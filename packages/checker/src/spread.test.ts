import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// De sitebuild zet `[...x]` om naar `[].concat(x)`. Voor een array is dat
// hetzelfde, voor een Map of Set niet: `[].concat(map)` is een lijst met één
// element, de Map zelf. Zo crashte de docentweergave bij de eerste vondst
// buiten de lesstof ("Cannot read properties of undefined (reading 'map')"),
// terwijl alle tests in node groen waren, want node draait de bron zonder
// die omzetting. Dat is niet in node na te spelen; deze guard weert daarom
// de vorm uit de nakijker. Gebruik Array.from(x).
//
// `for (const a of map)` is wel veilig: daarvoor gebruikt de build een helper
// die gewoon itereert.

const ROOT = fileURLToPath(new URL('../../..', import.meta.url));

function bestanden(map: string): string[] {
  return readdirSync(map).flatMap((naam) => {
    const pad = join(map, naam);
    if (statSync(pad).isDirectory()) return naam === '__fixtures__' ? [] : bestanden(pad);
    return /\.tsx?$/.test(naam) && !/\.test\.ts$/.test(naam) ? [pad] : [];
  });
}

const MAPPEN = [
  join(ROOT, 'packages/checker/src'),
  ...readdirSync(join(ROOT, 'sites/informatica')).map((s) =>
    join(ROOT, 'sites/informatica', s, 'src/checker'),
  ),
].filter((m) => {
  try {
    return statSync(m).isDirectory();
  } catch {
    return false;
  }
});

/** Spreads over iets dat geen array is: een iterator, of een Map of Set. */
function iterableSpreads(bron: string): string[] {
  const mapsEnSets = new Set(
    Array.from(
      bron.matchAll(
        /\b(?:const|let)\s+\[?\s*(\w+)[\s\S]{0,80}?(?:=\s*new\s+(?:Set|Map)\b|useState<(?:Set|Map)\b)/g,
      ),
      (m) => m[1],
    ),
  );
  const fout: string[] = [];
  for (const m of bron.matchAll(/\[\.\.\.\s*([\w.]+(?:\(\))?)\s*\]/g)) {
    const wat = m[1];
    if (/\.(?:values|keys|entries)\(\)$/.test(wat) || mapsEnSets.has(wat)) fout.push(m[0]);
  }
  return fout;
}

describe('geen spread over een Map, Set of iterator in de nakijker', () => {
  it('herkent de vormen die in de build stukgaan', () => {
    expect(iterableSpreads('const g = new Map();\nreturn [...g];')).toEqual(['[...g]']);
    expect(iterableSpreads('return [...perSleutel.values()];')).toEqual([
      '[...perSleutel.values()]',
    ]);
    expect(
      iterableSpreads('const [aan, zetAan] = useState<Set<string>>(new Set());\nf([...aan]);'),
    ).toEqual(['[...aan]']);
    expect(iterableSpreads('const a = [1];\nreturn [...a];')).toEqual([]);
  });

  it('komt nergens voor', () => {
    expect(MAPPEN.length).toBeGreaterThan(1);
    const fout = MAPPEN.flatMap(bestanden).flatMap((pad) =>
      iterableSpreads(readFileSync(pad, 'utf8')).map((s) => `${relative(ROOT, pad)}: ${s}`),
    );
    expect(fout).toEqual([]);
  });
});

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { SITES, SITES_BY_ID } from '@coderius/shared/sites';
import { alleLesbestanden } from '@coderius/shared/voorkennis';
import { describe, expect, it } from 'vitest';

// Python-voorbeelden springen in met vier spaties, nergens anders mee. Een
// leerling die code overtikt uit een les met haakjes-uitlijning of een
// verdwaalde regel met zes spaties, en dan in de editor op Tab drukt (vier
// spaties), krijgt een IndentationError die niets met de les te maken heeft.
// Dit leest elke les in elke cursus: de ```python-fences en de code in
// <PyRunner initialCode={`…`}>-achtige template-literals, in attribuut- en
// kind-vorm (<CodeExercise>{`…`}</CodeExercise>). Een fence in een
// opsomming is zelf ingesprongen; die inspringing telt niet mee. Een bewust
// fout voorbeeld (IndentationError in "Er gaat iets mis") draagt de bestaande
// marker {/* niet-compileren: … */} vlak erboven en wordt overgeslagen.

const SITES_ROOT = fileURLToPath(new URL('../../sites/', import.meta.url));
const MARKER = /niet-compileren/;
// Attribuut-vorm (initialCode={`…`}) én kind-vorm (<CodeExercise>{`…`}</CodeExercise>).
const LITERAL = /(?:(?:initialCode|code|starterCode|startCode)=|>)\{`([\s\S]*?)`\}/g;

type Overtreding = { bestand: string; regel: string };

function lesbestanden(): string[] {
  const mappen = [...SITES, ...Object.values(SITES_BY_ID)]
    .map((s) => s.id)
    .filter((id, i, alle) => alle.indexOf(id) === i)
    .flatMap((id) => [`${SITES_ROOT}${id}/docs`, `${SITES_ROOT}${id}/src/pages`]);
  return mappen.flatMap((map) => {
    try {
      return alleLesbestanden(map);
    } catch {
      return [];
    }
  });
}

/** Regels van een codeblok die fout inspringen: tabs, of geen veelvoud van vier. */
function foutIngesprongen(code: string, basis: number): string[] {
  const uit: string[] = [];
  for (const rauw of code.split('\n')) {
    const regel = rauw.slice(basis);
    const m = regel.match(/^([ \t]+)\S/);
    if (!m) continue;
    if (m[1].includes('\t') || m[1].length % 4 !== 0) uit.push(regel.trimEnd());
  }
  return uit;
}

function controleer(tekst: string, bestand: string): Overtreding[] {
  const uit: Overtreding[] = [];
  const regels = tekst.split('\n');
  for (let i = 0; i < regels.length; i++) {
    const open = regels[i].match(/^([ ]*)```python\b/);
    if (!open) continue;
    const basis = open[1].length;
    const boven = regels.slice(Math.max(0, i - 3), i).join('\n');
    let j = i + 1;
    while (j < regels.length && !regels[j].trim().startsWith('```')) j++;
    if (!MARKER.test(boven)) {
      for (const regel of foutIngesprongen(regels.slice(i + 1, j).join('\n'), basis)) {
        uit.push({ bestand, regel });
      }
    }
    i = j;
  }
  for (const m of tekst.matchAll(LITERAL)) {
    for (const regel of foutIngesprongen(m[1], 0)) uit.push({ bestand, regel });
  }
  return uit;
}

describe('inspringing in python-voorbeelden', () => {
  const bestanden = lesbestanden();

  it('vindt lessen', () => {
    expect(bestanden.length).toBeGreaterThan(100);
  });

  it('springt overal in met vier spaties, zonder tabs', () => {
    const kapot = bestanden.flatMap((b) =>
      controleer(readFileSync(b, 'utf8'), b.slice(SITES_ROOT.length)),
    );
    expect(kapot.map((k) => `${k.bestand}: ${JSON.stringify(k.regel)}`)).toEqual([]);
  });

  it('herkent een regel met twee spaties, een tab en haakjes-uitlijning wél', () => {
    expect(controleer('```python\nif x:\n  print(1)\n```', 'a')).toHaveLength(1);
    expect(controleer('```python\nif x:\n\tprint(1)\n```', 'a')).toHaveLength(1);
    expect(controleer('```python\nf(a,\n  b)\n```', 'a')).toHaveLength(1);
    expect(controleer('<PyRunner initialCode={`if x:\n  print(1)`} />', 'a')).toHaveLength(1);
    expect(controleer('<CodeExercise>{`if x:\n  print(1)`}</CodeExercise>', 'a')).toHaveLength(1);
  });

  it('telt de inspringing van een fence in een opsomming niet mee', () => {
    expect(controleer('- punt\n\n  ```python\n  if x:\n      print(1)\n  ```', 'a')).toEqual([]);
  });

  it('slaat een bewust fout voorbeeld met een niet-compileren-marker over', () => {
    const tekst =
      '{/* niet-compileren: bewuste IndentationError */}\n\n```python\nimport play\n  x = 1\n```';
    expect(controleer(tekst, 'a')).toEqual([]);
  });
});

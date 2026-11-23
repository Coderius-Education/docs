import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// Het bewegingsscript groeit zeven lessen lang, en elke les sluit af met het
// tabblad Je script tot nu toe. Wat er in die les bij kwam, was daar niet te
// zien: wie een regel miste, moest het script van de vorige les ernaast
// leggen. Het script markeert die regels nu (```gdscript {5-6}), en de zin
// erboven zegt het ook in woorden: een markering is een kleur, en op papier en
// voor een schermlezer is hij er niet.
//
// De markering is uit te rekenen: het verschil met het script van de les
// ervoor. Deze test doet dat, en schrijft hem ook:
//
//   SCHRIJF_MARKERING=1 pnpm exec vitest run script-markering
//
// Verander je een script, draai dat dan: ook de markering van de les erna
// schuift mee.

const require = createRequire(import.meta.url);
const { nieuwSinds, uitMeta, alsMeta } =
  require('../../../../../packages/shared/nieuw-sinds.js') as {
    nieuwSinds: (vorige: string[], nu: string[]) => number[];
    uitMeta: (meta: string) => number[];
    alsMeta: (nummers: number[]) => string;
  };

const MAP = fileURLToPath(new URL('../../docs/05-bewegingsscript', import.meta.url));
const SCHRIJF = process.env.SCHRIJF_MARKERING === '1';
const ZIN = 'De gemarkeerde regels zijn nieuw of veranderd in deze les.';

// De kop, wat ertussen staat, de fence met zijn metastring, en het script.
const SCRIPT =
  /(^## Je (?:script tot nu toe|complete script)[^\n]*\n)([\s\S]*?)(```gdscript)([^\n]*)\n([\s\S]*?)```/m;

const lessen = readdirSync(MAP)
  .filter((naam) => naam.endsWith('.md') || naam.endsWith('.mdx'))
  .map((naam) => {
    const pad = join(MAP, naam);
    const plek = Number(/^sidebar_position:\s*(\d+)/m.exec(readFileSync(pad, 'utf8'))?.[1] ?? 999);
    return { naam, pad, plek };
  })
  .sort((a, b) => a.plek - b.plek);

interface Script {
  les: string;
  pad: string;
  regels: string[];
  /** Wat de markering hoort te zijn: het verschil met het script ervoor. */
  hoort: string;
}

const scripts: Script[] = [];
for (const les of lessen) {
  const m = SCRIPT.exec(readFileSync(les.pad, 'utf8'));
  if (!m) continue;
  const regels = m[5].replace(/\n$/, '').split('\n');
  const vorige = scripts.at(-1);
  scripts.push({
    les: les.naam,
    pad: les.pad,
    regels,
    // Het eerste script heeft niets om mee te vergelijken.
    hoort: vorige ? alsMeta(nieuwSinds(vorige.regels, regels)) : '',
  });
}

if (SCHRIJF) {
  for (const script of scripts) {
    const bron = readFileSync(script.pad, 'utf8');
    const nieuw = bron.replace(SCRIPT, (_heel, kop, tussen, fence, _meta, code) => {
      const zonderZin = (tussen as string).replace(`${ZIN}\n\n`, '');
      const metZin = script.hoort ? `${zonderZin}${ZIN}\n\n` : zonderZin;
      return `${kop}${metZin}${fence}${script.hoort ? ` ${script.hoort}` : ''}\n${code}\`\`\``;
    });
    if (nieuw !== bron) writeFileSync(script.pad, nieuw);
  }
}

describe('Je script tot nu toe markeert wat er in deze les bij kwam', () => {
  it('elke les van het bewegingsscript heeft zijn script', () => {
    expect(scripts.length).toBe(7);
  });

  it.each(scripts)('$les: de gemarkeerde regels zijn het verschil met de les ervoor', (script) => {
    // Opnieuw gelezen: met SCHRIJF_MARKERING is het bestand net bijgewerkt.
    const meta = SCRIPT.exec(readFileSync(script.pad, 'utf8'))?.[4].trim() ?? '';
    expect(alsMeta(uitMeta(meta))).toBe(script.hoort);
  });

  it.each(scripts.filter((s) => s.hoort))(
    '$les: de tekst boven het script zegt in woorden wat de markering is',
    (script) => {
      const tussen = SCRIPT.exec(readFileSync(script.pad, 'utf8'))?.[2] ?? '';
      expect(tussen).toContain(ZIN);
    },
  );

  it('een les die niets aan het script verandert, markeert niets', () => {
    // Delta legt een regel uit die er al stond.
    const delta = scripts.find((s) => s.les.startsWith('delta'));
    expect(delta?.hoort).toBe('');
  });
});

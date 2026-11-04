import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { autoloadUit } from './extract';
import { type Blok, DOCS, blokkenInVolgorde, functies, leden } from './lessen';

// Een les die heel global.gd laat zien, vervangt bij een leerling die het
// overneemt alles wat er al stond. In de JSON-les ontbrak zo de lijst
// `levels` uit Lijsten: na het plakken liep de vlag vast op "Invalid access
// to property or key 'levels'". En de JSON-les zette de highscore-controle in
// verlies_leven(), een functie die in het project van de leerling niemand
// aanroept: de vijand uit 7.3.a doet zelf `Global.levens -= 1`. Wie game over
// ging, kreeg nooit een highscore.

const BLOKKEN = blokkenInVolgorde();

function isGlobalScript(b: Blok): boolean {
  return b.heelScript && /^extends Node\s*$/m.test(b.code) && /^var score\b/m.test(b.code);
}

// Het Global van de cursus zelf, zoals de extractie het voor het testproject bouwt.
const CURSUS_GLOBAL = functies(
  autoloadUit(readFileSync(join(DOCS, '07-signals-en-score', 'global_variables.md'), 'utf8')) ?? '',
);

describe('volledige global-scripts in hoofdstuk 10', () => {
  it('bevatten alles wat de cursus daarvoor als Global.<naam> gebruikte', () => {
    const gebruikt = new Set<string>();
    const fout: string[] = [];
    let gecontroleerd = 0;
    for (const b of BLOKKEN) {
      if (b.fout) continue;
      if (b.hoofdstuk === 10 && isGlobalScript(b)) {
        gecontroleerd += 1;
        const heeft = leden(b.code);
        const mist = [...gebruikt].filter((naam) => !heeft.has(naam));
        if (mist.length) fout.push(`${b.plek} mist ${mist.join(', ')}`);
      }
      for (const g of b.code.matchAll(/\bGlobal\.(\w+)/g)) gebruikt.add(g[1]);
    }
    expect(gecontroleerd).toBeGreaterThan(0);
    expect(fout).toEqual([]);
  });

  it('zetten alleen code in een functie die het project van de leerling ook aanroept', () => {
    // Een nieuwe of veranderde functie telt pas als hij wordt aangeroepen:
    // vanuit het global-script zelf, of als Global.<naam>() in een heel script
    // ergens in de cursus. Een losse voorbeeldregel ("Global.verlies_leven()")
    // telt niet, want die staat in geen enkel script van de leerling.
    const aanroepen = new Set<string>();
    for (const b of BLOKKEN) {
      if (b.fout || !b.heelScript) continue;
      for (const m of b.code.matchAll(/\bGlobal\.(\w+)\s*\(/g)) aanroepen.add(m[1]);
    }
    const fout: string[] = [];
    for (const b of BLOKKEN) {
      if (b.fout || b.hoofdstuk !== 10 || !isGlobalScript(b)) continue;
      const eigen = functies(b.code);
      for (const [naam, tekst] of eigen) {
        if (naam.startsWith('_') || CURSUS_GLOBAL.get(naam) === tekst) continue;
        const elders = [...eigen].some(
          ([ander, t]) => ander !== naam && new RegExp(`\\b${naam}\\s*\\(`).test(t),
        );
        if (!elders && !aanroepen.has(naam)) {
          fout.push(`${b.plek}: ${naam}() is nieuw of veranderd, maar geen script roept hem aan`);
        }
      }
    }
    expect(fout).toEqual([]);
  });
});

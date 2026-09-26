import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// De Babel van Docusaurus zet een spread in een array-literal om naar
// [].concat(...). Voor een array is dat goed, maar een Map- of Set-iterator
// wordt dan één element: [].concat(kaart.values()) is een lijst met de
// iterator erin. Zo tekende de speeltuin geen enkele schildpad, terwijl alle
// tests in node groen waren (daar draait de code onvertaald). Deze test weert
// een spread van een iterator in de broncode van de runner; gebruik Array.from.

const SRC = fileURLToPath(new URL('.', import.meta.url));
const ITERATOR_SPREAD = /\[\s*\.\.\.\s*(?:new (?:Set|Map)\b|[\w.]+\.(?:values|keys|entries)\(\))/;

function bronbestanden(map: string): string[] {
  return readdirSync(map).flatMap((naam) => {
    const pad = join(map, naam);
    if (statSync(pad).isDirectory()) return bronbestanden(pad);
    return /\.tsx?$/.test(naam) && !naam.includes('.test.') ? [pad] : [];
  });
}

describe('geen spread van een iterator in de runner', () => {
  it('Array.from in plaats van [...kaart.values()] of [...new Set()]', () => {
    const fout = bronbestanden(SRC).flatMap((pad) =>
      readFileSync(pad, 'utf8')
        .split('\n')
        .flatMap((regel, i) =>
          ITERATOR_SPREAD.test(regel) ? [`${relative(SRC, pad)}:${i + 1}`] : [],
        ),
    );
    expect(fout).toEqual([]);
  });

  it('de controle zelf herkent de vorm die misging', () => {
    expect(ITERATOR_SPREAD.test('schildpadden: [...schildpadden.values()],')).toBe(true);
    expect(ITERATOR_SPREAD.test('const uniek = [...new Set(lijst)];')).toBe(true);
    expect(ITERATOR_SPREAD.test('const kopie = [...lijst];')).toBe(false);
  });
});

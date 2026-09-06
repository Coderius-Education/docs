import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { traceSelectionSort } from '../lib/algorithmTraces';

// De tabel "Hoeveel werk doet dit?" op de compleet-pagina noemt getallen die
// nergens uit een codeblok komen, dus het blokken-script kijkt er niet naar.
// Bij de doorloop bleek de tabel `n(n − 1)/2` te tellen terwijl de code én de
// visualisatie `n(n + 1)/2` doen: de binnenste lus begint bij `j = i`, dus elk
// element wordt ook één keer met zichzelf vergeleken. Een leerling die het
// model op vijf getallen afspeelt ziet de teller op 15 eindigen en leest
// daarna 10 in de tabel — en denkt dat hij iets fout deed.
//
// Deze test legt de tabel naast de trace die de leerling in de visualisatie
// ziet. Verandert het algoritme of de tabel, dan moeten ze samen mee.

const DOCS = fileURLToPath(new URL('../../docs/', import.meta.url));

/** De rijen van de eerste markdown-tabel onder een kop, als cellen. */
function tabelOnderKop(tekst: string, kop: string): string[][] {
  const na = tekst.slice(tekst.indexOf(kop) + kop.length);
  const regels = na.split('\n');
  const start = regels.findIndex((r) => r.startsWith('|'));
  const rijen: string[][] = [];
  for (const regel of regels.slice(start)) {
    if (!regel.startsWith('|')) break;
    rijen.push(
      regel
        .split('|')
        .slice(1, -1)
        .map((c) => c.trim()),
    );
  }
  // Kop en scheidingsregel horen niet bij de data.
  return rijen.slice(2);
}

/** "5" en "1.000" zijn getallen; "hoogstens 4" draagt er een. */
function getal(cel: string): number {
  const m = cel.match(/[\d.]+/);
  if (!m) throw new Error(`geen getal in "${cel}"`);
  return Number(m[0].replace(/\./g, ''));
}

// `comparisons` is optioneel in TraceStats, omdat niet elk algoritme telt.
// Selection sort doet dat wel; ontbreekt de teller, dan is de trace stuk en
// zegt deze test daar iets zinnigs over in plaats van stil te slagen.
function telVergelijkingen(n: number): number {
  const lijst = Array.from({ length: n }, (_, i) => n - i);
  const laatste = traceSelectionSort(lijst).at(-1);
  const geteld = laatste?.stats.comparisons;
  if (geteld === undefined) throw new Error(`de trace van ${n} elementen telt geen vergelijkingen`);
  return geteld;
}

describe('de werk-tabel van selection sort', () => {
  const tekst = readFileSync(`${DOCS}selection-sort/08-compleet.mdx`, 'utf8');
  const rijen = tabelOnderKop(tekst, '## Hoeveel werk doet dit?');

  it('noemt minstens drie lijstgroottes', () => {
    expect(rijen.length).toBeGreaterThanOrEqual(3);
  });

  it.each([0, 1, 2])('rij %i telt evenveel vergelijkingen als de visualisatie', (i) => {
    const n = getal(rijen[i][0]);
    expect(getal(rijen[i][1])).toBe(telVergelijkingen(n));
  });

  it('de grote rijen volgen dezelfde formule', () => {
    for (const rij of rijen.slice(3)) {
      const n = getal(rij[0]);
      expect(getal(rij[1])).toBe((n * (n + 1)) / 2);
    }
  });

  it('swaps die iets verplaatsen zijn er hoogstens n - 1', () => {
    for (const rij of rijen) {
      const n = getal(rij[0]);
      expect(getal(rij[2])).toBe(n - 1);
    }
  });
});

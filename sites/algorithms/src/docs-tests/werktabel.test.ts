import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  traceBinarySearch,
  traceMaximum,
  traceMinAndMax,
  traceSelectionSort,
} from '../lib/algorithmTraces';

// De tabel "Hoeveel werk doet dit?" op de compleet-pagina noemt getallen die
// nergens uit een codeblok komen, dus het blokken-script kijkt er niet naar.
// Bij de doorloop bleek de tabel `n(n − 1)/2` te tellen terwijl de code én de
// visualisatie `n(n + 1)/2` doen: de binnenste lus begint bij `j = i`, dus elk
// element wordt ook één keer met zichzelf vergeleken. Een leerling die het
// model op vijf getallen afspeelt ziet de teller op 15 eindigen en leest
// daarna 10 in de tabel — en denkt dat hij iets fout deed.
//
// Hetzelfde gebeurde in max en min: de visualisatie op de concept-pagina
// deed elke stap twee vergelijkingen, terwijl het algoritme met `elif` de
// tweede overslaat zodra de eerste raak is. Acht vergelijkingen, geen tien.
//
// Deze tests leggen zulke met de hand getelde getallen naast de trace die de
// leerling in de visualisatie ziet. Verandert het algoritme of de lestekst,
// dan moeten ze samen mee.

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

describe('de visualisatie van max en min', () => {
  const tekst = readFileSync(`${DOCS}max-en-min/01-concept.mdx`, 'utf8');

  it('telt evenveel vergelijkingen als de trace', () => {
    const lijst = tekst.match(/^lijst:\s*\[([^\]]+)\]/m);
    if (!lijst) throw new Error('geen voorbeeldlijst in de visualisatie');
    const waardes = lijst[1].split(',').map((c) => Number(c.trim()));

    const belofte = tekst.match(/in (\d+) vergelijkingen/);
    if (!belofte) throw new Error('de visualisatie noemt geen aantal vergelijkingen');

    const laatste = traceMinAndMax(waardes).at(-1);
    const geteld = laatste?.stats.comparisons;
    if (geteld === undefined) throw new Error('de trace telt geen vergelijkingen');
    expect(Number(belofte[1])).toBe(geteld);
  });
});

describe('de visualisatie van vind het maximum', () => {
  const tekst = readFileSync(`${DOCS}vind-maximum/01-concept.mdx`, 'utf8');

  it('telt evenveel vergelijkingen als de trace', () => {
    const lijst = tekst.match(/^lijst:\s*\[([^\]]+)\]/m);
    if (!lijst) throw new Error('geen voorbeeldlijst in de visualisatie');
    const waardes = lijst[1].split(',').map((c) => Number(c.trim()));

    const belofte = tekst.match(/in (\d+) vergelijkingen/);
    if (!belofte) throw new Error('de visualisatie noemt geen aantal vergelijkingen');

    const geteld = traceMaximum(waardes).at(-1)?.stats.comparisons;
    if (geteld === undefined) throw new Error('de trace telt geen vergelijkingen');
    expect(Number(belofte[1])).toBe(geteld);
  });
});

// De cheatsheet van binair zoeken gaf `ceil(log2(n))` als slechtste geval.
// Dat klopt niet bij machten van twee: voor acht elementen geeft de formule
// drie stappen, terwijl het er vier zijn — precies de schatting waarvoor
// stelling 4 in datzelfde hoofdstuk waarschuwt. De tabel eronder klopte wel,
// en die leggen we hier naast de trace. De grote rijen lopen tot een miljard;
// die traceren we niet, want elke stap bewaart een kopie van de lijst.
const TRACEBAAR = 100_000;

function stappenInHetSlechtsteGeval(n: number): number {
  // Slechtste geval: een doel dat groter is dan alles in de lijst.
  const waardes = Array.from({ length: n }, (_, i) => i);
  const geteld = traceBinarySearch(waardes, n).at(-1)?.stats.comparisons;
  if (geteld === undefined) throw new Error(`de trace van ${n} telt geen vergelijkingen`);
  return geteld;
}

describe('de tabel van binair zoeken', () => {
  const tekst = readFileSync(`${DOCS}binair-zoeken/13-cheatsheet.mdx`, 'utf8');
  const rijen = tabelOnderKop(tekst, '<summary>Hoe snel?</summary>');

  it('noemt minstens drie lijstgroottes', () => {
    expect(rijen.length).toBeGreaterThanOrEqual(3);
  });

  it('de kleine rijen tellen evenveel stappen als de trace', () => {
    const klein = rijen.filter((rij) => getal(rij[0]) <= TRACEBAAR);
    expect(klein.length).toBeGreaterThan(0);
    for (const rij of klein) {
      expect(getal(rij[1])).toBe(stappenInHetSlechtsteGeval(getal(rij[0])));
    }
  });

  it('de grote rijen volgen dezelfde formule', () => {
    for (const rij of rijen.filter((r) => getal(r[0]) > TRACEBAAR)) {
      const n = getal(rij[0]);
      expect(getal(rij[1])).toBe(Math.floor(Math.log2(n)) + 1);
    }
  });

  it('de formule in de tekst is die van de trace, niet ceil(log2)', () => {
    expect(stappenInHetSlechtsteGeval(8)).toBe(4);
    expect(tekst).toContain('⌊log₂(n)⌋ + 1');
  });
});

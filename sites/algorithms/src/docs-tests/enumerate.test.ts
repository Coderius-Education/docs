import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// `enumerate` staat niet in de python-cursus. De uitleg staat in lineair
// zoeken, bouwsteen 1, en de regel van deze site (CLAUDE.md) is dat elke
// andere les die het gebruikt daarheen linkt met <Voorkennis>. Bij de
// doorloop van Torens van Hanoi gebruikte de compleet-pagina
// `enumerate(zetten, start=1)` zonder link, en vijf andere lessen ook. Die
// staan exact in ACHTERSTAND: een nieuwe les zonder link valt meteen op, en
// een opgeloste hoort hier weg.

const DOCS = fileURLToPath(new URL('../../docs/', import.meta.url));
const UITLEG = '/docs/lineair-zoeken/bouwen/04-doorlopen';

const ACHTERSTAND = [
  'cfg/13-compleet.mdx',
  'knapsack/bouwen/07-volledige-tabel.mdx',
  'vind-maximum/11-cheatsheet.mdx',
];

function lessen(map: string): string[] {
  return readdirSync(map)
    .sort()
    .flatMap((naam) => {
      const pad = join(map, naam);
      if (statSync(pad).isDirectory()) return lessen(pad);
      return /\.mdx?$/.test(naam) ? [pad] : [];
    });
}

describe('enumerate buiten lineair zoeken', () => {
  const zonderLink = lessen(DOCS)
    .map((pad) => relative(DOCS, pad))
    .filter((les) => !les.startsWith('lineair-zoeken/'))
    .filter((les) => {
      const tekst = readFileSync(join(DOCS, les), 'utf8');
      return /\benumerate\(/.test(tekst) && !tekst.includes(UITLEG);
    });

  it('elke les die enumerate gebruikt linkt naar de uitleg in lineair zoeken', () => {
    expect(zonderLink.filter((les) => !ACHTERSTAND.includes(les))).toEqual([]);
  });

  it('de achterstand is exact: een les met link hoort uit de lijst', () => {
    expect(zonderLink).toEqual(ACHTERSTAND);
  });
});

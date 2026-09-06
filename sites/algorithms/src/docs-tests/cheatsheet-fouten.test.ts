import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// De cheatsheet vat de fouten-pagina samen. Wie een fout op die pagina
// vervangt, vergeet de samenvatting: bij de doorloop bleken lineair zoeken en
// selection sort allebei een fout op te sommen die op hun fouten-pagina niet
// meer stond, allebei doordat die pagina eerder in deze reeks een andere derde
// fout kreeg. Een leerling die de cheatsheet als checklist gebruikt zoekt dan
// naar uitleg die er niet is.
//
// De regel: elk stukje `code` in een kop van de fouten-pagina komt ook in de
// samenvatting voor, letterlijk. Dat is streng — een samenvatting die dezelfde
// fout in andere woorden noemt valt om — en dat is de bedoeling: juist die
// woorden zijn waar de leerling op zoekt. Chapters die er nog niet aan voldoen
// staan exact in ACHTERSTAND, met de reden.

const DOCS = fileURLToPath(new URL('../../docs/', import.meta.url));

const ACHTERSTAND = new Map([
  [
    'binair-zoeken',
    'de kop zet de twee varianten naast elkaar, de cheatsheet noemt alleen de foute',
  ],
  ['minimax', 'de kop noemt twee helperfuncties, de samenvatting het algoritme'],
]);

function spans(tekst: string): string[] {
  return [...tekst.matchAll(/`([^`]+)`/g)].map((m) => m[1]);
}

function hoofdstukken(): string[] {
  return readdirSync(DOCS, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort();
}

/** De samenvatting van de fouten, en de koppen die hij samenvat. */
function paar(hoofdstuk: string): { samenvatting: string; koppen: string[] } | null {
  const bestanden = readdirSync(join(DOCS, hoofdstuk));
  const cheatsheet = bestanden.find((n) => n.includes('cheatsheet'));
  const fouten = bestanden.find((n) => n.includes('fouten'));
  if (!cheatsheet || !fouten) return null;
  const c = readFileSync(join(DOCS, hoofdstuk, cheatsheet), 'utf8');
  const blok = c.match(
    /<summary>(?:Top-3 fouten|Veelgemaakte fouten)[^<]*<\/summary>(.*?)<\/details>/s,
  );
  if (!blok) return null;
  const f = readFileSync(join(DOCS, hoofdstuk, fouten), 'utf8');
  return { samenvatting: blok[1], koppen: [...f.matchAll(/^## (.*)$/gm)].map((m) => m[1]) };
}

describe('de cheatsheet vat de fouten-pagina samen', () => {
  const met = hoofdstukken()
    .map((h) => [h, paar(h)] as const)
    .filter((x): x is readonly [string, NonNullable<ReturnType<typeof paar>>] => x[1] !== null);

  it("vindt hoofdstukken met allebei de pagina's", () => {
    expect(met.length).toBeGreaterThan(5);
  });

  it.each(met)('%s', (hoofdstuk, paar) => {
    const { samenvatting, koppen } = paar;
    const aanwezig = new Set(spans(samenvatting));
    const ontbreekt = koppen.flatMap((kop) => spans(kop).filter((s) => !aanwezig.has(s)));
    if (ACHTERSTAND.has(hoofdstuk)) {
      expect(ontbreekt, `${hoofdstuk} staat in ACHTERSTAND maar voldoet nu`).not.toEqual([]);
      return;
    }
    expect(ontbreekt).toEqual([]);
  });
});

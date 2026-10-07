import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// database.mdx zei dat een wijziging zonder commit() weg is "als het programma
// stopt" of "na herstarten". Dat is te laat: SqliteDict gooit de wijziging weg
// zodra het with-blok sluit. Nagedraaid: een POST en daarna GET /berichten in
// dezelfde serverrun gaf een lege lijst, en een tweede with-blok in hetzelfde
// script vond de sleutel niet meer. Wie het oude beeld heeft, zoekt de fout
// pas na een herstart en snapt niet waarom zijn lijst meteen leeg is.

const LESSEN = fileURLToPath(new URL('../../docs/FastAPI', import.meta.url));

describe('wat commit() doet', () => {
  it('geen alinea over commit zegt dat de data pas bij stoppen of herstarten weg is', () => {
    const fout: string[] = [];
    for (const bestand of readdirSync(LESSEN).filter((f) => f.endsWith('.mdx'))) {
      const tekst = readFileSync(`${LESSEN}/${bestand}`, 'utf8').replace(/```[\s\S]*?```/g, '');
      for (const alinea of tekst.split(/\n\s*\n/)) {
        if (!alinea.includes('commit')) continue;
        for (const zin of alinea.split(/(?<=[.?!])\s+/)) {
          if (/\b(weg|verdw\w+|kwijt)\b/.test(zin) && /(stopt|herstart\w*)/.test(zin))
            fout.push(`${bestand}: ${zin.trim()}`);
        }
      }
    }
    expect(fout).toEqual([]);
  });
});

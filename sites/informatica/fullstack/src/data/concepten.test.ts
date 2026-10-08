import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import sidebars from '../../sidebars';

// De conceptkaart uit de leerling-doorloop (oktober 2026): een concept wordt
// uitgelegd in de les waar het voor het eerst opduikt, ook als dat in een
// opdracht of antwoord is, en niet twee keer als nieuw. Gevonden waren onder
// meer `naam: str` zonder uitleg, `is None`, `reversed`, `keys()`, `<table>`,
// een list comprehension in het htmx-recept Zoeken en `await` in de
// hoofdtekst van de 404-les.

const DOCS = fileURLToPath(new URL('../../docs', import.meta.url));
type Item = string | { type: string; label: string; items: Item[] };
const plat = (items: Item[]): string[] =>
  items.flatMap((i) => (typeof i === 'string' ? [i] : plat(i.items)));
const lessen = plat(sidebars.apiSidebar as unknown as Item[]);
const tekst = (id: string) => readFileSync(`${DOCS}/${id}.mdx`, 'utf8');
const pythonBlokken = (bron: string) =>
  [...bron.matchAll(/```python[^\n]*\n([\s\S]*?)```/g)].map((m) => m[1]).join('\n');

// Bouwsteen, de les die hem uitlegt, en een woord uit die uitleg.
const KAART: [string, RegExp, string, RegExp][] = [
  ['type int', /\w+: int\b/, 'FastAPI/veel-paginas/query-parameters', /Met `int` zet FastAPI/],
  ['is None', /is None/, 'FastAPI/berichten-tonen/niet-gevonden', /`None` betekent/],
  ['reversed', /reversed\(/, 'FastAPI/onthouden/cookie-of-sessie', /`reversed\(\)` loopt/],
  ['keys()', /\.keys\(\)/, 'FastAPI/accounts/registreren', /`keys\(\)` geeft/],
  ['<table>', /<table>/, 'FastAPI/berichten-tonen/lijst_tonen', /elke rij is een `<tr>`/],
  ['strftime', /strftime/, 'FastAPI/zonder-herladen/htmx', /`strftime` maakt/],
  ['required', /<input[^>]*\brequired/, 'FastAPI/formulieren/forms', /`required` laat de browser/],
  ['Form(...)', /Form\(\.\.\.\)/, 'FastAPI/formulieren/forms', /drie puntjes/],
  ['await', /\bawait\b/, 'FastAPI/afronden/foutpagina', /De `await` wacht/],
];

describe('elk concept wordt uitgelegd waar het voor het eerst opduikt', () => {
  it.each(KAART)('%s', (_naam, bouwsteen, uitleg, woord) => {
    const eerste = lessen.find((id) => bouwsteen.test(tekst(id)));
    expect(eerste, 'komt nergens voor').toBeDefined();
    expect(lessen.indexOf(eerste as string), `eerst in ${eerste}`).toBeGreaterThanOrEqual(
      lessen.indexOf(uitleg),
    );
    expect(tekst(uitleg)).toMatch(woord);
  });

  it('geen list comprehension in de code van de route', () => {
    const fout = lessen.filter((id) =>
      /\[[^\]\n]*\bfor\b[^\]\n]*\bin\b[^\]\n]*\]/.test(
        pythonBlokken(tekst(id)).replace(/\n\s+/g, ' '),
      ),
    );
    expect(fout).toEqual([]);
  });

  it('de eerste les met een f-string in de code linkt naar de les over f-strings', () => {
    const eerste = lessen.find((id) => /\bf"/.test(pythonBlokken(tekst(id))));
    expect(eerste).toBe('FastAPI/veel-paginas/path-parameters');
    expect(tekst(eerste as string)).toContain("to: '/docs/tekst/04a-f-strings'");
  });

  it('get wordt één keer als nieuw uitgelegd; Zoeken verwijst terug naar path-parameters', () => {
    expect(tekst('FastAPI/sqlitedict/zoeken')).toContain(
      '](/docs/FastAPI/veel-paginas/path-parameters)',
    );
    expect(tekst('FastAPI/sqlitedict/zoeken')).not.toContain('**`get`**');
  });

  it('wie bekijk_db.py naast de server draait, hoort van de tweede terminal', () => {
    for (const id of [
      'FastAPI/berichten-opslaan/naam-opslaan',
      'FastAPI/berichten-verwijderen/verwijderen',
    ]) {
      expect(tekst(id), id).toMatch(/tweede( terminal)?[^.]*plusje/);
    }
  });
});

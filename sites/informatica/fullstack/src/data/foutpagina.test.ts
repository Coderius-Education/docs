import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import sidebars from '../../sidebars';

// Issue #125: een mooie 404-pagina. Er zijn drie manieren, en de les zet ze
// naast elkaar. De aanbevolen manier is een handler voor 404: die krijgt een
// onbekend adres én een eigen raise HTTPException(status_code=404), en laat de
// rest met rust. Een handler voor alle fouten zet leerlingen op het verkeerde
// been: nagedraaid met fastapi 0.142 toont een handler voor Exception een
// NameError als "Niet gevonden" met status 404, en een handler voor elke
// StarletteHTTPException zonder doorgeven maakt van een 401 en een 405 ook een
// 404. Een fout in de code moet een echte 500 blijven.

const DOCS = fileURLToPath(new URL('../../docs', import.meta.url));

type Item = string | { type: string; label: string; items: Item[] };
const plat = (items: Item[]): string[] =>
  items.flatMap((i) => (typeof i === 'string' ? [i] : plat(i.items)));
const zijbalk = sidebars.apiSidebar as unknown as Item[];
const les = () => readFileSync(`${DOCS}/FastAPI/afronden/foutpagina.mdx`, 'utf8');
const hoofdtekst = () => les().split(/\n## Opdrachten\n/)[0];
const python = (bron: string) =>
  [...bron.matchAll(/```python[^\n]*\n([\s\S]*?)```/g)].map((m) => m[1]);

function alleDocs(map: string): string[] {
  return readdirSync(map).flatMap((naam) => {
    const pad = join(map, naam);
    if (statSync(pad).isDirectory()) return alleDocs(pad);
    return /\.mdx?$/.test(naam) ? [pad] : [];
  });
}

describe('een eigen 404-pagina', () => {
  it('staat vooraan in Afronden, na de uitbreidingen', () => {
    const afronden = zijbalk.find(
      (i): i is Exclude<Item, string> => typeof i !== 'string' && i.label === 'Afronden',
    );
    expect(plat(afronden?.items ?? [])[0]).toBe('FastAPI/afronden/foutpagina');
    const lessen = plat(zijbalk);
    expect(lessen.indexOf('FastAPI/afronden/foutpagina')).toBeGreaterThan(
      lessen.indexOf('FastAPI/onthouden/sessies'),
    );
  });

  it('zet de drie manieren naast elkaar', () => {
    const tekst = hoofdtekst();
    expect(tekst).toContain('@app.exception_handler(404)');
    expect(tekst).toContain('FastAPI(exception_handlers={404: niet_gevonden})');
    const starlette = python(tekst).find((b) =>
      b.includes('@app.exception_handler(StarletteHTTPException)'),
    );
    expect(starlette).toContain('return await http_exception_handler(request, fout)');
    expect(starlette).toContain('if fout.status_code == 404:');
    expect(python(tekst).some((b) => b.trimStart().startsWith('if bericht is None:'))).toBe(true);
    expect(tekst).toMatch(/\| Fout in je code \(500\) \|/);
  });

  it('laat zien dat een onbekend adres en een eigen 404 allebei door de handler gaan', () => {
    const tekst = hoofdtekst();
    expect(tekst).toContain('/bestaat-niet');
    expect(tekst).toContain('/bericht/onzin');
    expect(tekst).toContain('## Een fout in je code blijft een 500');
  });

  it('elke foutpagina in de les gaat terug met status 404', () => {
    const fout = python(les())
      .filter((b) => b.includes('"404.html"'))
      .filter((b) => !b.includes('status_code=404'));
    expect(fout).toEqual([]);
  });

  it('geen blok in de cursus zet een handler voor alle fouten, of een die de rest niet doorgeeft', () => {
    const fout = alleDocs(DOCS).flatMap((pad) =>
      python(readFileSync(pad, 'utf8'))
        .filter(
          (b) =>
            b.includes('@app.exception_handler(Exception)') ||
            (b.includes('@app.exception_handler(StarletteHTTPException)') &&
              !b.includes('http_exception_handler(')),
        )
        .map(() => relative(DOCS, pad)),
    );
    expect(fout).toEqual([]);
  });

  it('de cheatsheet en Er gaat iets mis kennen de handler', () => {
    const cheatsheet = readFileSync(`${DOCS}/cheatsheet.md`, 'utf8');
    expect(cheatsheet).toContain(
      '<summary>Hoe maak ik een eigen 404-pagina? (exception_handler)</summary>',
    );
    const fouten = readFileSync(`${DOCS}/troubleshooting.md`, 'utf8');
    expect(fouten).toContain('(/docs/FastAPI/afronden/foutpagina)');
  });
});

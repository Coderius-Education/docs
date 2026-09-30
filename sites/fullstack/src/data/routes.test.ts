import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import sidebars from '../../sidebars';

// De leerling bouwt één project: elke les zet endpoints in dezelfde main.py.
// Een pad dat een latere les opnieuw gebruikt (/profiel in vier lessen,
// /verstuur, /naam, /aantal) gaf geen foutmelding: FastAPI neemt stil het
// eerste endpoint, en de leerling zag de uitvoer van een oude les. Een les die
// bewust een endpoint vervangt, zet `{/* route-dubbel: reden */}` direct boven
// het blok en zegt "vervang" in de tekst.

const DOCS = fileURLToPath(new URL('../../docs', import.meta.url));

type Item = string | { type: string; label: string; items: Item[] };
const plat = (items: Item[]): string[] =>
  items.flatMap((i) => (typeof i === 'string' ? [i] : plat(i.items)));
const lessen = plat(sidebars.apiSidebar as unknown as Item[]);

// Elk python-blok, met of er een route-dubbel-marker boven staat. Blokken in
// een uitklapblok "Zo ziet je main.py er nu uit" tellen niet: dat is een
// samenvatting van wat de les al liet zien.
function blokken(tekst: string): { code: string; dubbel: boolean }[] {
  const zonderStand = tekst.replace(
    /<details>\s*<summary>Zo ziet je `main\.py` er nu uit<\/summary>[\s\S]*?<\/details>/g,
    '',
  );
  return [
    ...zonderStand.matchAll(/(\{\/\* route-dubbel:[^*]*\*\/\}\s*)?```python[^\n]*\n([\s\S]*?)```/g),
  ].map((m) => ({ code: m[2], dubbel: Boolean(m[1]) }));
}

const routes = (code: string) =>
  [...code.matchAll(/@app\.(get|post|delete|put)\("([^"]+)"/g)].map(
    (m) => `${m[1].toUpperCase()} ${m[2]}`,
  );

describe('één project, geen dubbele paden', () => {
  it('een methode en pad komen maar in één les voor, tenzij de les zegt dat hij vervangt', () => {
    const eigenaar = new Map<string, string>();
    const fout: string[] = [];
    for (const id of lessen) {
      const tekst = readFileSync(`${DOCS}/${id}.mdx`, 'utf8');
      for (const { code, dubbel } of blokken(tekst)) {
        for (const route of routes(code)) {
          // Een blok met de marker vervangt het endpoint: vanaf hier hoort het
          // bij deze les. Een voorspelvraag met de marker (je voegt hem niet
          // toe) krijgt geen eigenaar.
          const eerder = eigenaar.get(route);
          if (dubbel) {
            if (eerder) eigenaar.set(route, id);
          } else if (eerder && eerder !== id) {
            fout.push(`${route} in ${id}, al in ${eerder}`);
          } else if (!eerder) {
            eigenaar.set(route, id);
          }
        }
      }
    }
    expect(fout).toEqual([]);
  });
});

describe('de stand van main.py per les', () => {
  // Elke basisles met een endpoint sluit de hoofdtekst af met het hele
  // main.py in de stand van die les. Losse stukken lieten de leerling zelf een
  // bestand samenstellen, en een compleet blok halverwege gooide eerder werk
  // weg. Elke stand bevat alle endpoints van de stand ervoor.
  const eersteUitbreiding = (sidebars.apiSidebar as unknown as Item[]).findIndex(
    (i) => typeof i !== 'string' && i.label.startsWith('Uitbreiding:'),
  );
  const basis = plat((sidebars.apiSidebar as unknown as Item[]).slice(0, eersteUitbreiding));
  const stand = (tekst: string) =>
    tekst.match(
      /<summary>Zo ziet je `main\.py` er nu uit<\/summary>[\s\S]*?```python\n([\s\S]*?)```/,
    )?.[1];

  it('elke basisles met een endpoint heeft het hele main.py', () => {
    const zonder = basis.filter((id) => {
      const tekst = readFileSync(`${DOCS}/${id}.mdx`, 'utf8');
      const hoofd = tekst.split('\n## Opdrachten\n')[0];
      return (
        blokken(hoofd).some((b) => b.code.includes('@app.')) &&
        !stand(tekst)?.includes('app = FastAPI()')
      );
    });
    expect(zonder).toEqual([]);
  });

  it('elke stand houdt de endpoints van de stand ervoor', () => {
    let vorige: string[] = [];
    let vorigeLes = '';
    const kwijt: string[] = [];
    for (const id of basis) {
      const code = stand(readFileSync(`${DOCS}/${id}.mdx`, 'utf8'));
      if (!code) continue;
      const nu = routes(code);
      for (const r of vorige)
        if (!nu.includes(r)) kwijt.push(`${r} uit ${vorigeLes} mist in ${id}`);
      vorige = nu;
      vorigeLes = id;
    }
    expect(kwijt).toEqual([]);
  });
});

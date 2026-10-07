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
function blokken(tekst: string): { code: string; dubbel: boolean; reden: string; voor: string }[] {
  const zonderStand = tekst.replace(
    /<details>\s*<summary>Zo ziet je `main\.py` er nu uit<\/summary>[\s\S]*?<\/details>/g,
    '',
  );
  return [
    ...zonderStand.matchAll(
      /(\{\/\* route-dubbel:([^*]*)\*\/\}\s*)?```python[^\n]*\n([\s\S]*?)```/g,
    ),
  ].map((m) => ({
    code: m[3],
    dubbel: Boolean(m[1]),
    reden: (m[2] ?? '').trim(),
    voor: alineaErvoor(zonderStand.slice(0, m.index)),
  }));
}

// De laatste alinea lestekst vóór een blok, zonder <CodeUitleg> en markers.
function alineaErvoor(tekst: string): string {
  const alineas = tekst
    .split(/\n\s*\n/)
    .map((a) => a.trim())
    .filter((a) => a && !a.startsWith('<') && !a.startsWith('{/*'));
  return alineas.at(-1) ?? '';
}

// De handler bij elke route in een blok: van de decorator tot de volgende
// decorator of het eind van het blok, zonder verschil in witruimte.
function handlers(code: string): Map<string, string> {
  const delen = code.split(/(?=@app\.)/);
  const uit = new Map<string, string>();
  for (const deel of delen) {
    const [route] = routes(deel);
    if (route) uit.set(route, deel.replace(/\s+/g, ' ').trim());
  }
  return uit;
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

describe('één les, één versie per pad', () => {
  // detailpagina.mdx gaf drie versies van GET /bericht/{sleutel} onder elkaar,
  // zonder "vervang". Wie ze alle drie toevoegde, kreeg stil de eerste: JSON
  // met status 200 in plaats van de template of de 404. Ook binnen één les
  // zegt een tweede versie van hetzelfde pad dat hij vervangt: met de marker,
  // of met "vervang" in de alinea erboven, die de leerling leest.
  it('een tweede blok met hetzelfde pad in dezelfde les zegt dat hij vervangt', () => {
    const fout: string[] = [];
    for (const id of lessen) {
      const tekst = readFileSync(`${DOCS}/${id}.mdx`, 'utf8');
      const gezien = new Set<string>();
      for (const { code, dubbel, voor } of blokken(tekst.split('\n## Opdrachten\n')[0])) {
        for (const route of routes(code)) {
          if (gezien.has(route) && !dubbel && !/vervang/i.test(voor))
            fout.push(`${route} twee keer in ${id}`);
          gezien.add(route);
        }
      }
    }
    expect(fout).toEqual([]);
  });
});

describe('een voorspelvraag botst niet met het project', () => {
  // De marker "voorspelvraag" ziet de leerling niet. Probeert hij de vraag uit
  // (Predict, dan Run), dan zet hij het endpoint toch in zijn main.py. Stond
  // dat pad al in het project, of komt het er later bij, dan neemt FastAPI
  // stil het eerste: forms.mdx had POST /groet (later de templateversie) en
  // redirect.mdx POST /opslaan (al uit Een formulier opslaan). Een
  // voorspelvraag gebruikt daarom een eigen pad, of precies dezelfde handler.
  it('elk pad uit een voorspelvraag is nieuw, of heeft dezelfde handler als in het project', () => {
    const project = new Map<string, Set<string>>();
    const vragen: { id: string; route: string; handler: string }[] = [];
    for (const id of lessen) {
      const tekst = readFileSync(`${DOCS}/${id}.mdx`, 'utf8');
      for (const { code, dubbel, reden } of blokken(tekst)) {
        for (const [route, handler] of handlers(code)) {
          if (dubbel && reden.startsWith('voorspelvraag')) {
            vragen.push({ id, route, handler });
          } else {
            if (!project.has(route)) project.set(route, new Set());
            project.get(route)?.add(handler);
          }
        }
      }
    }
    const fout = vragen
      .filter(({ route, handler }) => project.has(route) && !project.get(route)?.has(handler))
      .map(({ id, route }) => `${route} in de voorspelvraag van ${id}`);
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

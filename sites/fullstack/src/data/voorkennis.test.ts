import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { alleLesbestanden, lesBestaat, parseItems } from '@coderius/shared/voorkennis';
import { describe, expect, it } from 'vitest';

// Bewaakt de <Voorkennis>-blokken ("Hier bouw je op verder"): elk pad moet echt
// bestaan als lespagina op de doelsite, en elke gebruikte site moet in de
// registry staan. Zonder deze test breekt een hernoemde les in de python- of
// web-cursus de fullstack-links pas op in productie — cross-site links vallen
// buiten de linkcheck van `pnpm build`.
//
// Het zoekwerk zelf staat in packages/shared/voorkennis.js, samen met godot.
// Fullstack linkt naar drie sites (python, web, editor) en die hebben niet
// dezelfde mapconventie; die verschillen zitten in de gedeelde helper.

const FULLSTACK_DOCS = fileURLToPath(new URL('../../docs', import.meta.url));
const SITES_ROOT = fileURLToPath(new URL('../../..', import.meta.url));
const SITES_JS = fileURLToPath(new URL('../../../../packages/shared/sites.js', import.meta.url));

type Item = { site: string; to: string; label: string };

function voorkennisPerLes(): Map<string, Item[]> {
  const perLes = new Map<string, Item[]>();
  for (const pad of alleLesbestanden(FULLSTACK_DOCS)) {
    const items = parseItems(readFileSync(pad, 'utf8'));
    if (items.length > 0) {
      perLes.set(
        pad
          .slice(FULLSTACK_DOCS.length + 1)
          .split('\\')
          .join('/'),
        items,
      );
    }
  }
  return perLes;
}

// Lessen die bewust géén blok hebben, met de reden erbij. Een eerdere versie
// van deze test somde alleen de lessen mét een blok op; een nieuwe les zonder
// blok viel daar buiten en bleef stil ongecontroleerd — zo kwam
// cookie-of-sessie.mdx erbij zonder dat iemand de keuze maakte. Daarom staan
// nu álle lesbestanden in een van de twee lijsten.
const ZONDER_BLOK: Record<string, string> = {
  'FastAPI/cookie-of-sessie.mdx': 'bouwt alleen op de twee lessen ervoor, in dezelfde cursus',
  'FastAPI/cookies.mdx': 'nieuwe stof is server-side en wordt hier zelf uitgelegd',
  'FastAPI/hoe-een-verzoek-werkt.mdx': 'samenvatting van deze cursus, geen nieuwe stof',
  'FastAPI/html_bestanden.mdx': 'HTML-bestand en pad; HTML zelf staat al bij html_tonen',
  'FastAPI/jouw-project.mdx': 'eindopdracht, verwijst per stap naar de eigen lessen',
  'FastAPI/laat-het-zien.mdx': 'terminalcommando en netwerkadres, geen voorkennis uit een cursus',
  'FastAPI/projectstructuur.mdx': 'naslag over deze cursus zelf',
  'FastAPI/redirect.mdx': 'bouwt op forms en database, allebei in deze cursus',
  'cheatsheet.md': 'naslag',
  'troubleshooting.md': 'naslag',
};

const MET_BLOK = [
  'FastAPI/afbeeldingen.mdx',
  'FastAPI/database.mdx',
  'FastAPI/detailpagina.mdx',
  'FastAPI/eerste_endpoint.mdx',
  'FastAPI/forms.mdx',
  'FastAPI/get_vs_post.mdx',
  'FastAPI/html_tonen.mdx',
  'FastAPI/installatie.mdx',
  'FastAPI/javascript.mdx',
  'FastAPI/lijst_tonen.mdx',
  'FastAPI/links.mdx',
  'FastAPI/post_met_templates.mdx',
  'FastAPI/post_naar_database.mdx',
  'FastAPI/server-of-browser.mdx',
  'FastAPI/sessies.mdx',
  'FastAPI/static_files.mdx',
];

function relatievePaden(): string[] {
  return alleLesbestanden(FULLSTACK_DOCS)
    .map((pad) =>
      pad
        .slice(FULLSTACK_DOCS.length + 1)
        .split('\\')
        .join('/'),
    )
    .sort();
}

describe('fullstack Voorkennis-blokken', () => {
  it('precies de afgesproken lessen hebben een blok', () => {
    expect([...voorkennisPerLes().keys()].sort()).toEqual(MET_BLOK);
  });

  it('elke lespagina staat in een van de twee lijsten', () => {
    // Dit is wat de vorige test niet doet: een nieuwe les zonder blok
    // afdwingen als expliciete keuze in plaats van als stilzwijgen.
    const bekend = new Set([...MET_BLOK, ...Object.keys(ZONDER_BLOK)]);
    const onbesproken = relatievePaden().filter((p) => !bekend.has(p));

    expect(onbesproken).toEqual([]);
  });

  it('de twee lijsten spreken elkaar niet tegen', () => {
    // Een les die een blok krijgt moet uit ZONDER_BLOK verdwijnen, anders
    // blijft er een reden staan die niet meer klopt.
    const beide = MET_BLOK.filter((p) => p in ZONDER_BLOK);
    expect(beide).toEqual([]);

    const verdwenen = [...MET_BLOK, ...Object.keys(ZONDER_BLOK)].filter(
      (p) => !relatievePaden().includes(p),
    );
    expect(verdwenen).toEqual([]);

    const zonderReden = Object.entries(ZONDER_BLOK)
      .filter(([, reden]) => reden.trim() === '')
      .map(([p]) => p);
    expect(zonderReden).toEqual([]);
  });

  it('de regex vangt elk item, ook met een apostrof in het label', () => {
    // Telt alle label-voorkomens in de docs en vergelijkt dat met wat de
    // parser oplevert. Zonder deze check viel een label tussen dubbele quotes
    // stil buiten de controle.
    let inBron = 0;
    for (const pad of alleLesbestanden(FULLSTACK_DOCS)) {
      inBron += [...readFileSync(pad, 'utf8').matchAll(/\blabel: /g)].length;
    }
    const gevonden = [...voorkennisPerLes().values()].flat();
    expect(gevonden.length).toBe(inBron);
    expect(gevonden.map((i) => i.label)).toContain("Pagina's koppelen");
  });

  it('elk pad wijst naar een bestaande lespagina op de doelsite', () => {
    const kapot: string[] = [];
    for (const [les, items] of voorkennisPerLes()) {
      for (const item of items) {
        if (!lesBestaat(SITES_ROOT, item.site, item.to)) {
          kapot.push(`${les} -> ${item.site}:${item.to}`);
        }
      }
    }
    expect(kapot).toEqual([]);
  });

  it('de URL-vertaling herkent een niet-bestaande les als kapot', () => {
    // Zonder deze check zou een lesBestaat die altijd true geeft de hele
    // suite stil groen laten.
    expect(lesBestaat(SITES_ROOT, 'python', '/docs/basis/jij-als-variabele')).toBe(true);
    expect(lesBestaat(SITES_ROOT, 'web', '/docs/html-css/intro-html')).toBe(true);
    expect(lesBestaat(SITES_ROOT, 'editor', '/docs/python/stap-4-venv')).toBe(true);
    expect(lesBestaat(SITES_ROOT, 'python', '/docs/basis/bestaat-niet')).toBe(false);
    expect(lesBestaat(SITES_ROOT, 'web', '/docs/bestaat-niet/intro-html')).toBe(false);
    expect(lesBestaat(SITES_ROOT, 'bestaat-niet', '/docs/x/y')).toBe(false);
  });

  it('elke gebruikte site staat in de registry', () => {
    expect(existsSync(SITES_JS)).toBe(true);
    const bron = readFileSync(SITES_JS, 'utf8');
    const bekend = new Set([...bron.matchAll(/id: '([\w-]+)'/g)].map((m) => m[1]));
    const gebruikt = new Set([...voorkennisPerLes().values()].flat().map((i) => i.site));
    expect([...gebruikt].filter((s) => !bekend.has(s))).toEqual([]);
  });

  it('geen hardcoded cursus-URL in de lespaginas', () => {
    // De registry is de bron van waarheid voor cross-site links.
    const kapot: string[] = [];
    for (const pad of alleLesbestanden(FULLSTACK_DOCS)) {
      if (/https:\/\/\w+\.coderius\.nl/.test(readFileSync(pad, 'utf8'))) {
        kapot.push(pad.slice(FULLSTACK_DOCS.length + 1));
      }
    }
    expect(kapot).toEqual([]);
  });
});

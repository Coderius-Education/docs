import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// Bewaakt de <Voorkennis>-blokken ("Hier bouw je op verder"): elk pad moet echt
// bestaan als lespagina op de doelsite, en elke gebruikte site moet in de
// registry staan. Zonder deze test breekt een hernoemde les in de python- of
// web-cursus de fullstack-links pas op in productie — cross-site links vallen
// buiten de linkcheck van `pnpm build`.
//
// Anders dan de godot-variant linkt fullstack naar drie sites (python, web,
// editor), en die hebben niet dezelfde mapconventie: python nummert zijn
// mappen ("06-data" -> "data"), web en editor niet.

const FULLSTACK_DOCS = fileURLToPath(new URL('../../docs', import.meta.url));
const SITES_ROOT = fileURLToPath(new URL('../../..', import.meta.url));
const SITES_JS = fileURLToPath(new URL('../../../../packages/shared/sites.js', import.meta.url));

// Items staan letterlijk in deze vorm in de bron, dus een regex volstaat.
// Zelfde afspraak als scripts/check-voorkennis.mjs in algorithms.
const ITEM_RE = /\{site: '(\w+)', to: '([^']+)', label: '([^']+)'\}/g;

function alleLesbestanden(map: string): string[] {
  const paden: string[] = [];
  for (const entry of readdirSync(map, { withFileTypes: true })) {
    const volledig = join(map, entry.name);
    if (entry.isDirectory()) paden.push(...alleLesbestanden(volledig));
    else if (/\.mdx?$/.test(entry.name)) paden.push(volledig);
  }
  return paden;
}

/**
 * Vertaalt een docs-URL van een andere site terug naar een bronbestand.
 * Docusaurus stript alleen een puur numeriek prefix ("06-data" -> "data",
 * maar "10a-lijsten-basis" blijft staan); een slug in de frontmatter wint
 * van de bestandsnaam.
 */
function lesBestaat(site: string, to: string): boolean {
  const docsMap = join(SITES_ROOT, site, 'docs');
  if (!existsSync(docsMap)) return false;

  const segmenten = to
    .replace(/^\/docs\/?/, '')
    .split('/')
    .filter(Boolean);
  if (segmenten.length === 0) return false;

  // Alle segmenten op één na zijn mappen; het laatste is de pagina.
  let huidig = docsMap;
  for (const segment of segmenten.slice(0, -1)) {
    const mapNaam = readdirSync(huidig, { withFileTypes: true }).find(
      (e) => e.isDirectory() && (e.name === segment || e.name.replace(/^\d+-/, '') === segment),
    )?.name;
    if (!mapNaam) return false;
    huidig = join(huidig, mapNaam);
  }

  const paginaSegment = segmenten[segmenten.length - 1];
  for (const bestand of readdirSync(huidig)) {
    if (!/\.mdx?$/.test(bestand)) continue;
    const inhoud = readFileSync(join(huidig, bestand), 'utf8');
    const slug = inhoud.match(/^slug:\s*(\S+)/m)?.[1];
    if (slug) {
      if (slug === to || slug === `/${paginaSegment}` || slug === paginaSegment) return true;
      continue;
    }
    const kaal = bestand.replace(/\.mdx?$/, '');
    if (kaal === paginaSegment || kaal.replace(/^\d+-/, '') === paginaSegment) return true;
  }
  return false;
}

type Item = { site: string; to: string; label: string };

function voorkennisPerLes(): Map<string, Item[]> {
  const perLes = new Map<string, Item[]>();
  for (const pad of alleLesbestanden(FULLSTACK_DOCS)) {
    const inhoud = readFileSync(pad, 'utf8');
    const items = [...inhoud.matchAll(ITEM_RE)].map((m) => ({
      site: m[1],
      to: m[2],
      label: m[3],
    }));
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

describe('fullstack Voorkennis-blokken', () => {
  it('precies de afgesproken lessen hebben een blok', () => {
    // Bewust een exacte lijst: een per ongeluk verwijderd blok valt zo direct
    // op, en een nieuwe les dwingt een expliciete keuze af. Lessen zonder blok
    // staan er bewust niet in — hun nieuwe stof is server-side en wordt op de
    // pagina zelf uitgelegd.
    expect([...voorkennisPerLes().keys()].sort()).toEqual([
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
      'FastAPI/static_files.mdx',
    ]);
  });

  it('elk pad wijst naar een bestaande lespagina op de doelsite', () => {
    const kapot: string[] = [];
    for (const [les, items] of voorkennisPerLes()) {
      for (const item of items) {
        if (!lesBestaat(item.site, item.to)) kapot.push(`${les} -> ${item.site}:${item.to}`);
      }
    }
    expect(kapot).toEqual([]);
  });

  it('de URL-vertaling herkent een niet-bestaande les als kapot', () => {
    // Zonder deze check zou een lesBestaat die altijd true geeft de hele
    // suite stil groen laten.
    expect(lesBestaat('python', '/docs/basis/jij-als-variabele')).toBe(true);
    expect(lesBestaat('web', '/docs/html-css/intro-html')).toBe(true);
    expect(lesBestaat('editor', '/docs/python/stap-4-venv')).toBe(true);
    expect(lesBestaat('python', '/docs/basis/bestaat-niet')).toBe(false);
    expect(lesBestaat('web', '/docs/bestaat-niet/intro-html')).toBe(false);
    expect(lesBestaat('bestaat-niet', '/docs/x/y')).toBe(false);
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
      const inhoud = readFileSync(pad, 'utf8');
      if (/https:\/\/\w+\.coderius\.nl/.test(inhoud)) {
        kapot.push(pad.slice(FULLSTACK_DOCS.length + 1));
      }
    }
    expect(kapot).toEqual([]);
  });
});

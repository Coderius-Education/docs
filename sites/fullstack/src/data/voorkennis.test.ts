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
      'FastAPI/sessies.mdx',
      'FastAPI/static_files.mdx',
    ]);
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

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SITES_BY_ID } from '@coderius/shared/sites';
import { alleLesbestanden, lesBestaat } from '@coderius/shared/voorkennis';
import { describe, expect, it } from 'vitest';

// <SiteLink> is de vooruitwijzende tegenhanger van <Voorkennis>: een inline
// link naar een andere cursus, opgebouwd uit de registry. Net als daar vallen
// die links buiten de linkcheck van `pnpm build` — een hernoemde pagina op de
// doelsite breekt ze pas in productie. Vandaar dezelfde monorepo-brede guard.

const SITES_ROOT = fileURLToPath(new URL('../../sites', import.meta.url));

const OVERSLAAN = new Set([
  'node_modules',
  'build',
  '.docusaurus',
  'static',
  '__fixtures__',
  'extracted',
]);

const SITELINK_RE = /<SiteLink\s+site="(\w+)"\s+to="([^"]*)"\s*>/g;

type Vondst = { bestand: string; site: string; to: string };

function alleBronbestanden(): string[] {
  const paden: string[] = [];
  for (const site of Object.keys(SITES_BY_ID)) {
    const siteMap = join(SITES_ROOT, site);
    if (!existsSync(siteMap)) continue;
    for (const entry of readdirSync(siteMap, { withFileTypes: true })) {
      if (!entry.isDirectory() || OVERSLAAN.has(entry.name)) continue;
      for (const pad of alleLesbestanden(join(siteMap, entry.name))) {
        if (pad.split(/[\\/]/).some((deel) => OVERSLAAN.has(deel))) continue;
        paden.push(pad);
      }
    }
  }
  return paden;
}

function alleGebruik(): Vondst[] {
  const vondsten: Vondst[] = [];
  for (const pad of alleBronbestanden()) {
    for (const m of readFileSync(pad, 'utf8').matchAll(SITELINK_RE)) {
      vondsten.push({
        bestand: pad
          .slice(SITES_ROOT.length + 1)
          .split('\\')
          .join('/'),
        site: m[1],
        to: m[2],
      });
    }
  }
  return vondsten;
}

/**
 * Bestaat dit SiteLink-doel op de doelsite? Ruimer dan lesBestaat, want een
 * vooruitwijzing mag ook naar de site-root ('/'), naar een categorie-index
 * (editor's '/git/vscode/' is een map met index.md) of naar een pagina onder
 * src/pages wijzen.
 */
function doelBestaat(site: string, to: string): boolean {
  const siteMap = join(SITES_ROOT, site);
  if (!existsSync(siteMap)) return false;

  const zonder = to.replace(/\/+$/, '');
  if (zonder === '') return true; // de site-root bestaat altijd

  if (lesBestaat(SITES_ROOT, site, zonder)) return true;

  const segmenten = zonder
    .replace(/^\/docs\/?/, '')
    .split('/')
    .filter(Boolean);

  // Categorie-index onder docs/: elk segment een map (numeriek prefix mag
  // wegvallen, net als bij lesBestaat), de laatste met een index-pagina.
  let huidig = join(siteMap, 'docs');
  let alleMappen = existsSync(huidig);
  for (const segment of segmenten) {
    if (!alleMappen) break;
    const naam = readdirSync(huidig, { withFileTypes: true }).find(
      (e) => e.isDirectory() && (e.name === segment || e.name.replace(/^\d+-/, '') === segment),
    )?.name;
    if (!naam) {
      alleMappen = false;
      break;
    }
    huidig = join(huidig, naam);
  }
  if (
    alleMappen &&
    (existsSync(join(huidig, 'index.md')) || existsSync(join(huidig, 'index.mdx')))
  ) {
    return true;
  }

  // Losse pagina onder src/pages (docenten, jouw-website, ...).
  const paginaBasis = join(siteMap, 'src', 'pages', ...segmenten);
  for (const ext of ['.md', '.mdx', '.tsx', '/index.tsx', '/index.mdx', '/index.md']) {
    if (existsSync(paginaBasis + ext)) return true;
  }
  return false;
}

describe('SiteLink-verwijzingen over alle sites', () => {
  const gebruik = alleGebruik();

  it('vindt überhaupt verwijzingen om te controleren', () => {
    // Een kapotte regex of walk zou de tests hieronder leeg en groen laten.
    expect(gebruik.length).toBeGreaterThan(10);
    expect(new Set(gebruik.map((v) => v.bestand.split('/')[0])).size).toBeGreaterThan(3);
  });

  it('elke doelsite staat in de registry', () => {
    const onbekend = gebruik
      .filter((v) => !(v.site in SITES_BY_ID))
      .map((v) => `${v.bestand} -> site '${v.site}'`);
    expect(onbekend).toEqual([]);
  });

  it('elk doelpad bestaat op de doelsite', () => {
    const kapot = gebruik
      .filter((v) => !doelBestaat(v.site, v.to))
      .map((v) => `${v.bestand} -> ${v.site}${v.to}`);
    expect(kapot).toEqual([]);
  });

  it('wijst een verzonnen doel wél af', () => {
    // De test hierboven is alleen wat waard als doelBestaat nee kan zeggen.
    expect(doelBestaat('editor', '/git/bestaat-niet/')).toBe(false);
    expect(doelBestaat('bestaat-niet', '/')).toBe(false);
    // En de vormen die hij juist moet toestaan:
    expect(doelBestaat('ide', '/')).toBe(true);
    expect(doelBestaat('editor', '/git/vscode/')).toBe(true);
  });
});

describe('geen hardcoded cursus-URL in lestekst', () => {
  // Stijlgids §12: de registry is de enige bron van waarheid. Een hardcoded
  // URL overleeft een domeinwijziging niet en ontwijkt bovendien de
  // doelpad-controle hierboven. stats.coderius.nl (Matomo) is infrastructuur,
  // geen cursus, en telt niet mee.
  const UITZONDERINGEN: string[] = [];

  it('lestekst linkt via <SiteLink> of <Voorkennis>, niet via een URL', () => {
    const HARDCODED = /https?:\/\/(?!stats\.)[a-z]+\.coderius\.nl/;
    const fout: string[] = [];

    for (const pad of alleBronbestanden()) {
      const kort = pad
        .slice(SITES_ROOT.length + 1)
        .split('\\')
        .join('/');
      if (UITZONDERINGEN.includes(kort)) continue;
      readFileSync(pad, 'utf8')
        .split('\n')
        .forEach((regel, i) => {
          if (HARDCODED.test(regel)) fout.push(`${kort}:${i + 1}`);
        });
    }

    expect(fout).toEqual([]);
  });

  it('de uitzonderingenlijst bevat geen dode paden', () => {
    // Anders blijft een uitzondering bestaan nadat het bestand verdween en
    // dekt hij ooit stilletjes een nieuw bestand met dezelfde naam.
    const dood = UITZONDERINGEN.filter((p) => !existsSync(join(SITES_ROOT, p)));
    expect(dood).toEqual([]);
  });
});

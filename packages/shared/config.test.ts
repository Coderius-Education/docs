import { readFileSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { HOME, SITES, SITES_BY_ID, SUBJECTS_BY_ID } from '@coderius/shared/sites';
import { siteMappenOpSchijf } from '@coderius/shared/voorkennis';
import { describe, expect, it } from 'vitest';

// createConfig leest host en pad van een cursus uit de registry: elke cursus
// staat onder de host van zijn vak (https://informatica.coderius.nl/python/).
// Gaat dat mis, dan bouwt de site wel, maar wijst elke asset en elke link naar
// de root van de vak-host, en daar staat de homepage.

const require = createRequire(import.meta.url);
const { createConfig, FASTER } = require('./config');

type NavItem = { label: string; href?: string; to?: string; type?: string; items?: NavItem[] };

function dropdown(config: { themeConfig: { navbar: { items: NavItem[] } } }): NavItem[] {
  const menu = config.themeConfig.navbar.items.find(
    (i) => i.type === 'dropdown' && i.label === 'Cursussen',
  );
  return menu?.items ?? [];
}

const ROOT = fileURLToPath(new URL('../..', import.meta.url));

describe('createConfig — host en pad uit de registry', () => {
  it('zet url op de vak-host en baseUrl op het pad van de cursus', () => {
    const config = createConfig({ siteId: 'algorithms' });
    expect(config.url).toBe('https://informatica.coderius.nl');
    expect(config.baseUrl).toBe('/algoritmes/');
    // siteId is van de factory, niet van Docusaurus (die weigert onbekende velden).
    expect(config).not.toHaveProperty('siteId');
  });

  it('werkt voor elke site in de registry, ook de docentensites', () => {
    for (const site of Object.values(SITES_BY_ID)) {
      const config = createConfig({ siteId: site.id });
      expect(config.url + config.baseUrl).toBe(site.url);
      expect(SUBJECTS_BY_ID[site.subject].url).toBe(config.url);
    }
  });

  it('herkent een oude subdomein-URL, zodat oudere configs blijven bouwen', () => {
    const config = createConfig({ url: 'https://algoritmes.coderius.nl' });
    expect(config.url).toBe('https://informatica.coderius.nl');
    expect(config.baseUrl).toBe('/algoritmes/');
  });

  it('wint van een url of baseUrl die de site zelf meegeeft', () => {
    const config = createConfig({ siteId: 'python', url: 'https://elders.nl', baseUrl: '/' });
    expect(config.url).toBe('https://informatica.coderius.nl');
    expect(config.baseUrl).toBe('/python/');
  });

  it('weigert een onbekende siteId', () => {
    expect(() => createConfig({ siteId: 'bestaat-niet' })).toThrow(/bestaat-niet/);
  });
});

describe('createConfig — de Cursussen-dropdown toont alleen het eigen vak', () => {
  it('bevat de andere cursussen van het vak, het overzicht en "Andere vakken"', () => {
    const items = dropdown(createConfig({ siteId: 'python' }));
    const verwacht = SITES.filter((s) => s.subject === 'informatica' && s.id !== 'python');
    expect(items.filter((i) => i.href && i.href !== HOME.url).map((i) => i.href)).toEqual(
      verwacht.map((s) => s.url),
    );
    expect(items).toContainEqual({ label: 'Alle cursussen', to: '/cursussen' });
    expect(items).toContainEqual({ label: 'Andere vakken', href: HOME.url });
    expect(items.some((i) => i.href === SITES_BY_ID.python.url)).toBe(false);
  });

  it('linkt geen enkele cursus via een oud subdomein', () => {
    const items = dropdown(createConfig({ siteId: 'web' }));
    expect(
      items.filter((i) => /https:\/\/(?!informatica\.)[a-z]+\.coderius\.nl/.test(i.href ?? '')),
    ).toEqual([]);
  });
});

describe('createConfig — Docusaurus Faster', () => {
  // Rspack, swc en lightningcss bouwen drie tot zeven keer zo snel, met
  // dezelfde pagina's. Twee onderdelen staan uit, en dat moet zo blijven.
  it('staat aan voor elke site', () => {
    const config = createConfig({ siteId: 'python', title: 'x' });
    expect(config.future.faster).toBe(FASTER);
    expect(FASTER.rspackBundler).toBe(true);
  });

  it('zonder de html-minifier van swc: die haalt de aanhalingstekens weg', () => {
    // scripts/controleer-cross-links.mjs leest `href="…"`; met `href=/python/…`
    // vond hij geen enkele link meer, en bleef de CI-job toch groen.
    expect(FASTER.swcHtmlMinimizer).toBe(false);
  });

  it('een site kan Faster niet zelf aanzetten of anders instellen', () => {
    // future: { faster: true } zette de html-minifier van swc weer aan voor
    // die ene site, en dan las de controle op links tussen cursussen zijn
    // pagina's maar half.
    for (const faster of [true, false, { swcHtmlMinimizer: true }]) {
      const config = createConfig({ siteId: 'python', title: 'x', future: { faster } });
      expect(config.future.faster).toBe(FASTER);
    }
    // Andere future-vlaggen mag een site wel zetten.
    expect(createConfig({ siteId: 'python', title: 'x', future: { v4: false } }).future.v4).toBe(
      false,
    );
  });

  it('zonder persistente cache: elke build byte voor byte gelijk', () => {
    expect(FASTER.rspackPersistentCache).toBe(false);
  });

  // @docusaurus/core zoekt @docusaurus/faster als optionele peer, binnen de
  // site die core gebruikt. Eerst stond het pakket in geen enkele
  // package.json en kwam het alleen via de lockfile mee; een update van
  // Docusaurus kon het dan weglaten of een andere versie dan core geven.
  it('elke Docusaurus-site heeft @docusaurus/faster, in de versie van core', () => {
    const workspace = readFileSync(join(ROOT, 'pnpm-workspace.yaml'), 'utf8');
    const versie = (naam: string) => workspace.match(new RegExp(`^ {2}'${naam}': (.+)$`, 'm'))?.[1];
    expect(versie('@docusaurus/faster')).toBeDefined();
    expect(versie('@docusaurus/faster')).toBe(versie('@docusaurus/core'));

    const zonder = siteMappenOpSchijf(ROOT)
      .map(({ map }) => JSON.parse(readFileSync(join(map, 'package.json'), 'utf8')))
      .filter((pkg) => pkg.dependencies?.['@docusaurus/core'])
      .filter((pkg) => pkg.dependencies['@docusaurus/faster'] !== 'catalog:')
      .map((pkg) => pkg.name);
    expect(zonder).toEqual([]);
  });
});

describe('de kleuren van Python-code (issue #158)', () => {
  const { licht, donker } = require('./prism-thema');

  it("createConfig geeft elke cursus de thema's uit prism-thema.js, en geen cursus zet zelf dracula", () => {
    const config = createConfig({ siteId: 'python' });
    expect(config.themeConfig.prism.theme).toBe(licht);
    expect(config.themeConfig.prism.darkTheme).toBe(donker);
    const sites = fileURLToPath(new URL('../../sites', import.meta.url));
    const fout = readdirSync(sites, { recursive: true })
      .map(String)
      .filter((f) => f.endsWith('docusaurus.config.ts') && !f.includes('node_modules'))
      .filter((f) => /\bdracula\b/.test(readFileSync(join(sites, f), 'utf8')));
    expect(fout).toEqual([]);
  });

  it("de editor van de python-runner gebruikt dezelfde thema's", () => {
    const editor = readFileSync(
      fileURLToPath(new URL('../python-runner/src/HighlightedEditor/index.tsx', import.meta.url)),
      'utf8',
    );
    expect(editor).toContain("from '@coderius/shared/prism-thema'");
    expect(editor).not.toMatch(/\bdracula\b/);
  });
});

describe('createConfig — les-tabbladen', () => {
  // Met `lesTabs: true` zet een remark-stap elke ##-sectie van een les in een
  // tabblad (plugins/les-tabs.js). De stap moet de laatste zijn: Docusaurus
  // heeft dan de id's van de koppen gezet, en de begrippen-stap is geweest.
  const { remarkLesTabs } = require('./plugins/les-tabs.js');
  const docsVan = (config: { presets: [string, { docs?: { remarkPlugins?: unknown[] } }][] }) =>
    config.presets[0][1].docs?.remarkPlugins ?? [];
  const basis = {
    siteId: 'web',
    title: 'x',
    presets: [['classic', { docs: { remarkPlugins: ['eerst'] }, blog: false }]],
  };

  it('zet de stap achteraan in de docs, alleen met de schakelaar aan', () => {
    expect(docsVan(createConfig({ ...basis, lesTabs: true })).at(-1)).toBe(remarkLesTabs);
    expect(docsVan(createConfig({ ...basis, lesTabs: true }))).toContain('eerst');
    expect(docsVan(createConfig(basis))).not.toContain(remarkLesTabs);
  });

  it('geeft de schakelaar niet door aan Docusaurus, dat een onbekend veld weigert', () => {
    expect(createConfig({ ...basis, lesTabs: true })).not.toHaveProperty('lesTabs');
  });

  it('zet de plugin aan die per les de werkvormen levert, alleen met de schakelaar aan', () => {
    // De docentenhandleiding toont per les de iconen van zijn tabbladen
    // (<LesWerkvormen>); zonder de plugin heeft dat onderdeel geen gegevens.
    const werkvormenPlugin = require('./plugins/werkvormen.js');
    const plugins = (config: { plugins: unknown[] }) => config.plugins;
    expect(plugins(createConfig({ ...basis, lesTabs: true }))).toContain(werkvormenPlugin);
    expect(plugins(createConfig(basis))).not.toContain(werkvormenPlugin);
  });

  it('staat aan bij de cursussen die zijn omgezet, en alleen daar', () => {
    // Aanzetten is de eerste van vijf stappen (root-CLAUDE.md, Les-tabbladen):
    // zonder meten en inkorten staat een cursus vol schermen die niet passen.
    // Een cursus komt in deze lijst als hij die stappen heeft gehad.
    const aan = SITES.filter((s) => {
      const pad = join(ROOT, 'sites', s.subject ?? '', s.id, 'docusaurus.config.ts');
      try {
        return /\blesTabs:\s*true/.test(readFileSync(pad, 'utf8'));
      } catch {
        return false;
      }
    }).map((s) => s.id);
    expect(aan).toEqual(['python', 'web']);
  });
});

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const { CURSUSSEN, CURSUS_KLEUREN, NEUTRAAL } = require('./huisstijl');
const { contrast } = require('./huisstijl/kleur');
const { SITES, DOCENTEN_SITES } = require('./sites');
const { createConfig } = require('./config');

const ROOT = path.resolve(__dirname, '..', '..');
const MERK = path.join(__dirname, 'static', 'img', 'merk');

describe('huisstijl', () => {
  it('gegenereerde logo’s en CSS passen bij de bron', () => {
    // Faalt met de lijst verouderde bestanden; los op met
    // `node scripts/genereer-huisstijl.mjs`.
    execFileSync('node', [path.join(ROOT, 'scripts', 'genereer-huisstijl.mjs'), '--check'], {
      stdio: 'pipe',
    });
  });

  it('elke cursus en docentensite heeft een merk, een tegel en een woordmerk', () => {
    for (const site of [...SITES, ...DOCENTEN_SITES]) {
      const cursus = CURSUSSEN.find((c: { id: string }) => c.id === site.id);
      expect(cursus, `geen huisstijl voor ${site.id}`).toBeDefined();
      for (const bestand of [
        `${site.id}.svg`,
        `${site.id}-donker.svg`,
        `${site.id}-tegel.svg`,
        `woordmerk-${site.id}.svg`,
        `woordmerk-${site.id}-donker.svg`,
      ]) {
        expect(fs.existsSync(path.join(MERK, bestand)), bestand).toBe(true);
      }
    }
  });

  it('de SVG’s zijn geldige XML: een & uit een label is ge-escaped', () => {
    // "VS Code & Git" brak het woordmerk van de editor-cursus.
    for (const bestand of fs.readdirSync(MERK)) {
      const svg = fs.readFileSync(path.join(MERK, bestand), 'utf8');
      expect(svg, bestand).not.toMatch(/&(?!amp;|lt;|gt;|quot;|apos;)/);
    }
  });

  const ids: string[] = CURSUSSEN.map((c: { id: string }) => c.id);
  describe.each(ids)('contrast van %s', (id: string) => {
    const { licht, donker } = CURSUS_KLEUREN[id];
    it('licht: primary als tekst op de grond en als vlak onder on-primary', () => {
      expect(contrast(licht.primary, NEUTRAAL.licht.achtergrond)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(licht.primary, NEUTRAAL.licht.oppervlak)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(licht.primary, licht['on-primary'])).toBeGreaterThanOrEqual(4.5);
    });
    it('donker: primary als tekst op de grond en als vlak onder on-primary', () => {
      expect(contrast(donker.primary, NEUTRAAL.donker.achtergrond)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(donker.primary, NEUTRAAL.donker.oppervlak)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(donker.primary, donker['on-primary'])).toBeGreaterThanOrEqual(4.5);
    });
  });

  it('variabelen staan op de opgehoogde selector die Infima’s layer-polyfill verslaat', () => {
    // Een kale :root verloor van :root:not(#\#):not(#\#); het oude groen
    // heeft daardoor nooit op een site gestaan.
    const css = path.join(__dirname, 'css');
    const bestanden = [
      'huisstijl.css',
      'custom.css',
      ...fs.readdirSync(path.join(css, 'cursus')).map((f) => `cursus/${f}`),
    ];
    for (const f of bestanden) {
      const src = fs.readFileSync(path.join(css, f), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
      for (const [, sel, body] of src.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
        if (/--ifm-[\w-]+\s*:/.test(body))
          expect(sel.trim(), f).toMatch(/:not\(#\\#\):not\(#\\#\)$/);
      }
    }
  });

  it('lopende tekst haalt AAA in beide thema’s', () => {
    for (const t of ['licht', 'donker'] as const) {
      expect(contrast(NEUTRAAL[t].inkt, NEUTRAAL[t].achtergrond)).toBeGreaterThanOrEqual(7);
    }
  });

  it('createConfig zet merk, naam en favicon van de cursus', () => {
    const config = createConfig({
      url: 'https://python.coderius.nl',
      presets: [['classic', { theme: {} }]],
    });
    expect(config.themeConfig.navbar.logo).toMatchObject({
      src: 'img/merk/python.svg',
      srcDark: 'img/merk/python-donker.svg',
    });
    expect(config.themeConfig.navbar.title).toBe('Python');
    expect(config.favicon).toBe('img/merk/python-tegel.svg');
    const css = config.presets[0][1].theme.customCss.map((p: string) => path.basename(p));
    expect(css).toEqual(['huisstijl.css', 'custom.css', 'python.css']);
  });

  it('een eigen navbar-logo van de site blijft staan', () => {
    const logo = { alt: 'eigen', src: 'img/eigen.svg' };
    const config = createConfig({
      url: 'https://python.coderius.nl',
      themeConfig: { navbar: { logo, title: 'Eigen' } },
    });
    expect(config.themeConfig.navbar.logo).toEqual(logo);
    expect(config.themeConfig.navbar.title).toBe('Eigen');
  });

  it('geen site overschrijft het huisstijl-merk of de primary-kleur nog met de hand', () => {
    for (const map of fs.readdirSync(path.join(ROOT, 'sites'))) {
      const cfg = path.join(ROOT, 'sites', map, 'docusaurus.config.ts');
      if (fs.existsSync(cfg)) {
        expect(fs.readFileSync(cfg, 'utf8'), cfg).not.toMatch(/navbar:\s*\{\s*(title|logo):/);
      }
      const css = path.join(ROOT, 'sites', map, 'src', 'css', 'custom.css');
      if (fs.existsSync(css))
        expect(fs.readFileSync(css, 'utf8'), css).not.toMatch(/--ifm-color-primary\s*:/);
    }
  });
});

// Wit op de primary-kleur haalde in donker thema maar 2.3:1: de lichte
// donker-thema-primary vraagt donkere tekst. Tekst op een primary-vlak gebruikt
// daarom --coderius-on-primary.
describe('tekst op een primary-vlak', () => {
  const OVERSLAAN = new Set(['node_modules', 'build', '.docusaurus', '.svelte-kit', 'static']);
  const cssBestanden: string[] = [];
  const loop = (dir: string) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      if (OVERSLAAN.has(e.name)) continue;
      const p = path.join(dir, e.name);
      if (e.isDirectory()) loop(p);
      else if (p.endsWith('.css')) cssBestanden.push(p);
    }
  };
  loop(path.join(ROOT, 'packages'));
  loop(path.join(ROOT, 'sites'));

  it('is nergens hard wit', () => {
    const fout: string[] = [];
    for (const f of cssBestanden) {
      const src = fs.readFileSync(f, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
      for (const [, sel, body] of src.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
        if (
          /background(-color)?\s*:[^;]*--ifm-color-primary/.test(body) &&
          /(^|[;\s])color\s*:\s*(#fff\b|#ffffff|white)/i.test(body)
        ) {
          fout.push(`${path.relative(ROOT, f)} ${sel.trim().split('\n').pop()}`);
        }
      }
    }
    expect(fout).toEqual([]);
  });
});

describe('de homepage van elke cursus past in één scherm', () => {
  // Of hij echt past hangt aan layout en valt alleen in een browser te meten
  // (zie sites/home/CLAUDE.md en de commit die dit invoerde). Wat hier wel kan:
  // de twee dingen vastpinnen waar dat van afhangt.
  const regels = (f: string) =>
    [
      ...fs
        .readFileSync(f, 'utf8')
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .matchAll(/([^{}]+)\{([^{}]*)\}/g),
    ].map(([, sel, body]) => ({ sel: sel.trim().split('\n').pop() ?? '', body }));

  it('de maten van hero en kaarten winnen van Infima: ze staan op de opgehoogde selector', () => {
    // Infima's .hero, h2, h3 en p staan door de layer-polyfill op
    // :not(#\#):not(#\#). Een kale module-klasse verloor: de hero van elke
    // cursus had Infima's 4rem padding in plaats van de 2,5rem uit deze CSS,
    // en de kaarttitels van algorithms stonden op 1.25rem in plaats van 0.95.
    const bestanden = [
      path.join(__dirname, 'components', 'HomepageHero', 'styles.module.css'),
      path.join(__dirname, 'components', 'HomepageFeatures', 'styles.module.css'),
      path.join(__dirname, 'components', 'HomepageSections', 'styles.module.css'),
      path.join(
        ROOT,
        'sites',
        'algorithms',
        'src',
        'components',
        'AlgorithmGrid',
        'styles.module.css',
      ),
    ];
    const fout: string[] = [];
    for (const f of bestanden) {
      for (const { sel } of regels(f)) {
        const raaktInfima =
          /\.heroBanner|\.compact|\.cardTitle|\.cardSummary/.test(sel) ||
          /\.(featuresHeader|featureCard)\b.*\b(h2|h3|p)\b/.test(sel);
        if (raaktInfima && !/:not\(#\\#\):not\(#\\#\)/.test(sel))
          fout.push(`${path.relative(ROOT, f)}: ${sel}`);
      }
    }
    expect(fout).toEqual([]);
  });

  it('elke homepage draagt coderius-homepage, zodat de footer daar compact staat', () => {
    const custom = fs.readFileSync(path.join(__dirname, 'css', 'custom.css'), 'utf8');
    expect(custom).toMatch(/html:has\(\.coderius-homepage\) \.footer__items/);
    // ManagedHomepage zet de klasse; elke homepage loopt daardoorheen.
    const managed = fs.readFileSync(
      path.join(__dirname, 'components', 'ManagedHomepage', 'index.tsx'),
      'utf8',
    );
    expect(managed).toContain("'coderius-homepage'");
    // De homepage vult het scherm tot de footer; de hero vangt de extra ruimte
    // op en de kaarten staan gecentreerd in de rest, anders staat er onder de
    // kaarten een leeg vlak (ruim 400 px op 1920×1080).
    expect(managed).toContain('styles.homepage');
    const managedCss = fs.readFileSync(
      path.join(__dirname, 'components', 'ManagedHomepage', 'styles.module.css'),
      'utf8',
    );
    expect(managedCss).toMatch(
      /header\.hero\):has\(\+ :is\(section, main\)\)\s*\{\s*flex: 2 0 auto;/,
    );
    expect(managedCss).toMatch(/\+ :is\(section, main\)\s*\{[^}]*justify-content: center;/);
    const fout: string[] = [];
    for (const site of fs.readdirSync(path.join(ROOT, 'sites'))) {
      const pages = path.join(ROOT, 'sites', site, 'src', 'pages');
      const index =
        fs.existsSync(pages) &&
        fs.readdirSync(pages).find((n) => /^index\.(tsx|jsx?|mdx)$/.test(n));
      if (!index) continue;
      const src = fs.readFileSync(path.join(pages, index), 'utf8');
      if (!src.includes('ManagedHomepage') && !src.includes('coderius-homepage')) fout.push(site);
    }
    expect(fout).toEqual([]);
  });
});

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

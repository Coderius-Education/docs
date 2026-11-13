import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const require = createRequire(import.meta.url);
const { adresVanBron, lessenVoorMeting } = require('./meet-selectie.js');
const { siteDir } = require('./sites.js');

// De job `schermen` meet in Chromium de lessen die een wijziging raakt
// (scripts/meet-les-tabs.mjs --bronnen=changed.json --streng). Welke dat zijn,
// staat hier.

const ROOT = fileURLToPath(new URL('../..', import.meta.url));
const LESSEN = ['docs/terminal/mappen', 'docs/terminal/jokertekens', 'docs/wsl/tunnel'];
const plan = (bestanden: string[], extra = {}) => ({
  volledig: false,
  bestanden: Object.fromEntries(bestanden.map((b) => [b, [[1, 1]]])),
  ...extra,
});
const lees = (bronnen: Record<string, string>) => (pad: string) =>
  pad in bronnen ? bronnen[pad] : '---\nsidebar_position: 1\n---\n# Les\n';

describe('het adres van een lespagina', () => {
  it('is het pad na de map van de docs-plugin, zonder extensie', () => {
    expect(adresVanBron('docs/terminal/jokertekens.mdx', '')).toBe('terminal/jokertekens');
    expect(adresVanBron('lego_auto/deel-1.mdx', '')).toBe('deel-1');
    expect(adresVanBron('src/pages/docenten.mdx', '')).toBe('docenten');
  });

  it('laat een nummer vooraan weg, zoals Docusaurus', () => {
    expect(adresVanBron('docs/02-editor-leren-kennen/01-interface.md', '')).toBe(
      'editor-leren-kennen/interface',
    );
  });

  it('volgt slug en id uit de front matter', () => {
    expect(adresVanBron('docs/a/b.md', '---\nslug: /c/d\n---\n')).toBe('c/d');
    expect(adresVanBron('docs/a/b.md', "---\nslug: 'e'\n---\n")).toBe('a/e');
    expect(adresVanBron('docs/a/b.md', '---\nid: f\n---\n')).toBe('a/f');
  });

  it('een index is de map zelf', () => {
    expect(adresVanBron('docs/git/basis/index.mdx', '')).toBe('git/basis');
    expect(adresVanBron('docs/git/basis/basis.md', '')).toBe('git/basis');
  });

  it('een deel, een onderdeel of de config is geen lespagina', () => {
    expect(adresVanBron('docs/onderdelen/_delen/i2c.mdx', '')).toBeNull();
    expect(adresVanBron('src/components/LinuxTerminal/index.js', '')).toBeNull();
    expect(adresVanBron('docusaurus.config.ts', '')).toBeNull();
    expect(adresVanBron('static/img/a.md', '')).toBeNull();
  });
});

describe('welke lessen CI meet', () => {
  const siteMap = 'sites/informatica/linux';
  const meet = (bestanden: string[], extra = {}, bronnen = {}) =>
    lessenVoorMeting({
      plan: plan(bestanden, extra),
      siteMap,
      lessen: LESSEN,
      leesBron: lees(bronnen),
    });

  it('alleen de gewijzigde lessen', () => {
    const r = meet([`${siteMap}/docs/terminal/jokertekens.mdx`, 'sites/informatica/web/docs/a.md']);
    expect(r).toMatchObject({ alles: false, lessen: ['docs/terminal/jokertekens'] });
  });

  it('alles bij een onderdeel, de opmaak, een deel of een package', () => {
    expect(meet([`${siteMap}/src/components/LinuxTerminal/index.js`]).alles).toBe(true);
    expect(meet([`${siteMap}/src/css/custom.css`]).alles).toBe(true);
    expect(meet([`${siteMap}/docs/terminal/_samen.mdx`]).alles).toBe(true);
    // Geen eigen bestand veranderd, wel geraakt: dan een package (LesTabs).
    expect(meet(['packages/shared/components/LesTabs/index.tsx']).alles).toBe(true);
  });

  it('alles in een volledige run, of als het meetscript veranderde', () => {
    expect(meet([], { volledig: true }).alles).toBe(true);
    expect(meet([`${siteMap}/docs/terminal/mappen.mdx`], { schermen: { alles: true } }).alles).toBe(
      true,
    );
  });

  it('een weggehaalde les valt weg, een pagina zonder meting wordt genoemd', () => {
    const r = lessenVoorMeting({
      plan: plan([`${siteMap}/docs/terminal/weg.mdx`, `${siteMap}/docs/cheatsheet.mdx`]),
      siteMap,
      lessen: LESSEN,
      leesBron: (pad: string) => (pad.endsWith('weg.mdx') ? null : '# Cheatsheet\n'),
    });
    expect(r).toMatchObject({
      alles: false,
      lessen: [],
      nietGevonden: [`${siteMap}/docs/cheatsheet.mdx`],
    });
  });
});

describe('in deze repository', () => {
  // Elke les van een cursus met tabbladen die al gebouwd is, moet bij zijn
  // bron te vinden zijn: anders meet CI een gewijzigde les stil niet.
  it('elke gebouwde les met tabbladen hoort bij een bron', () => {
    const fout: string[] = [];
    for (const site of ['linux', 'ctf', 'editor', 'web', 'python', 'robotica', 'fullstack']) {
      const map = join(ROOT, siteDir(site));
      const build = join(map, 'build');
      if (!existsSync(build)) continue;
      const lessen: string[] = [];
      const loop = (d: string) => {
        for (const n of readdirSync(d)) {
          const p = join(d, n);
          if (statSync(p).isDirectory()) {
            if (!['assets', 'img', 'pyodide', 'oud'].includes(relative(build, p))) loop(p);
          } else if (
            n === 'index.html' &&
            /data-les-(tabs|zonder-tabs)/.test(readFileSync(p, 'utf8'))
          )
            lessen.push(relative(build, d));
        }
      };
      loop(build);
      const bronnen: string[] = [];
      const zoek = (d: string) => {
        for (const n of readdirSync(d)) {
          const p = join(d, n);
          if (['node_modules', 'build', '.docusaurus'].includes(n)) continue;
          if (statSync(p).isDirectory()) zoek(p);
          else if (/\.mdx?$/.test(n)) bronnen.push(relative(map, p));
        }
      };
      zoek(map);
      const adressen = bronnen
        .map((b) => adresVanBron(b, readFileSync(join(map, b), 'utf8')))
        .filter((a): a is string => a !== null);
      for (const les of lessen)
        if (!adressen.some((a) => les === a || les.endsWith(`/${a}`))) fout.push(`${site}: ${les}`);
    }
    expect(fout).toEqual([]);
  });
});

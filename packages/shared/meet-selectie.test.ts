import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const require = createRequire(import.meta.url);
const {
  adresVanBron,
  deelVan,
  docsMappen,
  heleSite,
  lesVan,
  lessenVoorMeting,
  moetGemetenWorden,
  houdtNummers,
} = require('./meet-selectie.js');
const { alleSiteMappen, siteDir } = require('./sites.js');
const { plan: maakPlan } = require('./wijzigingen.js');

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

  it('houdt het nummer als de site dat doet (numberPrefixParser: false)', () => {
    // Algoritmes: docs/bubble-sort/01-concept.mdx is de les
    // docs/bubble-sort/01-concept. Zonder nummer vond de meting hem niet.
    expect(adresVanBron('docs/bubble-sort/bouwen/04-de-swap.mdx', '', { nummers: true })).toBe(
      'bubble-sort/bouwen/04-de-swap',
    );
    expect(houdtNummers("docs: { numberPrefixParser: false, sidebarPath: './s.ts' }")).toBe(true);
    expect(houdtNummers("docs: { sidebarPath: './s.ts' }")).toBe(false);
    expect(
      houdtNummers(readFileSync(join(ROOT, siteDir('algorithms'), 'docusaurus.config.ts'), 'utf8')),
    ).toBe(true);
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
      site: 'linux',
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

  // Het plan van CI (schermenMatrix) beslist met heleSite of een cursus in
  // delen gemeten wordt; het meetscript beslist met lessenVoorMeting. Het plan
  // kent alleen bestaat-of-niet (scripts/wijzigingen.mjs), het meetscript de
  // inhoud. Liepen ze uiteen, dan kreeg een hele cursus één runner, of een paar
  // lessen zes.
  it('het plan en het meetscript beslissen hetzelfde, ook met een weggehaald bestand', () => {
    const weg = `${siteMap}/src/components/Oud.tsx`;
    const les = `${siteMap}/docs/terminal/jokertekens.mdx`;
    const wegLes = `${siteMap}/docs/terminal/oud.mdx`;
    const bestaat = (pad: string) => ![weg, wegLes].includes(pad);
    const planLees = (pad: string) => (bestaat(pad) ? '' : null);
    const scriptLees = (pad: string) => (bestaat(pad) ? lees({})(pad) : null);
    const gevallen: [string[], object][] = [
      [[les], {}],
      [[`${siteMap}/src/css/custom.css`], {}],
      [[`${siteMap}/src/css/custom.css`, les], {}],
      [[`${siteMap}/docs/terminal/_samen.mdx`], {}],
      [['packages/shared/components/LesTabs/index.tsx'], {}],
      [[weg, les], {}],
      [[wegLes], {}],
      [[les], { volledig: true }],
      [[les], { schermen: { alles: true } }],
      [[les], { schermen: { viaPakket: { linux: 'p/a.ts' } } }],
    ];
    for (const [bestanden, extra] of gevallen) {
      const p = plan(bestanden, extra);
      const heel = heleSite({ plan: p, site: 'linux', siteMap, leesBron: planLees });
      const keuze = lessenVoorMeting({
        plan: p,
        site: 'linux',
        siteMap,
        lessen: LESSEN,
        leesBron: scriptLees,
      });
      expect(heel !== null, bestanden.join()).toBe(keuze.alles);
    }
  });

  it('een test, de notities of de labels van de lessenlijst raken geen scherm', () => {
    // Eerst maten ze de hele cursus, met de meting in delen zes runners.
    for (const pad of [
      'src/docs-tests/opdrachten.test.ts',
      'src/components/PyRunner/breedte.test.ts',
      'CLAUDE.md',
      'docs/terminal/_category_.json',
    ]) {
      const keuze = meet([`${siteMap}/${pad}`]);
      expect(keuze, pad).toMatchObject({ alles: false, lessen: [], nietGevonden: [] });
      expect(
        heleSite({ plan: plan([`${siteMap}/${pad}`]), site: 'linux', siteMap }),
        pad,
      ).toBeNull();
    }
    // Een test naast een onderdeel: het onderdeel telt.
    expect(
      meet([`${siteMap}/src/components/X/a.test.ts`, `${siteMap}/src/components/X/a.ts`]).alles,
    ).toBe(true);
  });

  it('de delen bevatten samen elke les precies één keer', () => {
    const lessen = Array.from({ length: 23 }, (_, i) => `docs/les-${i}`);
    for (const delen of [1, 2, 4, 6, 30]) {
      const samen = Array.from({ length: delen }, (_, i) => deelVan(lessen, i + 1, delen)).flat();
      expect(samen.sort(), `${delen} delen`).toEqual([...lessen].sort());
    }
    // Om en om: een hoofdstuk komt niet in één deel terecht.
    expect(deelVan(lessen, 2, 4).slice(0, 2)).toEqual(['docs/les-1', 'docs/les-5']);
    for (const fout of [
      [0, 2],
      [3, 2],
      [1.5, 2],
      [1, 0],
    ] as const)
      expect(() => deelVan(lessen, ...fout), fout.join('/')).toThrow();
  });

  it('een les is `les/index.html`, of `les.html` bij trailingSlash: false', () => {
    expect(lesVan('docs/terminal/mappen', 'index.html')).toBe('docs/terminal/mappen');
    expect(lesVan('docs/hanoi', '01-spel.html')).toBe('docs/hanoi/01-spel');
    expect(lesVan('', '404.html')).toBeNull();
    expect(lesVan('docs', 'plaatje.png')).toBeNull();
  });

  it('alles in een volledige run, of als het meetscript veranderde', () => {
    expect(meet([], { volledig: true }).alles).toBe(true);
    expect(meet([`${siteMap}/docs/terminal/mappen.mdx`], { schermen: { alles: true } }).alles).toBe(
      true,
    );
  });

  // Speling.ts én een les van de cursus: eerst mat de job alleen die les,
  // want "alles" kwam er alleen als er onder de site niets veranderde.
  it('alles bij een package waar de site van afhangt, ook naast een gewijzigde les', () => {
    const r = meet([`${siteMap}/docs/terminal/jokertekens.mdx`], {
      schermen: {
        sites: ['linux'],
        alles: false,
        viaPakket: { linux: 'packages/shared/components/LesTabs/speling.ts' },
      },
    });
    expect(r).toMatchObject({ alles: true, lessen: LESSEN });
    expect(r.reden).toContain('speling.ts');
    // Een package van een andere cursus raakt deze niet.
    const ander = meet([`${siteMap}/docs/terminal/jokertekens.mdx`], {
      schermen: { sites: ['linux'], alles: false, viaPakket: { web: 'packages/x/a.ts' } },
    });
    expect(ander).toMatchObject({ alles: false, lessen: ['docs/terminal/jokertekens'] });
  });

  it('het plan en de selectie samen: speling.ts en een les van linux', () => {
    const sites = alleSiteMappen();
    const linux = siteDir('linux');
    const bestanden = {
      'packages/shared/components/LesTabs/speling.ts': [[3, 3]],
      [`${linux}/docs/terminal/jokertekens.mdx`]: [[3, 3]],
    };
    const p = maakPlan({
      bestanden,
      geraakt: ['packages/shared', linux],
      alleMappen: [...sites.map((s: { dir: string }) => s.dir), 'packages/shared'],
      sites,
      tests: [],
      metTabbladen: ['linux'],
      afhankelijkheden: { linux: ['packages/shared', linux] },
    });
    const r = lessenVoorMeting({
      plan: JSON.parse(JSON.stringify(p)),
      site: 'linux',
      siteMap: linux,
      lessen: LESSEN,
      leesBron: lees({}),
    });
    expect(r.alles).toBe(true);
  });

  it('een weggehaalde les valt weg, een pagina zonder meting wordt genoemd', () => {
    const r = lessenVoorMeting({
      plan: plan([`${siteMap}/docs/terminal/weg.mdx`, `${siteMap}/docs/cheatsheet.mdx`]),
      site: 'linux',
      siteMap,
      lessen: LESSEN,
      leesBron: (pad: string) =>
        pad.endsWith('weg.mdx') ? null : '---\nles_tabs: false\n---\n# Cheatsheet\n',
    });
    expect(r).toMatchObject({
      alles: false,
      lessen: [],
      nietGevonden: [`${siteMap}/docs/cheatsheet.mdx`],
      ontbreekt: [],
    });
  });

  // Een gewijzigde les die de selectie in de build niet vond, mat CI stil
  // niet: alleen een regel op stderr. Zonder les_tabs: false hoort hij er
  // te zijn, en dan faalt --streng.
  it('een les zonder les_tabs: false die niet in de build staat, ontbreekt', () => {
    const r = lessenVoorMeting({
      plan: plan([
        `${siteMap}/docs/terminal/nieuw.mdx`,
        `${siteMap}/docs/terminal/jokertekens.mdx`,
        `${siteMap}/docs/hand-out.md`,
      ]),
      site: 'linux',
      siteMap,
      lessen: LESSEN,
      leesBron: (pad: string) =>
        pad.endsWith('hand-out.md')
          ? "---\nles_tabs: 'false'\n---\n# Hand-out\n"
          : '---\nsidebar_position: 3\n---\n# Nieuw\n',
    });
    expect(r).toMatchObject({
      alles: false,
      lessen: ['docs/terminal/jokertekens'],
      nietGevonden: [`${siteMap}/docs/terminal/nieuw.mdx`, `${siteMap}/docs/hand-out.md`],
      ontbreekt: [`${siteMap}/docs/terminal/nieuw.mdx`],
    });
  });
});

describe('welke gewijzigde bron een les in de build hoort te hebben', () => {
  const MAPPEN = ['docs', 'lego_auto'];
  const les = '---\nsidebar_position: 1\n---\n# Les\n';

  it('een pagina in een docs-map', () => {
    expect(moetGemetenWorden('docs/terminal/mappen.mdx', les, MAPPEN)).toBe(true);
    expect(moetGemetenWorden('lego_auto/deel-1.md', les, MAPPEN)).toBe(true);
    expect(moetGemetenWorden('docs/a.md', '# Zonder front matter\n', MAPPEN)).toBe(true);
  });

  it('niet met les_tabs: false, als draft, als deel of buiten de docs-mappen', () => {
    expect(moetGemetenWorden('docs/cheatsheet.md', '---\nles_tabs: false\n---\n', MAPPEN)).toBe(
      false,
    );
    expect(moetGemetenWorden('docs/a.md', '---\ndraft: true\n---\n', MAPPEN)).toBe(false);
    expect(moetGemetenWorden('docs/onderdelen/_delen/i2c.mdx', les, MAPPEN)).toBe(false);
    expect(moetGemetenWorden('docs/_stap.mdx', les, MAPPEN)).toBe(false);
    expect(moetGemetenWorden('blog/2024-01-01-nieuw.md', les, MAPPEN)).toBe(false);
    expect(moetGemetenWorden('src/pages/docenten.mdx', les, MAPPEN)).toBe(false);
    expect(moetGemetenWorden('README.md', les, MAPPEN)).toBe(false);
    expect(moetGemetenWorden('docs/afbeelding.png', les, MAPPEN)).toBe(false);
  });

  it('de docs-mappen komen uit de config', () => {
    const lees = (id: string) =>
      readFileSync(join(ROOT, siteDir(id), 'docusaurus.config.ts'), 'utf8');
    expect(docsMappen(lees('robotica')).sort()).toEqual(['docs', 'golfbot', 'lego_auto']);
    expect(docsMappen(lees('editor'))).toEqual(['docs']);
    expect(docsMappen(lees('linux'))).toEqual(['docs']);
  });
});

describe('in deze repository', () => {
  // Alleen met een build: in CI heeft de job test er geen, en daar bewaakt
  // de job `schermen` het met --streng (`ontbreekt`). Zonder build staat de
  // test op overgeslagen, niet op groen.
  const CURSUSSEN = [
    'linux',
    'ctf',
    'editor',
    'web',
    'python',
    'algorithms',
    'robotica',
    'fullstack',
  ];
  const gebouwd = CURSUSSEN.filter((site) => existsSync(join(ROOT, siteDir(site), 'build')));

  // Elke les van een cursus met tabbladen die al gebouwd is, moet bij zijn
  // bron te vinden zijn: anders meet CI een gewijzigde les stil niet. En
  // andersom: elke bron die een les hoort te hebben, vindt er een.
  it.skipIf(gebouwd.length === 0)('elke gebouwde les met tabbladen hoort bij een bron', () => {
    const fout: string[] = [];
    for (const site of gebouwd) {
      const map = join(ROOT, siteDir(site));
      const build = join(map, 'build');
      const lessen: string[] = [];
      const loop = (d: string) => {
        for (const n of readdirSync(d)) {
          const p = join(d, n);
          if (statSync(p).isDirectory()) {
            if (!['assets', 'img', 'pyodide', 'oud'].includes(relative(build, p))) loop(p);
          } else if (
            lesVan(relative(build, d), n) !== null &&
            /data-les-(tabs|zonder-tabs)/.test(readFileSync(p, 'utf8'))
          )
            // Dezelfde lesVan als het meetscript.
            lessen.push(lesVan(relative(build, d), n) as string);
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
      const config = readFileSync(join(map, 'docusaurus.config.ts'), 'utf8');
      const nummers = houdtNummers(config);
      const adressen = bronnen
        .map((b) => adresVanBron(b, readFileSync(join(map, b), 'utf8'), { nummers }))
        .filter((a): a is string => a !== null);
      for (const les of lessen)
        if (!adressen.some((a) => les === a || les.endsWith(`/${a}`))) fout.push(`${site}: ${les}`);
      // Elke lespagina als gewijzigd; een bron zonder adres (een README, een
      // onderdeel) zou de selectie "alles" laten kiezen en blijft weg.
      const lespaginas = bronnen.filter(
        (b) => adresVanBron(b, readFileSync(join(map, b), 'utf8'), { nummers }) !== null,
      );
      const keuze = lessenVoorMeting({
        plan: {
          volledig: false,
          bestanden: Object.fromEntries(lespaginas.map((b) => [`${siteDir(site)}/${b}`, [[1, 1]]])),
        },
        site,
        siteMap: siteDir(site),
        lessen,
        leesBron: (pad: string) => readFileSync(join(ROOT, pad), 'utf8'),
        mappen: docsMappen(config),
        nummers,
      });
      expect(keuze.alles, site).toBe(false);
      for (const pad of keuze.ontbreekt) fout.push(`${site}: geen les voor ${pad}`);
    }
    expect(fout).toEqual([]);
  });
});

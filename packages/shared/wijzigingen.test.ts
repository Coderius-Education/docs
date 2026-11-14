import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { alleSiteMappen } from '@coderius/shared/sites';
import { controleer } from '@coderius/shared/stijl';
import {
  HEEL_BESTAND,
  LESSEN_PER_DEEL,
  MAX_BESTANDEN,
  MAX_DELEN,
  MAX_SCHERMEN,
  binnenWijziging,
  cursussenMetTabbladen,
  heeftLesTabs,
  isGlobaal,
  opGewijzigdeRegels,
  overlapt,
  parseDiff,
  plan,
  runnerAlles,
  schermenMatrix,
  volledigOpNamen,
  voorraadSites,
  workspaceAfhankelijkheden,
} from '@coderius/shared/wijzigingen';
import { describe, expect, it } from 'vitest';

// De planner beslist wat CI overslaat. Een fout hier is stil: een job die niet
// draait is groen. Daarom staat elke beslissing hier vast, met de echte
// registry (een site die verhuist moet hier niet stil uit de matrix vallen).

const SITES = alleSiteMappen();
const MAP = Object.fromEntries(SITES.map((s) => [s.id, s.dir]));
const ALLE_MAPPEN = [
  ...SITES.map((s) => s.dir),
  'packages/shared',
  'packages/checker',
  'packages/editor',
  'packages/python-runner',
];

function planVoor(
  bestanden: Record<string, [number, number][]>,
  geraakt: string[],
  tests: { pad: string; tekst: string }[] = [],
) {
  return plan({ bestanden, geraakt, alleMappen: ALLE_MAPPEN, sites: SITES, tests });
}

describe('parseDiff', () => {
  it('zet hunks om in regelbereiken van de nieuwe versie', () => {
    const diff = [
      'diff --git a/sites/informatica/python/docs/les.md b/sites/informatica/python/docs/les.md',
      'index 1111111..2222222 100644',
      '--- a/sites/informatica/python/docs/les.md',
      '+++ b/sites/informatica/python/docs/les.md',
      '@@ -10 +10 @@ kop',
      '-oud',
      '+nieuw',
      '@@ -20,0 +21,3 @@',
      '+a',
      '+b',
      '+c',
      '@@ -40,2 +43,0 @@',
      '-weg',
      '-weg',
    ].join('\n');
    expect(parseDiff(diff)).toEqual({
      'sites/informatica/python/docs/les.md': [
        [10, 10],
        [21, 23],
        // Alleen weggehaald: de buren 43 en 44 tellen als gewijzigd.
        [43, 44],
      ],
    });
  });

  it('nieuw, verwijderd en binair', () => {
    const diff = [
      'diff --git a/nieuw.md b/nieuw.md',
      'new file mode 100644',
      '--- /dev/null',
      '+++ b/nieuw.md',
      '@@ -0,0 +1,2 @@',
      '+een',
      '+twee',
      'diff --git a/weg.md b/weg.md',
      'deleted file mode 100644',
      '--- a/weg.md',
      '+++ /dev/null',
      '@@ -1,3 +0,0 @@',
      '-x',
      'diff --git a/plaatje.png b/plaatje.png',
      'index 1..2 100644',
      'Binary files a/plaatje.png and b/plaatje.png differ',
      'diff --git a/leeg.md b/leeg.md',
      'deleted file mode 100644',
      'diff --git a/script.sh b/script.sh',
      'old mode 100644',
      'new mode 100755',
    ].join('\n');
    expect(parseDiff(diff)).toEqual({
      'nieuw.md': [[1, 2]],
      'weg.md': [],
      'plaatje.png': [HEEL_BESTAND],
      'leeg.md': [],
      'script.sh': [],
    });
  });

  it('een weggehaalde eerste regel raakt regel 1', () => {
    const diff = 'diff --git a/x.md b/x.md\n--- a/x.md\n+++ b/x.md\n@@ -1 +0,0 @@\n-weg';
    expect(parseDiff(diff)).toEqual({ 'x.md': [[1, 1]] });
  });
});

describe('overlap', () => {
  it('een melding of blok over meerdere regels telt als hij een wijziging raakt', () => {
    expect(overlapt([[10, 12]], 5, 9)).toBe(false);
    expect(overlapt([[10, 12]], 5, 10)).toBe(true);
    expect(overlapt([[10, 12]], 12, 30)).toBe(true);
    expect(overlapt([[10, 12]], 13)).toBe(false);
    expect(overlapt([[10, 12]], 11)).toBe(true);
    expect(overlapt(undefined, 1)).toBe(false);
  });

  it('binnenWijziging en runnerAlles volgen volledig', () => {
    const g = { volledig: false, bestanden: { 'a.md': [[3, 4]] as [number, number][] } };
    expect(binnenWijziging(g, 'a.md', 4)).toBe(true);
    expect(binnenWijziging(g, 'b.md', 4)).toBe(false);
    expect(binnenWijziging({ ...g, volledig: true }, 'b.md', 4)).toBe(true);
    expect(runnerAlles(g, 'python')).toBe(false);
    expect(
      runnerAlles({ ...g, runners: { python: { draaien: true, alles: true } } }, 'python'),
    ).toBe(true);
  });
});

describe('globale bestanden', () => {
  it.each([
    'pnpm-lock.yaml',
    'package.json',
    'pnpm-workspace.yaml',
    'tsconfig.base.json',
    '.browserslistrc',
    '.github/workflows/build.yml',
    'scripts/wijzigingen.mjs',
    'scripts/sites-json.mjs',
    'packages/shared/sites.js',
  ])('%s raakt alles', (pad) => {
    expect(isGlobaal(pad)).toBe(true);
    const p = planVoor({ [pad]: [[1, 1]] }, []);
    expect(p.volledig).toBe(true);
    expect(p.sites).toHaveLength(SITES.length);
    expect(Object.values(p.runners).every((r) => r.draaien && r.alles)).toBe(true);
  });

  it.each(['sites/informatica/python/package.json', 'cspell.json', 'biome.json'])(
    '%s is niet globaal',
    (pad) => {
      expect(isGlobaal(pad)).toBe(false);
    },
  );
});

describe('plan', () => {
  const les = `${MAP.python}/docs/02-variabelen/01-les.md`;

  it('één regel in een python-les: alleen die site, die runner en die tekst', () => {
    const tests = [
      { pad: `${MAP.python}/src/docs-tests/lessen.test.ts`, tekst: 'readFileSync(x)' },
      { pad: `${MAP.python}/src/data/rekenen.test.ts`, tekst: "import { x } from './x'" },
      { pad: 'packages/shared/links-in-lestekst.test.ts', tekst: 'readFileSync alleSiteMappen()' },
      { pad: `${MAP.web}/src/docs-tests/lessen.test.ts`, tekst: 'readFileSync(x)' },
    ];
    const p = planVoor({ [les]: [[14, 14]] }, [MAP.python], tests);
    expect(p.volledig).toBe(false);
    expect(p.sites).toEqual(['python']);
    expect(p.ongewijzigd).not.toContain('python');
    expect(p.ongewijzigd).toHaveLength(SITES.length - 1);
    expect(p.runners.python).toEqual({ draaien: true, alles: false });
    expect(p.runners.algorithms.draaien).toBe(false);
    expect(p.runners.play.draaien).toBe(false);
    expect(p.tekst).toEqual({ alles: false, bestanden: [les] });
    // Een les is geen import: de tests die lestekst lezen doen mee, de rest niet.
    expect(p.vitest.bestanden).toEqual([
      'packages/shared/links-in-lestekst.test.ts',
      `${MAP.python}/src/docs-tests/lessen.test.ts`,
    ]);
    expect(p.jobs).toMatchObject({ test: true, tekst: true, crosslinks: true, lint: false });
  });

  it('een wijziging in packages/shared raakt elke site via pnpm', () => {
    const p = planVoor({ 'packages/shared/css/custom.css': [[3, 3]] }, [
      ...SITES.map((s) => s.dir),
      'packages/shared',
      'packages/editor',
      'packages/python-runner',
    ]);
    expect(p.volledig).toBe(false);
    expect(p.sites).toHaveLength(SITES.length);
    expect(p.ongewijzigd).toEqual([]);
    // Geen runner leest CSS.
    expect(Object.values(p.runners).some((r) => r.draaien)).toBe(false);
  });

  it('de gedeelde extractie laat de compileer-runners alles doen', () => {
    const p = planVoor({ 'packages/shared/codeblokken.js': [[5, 5]] }, ['packages/shared']);
    expect(p.runners.robotica).toEqual({ draaien: true, alles: true });
    expect(p.runners.fullstack).toEqual({ draaien: true, alles: true });
    expect(p.runners.python.draaien).toBe(false);
    expect(p.vitest.bestanden).toContain('packages/shared/codeblokken.js');
  });

  it('het harnas met leaphymicropython laat alleen robotica alles draaien', () => {
    // scripts/draai-leaphy-blokken.py voert elk robotica-blok uit; een
    // wijziging aan het harnas of aan de commit van de bibliotheek raakt ze allemaal.
    for (const pad of [
      'scripts/draai-leaphy-blokken.py',
      'scripts/leaphy_nep/machine.py',
      'scripts/leaphy_nep/vooraf.py',
      `${MAP.robotica}/src/lego-tests/leaphy-api.json`,
    ]) {
      // Een bestand in de site raakt volgens pnpm ook het package van robotica.
      const geraakt = pad.startsWith('sites/') ? [MAP.robotica] : [];
      const p = planVoor({ [pad]: [[3, 3]] }, geraakt);
      expect(p.volledig, pad).toBe(false);
      expect(p.runners.robotica, pad).toEqual({ draaien: true, alles: true });
      expect(p.runners.fullstack.draaien, pad).toBe(false);
    }
  });

  it('Python in scripts/ (ook in een submap) en in de scripts/ van een site laat de unittests draaien', () => {
    // scripts/test_leaphy_nep.py toetst scripts/leaphy_nep/, en
    // scripts/test_leaphy_api.py het script van robotica. Draaide de job test
    // daar niet bij, dan bleef een fout erin stil groen.
    for (const [pad, geraakt] of [
      ['scripts/draai-leaphy-blokken.py', []],
      ['scripts/leaphy_nep/machine.py', []],
      [`${MAP.robotica}/scripts/leaphy-api.py`, [MAP.robotica]],
    ] as const) {
      const p = planVoor({ [pad]: [[3, 3]] }, [...geraakt]);
      expect(p.volledig, pad).toBe(false);
      expect(p.jobs.test, pad).toBe(true);
    }
  });

  it('het controlescript van fullstack laat de fullstack-job draaien', () => {
    for (const pad of [
      `${MAP.fullstack}/static/controleer.py`,
      `${MAP.fullstack}/src/controle/draai.py`,
      `${MAP.fullstack}/src/controle/kapot.py`,
      `${MAP.fullstack}/src/controle/uitbreidingen.py`,
      `${MAP.fullstack}/static/htmx/htmx.min.js`,
      // draai.py leest de volgorde van de lessen uit de sidebar.
      `${MAP.fullstack}/sidebars.ts`,
      `${MAP.fullstack}/src/controle/referentie/templates/berichten.html`,
    ]) {
      const p = planVoor({ [pad]: [[3, 3]] }, [MAP.fullstack]);
      expect(p.runners.fullstack, pad).toEqual({ draaien: true, alles: false });
      expect(p.runners.robotica.draaien, pad).toBe(false);
    }
  });

  it('de runner zelf laat alleen die runner alles doen', () => {
    const p = planVoor({ 'scripts/draai-python-blokken.py': [[300, 301]] }, []);
    expect(p.runners.python).toEqual({ draaien: true, alles: true });
    expect(p.runners.algorithms).toEqual({ draaien: true, alles: true });
    expect(p.runners.play.draaien).toBe(false);
    expect(p.sites).toEqual([]);
    // De Python-tests van de runners draaien in de test-job.
    expect(p.jobs.test).toBe(true);
    expect(p.jobs.crosslinks).toBe(false);
  });

  it('de speeltuin in de browser: als de python-site gebouwd wordt, of het script verandert', () => {
    // Een wijziging in packages/python-runner bouwt python via pnpm, en dan
    // moet de rooktest in Chromium ook.
    const runner = planVoor({ 'packages/python-runner/src/PyodideProvider.ts': [[3, 3]] }, [
      MAP.python,
      'packages/python-runner',
    ]);
    expect(runner.sites).toContain('python');
    expect(runner.jobs.browser).toBe(true);
    expect(runner.runners.python).toEqual({ draaien: true, alles: true });

    const script = planVoor({ 'scripts/rooktest-speeltuin.mjs': [[3, 3]] }, []);
    expect(script.sites).toEqual([]);
    expect(script.jobs.browser).toBe(true);

    const web = planVoor({ [`${MAP.web}/docs/html-css/position.mdx`]: [[3, 3]] }, [MAP.web]);
    expect(web.jobs.browser).toBe(false);
  });

  it('de oefenterminal in de browser: als de linux-site gebouwd wordt, of het script verandert', () => {
    const les = planVoor({ [`${MAP.linux}/docs/terminal/mappen.mdx`]: [[3, 3]] }, [MAP.linux]);
    expect(les.jobs.terminal).toBe(true);
    const script = planVoor({ 'scripts/rooktest-linux.mjs': [[3, 3]] }, []);
    expect(script.sites).toEqual([]);
    expect(script.jobs.terminal).toBe(true);
    const web = planVoor({ [`${MAP.web}/docs/html-css/position.mdx`]: [[3, 3]] }, [MAP.web]);
    expect(web.jobs.terminal).toBe(false);
  });

  it('de schermen: elke gebouwde cursus met tabbladen, alles als het meetscript verandert', () => {
    const metTabbladen = ['web', 'linux'];
    const voor = (bestanden: Record<string, [number, number][]>, geraakt: string[]) =>
      plan({ bestanden, geraakt, alleMappen: ALLE_MAPPEN, sites: SITES, tests: [], metTabbladen });
    // Een les van web: web meten, en alleen de gewijzigde lessen.
    const les = voor({ [`${MAP.web}/docs/html-css/position.mdx`]: [[3, 3]] }, [MAP.web]);
    expect(les.schermen).toEqual({ sites: ['web'], alles: false, viaPakket: {} });
    // Een cursus zonder tabbladen meet niets.
    const play = voor({ [`${MAP.play}/docs/acties/klonen.md`]: [[3, 3]] }, [MAP.play]);
    expect(play.schermen.sites).toEqual([]);
    // Het meetscript zelf: in elke cursus met tabbladen alles, ook in een
    // cursus die niet gebouwd wordt (de job haalt hem uit de cache).
    const script = voor(
      {
        'scripts/meet-les-tabs.mjs': [[1, 1]],
        [`${MAP.linux}/docs/terminal/mappen.mdx`]: [[2, 2]],
      },
      [MAP.linux],
    );
    expect(script.schermen).toMatchObject({ sites: ['web', 'linux'], alles: true });
    // Een volledige run meet elke cursus met tabbladen.
    const alles = plan({
      bestanden: {},
      geraakt: [],
      alleMappen: ALLE_MAPPEN,
      sites: SITES,
      tests: [],
      metTabbladen,
      volledig: true,
    });
    // In de volgorde van het register.
    expect(alles.schermen).toEqual({ sites: ['web', 'linux'], alles: true, viaPakket: {} });
  });

  // Een hele cursus op één runner meten kostte tot zestien minuten
  // (algoritmes), terwijl de rest van CI na drie minuten klaar was. Een
  // cursus die helemaal gemeten wordt, krijgt daarom meer runners; een paar
  // gewijzigde lessen blijven op één.
  it('de schermen: een hele cursus over meer runners, een paar lessen op één', () => {
    const metTabbladen = ['web', 'linux'];
    const voor = (bestanden: Record<string, [number, number][]>, geraakt: string[]) =>
      plan({ bestanden, geraakt, alleMappen: ALLE_MAPPEN, sites: SITES, tests: [], metTabbladen });
    const opties = {
      siteMappen: MAP,
      lesAantallen: { web: 34, linux: 3 * LESSEN_PER_DEEL + 1 },
    };
    const delen = (m: { site: string; deel: number; delen: number }[]) =>
      m.map((r) => `${r.site} ${r.deel}/${r.delen}`);
    // Een les van linux: één runner, ook in een grote cursus.
    const les = voor({ [`${MAP.linux}/docs/terminal/mappen.mdx`]: [[3, 3]] }, [MAP.linux]);
    expect(delen(schermenMatrix(les, opties))).toEqual(['linux 1/1']);
    // Een onderdeel van linux kan elke les raken: de hele cursus, in delen.
    const onderdeel = voor({ [`${MAP.linux}/src/components/X/index.tsx`]: [[3, 3]] }, [MAP.linux]);
    expect(delen(schermenMatrix(onderdeel, opties))).toEqual([
      'linux 1/4',
      'linux 2/4',
      'linux 3/4',
      'linux 4/4',
    ]);
    // Het meetscript: elke cursus helemaal; een kleine cursus blijft op één.
    const script = voor({ 'scripts/meet-les-tabs.mjs': [[1, 1]] }, []);
    expect(delen(schermenMatrix(script, opties))).toEqual([
      'web 1/1',
      'linux 1/4',
      'linux 2/4',
      'linux 3/4',
      'linux 4/4',
    ]);
    // Nooit meer dan MAX_DELEN runners voor één cursus.
    const groot = schermenMatrix(script, {
      ...opties,
      lesAantallen: { web: 1000 * LESSEN_PER_DEEL, linux: 0 },
    });
    expect(groot.filter((r) => r.site === 'web')).toHaveLength(MAX_DELEN);
    expect(delen(groot.filter((r) => r.site === 'linux'))).toEqual(['linux 1/1']);
  });

  // Een volledige meting startte 23 delen naast cross-links, browser en de
  // staart van test: meer dan de twintig runners van GitHub. Een deel van
  // algoritmes wachtte anderhalve minuut en werd het langste pad.
  it('de schermen: samen niet meer dan MAX_SCHERMEN delen, de grootste eerst', () => {
    const sites = [
      'web',
      'linux',
      'python',
      'fullstack',
      'algorithms',
      'robotica',
      'ctf',
      'editor',
    ];
    const p = plan({
      bestanden: {},
      geraakt: [],
      alleMappen: ALLE_MAPPEN,
      sites: SITES,
      tests: [],
      metTabbladen: sites,
      volledig: true,
    });
    const lesAantallen = {
      web: 34,
      linux: 30,
      python: 150,
      fullstack: 170,
      algorithms: 284,
      robotica: 101,
      ctf: 22,
      editor: 78,
    };
    const m = schermenMatrix(p, { siteMappen: MAP, lesAantallen });
    expect(m.length).toBeLessThanOrEqual(MAX_SCHERMEN);
    // Elke cursus houdt minstens één deel, en zijn delen zijn compleet.
    for (const site of sites) {
      const delen = m.filter((r) => r.site === site);
      expect(delen.length, site).toBeGreaterThan(0);
      expect(
        delen.map((r) => r.deel),
        site,
      ).toEqual(Array.from({ length: delen[0].delen }, (_, i) => i + 1));
    }
    // De cursus met de meeste lessen per runner staat vooraan.
    const per = (site: string) =>
      lesAantallen[site as keyof typeof lesAantallen] /
      (m.find((r) => r.site === site)?.delen ?? 1);
    const volgorde = [...new Set(m.map((r) => r.site))];
    expect(volgorde.map(per)).toEqual([...volgorde.map(per)].sort((a, b) => b - a));
  });

  it('de voorraad: elke ongewijzigde site voor cross-links, en wat schermen uit de cache meet', () => {
    const metTabbladen = ['web', 'linux'];
    const voor = (bestanden: Record<string, [number, number][]>, geraakt: string[]) =>
      plan({ bestanden, geraakt, alleMappen: ALLE_MAPPEN, sites: SITES, tests: [], metTabbladen });
    // Alleen het meetscript: niets gebouwd, geen cross-links; schermen meet
    // web en linux uit de cache, en die zet voorraad er één keer in.
    expect(voorraadSites(voor({ 'scripts/meet-les-tabs.mjs': [[1, 1]] }, [])).sort()).toEqual([
      'linux',
      'web',
    ]);
    // Een les van web: cross-links draait, dus elke ongewijzigde site.
    const les = voor({ [`${MAP.web}/docs/html-css/position.mdx`]: [[3, 3]] }, [MAP.web]);
    expect(voorraadSites(les)).toEqual(les.ongewijzigd);
  });

  // Wie alleen de meting veranderde, kreeg geen enkele cursus: de job
  // `schermen` viel weg en de check build was groen, terwijl een nieuwe
  // controle in het script nergens had gedraaid.
  it.each([
    'scripts/meet-les-tabs.mjs',
    'scripts/meet-les-tabs-uitzonderingen.json',
    'packages/shared/meet-selectie.js',
  ])('de schermen: alleen %s gewijzigd meet toch elke cursus met tabbladen', (pad) => {
    const metTabbladen = ['web', 'linux'];
    const geraakt = pad.startsWith('packages/shared/')
      ? ['packages/shared', MAP.web, MAP.linux]
      : [];
    const p = plan({
      bestanden: { [pad]: [[1, 1]] },
      geraakt,
      alleMappen: ALLE_MAPPEN,
      sites: SITES,
      tests: [],
      metTabbladen,
    });
    expect(p.schermen).toMatchObject({ sites: ['web', 'linux'], alles: true });
  });

  // Een package en een les samen: de les veranderde, maar speling.ts kan elke
  // les van de cursus raken. Eerst mat de job dan alleen die les.
  it('de schermen: een package waar de cursus van afhangt, ook naast een les', () => {
    const metTabbladen = ['web', 'linux'];
    const bestanden = {
      'packages/shared/components/LesTabs/speling.ts': [[3, 3]] as [number, number][],
      [`${MAP.web}/docs/html-css/position.mdx`]: [[3, 3]] as [number, number][],
    };
    const geraakt = ['packages/shared', MAP.web, MAP.linux];
    const metDeps = plan({
      bestanden,
      geraakt,
      alleMappen: ALLE_MAPPEN,
      sites: SITES,
      tests: [],
      metTabbladen,
      afhankelijkheden: {
        web: ['packages/shared', MAP.web],
        linux: ['packages/shared', MAP.linux],
      },
    });
    expect(metDeps.schermen).toEqual({
      sites: ['web', 'linux'],
      alles: false,
      viaPakket: {
        web: 'packages/shared/components/LesTabs/speling.ts',
        linux: 'packages/shared/components/LesTabs/speling.ts',
      },
    });
    // Zonder de afhankelijkheden telt elk package dat geen site is.
    expect(
      plan({ bestanden, geraakt, alleMappen: ALLE_MAPPEN, sites: SITES, tests: [], metTabbladen })
        .schermen.viaPakket,
    ).toEqual(metDeps.schermen.viaPakket);
    // Een package waar web niet van afhangt, raakt de lessen van web niet.
    const checker = plan({
      bestanden: {
        'packages/checker/src/index.ts': [[3, 3]],
        [`${MAP.web}/docs/html-css/position.mdx`]: [[3, 3]],
      },
      geraakt: ['packages/checker', MAP.web],
      alleMappen: ALLE_MAPPEN,
      sites: SITES,
      tests: [],
      metTabbladen,
      afhankelijkheden: {
        web: ['packages/shared', MAP.web],
        linux: ['packages/shared', MAP.linux],
      },
    });
    expect(checker.schermen).toEqual({ sites: ['web'], alles: false, viaPakket: {} });
    // Alleen een les: geen package.
    const les = plan({
      bestanden: { [`${MAP.web}/docs/html-css/position.mdx`]: [[3, 3]] },
      geraakt: [MAP.web],
      alleMappen: ALLE_MAPPEN,
      sites: SITES,
      tests: [],
      metTabbladen,
    });
    expect(les.schermen.viaPakket).toEqual({});
  });

  it('alleen sites/home', () => {
    const p = planVoor({ 'sites/home/src/routes/+page.svelte': [[8, 9]] }, ['sites/home']);
    expect(p.sites).toEqual(['home']);
    expect(Object.values(p.runners).some((r) => r.draaien)).toBe(false);
    expect(p.tekst.bestanden).toEqual([]);
    expect(p.jobs.tekst).toBe(false);
  });

  it('een bestand buiten de packages: de guards en de tests die het bij naam noemen', () => {
    const tests = [
      { pad: 'packages/shared/bestanden.test.ts', tekst: "readdirSync 'WRITING_STYLE_GUIDE.md'" },
      { pad: 'packages/shared/links-in-lestekst.test.ts', tekst: 'readFileSync alleSiteMappen()' },
      { pad: 'packages/shared/dialoog.test.ts', tekst: "import { x } from './dialoog'" },
      { pad: `${MAP.web}/src/docs-tests/lessen.test.ts`, tekst: 'readFileSync(x)' },
    ];
    const p = planVoor({ 'org-handbook/WRITING_STYLE_GUIDE.md': [[9, 9]] }, [], tests);
    expect(p.sites).toEqual([]);
    expect(p.vitest.bestanden).toEqual([
      'packages/shared/bestanden.test.ts',
      'packages/shared/links-in-lestekst.test.ts',
    ]);
    // Een los script buiten de packages: alleen wat het importeert.
    const s = planVoor({ 'scripts/run-all-sites.mjs': [[3, 3]] }, [], tests);
    expect(s.vitest.bestanden).toEqual(['scripts/run-all-sites.mjs']);
  });

  it('vitest-config en woordenlijst raken alleen hun eigen job', () => {
    const v = planVoor({ 'vitest.setup.ts': [[1, 1]] }, []);
    expect(v.vitest.alles).toBe(true);
    expect(v.sites).toEqual([]);
    const c = planVoor({ 'cspell-woorden.txt': [[40, 40]] }, []);
    expect(c.tekst.alles).toBe(true);
    expect(c.jobs.tekst).toBe(true);
    expect(c.sites).toEqual([]);
    const b = planVoor({ 'biome.json': [[2, 2]] }, []);
    expect(b.jobs.lint).toBe(true);
  });

  it('een verwijderde les bouwt de site maar draait geen blokken of tekst', () => {
    const p = planVoor({ [les]: [] }, [MAP.python]);
    expect(p.sites).toEqual(['python']);
    expect(p.runners.python.draaien).toBe(false);
    expect(p.tekst.bestanden).toEqual([]);
  });

  it('valt terug op alles als pnpm een gewijzigd package mist', () => {
    const p = planVoor({ [les]: [[1, 1]] }, []);
    expect(p.volledig).toBe(true);
    expect(p.reden).toMatch(/pnpm/);
  });

  it('volledig zet alles aan', () => {
    const p = plan({
      bestanden: {},
      geraakt: [],
      alleMappen: ALLE_MAPPEN,
      sites: SITES,
      tests: [],
      volledig: true,
      reden: 'nightly',
    });
    expect(p).toMatchObject({ volledig: true, reden: 'nightly', ongewijzigd: [] });
    expect(p.vitest.alles && p.tekst.alles).toBe(true);
  });
});

describe('workspaceAfhankelijkheden', () => {
  it('volgt workspace-dependencies transitief', () => {
    const pakketten = {
      'sites/informatica/ide': { naam: '@coderius/ide', deps: ['@coderius/editor'] },
      'packages/editor': { naam: '@coderius/editor', deps: ['@coderius/python-runner'] },
      'packages/python-runner': { naam: '@coderius/python-runner', deps: ['@coderius/shared'] },
      'packages/shared': { naam: '@coderius/shared', deps: [] },
      'packages/checker': { naam: '@coderius/checker', deps: [] },
    };
    expect(workspaceAfhankelijkheden(pakketten, 'sites/informatica/ide')).toEqual([
      'packages/editor',
      'packages/python-runner',
      'packages/shared',
      'sites/informatica/ide',
    ]);
  });

  it('een kring loopt niet vast', () => {
    const pakketten = {
      a: { naam: 'a', deps: ['b'] },
      b: { naam: 'b', deps: ['a'] },
    };
    expect(workspaceAfhankelijkheden(pakketten, 'a')).toEqual(['a', 'b']);
  });
});

describe('opGewijzigdeRegels (tekst --regels)', () => {
  // Een alinea met vijf keer vet over drie regels: één melding, regel 3 t/m 5.
  const tekst = [
    '# Kop',
    '',
    'Hier staat **een** en **twee**',
    'en ook **drie** en **vier**',
    'en tot slot **vijf** woorden vet.',
    '',
    'Hier kunt u verder lezen.',
    '',
  ].join('\n');
  const meldingen = controleer(tekst);

  it('stijl.js geeft een melding over meer regels een eind', () => {
    expect(meldingen.find((m) => m.naam === 'vet-overdaad')).toMatchObject({ regel: 3, eind: 5 });
    expect(meldingen.find((m) => m.naam === 'u-vorm')).toMatchObject({ regel: 7, eind: 7 });
  });

  it('een gewijzigde middelste regel houdt de melding over de hele alinea', () => {
    expect(opGewijzigdeRegels(meldingen, [[4, 4]]).map((m) => m.naam)).toEqual(['vet-overdaad']);
  });

  it('een wijziging elders laat alleen die melding over', () => {
    expect(opGewijzigdeRegels(meldingen, [[7, 7]]).map((m) => m.naam)).toEqual(['u-vorm']);
    expect(opGewijzigdeRegels(meldingen, [[1, 2]])).toEqual([]);
    expect(opGewijzigdeRegels(meldingen, undefined)).toEqual([]);
  });
});

describe('volledigOpNamen', () => {
  // De eerste CI-run op de vakken-PR viel om met ENOBUFS: de -U0-diff van
  // ~1900 verhuisde bestanden paste niet in de buffer van execFileSync. Op de
  // namen alleen moet al vaststaan dat zo'n wijziging volledig draait.
  it('een globaal bestand geeft een volledige run met dat bestand als reden', () => {
    expect(
      volledigOpNamen(['sites/informatica/python/docs/a.md', '.github/workflows/build.yml']),
    ).toBe('globale wijziging (.github/workflows/build.yml)');
  });

  it('een grote verhuizing draait volledig, ook zonder globaal bestand', () => {
    const namen = Array.from(
      { length: MAX_BESTANDEN + 1 },
      (_, i) => `sites/informatica/python/docs/les-${i}.md`,
    );
    expect(volledigOpNamen(namen)).toBe(
      `${MAX_BESTANDEN + 1} bestanden gewijzigd (meer dan ${MAX_BESTANDEN})`,
    );
  });

  it('een gewone wijziging blijft incrementeel', () => {
    const namen = Array.from(
      { length: MAX_BESTANDEN },
      (_, i) => `sites/informatica/python/docs/les-${i}.md`,
    );
    expect(volledigOpNamen(namen)).toBeNull();
    expect(volledigOpNamen([])).toBeNull();
  });
});

// De plan-job leest uit elke docusaurus.config.ts of de cursus tabbladen
// heeft; alleen die meet de job `schermen`. Eerst deed een losse regex in
// scripts/wijzigingen.mjs dat, zonder test: `lesTabs: false` telde als aan,
// en `{ ...basis, lesTabs }` als uit.
describe('cursussen met tabbladen', () => {
  it('een ware lesTabs zet ze aan, zoals in createConfig', () => {
    expect(heeftLesTabs('createConfig({ siteId: "x", lesTabs: true })')).toBe(true);
    expect(heeftLesTabs('createConfig({\n  lesTabs: { eenScherm: true },\n})')).toBe(true);
    expect(heeftLesTabs('createConfig({\n  lesTabs: {\n    eenScherm: true,\n  },\n})')).toBe(true);
  });

  it('lesTabs: false, een lege waarde of een opmerking zet ze niet aan', () => {
    expect(heeftLesTabs('createConfig({ lesTabs: false })')).toBe(false);
    expect(heeftLesTabs('createConfig({\n  lesTabs: false,\n})')).toBe(false);
    expect(heeftLesTabs('createConfig({ lesTabs: undefined })')).toBe(false);
    expect(heeftLesTabs('createConfig({ siteId: "x" })')).toBe(false);
    expect(heeftLesTabs('// lesTabs: true komt later\ncreateConfig({ siteId: "x" })')).toBe(false);
    expect(heeftLesTabs('/* lesTabs: true */ createConfig({})')).toBe(false);
  });

  it('de verkorte vorm leest de variabele', () => {
    expect(heeftLesTabs('const lesTabs = true;\ncreateConfig({ siteId, lesTabs })')).toBe(true);
    expect(heeftLesTabs('const lesTabs = { eenScherm: true };\ncreateConfig({ lesTabs, x })')).toBe(
      true,
    );
    expect(heeftLesTabs('const lesTabs = false;\ncreateConfig({\n  siteId,\n  lesTabs,\n})')).toBe(
      false,
    );
    // Niet te lezen: liever een meting te veel.
    expect(heeftLesTabs("import { lesTabs } from './x';\ncreateConfig({ lesTabs })")).toBe(true);
  });

  it('de lijst in deze repository, naast de config van elke site', () => {
    const ROOT = fileURLToPath(new URL('../..', import.meta.url));
    const lees = (dir: string) => {
      const config = join(ROOT, dir, 'docusaurus.config.ts');
      return existsSync(config) ? readFileSync(config, 'utf8') : null;
    };
    // Komt er een cursus met tabbladen bij, zet hem dan hier: dan meet CI
    // zijn schermen.
    expect([...cursussenMetTabbladen(SITES, lees)].sort()).toEqual(
      ['algorithms', 'ctf', 'editor', 'fullstack', 'linux', 'python', 'robotica', 'web'].sort(),
    );
  });
});

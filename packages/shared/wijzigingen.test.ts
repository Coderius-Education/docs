import { alleSiteMappen } from '@coderius/shared/sites';
import { controleer } from '@coderius/shared/stijl';
import {
  HEEL_BESTAND,
  binnenWijziging,
  isGlobaal,
  opGewijzigdeRegels,
  overlapt,
  parseDiff,
  plan,
  runnerAlles,
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
      { pad: 'packages/shared/sitelink.test.ts', tekst: 'readFileSync alleSiteMappen()' },
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
      'packages/shared/sitelink.test.ts',
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
      { pad: 'packages/shared/sitelink.test.ts', tekst: 'readFileSync alleSiteMappen()' },
      { pad: 'packages/shared/dialoog.test.ts', tekst: "import { x } from './dialoog'" },
      { pad: `${MAP.web}/src/docs-tests/lessen.test.ts`, tekst: 'readFileSync(x)' },
    ];
    const p = planVoor({ 'org-handbook/WRITING_STYLE_GUIDE.md': [[9, 9]] }, [], tests);
    expect(p.sites).toEqual([]);
    expect(p.vitest.bestanden).toEqual([
      'packages/shared/bestanden.test.ts',
      'packages/shared/sitelink.test.ts',
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

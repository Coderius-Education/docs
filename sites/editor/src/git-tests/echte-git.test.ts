import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { emptyState, runCommand } from '../components/GitSimulator/gitEngine';

// De simulator belooft dat je straks in VS Code hetzelfde ziet. Deze test legt
// die belofte naast de echte git die op deze machine staat. Zonder dit kon de
// simulator jarenlang iets anders afdrukken zonder dat iemand het merkte —
// precies wat er gebeurde toen hij "Op branch main" zei terwijl git "On branch
// master" zegt.

let werkmap: string;
let home: string;

function git(args: string[], opties: { in?: string; env?: Record<string, string> } = {}): string {
  return execFileSync('git', args, {
    cwd: opties.in ?? werkmap,
    encoding: 'utf8',
    // stderr opvangen in plaats van doorlaten: de tests lokken bewust
    // foutmeldingen uit en die horen niet door de testuitvoer heen te lopen.
    stdio: ['ignore', 'pipe', 'pipe'],
    env: {
      ...process.env,
      HOME: home,
      // Vaste, taalneutrale omgeving: een docent met een Nederlandse locale
      // zou anders andere uitvoer krijgen dan CI.
      LANG: 'C',
      LC_ALL: 'C',
      GIT_CONFIG_GLOBAL: join(home, '.gitconfig'),
      GIT_CONFIG_SYSTEM: '/dev/null',
    },
  });
}

function gitFaalt(args: string[], map?: string): string {
  try {
    git(args, { in: map });
    return '';
  } catch (e) {
    const err = e as { stderr?: string; stdout?: string };
    return `${err.stdout ?? ''}${err.stderr ?? ''}`;
  }
}

beforeAll(() => {
  home = mkdtempSync(join(tmpdir(), 'git-home-'));
  werkmap = mkdtempSync(join(tmpdir(), 'git-proef-'));
  writeFileSync(
    join(home, '.gitconfig'),
    '[user]\n\tname = Leerling\n\temail = leerling@school.nl\n[init]\n\tdefaultBranch = main\n',
  );
});

afterAll(() => {
  for (const map of [home, werkmap]) {
    rmSync(map, { recursive: true, force: true });
  }
});

// De hints in `git status` (`git restore <file>...`) bestaan pas sinds git
// 2.23 uit 2019. Daaronder wijkt de uitvoer af en zegt een falende test niets
// over deze repository — dus noemen we die ondergrens hier, in plaats van de
// gebruiker te laten raden waarom zijn machine rood staat.
const MINIMALE_GIT = [2, 23];

function versie(): [number, number] {
  const m = git(['--version']).match(/(\d+)\.(\d+)/);
  if (!m) throw new Error(`Onverwachte uitvoer van git --version: ${git(['--version'])}`);
  return [Number(m[1]), Number(m[2])];
}

describe('git staat op deze machine', () => {
  it('is te vinden en noemt zijn versie', () => {
    expect(git(['--version'])).toMatch(/^git version \d+\.\d+/);
  });

  it('is nieuw genoeg voor de uitvoer die de simulator nabootst', () => {
    const [groot, klein] = versie();
    const oud = groot < MINIMALE_GIT[0] || (groot === MINIMALE_GIT[0] && klein < MINIMALE_GIT[1]);

    expect(
      oud,
      `git ${groot}.${klein} is te oud voor deze test; vanaf ${MINIMALE_GIT.join('.')} schrijft git de restore-hints die de simulator nabootst. Werk git bij.`,
    ).toBe(false);
  });
});

describe('waarom stap-1-config init.defaultBranch zet', () => {
  it('zonder die instelling heet de eerste branch master', () => {
    // Dit is de reden dat die regel in de les staat. Verandert git dit ooit,
    // dan valt deze test om en kan de uitleg korter.
    const kaal = mkdtempSync(join(tmpdir(), 'git-kaal-'));
    try {
      execFileSync('git', ['init'], {
        cwd: kaal,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
        env: {
          ...process.env,
          HOME: kaal,
          GIT_CONFIG_GLOBAL: '/dev/null',
          GIT_CONFIG_SYSTEM: '/dev/null',
          LC_ALL: 'C',
        },
      });
      const tak = execFileSync('git', ['symbolic-ref', '--short', 'HEAD'], {
        cwd: kaal,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
        env: { ...process.env, HOME: kaal, GIT_CONFIG_GLOBAL: '/dev/null' },
      }).trim();
      expect(tak).toBe('master');
    } finally {
      rmSync(kaal, { recursive: true, force: true });
    }
  });

  it('met de instelling uit de les heet hij main', () => {
    git(['init']);
    expect(git(['symbolic-ref', '--short', 'HEAD']).trim()).toBe('main');
  });

  it('pushen naar main mislukt precies zoals de les beschrijft', () => {
    // Eigen mappen, want de rest van dit bestand vergelijkt uitvoer in
    // `werkmap` en die mag deze test niet onder zich vandaan committen.
    const afstand = mkdtempSync(join(tmpdir(), 'git-origin-'));
    const lokaal = mkdtempSync(join(tmpdir(), 'git-lokaal-'));
    try {
      git(['init', '--bare'], { in: afstand });
      git(['init'], { in: lokaal });
      writeFileSync(join(lokaal, 'hello.txt'), 'Hallo wereld.\n');
      git(['add', 'hello.txt'], { in: lokaal });
      git(['commit', '-m', 'eerste versie'], { in: lokaal });
      git(['remote', 'add', 'origin', afstand], { in: lokaal });
      // Nadoen wat een leerling zonder init.defaultBranch heeft.
      git(['branch', '-m', 'master'], { in: lokaal });

      const fout = gitFaalt(['push', '-u', 'origin', 'main'], lokaal);
      // Deze regel citeert stap-1-config letterlijk als reden voor de instelling.
      expect(fout).toContain('error: src refspec main does not match any');

      // En met de branchnaam uit de les gaat het wel goed.
      git(['branch', '-m', 'main'], { in: lokaal });
      expect(() => git(['push', '-u', 'origin', 'main'], { in: lokaal })).not.toThrow();
    } finally {
      for (const map of [afstand, lokaal]) rmSync(map, { recursive: true, force: true });
    }
  });
});

describe('de simulator drukt af wat git afdrukt', () => {
  function simulator(...commandos: string[]): string {
    let state = emptyState({ 'hello.txt': 'Hallo wereld.\n' });
    let laatste = '';
    for (const c of commandos) {
      const r = runCommand(state, c);
      state = r.newState;
      laatste = r.output;
    }
    return laatste;
  }

  it('git status op een onbekend bestand', () => {
    writeFileSync(join(werkmap, 'hello.txt'), 'Hallo wereld.\n');
    const echt = git(['status']).trimEnd();
    const nagemaakt = simulator('git init', 'git status').trimEnd();

    expect(nagemaakt).toBe(echt);
  });

  it('git status met een bestand in staging', () => {
    git(['add', 'hello.txt']);
    const echt = git(['status']).trimEnd();
    const nagemaakt = simulator('git init', 'git add hello.txt', 'git status').trimEnd();

    expect(nagemaakt).toBe(echt);
  });

  it('git status met een schone werkmap', () => {
    git(['commit', '-m', 'eerste versie']);
    const echt = git(['status']).trimEnd();
    const nagemaakt = simulator(
      'git init',
      'git add hello.txt',
      'git commit -m "eerste versie"',
      'git status',
    ).trimEnd();

    expect(nagemaakt).toBe(echt);
  });

  it('git status met een wijziging die nog niet klaarstaat', () => {
    writeFileSync(join(werkmap, 'hello.txt'), 'Hallo wereld.\nregel twee\n');
    const echt = git(['status']).trimEnd();

    let state = emptyState({ 'hello.txt': 'Hallo wereld.\n' });
    for (const c of ['git init', 'git add hello.txt', 'git commit -m "eerste versie"']) {
      state = runCommand(state, c).newState;
    }
    state = { ...state, workingDir: { 'hello.txt': 'Hallo wereld.\nregel twee\n' } };
    const nagemaakt = runCommand(state, 'git status').output.trimEnd();

    expect(nagemaakt).toBe(echt);
  });

  it('git status met alleen een nieuw bestand naast een bestaande commit', () => {
    // Deze combinatie ving de laatste opmaakfout: git zet geen lege regel
    // tussen 'On branch main' en het eerste blok zodra er een commit bestaat.
    git(['add', 'hello.txt']);
    git(['commit', '-m', 'regel twee']);
    writeFileSync(join(werkmap, 'nieuw.txt'), 'iets\n');
    const echt = git(['status']).trimEnd();

    let state = emptyState({ 'hello.txt': 'a\n' });
    for (const c of ['git init', 'git add .', 'git commit -m "een"']) {
      state = runCommand(state, c).newState;
    }
    state = { ...state, workingDir: { ...state.workingDir, 'nieuw.txt': 'iets\n' } };

    expect(runCommand(state, 'git status').output.trimEnd()).toBe(echt);
  });

  it('de foutmelding buiten een repository', () => {
    const buiten = mkdtempSync(join(tmpdir(), 'geen-repo-'));
    try {
      const echt = gitFaalt(['status'], buiten).trim();
      const nagemaakt = simulator('git status');

      // De simulator zet er een Nederlandse hint onder; de fatal-regel zelf
      // moet woordelijk kloppen.
      expect(nagemaakt.split('\n')[0]).toBe(echt.split('\n')[0]);
      expect(nagemaakt).toContain('hint:');
    } finally {
      rmSync(buiten, { recursive: true, force: true });
    }
  });
});

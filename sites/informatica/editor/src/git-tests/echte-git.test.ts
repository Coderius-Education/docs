import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  COMMANDOS_VAN_GIT,
  emptyState,
  runCommand,
  schrijfBestand,
} from '../components/GitSimulator/gitEngine';

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

  describe('waar de simulator eerst afweek', () => {
    // Uit de doorloop, elk naast git gelegd in een eigen map.
    let map: string;
    beforeAll(() => {
      map = mkdtempSync(join(tmpdir(), 'git-afwijking-'));
      git(['init'], { in: map });
    });
    afterAll(() => rmSync(map, { recursive: true, force: true }));

    it('git status noemt bestanden op alfabet, niet in de volgorde van aanmaken', () => {
      const namen = ['zebra.txt', 'appel.txt', 'Mango.txt'];
      for (const naam of namen) writeFileSync(join(map, naam), 'x\n');
      const echt = git(['status'], { in: map }).trimEnd();
      const state = runCommand(
        emptyState(Object.fromEntries(namen.map((n) => [n, 'x\n']))),
        'git init',
      ).newState;
      expect(runCommand(state, 'git status').output.trimEnd()).toBe(echt);
    });

    it('een boodschap zonder aanhalingstekens: het tweede woord is een bestand', () => {
      git(['add', 'appel.txt'], { in: map });
      const echt = gitFaalt(['commit', '-m', 'eerste', 'versie'], map).trimEnd();
      let state = runCommand(emptyState({ 'appel.txt': 'x\n' }), 'git init').newState;
      state = runCommand(state, 'git add appel.txt').newState;
      const r = runCommand(state, 'git commit -m eerste versie');
      expect(r.ok).toBe(false);
      expect(r.output.split('\n')[0]).toBe(echt);
      expect(r.newState.commits).toHaveLength(0);
    });

    it('git log --oneline: per commit de korte id en de boodschap', () => {
      git(['commit', '-m', 'eerste versie'], { in: map });
      writeFileSync(join(map, 'appel.txt'), 'y\n');
      git(['commit', '-am', 'tweede'], { in: map });
      const echt = git(['log', '--oneline', '--decorate'], { in: map }).trimEnd().split('\n');
      let state = runCommand(emptyState({ 'appel.txt': 'x\n' }), 'git init').newState;
      for (const c of ['git add appel.txt', 'git commit -m "eerste versie"'])
        state = runCommand(state, c).newState;
      state = { ...state, workingDir: { 'appel.txt': 'y\n' } };
      for (const c of ['git add .', 'git commit -m "tweede"'])
        state = runCommand(state, c).newState;
      const nagemaakt = runCommand(state, 'git log --oneline').output.split('\n');
      // De id's verschillen; de vorm niet.
      const vorm = (r: string) => r.replace(/^[0-9a-f]{7}/, 'ID');
      expect(nagemaakt.map(vorm)).toEqual(echt.map(vorm));
      expect(nagemaakt[0]).toMatch(/^[0-9a-f]{7} \(HEAD -> main\) tweede$/);
    });

    it('een optie die git log niet kent', () => {
      const echt = gitFaalt(['log', '--foo'], map).trimEnd();
      const state = runCommand(emptyState({}), 'git init').newState;
      expect(runCommand(state, 'git log --foo').output.split('\n')[0]).toBe(echt);
    });

    it('twee spaties tellen als één: het commando telt voor het doel', () => {
      const state = runCommand(emptyState({}), 'git init').newState;
      expect(runCommand(state, 'git  status').newState.commands).toContain('git status');
    });
    // Uit de tweede review: wat git wel doet en de simulator niet.
    describe('meer gevallen naast git', () => {
      let m: string;
      beforeAll(() => {
        m = mkdtempSync(join(tmpdir(), 'git-meer-'));
        git(['init'], { in: m });
        writeFileSync(join(m, 'hello.txt'), 'a\n');
        git(['add', 'hello.txt'], { in: m });
      });
      afterAll(() => rmSync(m, { recursive: true, force: true }));
      const start = () => {
        let st = runCommand(emptyState({ 'hello.txt': 'a\n' }), 'git init').newState;
        st = runCommand(st, 'git add hello.txt').newState;
        return st;
      };

      it('een lege boodschap breekt af', () => {
        const echt = gitFaalt(['commit', '-m', ''], m).trimEnd();
        const r = runCommand(start(), 'git commit -m ""');
        expect(r.output).toBe(echt);
        expect(r.newState.commits).toHaveLength(0);
      });

      it('-m"…" zonder spatie is ook een boodschap', () => {
        const r = runCommand(start(), 'git commit -m"eerste versie"');
        expect(r.ok).toBe(true);
        expect(r.newState.commits[0].message).toBe('eerste versie');
      });

      it('git log met de naam, de datum en de hele hash', () => {
        git(['commit', '-m', 'eerste versie'], { in: m });
        const echt = git(['log'], { in: m }).trimEnd().split('\n');
        const st = runCommand(start(), 'git commit -m "eerste versie"').newState;
        const nagemaakt = runCommand(st, 'git log').output.split('\n');
        // De hash en de tijd verschillen; de vorm niet. Git zet (HEAD -> main)
        // alleen op een terminal, niet als je zijn uitvoer opvangt.
        const vorm = (r: string) =>
          r
            .replace(/^commit [0-9a-f]{40}( \(HEAD -> main\))?$/, 'commit HASH')
            .replace(/^Date: {3}.+$/, 'Date: DATUM');
        expect(nagemaakt.map(vorm)).toEqual(echt.map(vorm));
        expect(nagemaakt[2]).toMatch(
          /^Date: {3}\w{3} \w{3} \d{1,2} \d\d:\d\d:\d\d \d{4} [+-]\d{4}$/,
        );
      });

      it('git commit -am zet een gewijzigd bestand eerst klaar', () => {
        writeFileSync(join(m, 'hello.txt'), 'a\nb\n');
        git(['commit', '-am', 'tweede'], { in: m });
        const echt = git(['status'], { in: m }).trimEnd();
        let st = runCommand(start(), 'git commit -m "eerste versie"').newState;
        st = { ...st, workingDir: { 'hello.txt': 'a\nb\n' } };
        const r = runCommand(st, 'git commit -am "tweede"');
        expect(r.ok).toBe(true);
        expect(runCommand(r.newState, 'git status').output.trimEnd()).toBe(echt);
      });

      it('git log -1 en -n 2 tonen de nieuwste commits', () => {
        const echt = git(['log', '--oneline', '-1'], { in: m }).trimEnd().split('\n');
        let st = runCommand(start(), 'git commit -m "eerste versie"').newState;
        st = { ...st, workingDir: { 'hello.txt': 'a\nb\n' } };
        st = runCommand(st, 'git commit -am "tweede"').newState;
        const vorm = (r: string) => r.replace(/^[0-9a-f]{7}( \(HEAD -> main\))?/, 'ID');
        expect(runCommand(st, 'git log --oneline -1').output.split('\n').map(vorm)).toEqual(
          echt.map(vorm),
        );
        expect(runCommand(st, 'git log --oneline -n 2').output.split('\n')).toHaveLength(2);
        // Een optie die git kent en de simulator niet: geen verzonnen fatal.
        expect(runCommand(st, 'git log --graph').output).not.toMatch(/fatal/);
      });

      it('git restore --staged haalt een nieuw bestand uit staging', () => {
        writeFileSync(join(m, 'nieuw.txt'), 'n\n');
        git(['add', 'nieuw.txt'], { in: m });
        git(['restore', '--staged', 'nieuw.txt'], { in: m });
        const echt = git(['status'], { in: m }).trimEnd();
        let st = runCommand(start(), 'git commit -m "eerste versie"').newState;
        st = { ...st, workingDir: { 'hello.txt': 'a\nb\n', 'nieuw.txt': 'n\n' } };
        st = runCommand(st, 'git commit -am "tweede"').newState;
        st = runCommand(st, 'git add nieuw.txt').newState;
        const r = runCommand(st, 'git restore --staged nieuw.txt');
        expect(r.ok).toBe(true);
        expect(runCommand(r.newState, 'git status').output.trimEnd()).toBe(echt);
        rmSync(join(m, 'nieuw.txt'));
      });

      it('.gitignore met een patroon: *.txt en /naam', () => {
        for (const regel of ['*.txt', '/geheim.txt']) {
          writeFileSync(join(m, 'geheim.txt'), 'w\n');
          writeFileSync(join(m, '.gitignore'), `${regel}\n`);
          const echt = git(['status', '--short'], { in: m });
          let st = runCommand(emptyState({ 'hello.txt': 'a\n' }), 'git init').newState;
          st = schrijfBestand(st, 'geheim.txt', 'w\n');
          st = schrijfBestand(st, '.gitignore', `${regel}\n`);
          const status = runCommand(st, 'git status').output;
          expect(echt, regel).not.toContain('geheim.txt');
          expect(status, regel).not.toContain('geheim.txt');
        }
        rmSync(join(m, '.gitignore'));
        rmSync(join(m, 'geheim.txt'));
      });

      it('"is not a git command" alleen voor wat git echt niet kent', () => {
        const kent = git(['help', '-a'], { in: m });
        for (const cmd of COMMANDOS_VAN_GIT) {
          expect(kent, cmd).toMatch(new RegExp(`^\\s+${cmd}\\s`, 'm'));
          expect(runCommand(start(), `git ${cmd}`).output, cmd).not.toMatch(/not a git command/);
        }
        expect(gitFaalt(['pusj'], m)).toMatch(/is not a git command/);
        expect(runCommand(start(), 'git pusj').output).toMatch(/is not a git command/);
      });
    });
  });

  it('.gitignore geldt niet voor een bestand dat al gecommit is', () => {
    // Dit is waarom de simulator onderscheid maakt tussen gevolgd en
    // niet-gevolgd. Zonder dit bewijs is dat gedrag een aanname.
    const map = mkdtempSync(join(tmpdir(), 'git-ign-'));
    try {
      git(['init'], { in: map });
      writeFileSync(join(map, 'geheim.txt'), 'wachtwoord\n');
      git(['add', 'geheim.txt'], { in: map });
      git(['commit', '-m', 'oeps'], { in: map });

      writeFileSync(join(map, '.gitignore'), 'geheim.txt\n');
      writeFileSync(join(map, 'geheim.txt'), 'ander wachtwoord\n');

      // Nog steeds gevolgd, dus nog steeds zichtbaar als gewijzigd.
      expect(git(['status', '--short'], { in: map })).toContain('M geheim.txt');

      // En een niet-gevolgd bestand dat wél genegeerd wordt, weigert git.
      writeFileSync(join(map, '.gitignore'), 'geheim.txt\nnieuw.txt\n');
      writeFileSync(join(map, 'nieuw.txt'), 'x\n');
      expect(git(['status', '--short'], { in: map })).not.toContain('nieuw.txt');
      expect(gitFaalt(['add', 'nieuw.txt'], map)).toContain('The following paths are ignored');
    } finally {
      rmSync(map, { recursive: true, force: true });
    }
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

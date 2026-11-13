import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, unlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  GIT_VERSIE_SIMULATOR,
  type RepoState,
  deleteFile,
  emptyState,
  runCommand,
  schrijfBestand,
} from './gitEngine';

// Elke reeks hieronder loopt twee keer: in de simulator, en met de echte git
// in een lege map, in bash: wat de shell met een regel doet (`*` invullen,
// een `;` aan het eind), doet de simulator ook. Na elk commando moeten de uitvoer en het slagen gelijk
// zijn (de exitcode van git tegen `ok` van de simulator). Wat de simulator
// zelf toevoegt, een `hint:` in het Nederlands, telt niet mee; git's eigen
// hints ook niet. Hashes en datums verschillen per keer en worden gelijk
// gemaakt; de vorm niet.
//
// De gevallen komen uit een review: wat de simulator anders deed dan git,
// en dus anders dan wat de leerling straks in VS Code ziet.

type Stap =
  | string
  /** Alleen de eerste regel telt: git zet er veertig regels `usage:` onder. */
  | { eerste: string }
  | { schrijf: string; inhoud: string }
  | { weg: string };

let home: string;

beforeAll(() => {
  home = mkdtempSync(join(tmpdir(), 'git-naast-home-'));
  writeFileSync(
    join(home, '.gitconfig'),
    // Altijd (HEAD -> main), ook als git niet naar een terminal schrijft:
    // de simulator is een terminal.
    '[user]\n\tname = Leerling\n\temail = leerling@school.nl\n[init]\n\tdefaultBranch = main\n[log]\n\tdecorate = short\n[advice]\n\tdetachedHead = false\n',
  );
});
afterAll(() => rmSync(home, { recursive: true, force: true }));

const omgeving = () => ({
  ...process.env,
  HOME: home,
  LANG: 'C',
  LC_ALL: 'C',
  GIT_CONFIG_GLOBAL: join(home, '.gitconfig'),
  GIT_CONFIG_SYSTEM: '/dev/null',
  GIT_EDITOR: 'false',
  GIT_PAGER: 'cat',
});

/**
 * Hashes, datums en het pad van de repository: die verschillen altijd. Een
 * syntaxfout zet `bash -c` als `bash: -c: line 1: …` met de regel eronder;
 * in een terminal staat er alleen `bash: …`.
 */
function vorm(uitvoer: string): string {
  return uitvoer
    .split('\n')
    .filter((r) => !r.startsWith('hint: ') && !/^bash: -c: line \d+: `/.test(r))
    .map((r) => r.replace(/^bash: -c: line \d+: /, 'bash: '))
    .join('\n')
    .replace(/[0-9a-f]{40}/g, 'HASH')
    .replace(/^\[main (\(root-commit\) )?[0-9a-f]{7}\]/gm, '[main $1ID]')
    .replace(/^[0-9a-f]{7} /gm, 'ID ')
    .replace(/^( ?Date: +).+$/gm, '$1DATUM')
    .replace(/(Git repository in ).+$/gm, '$1PAD')
    .trimEnd();
}

type Uitkomst = { stap: string; echt: string; nagemaakt: string; echtOk: boolean; ok: boolean };

function naastGit(begin: Record<string, string>, stappen: Stap[]): Uitkomst[] {
  const map = mkdtempSync(join(tmpdir(), 'git-naast-'));
  let state: RepoState = emptyState(begin);
  for (const [naam, inhoud] of Object.entries(begin)) writeFileSync(join(map, naam), inhoud);
  const uit: Uitkomst[] = [];
  try {
    for (const stap of stappen) {
      if (typeof stap === 'object' && 'schrijf' in stap) {
        writeFileSync(join(map, stap.schrijf), stap.inhoud);
        state = schrijfBestand(state, stap.schrijf, stap.inhoud);
        continue;
      }
      if (typeof stap === 'object' && 'weg' in stap) {
        unlinkSync(join(map, stap.weg));
        state = deleteFile(state, stap.weg);
        continue;
      }
      const commando = typeof stap === 'string' ? stap : stap.eerste;
      let echt: string;
      let echtOk = true;
      try {
        echt = execFileSync('bash', ['-c', `{ ${commando}\n} 2>&1`], {
          cwd: map,
          encoding: 'utf8',
          env: omgeving(),
          stdio: ['ignore', 'pipe', 'pipe'],
        });
      } catch (e) {
        echtOk = false;
        // Een syntaxfout meldt bash zelf, buiten de 2>&1 om.
        const fout = e as { stdout?: string; stderr?: string };
        echt = `${fout.stdout ?? ''}${fout.stderr ?? ''}`;
      }
      const r = runCommand(state, commando);
      state = r.newState;
      const eerste = (s: string) => (typeof stap === 'string' ? s : s.split('\n')[0]);
      uit.push({
        stap: commando,
        echt: eerste(vorm(echt)),
        nagemaakt: eerste(vorm(r.output)),
        echtOk,
        ok: r.ok,
      });
    }
  } finally {
    rmSync(map, { recursive: true, force: true });
  }
  return uit;
}

/**
 * De simulator volgt een nieuwe git (in CI 2.56): leerlingen installeren de
 * nieuwste Git voor Windows. Waar git 2.43 (Ubuntu 24.04) het anders zei,
 * staat het hier, zodat de test ook met die git draait.
 */
const ANDERS_IN_243: { nieuw: string; oud: string; oudOk: boolean }[] = [
  { nieuw: "fatal: could not resolve 'HEAD'", oud: 'fatal: could not resolve HEAD', oudOk: false },
  // 2.43 las er 0 in en toonde niets.
  { nieuw: "fatal: 'x': not an integer", oud: '', oudOk: true },
  {
    nieuw: "fatal: '3x': not an integer",
    oud: "fatal: '3x': not a non-negative integer",
    oudOk: false,
  },
  // 2.43 las bij -n en --max-count de cijfers vooraan in, en anders 0.
  { nieuw: "fatal: '=3': not an integer", oud: '', oudOk: true },
  { nieuw: "fatal: 'abc': not an integer", oud: '', oudOk: true },
  { nieuw: "fatal: '': not an integer", oud: '', oudOk: true },
  { nieuw: "fatal: '2x': not an integer", oud: 'ID (HEAD -> main) drie\nID twee', oudOk: true },
  { nieuw: "fatal: '1x': not an integer", oud: 'ID (HEAD -> main) drie', oudOk: true },
  { nieuw: "fatal: '1.5': not an integer", oud: 'ID (HEAD -> main) drie', oudOk: true },
  // Te groot voor een int: 2.43 toonde alles.
  {
    nieuw: "fatal: '99999999999': not an integer",
    oud: 'ID (HEAD -> main) drie\nID twee\nID een',
    oudOk: true,
  },
];

const gitVersie = (() => {
  const m = execFileSync('git', ['--version'], { encoding: 'utf8' }).match(/(\d+)\.(\d+)/);
  return m ? [Number(m[1]), Number(m[2])] : [0, 0];
})();
const ouderDan256 = gitVersie[0] < 2 || (gitVersie[0] === 2 && gitVersie[1] < 56);

/**
 * Alle verschillen van een reeks in één keer: met een andere git (een
 * nieuwere in CI) zag je anders per run alleen het eerste.
 */
function gelijkAanGit(begin: Record<string, string>, stappen: Stap[]): void {
  const verschillen: string[] = [];
  for (const u of naastGit(begin, stappen)) {
    const anders = ouderDan256 && ANDERS_IN_243.find((a) => a.nieuw === u.nagemaakt);
    const verwacht = anders
      ? { tekst: anders.oud, ok: anders.oudOk }
      : { tekst: u.nagemaakt, ok: u.ok };
    if (verwacht.tekst !== u.echt)
      verschillen.push(`${u.stap}\n  git:       ${u.echt}\n  simulator: ${verwacht.tekst}`);
    else if (verwacht.ok !== u.echtOk)
      verschillen.push(`${u.stap}: slaagt in git ${u.echtOk ? 'wel' : 'niet'}`);
  }
  expect(verschillen, `git ${gitVersie.join('.')}`).toEqual([]);
}

const HELLO = { 'hello.txt': 'Hallo wereld.\n' };

describe('restore en rm --cached, wat git status zelf aanraadt', () => {
  it('voor de eerste commit: restore --staged kan nog niet, rm --cached wel', () => {
    gelijkAanGit(HELLO, [
      'git init',
      'git restore .',
      'git add .',
      'git restore --staged .',
      'git restore --staged hello.txt',
      'git restore .',
      'git restore nope.txt',
      'git rm --cached hello.txt',
      'git status',
      'git rm --cached hello.txt',
      'git rm --cached',
      'git add hello.txt',
      { schrijf: 'hello.txt', inhoud: 'anders\n' },
      'git rm --cached hello.txt',
      'git rm hello.txt',
      'git status',
    ]);
  });

  it('na een commit: restore --staged . en restore . doen echt iets', () => {
    gelijkAanGit(HELLO, [
      'git init',
      'git add .',
      'git commit -m "een"',
      { schrijf: 'hello.txt', inhoud: 'Hallo wereld.\nnog een\n' },
      { schrijf: 'nieuw.txt', inhoud: 'n\n' },
      'git add .',
      'git restore --staged .',
      'git status',
      'git restore .',
      'git status',
      'git restore nieuw.txt',
      'git restore --staged nieuw.txt',
      'git add nieuw.txt',
      'git restore -SW nieuw.txt',
      'git status',
      'git restore',
    ]);
  });

  it('git rm, met en zonder --cached', () => {
    gelijkAanGit(HELLO, [
      'git init',
      'git add .',
      'git commit -m "een"',
      'git rm --cached hello.txt',
      'git status',
      'git add hello.txt',
      { schrijf: 'hello.txt', inhoud: 'twee\n' },
      'git rm hello.txt',
      'git add hello.txt',
      'git rm hello.txt',
      { schrijf: 'hello.txt', inhoud: 'drie\n' },
      'git rm --cached hello.txt',
      'git rm -f hello.txt',
      'git status',
      'git rm .',
      'git rm nope.txt',
      'git commit -m "weg"',
    ]);
  });
});

describe('een bestand weggooien in de werkmap', () => {
  const BEGIN = { 'hello.txt': 'Hallo wereld.\n', 'b.txt': 'b\n' };

  it('git status toont het, git add zet het klaar, commit legt het vast', () => {
    gelijkAanGit(BEGIN, [
      'git init',
      'git add .',
      'git commit -m "een"',
      { weg: 'b.txt' },
      'git status',
      'git status -s',
      'git add b.txt',
      'git status',
      'git commit -m "weg"',
      'git status',
      'git log --oneline',
    ]);
  });

  it('git add ., -A, --all en -u zetten de verwijdering ook klaar', () => {
    gelijkAanGit(BEGIN, [
      'git init',
      'git add -A',
      'git status',
      'git commit -m "een"',
      { weg: 'b.txt' },
      { schrijf: 'hello.txt', inhoud: 'x\n' },
      { schrijf: 'c.txt', inhoud: 'c\n' },
      'git add --all',
      'git status',
      'git restore --staged .',
      'git add .',
      'git status -s',
      'git restore --staged .',
      'git add -u',
      'git status -s',
      'git restore --staged .',
      'git commit -am "twee"',
      'git status',
    ]);
  });
});

describe('git commit', () => {
  it('met niets klaar toont git eerst de status, ook zonder -m', () => {
    gelijkAanGit(HELLO, [
      'git init',
      'git commit',
      'git commit -m ""',
      'git commit -m "x"',
      'git add .',
      'git commit -m "een"',
      'git commit -m "x"',
      'git commit',
      'git commit -m ""',
      { schrijf: 'hello.txt', inhoud: 'x\n' },
      'git commit -m "x"',
      'git commit',
    ]);
  });

  it('--message, en de regels die commit onder zijn eerste regel zet', () => {
    gelijkAanGit({ ...HELLO, 'leeg.txt': '' }, [
      'git init',
      'git add .',
      'git commit --message="een"',
      { schrijf: 'hello.txt', inhoud: 'x\ny\nz\n' },
      'git add .',
      'git commit --message twee',
      { schrijf: 'hello.txt', inhoud: 'x\nq\nz\nw' },
      { schrijf: 'b.txt', inhoud: 'b\n' },
      'git add .',
      'git commit -m "drie" -m "met een tweede alinea"',
      'git log -1',
      'git commit -qam "vier"',
      'git commit --message',
      'git commit -m',
      { eerste: 'git commit --bogus' },
      { eerste: 'git commit -x' },
    ]);
  });

  it('met een bestandsnaam erachter: alleen dat bestand', () => {
    gelijkAanGit(HELLO, [
      'git init',
      'git commit -m "x" hello.txt',
      'git add hello.txt',
      { schrijf: 'b.txt', inhoud: 'b\n' },
      'git add b.txt',
      'git commit -m "x" hello.txt',
      'git status',
      'git commit -m "y" hello.txt',
      'git commit -am "z" hello.txt',
      { schrijf: 'hello.txt', inhoud: 'anders\n' },
      'git commit -m "z" hello.txt',
      'git status',
      'git commit -m "q" nope',
      'git commit -m eerste versie',
    ]);
  });

  it('--amend vervangt de laatste commit', () => {
    gelijkAanGit(HELLO, [
      'git init',
      'git commit --amend -m "x"',
      'git add .',
      'git commit -m "een"',
      'git commit --amend -m "een, beter"',
      { schrijf: 'geheim.txt', inhoud: 'w\n' },
      'git add .',
      'git commit -m "geheim"',
      'git rm --cached geheim.txt',
      'git commit --amend -m "zonder"',
      'git commit --amend --no-edit',
      'git restore --staged geheim.txt',
      'git commit --amend -m "opnieuw"',
      'git log --oneline',
      'git log',
    ]);
  });
});

describe('git log', () => {
  const DRIE: Stap[] = [
    'git init',
    'git add .',
    'git commit -m "een"',
    { schrijf: 'hello.txt', inhoud: 'twee\n' },
    'git commit -am "twee"',
    { schrijf: 'b.txt', inhoud: 'b\n' },
    'git add b.txt',
    'git commit -m "drie"',
  ];

  it('zonder commits', () => {
    gelijkAanGit(HELLO, [
      'git init',
      'git log',
      'git log -1',
      'git log main',
      'git log HEAD',
      'git log hello.txt',
    ]);
  });

  it('een revisie, een bestand en de manieren om te tellen', () => {
    gelijkAanGit(HELLO, [
      ...DRIE,
      'git log main',
      'git log HEAD',
      'git log --max-count 1',
      'git log --max-count=1',
      'git log -q',
      'git log --quiet --oneline',
      'git log -n',
      'git log -n 1',
      'git log -n1',
      'git log -1',
      'git log -0',
      'git log -n x',
      'git log -3x',
      'git log --max-count',
      'git log foo',
      'git log HEAD~1 --oneline',
      'git log HEAD^ -1',
      'git log main~2 --oneline',
      'git log HEAD~5',
      'git log --oneline hello.txt',
      'git log --oneline b.txt',
      'git log -- nope.txt',
      'git log nope.txt',
      'git log HEAD hello.txt --oneline',
      'git log hello.txt HEAD',
      'git log --no-decorate -1',
      'git log --oneline=x',
      'git --no-pager log --oneline',
    ]);
  });

  it('een telling die geen geheel getal is, weigert git 2.56', () => {
    // Uit een review: de simulator las de cijfers vooraan (`-n2x` was 2)
    // of 0, en weigerde `-n -1`, dat in git alles toont.
    gelijkAanGit(HELLO, [
      ...DRIE,
      'git log --oneline -n=3',
      'git log --oneline --max-count=abc',
      'git log --oneline --max-count=2x',
      'git log --oneline --max-count 2x',
      'git log --oneline --max-count=',
      'git log --oneline -n2x',
      'git log --oneline -n 1x',
      'git log --oneline -n 1.5',
      "git log --oneline -n ''",
      'git log --oneline -n 99999999999',
      'git log --oneline -n -1',
      'git log --oneline -n-1',
      'git log --oneline --max-count=-1',
      'git log --oneline -n -0',
      'git log --oneline -n 03',
      'git log --oneline -n +2',
      "git log --oneline -n ' 2'",
    ]);
  });
});

describe('git add', () => {
  it('met genegeerde bestanden, een patroon en -f', () => {
    gelijkAanGit({ ...HELLO, 'geheim.txt': 'w\n' }, [
      'git init',
      { schrijf: '.gitignore', inhoud: 'geheim.txt\n' },
      'git add',
      { eerste: 'git add hello.txt geheim.txt' },
      'git status -s',
      'git restore --staged hello.txt',
      'git rm --cached hello.txt',
      'git add "*.txt"',
      'git status -s',
      'git add "geh*"',
      'git add -f geheim.txt',
      'git status -s',
      'git add nope.txt hello.txt',
      { eerste: 'git add -x' },
      { eerste: 'git add --bogus' },
    ]);
  });

  it('git add . met alleen genegeerde bestanden, of zonder bestanden', () => {
    gelijkAanGit({}, [
      'git init',
      'git add .',
      'git add -A',
      { schrijf: 'geheim.txt', inhoud: 'w\n' },
      { schrijf: '.gitignore', inhoud: 'geheim.txt\n' },
      'git add .gitignore',
      'git add .',
      'git status',
    ]);
  });
});

describe('.gitignore met patronen', () => {
  // Elk patroon tegen dezelfde map: wat negeert git, en de simulator?
  for (const patroon of [
    '**/geheim.txt',
    '*.txt\n!hello.txt',
    '!geheim.txt\ngeheim.txt',
    'geheim.*',
    '[gG]eheim.txt',
    'geheim.txt/',
    '/geheim.txt',
    'map/geheim.txt',
    '**/*.txt\n!**/hello.txt',
    '\\#notitie.txt',
    '# geheim.txt',
    'geheim.tx?',
    '*',
    // Een spatie vooraan hoort bij de naam; spaties achteraan telt git niet
    // mee, tenzij er een backslash voor staat, en een tab wel. Eerst haalde
    // de simulator alles weg, en negeerde hij wat git bleef tonen.
    ' geheim.txt',
    'geheim.txt   ',
    'geheim.txt\\ ',
    'geheim.txt\t',
    '\tgeheim.txt',
  ]) {
    it(JSON.stringify(patroon), () => {
      gelijkAanGit({ ...HELLO, 'geheim.txt': 'w\n', '#notitie.txt': 'n\n' }, [
        'git init',
        { schrijf: '.gitignore', inhoud: `${patroon}\n` },
        'git status',
        'git add .',
        'git status -s',
      ]);
    });
  }
});

describe('namen met een spatie of een letter buiten ASCII', () => {
  it('tussen aanhalingstekens werkt het, en git status zet ze zoals git', () => {
    gelijkAanGit({ 'mijn bestand.txt': 'a\n', 'één.txt': 'b\n' }, [
      'git init',
      'git status',
      'git add mijn bestand.txt',
      'git add "mijn bestand.txt"',
      'git status',
      "git add 'één.txt'",
      'git status -s',
      'git commit -m "x"',
      'git rm --cached mijn\\ bestand.txt',
      'git restore --staged "mijn bestand.txt"',
      'git status -s',
    ]);
  });
});

describe('de shell om git heen', () => {
  it('&&, || en ; zoals in een terminal', () => {
    gelijkAanGit(HELLO, [
      'git init && git add . && git commit -m "een"',
      'git add nope.txt && git status',
      'git status; git log --oneline',
      'git commit -m "x" || git status',
      'git status && git commit -m "a && b"',
    ]);
  });

  it('git --version, -v en version', () => {
    // Exact alleen op een machine met dezelfde git; elders de vorm.
    const echt = execFileSync('git', ['--version'], { encoding: 'utf8' }).trim();
    for (const c of ['git --version', 'git -v', 'git version']) {
      const r = runCommand(emptyState(), c);
      expect(r.ok, c).toBe(true);
      if (echt === `git version ${GIT_VERSIE_SIMULATOR}`) expect(r.output, c).toBe(echt);
      else expect(r.output, c).toMatch(/^git version \d+\.\d+\.\d+$/);
    }
  });

  it('git --version noemt de git die de simulator volgt: die van CI', () => {
    // Er stond 2.43.0, terwijl de simulator git 2.56 volgt. De versie van
    // CI staat in build.yml (GIT_VERSIE, job test).
    const build = readFileSync(
      fileURLToPath(new URL('../../../../../../.github/workflows/build.yml', import.meta.url)),
      'utf8',
    );
    const ci = build.match(/^\s*GIT_VERSIE: '([\d.]+)'/m)?.[1];
    expect(ci).toBeTruthy();
    expect(GIT_VERSIE_SIMULATOR).toBe(ci);
    expect(runCommand(emptyState(), 'git --version').output).toBe(`git version ${ci}`);
  });

  it('een ; aan het eind mag; ervoor, dubbel of zonder commando is het een fout van bash', () => {
    // `git status;` gaf een rode fout, terwijl bash het gewoon uitvoert.
    gelijkAanGit(HELLO, [
      'git init',
      'git status;',
      'git add . ;',
      'git status -s ;  ',
      'git status -s; git log --oneline;',
      ';git status',
      'git status;;',
      'git status; ;',
      'git status && ; git log',
      ';',
    ]);
  });

  it('een tikfout: git noemt het commando dat erop lijkt', () => {
    // Echte git zegt onder "is not a git command" welk commando je
    // bedoelde; de simulator zei het niet.
    gelijkAanGit(HELLO, [
      'git init',
      'git stauts',
      'git innit',
      'git ad .',
      'git comit -m "x"',
      'git commmit -m "x"',
      'git statsu',
      'git sttaus',
      'git stat',
      'git lgo',
      'git inti',
      'git resotre .',
      'git restor',
      'git psuh',
      'git pusj',
      'git xyzzy',
    ]);
  });
});

describe('woorden met * ? of [ zonder aanhalingstekens vult de shell in', () => {
  // In een terminal krijgt git niet `*` maar de namen die erop passen,
  // zonder de namen met een punt vooraan. Eerst las de simulator `*` als
  // patroon van git, en sloeg hij geheim.txt stil over waar git het met
  // naam kreeg en weigerde.
  it('git add *, *.md, geh*, h?llo.txt en [bh]*', () => {
    gelijkAanGit({ ...HELLO, 'geheim.txt': 'w\n', 'b.md': 'b\n' }, [
      'git init',
      { schrijf: '.gitignore', inhoud: 'geheim.txt\n' },
      'git add *',
      'git status -s',
      'git rm --cached *',
      'git add *.md',
      'git add geh*',
      'git add h?llo.txt',
      'git status -s',
      'git rm --cached [bh]*',
      'git add [bh]*',
      'git status -s',
    ]);
  });

  it('zonder treffer, of tussen aanhalingstekens, krijgt git het patroon zelf', () => {
    gelijkAanGit({ ...HELLO, 'geheim.txt': 'w\n', 'b.md': 'b\n' }, [
      'git init',
      { schrijf: '.gitignore', inhoud: 'geheim.txt\n' },
      'git add *.py',
      'git add \\*.txt',
      'git status -s',
      'git rm --cached hello.txt',
      'git add "*".txt',
      'git status -s',
      "git add 'b'*",
      'git status -s',
      'git commit -m "x" *',
      'git log --oneline -- *.md',
    ]);
  });
});

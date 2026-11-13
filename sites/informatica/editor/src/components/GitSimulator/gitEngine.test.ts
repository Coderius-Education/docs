import { describe, expect, it } from 'vitest';
import {
  type RepoState,
  addToIgnore,
  bestandsnaamFout,
  deleteFile,
  emptyState,
  inGitignore,
  runCommand,
  schrijfBestand,
  setFile,
} from './gitEngine';

// De simulator is het enige stuk van deze site waar een leerling iets kan
// "doen" in plaats van lezen. Gaat hij stil verkeerd, dan leert de leerling
// git verkeerd — erger dan een pagina die niet laadt.

function draai(state: RepoState, ...commandos: string[]): RepoState {
  let s = state;
  for (const c of commandos) {
    s = runCommand(s, c).newState;
  }
  return s;
}

function uitvoer(state: RepoState, commando: string): string {
  return runCommand(state, commando).output;
}

const START = () => emptyState({ 'hello.txt': 'Hallo wereld.\n' });

describe('de kerncyclus', () => {
  it('init, add, commit brengt het bestand in de repository', () => {
    const s = draai(START(), 'git init', 'git add hello.txt', 'git commit -m "eerste versie"');

    expect(s.initialized).toBe(true);
    expect(s.commits).toHaveLength(1);
    expect(s.commits[0].message).toBe('eerste versie');
    expect(s.commits[0].tree).toEqual({ 'hello.txt': 'Hallo wereld.\n' });
    expect(s.commits[0].parent).toBeNull();
    // Staging is na een commit leeg; dat is wat de les belooft in stap 4.
    expect(s.staged).toEqual({});
  });

  it('een tweede commit wijst terug naar de eerste', () => {
    let s = draai(START(), 'git init', 'git add .', 'git commit -m "een"');
    s = setFile(s, 'hello.txt', 'Hallo wereld.\nregel twee\n');
    s = draai(s, 'git add .', 'git commit -m "twee"');

    expect(s.commits).toHaveLength(2);
    expect(s.commits[1].parent).toBe(s.commits[0].id);
    expect(s.head).toBe(s.commits[1].id);
  });

  it('commit zonder iets in staging maakt geen commit', () => {
    const s = draai(START(), 'git init');
    const na = runCommand(s, 'git commit -m "leeg"');

    expect(na.ok).toBe(false);
    expect(na.newState.commits).toHaveLength(0);
  });

  it('twee keer dezelfde inhoud committen levert geen tweede commit op', () => {
    const s = draai(START(), 'git init', 'git add .', 'git commit -m "een"');
    const na = runCommand(draai(s, 'git add .'), 'git commit -m "twee"');

    expect(na.ok).toBe(false);
    expect(na.newState.commits).toHaveLength(1);
  });
});

describe('git status vertelt de waarheid', () => {
  it('noemt een onbekend bestand untracked', () => {
    const s = draai(START(), 'git init');
    expect(uitvoer(s, 'git status')).toContain('Untracked files:');
    expect(uitvoer(s, 'git status')).toContain('hello.txt');
  });

  it('verplaatst het bestand naar Changes to be committed na git add', () => {
    const s = draai(START(), 'git init', 'git add hello.txt');
    const out = uitvoer(s, 'git status');

    expect(out).toContain('Changes to be committed:');
    expect(out).toContain('new file:   hello.txt');
    expect(out).not.toContain('Untracked files:');
  });

  it('meldt een schone werkmap na de commit', () => {
    const s = draai(START(), 'git init', 'git add .', 'git commit -m "een"');
    expect(uitvoer(s, 'git status')).toBe('On branch main\nnothing to commit, working tree clean');
  });

  it('ziet een wijziging na de commit als niet-gestaged', () => {
    let s = draai(START(), 'git init', 'git add .', 'git commit -m "een"');
    s = setFile(s, 'hello.txt', 'iets anders\n');
    const out = uitvoer(s, 'git status');

    expect(out).toContain('Changes not staged for commit:');
    expect(out).toContain('modified:   hello.txt');
  });

  it('toont een bestand dat zowel gestaged als daarna gewijzigd is twee keer', () => {
    // Het klassieke struikelblok: git add maakt een momentopname, geen
    // koppeling. Wie daarna doortypt heeft twee verschillende versies.
    let s = draai(START(), 'git init', 'git add .', 'git commit -m "een"');
    s = setFile(s, 'hello.txt', 'versie twee\n');
    s = draai(s, 'git add .');
    s = setFile(s, 'hello.txt', 'versie drie\n');
    const out = uitvoer(s, 'git status');

    expect(out).toContain('Changes to be committed:');
    expect(out).toContain('Changes not staged for commit:');
  });
});

describe('foutmeldingen', () => {
  it('weigert alles voordat de map een repository is', () => {
    const s = START();
    for (const c of ['git status', 'git add hello.txt', 'git commit -m "x"', 'git log']) {
      const r = runCommand(s, c);
      expect(r.ok, c).toBe(false);
      expect(r.output, c).toContain('fatal: not a git repository');
    }
  });

  it('klaagt over een bestand dat niet bestaat', () => {
    const s = draai(START(), 'git init');
    const r = runCommand(s, 'git add bestaatniet.txt');

    expect(r.ok).toBe(false);
    expect(r.output).toContain("pathspec 'bestaatniet.txt' did not match any files");
    expect(r.newState.staged).toEqual({});
  });

  it('wijst een commando zonder boodschap af', () => {
    const s = draai(START(), 'git init', 'git add .');
    expect(runCommand(s, 'git commit').ok).toBe(false);
    expect(runCommand(s, 'git commit').newState.commits).toHaveLength(0);
  });

  it('legt uit dat alleen git-commandos werken', () => {
    const r = runCommand(START(), 'ls -la');
    expect(r.ok).toBe(false);
    expect(r.output).toContain('command not found');
  });

  it('noemt de commandos die de simulator wel kent', () => {
    const r = runCommand(draai(START(), 'git init'), 'git pusj');
    expect(r.ok).toBe(false);
    expect(r.output).toContain('init, status, add, commit, log, restore en rm');
  });

  it('een commando dat git wel kent, heet geen "not a git command"', () => {
    // git status raadt zelf `git rm --cached` aan; de simulator zei dan dat
    // rm geen git-commando was. Dat is niet waar.
    const r = runCommand(draai(START(), 'git init'), 'git push');
    expect(r.ok).toBe(false);
    expect(r.output).not.toMatch(/is not a git command/);
    expect(r.output).toMatch(/git kent 'push' wel/);
  });

  it('git log zonder commits verwijst naar git commit', () => {
    const r = runCommand(draai(START(), 'git init'), 'git log');
    expect(r.ok).toBe(false);
    expect(r.output).toContain('does not have any commits yet');
  });
});

describe('.gitignore', () => {
  it('houdt een genegeerd bestand uit git status', () => {
    let s = draai(START(), 'git init');
    s = setFile(s, 'geheim.txt', 'wachtwoord\n');
    expect(uitvoer(s, 'git status')).toContain('geheim.txt');

    s = addToIgnore(s, 'geheim.txt');
    expect(uitvoer(s, 'git status')).not.toContain('geheim.txt');
  });

  it('blijft een bestand volgen dat al gecommit was', () => {
    // De hardnekkigste misvatting over .gitignore: "zet het erin en git vergeet
    // het". Dat geldt alleen voor bestanden die git nog niet kende. Deze test
    // legt vast wat echte git doet — zie echte-git.test.ts voor het bewijs.
    let s = draai(START(), 'git init');
    s = setFile(s, 'geheim.txt', 'wachtwoord\n');
    s = draai(s, 'git add .', 'git commit -m "oeps"');

    s = addToIgnore(s, 'geheim.txt');
    s = setFile(s, 'geheim.txt', 'ander wachtwoord\n');

    const out = uitvoer(s, 'git status');
    expect(out).toContain('Changes not staged for commit:');
    expect(out).toContain('modified:   geheim.txt');

    // En git add . neemt hem gewoon mee, want hij is gevolgd.
    expect(Object.keys(draai(s, 'git add .').staged ?? {})).toContain('geheim.txt');
  });

  it('legt uit waarom hij een genegeerd bestand overslaat', () => {
    // Stil niets doen zou de leerling laten denken dat het gelukt was.
    let s = draai(START(), 'git init');
    s = setFile(s, 'geheim.txt', 'wachtwoord\n');
    s = addToIgnore(s, 'geheim.txt');

    const r = runCommand(s, 'git add geheim.txt');
    expect(r.ok).toBe(false);
    expect(r.output).toContain('The following paths are ignored');
    expect(r.newState.staged).toEqual({});
  });

  it('slaat een genegeerd bestand over bij git add .', () => {
    let s = draai(START(), 'git init');
    s = setFile(s, 'geheim.txt', 'wachtwoord\n');
    s = addToIgnore(s, 'geheim.txt');
    s = draai(s, 'git add .');

    expect(Object.keys(s.staged ?? {})).toEqual(['hello.txt']);
  });
});

describe('git log', () => {
  it('zet de nieuwste commit bovenaan met HEAD erbij', () => {
    let s = draai(START(), 'git init', 'git add .', 'git commit -m "een"');
    s = setFile(s, 'hello.txt', 'twee\n');
    s = draai(s, 'git add .', 'git commit -m "twee"');
    const regels = uitvoer(s, 'git log').split('\n');

    expect(regels[0]).toContain('(HEAD -> main)');
    expect(regels[0]).toContain(s.commits[1].id);
    expect(regels[1]).toBe('Author: Leerling <leerling@school.nl>');
    expect(regels[2]).toMatch(/^Date: {3}\w{3} \w{3} \d{1,2} \d\d:\d\d:\d\d \d{4} [+-]\d{4}$/);
    expect(regels[4]).toBe('    twee');
    expect(uitvoer(s, 'git log').indexOf('twee')).toBeLessThan(
      uitvoer(s, 'git log').indexOf('een'),
    );
  });

  it('geeft elke commit een id van veertig tekens, en toont er zeven', () => {
    // Zoals git: git log toont de hele hash, git commit en --oneline zeven.
    for (let i = 0; i < 200; i++) {
      const s0 = draai(START(), 'git init', 'git add .');
      const r = runCommand(s0, `git commit -m "nummer ${i}"`);
      const id = r.newState.commits[0].id;
      expect(id).toMatch(/^[0-9a-f]{40}$/);
      expect(r.output).toBe(
        [
          `[main (root-commit) ${id.slice(0, 7)}] nummer ${i}`,
          ' 1 file changed, 1 insertion(+)',
          ' create mode 100644 hello.txt',
        ].join('\n'),
      );
    }
  });
});

describe('de naam van een nieuw bestand', () => {
  it('zegt wat er mis is, in plaats van niets te doen', () => {
    expect(bestandsnaamFout('', {})).toMatch(/naam/);
    expect(bestandsnaamFout('gitignore', {})).toMatch(/\.gitignore/);
    expect(bestandsnaamFout('map/a.txt', {})).toMatch(/mappen/);
    expect(bestandsnaamFout('hello.txt', { 'hello.txt': 'x' })).toMatch(/bewerk hello\.txt/);
    expect(bestandsnaamFout('.gitignore', { 'hello.txt': 'x' })).toBeNull();
  });

  it('een spatie mag, tekens die in een terminal iets anders doen niet', () => {
    // Een naam met een aanhalingsteken was aan te maken en daarna met geen
    // enkel commando te noemen.
    expect(bestandsnaamFout('mijn bestand.txt', {})).toBeNull();
    for (const naam of ['a"b.txt', "it's.txt", 'a\\b', '*.txt', 'a;b', '-n'])
      expect(bestandsnaamFout(naam, {}), naam).not.toBeNull();
  });

  it('een naam die op .gitignore lijkt, zegt het: git leest alleen .gitignore', () => {
    // Alleen `gitignore` zonder punt werd opgevangen. Met `.gitignore.txt`
    // of `.gitingore` gebeurde niets, en zag de leerling alleen dat git
    // geheim.txt bleef tonen.
    for (const naam of [
      '.gitignore.txt',
      'gitignore.txt',
      '.gitingore',
      '.gitignor',
      '.gitigore',
      '.Gitignore',
      '.GITIGNORE',
      '.gitignores',
    ])
      expect(bestandsnaamFout(naam, {}), naam).toMatch(/Bedoel je \.gitignore\?/);
    for (const naam of ['.gitignore', 'geheim.txt', 'hello.txt', '.github', '.gitkeep', 'git.txt'])
      expect(bestandsnaamFout(naam, {}), naam).toBeNull();
  });
});

describe('een bestand dat weg is', () => {
  // Met de knop x was een bestand weg, en zei git status daarna "working
  // tree clean": de verwijdering was niet te zien en niet te committen.
  it('git status toont het, git add zet het klaar, commit legt het vast', () => {
    let s = draai(START(), 'git init', 'git add .', 'git commit -m "een"');
    s = deleteFile(s, 'hello.txt');
    expect(uitvoer(s, 'git status')).toContain('\tdeleted:    hello.txt');
    s = draai(s, 'git add hello.txt');
    expect(s.staged).toEqual({ 'hello.txt': null });
    const r = runCommand(s, 'git commit -m "weg"');
    expect(r.output.split('\n').slice(1)).toEqual([
      ' 1 file changed, 1 deletion(-)',
      ' delete mode 100644 hello.txt',
    ]);
    expect(r.newState.commits[1].tree).toEqual({});
  });

  it('git add . en git add -A zetten de verwijdering ook klaar', () => {
    for (const c of ['git add .', 'git add -A', 'git add --all', 'git commit -am "x"']) {
      let s = draai(START(), 'git init', 'git add .', 'git commit -m "een"');
      s = deleteFile(s, 'hello.txt');
      const r = runCommand(s, c);
      expect(r.output, c).not.toMatch(/pathspec/);
      expect(r.ok, c).toBe(true);
      expect(uitvoer(r.newState, 'git status -s'), c).not.toContain(' D hello.txt');
    }
  });
});

describe('restore en rm --cached', () => {
  const NA_ADD = () => draai(START(), 'git init', 'git add .');

  it('restore --staged . haalt echt alles uit staging', () => {
    // Het deed niets en meldde succes.
    let s = draai(NA_ADD(), 'git commit -m "een"');
    s = setFile(s, 'hello.txt', 'anders\n');
    s = draai(s, 'git add .', 'git restore --staged .');
    expect(s.staged).toEqual({});
  });

  it('restore . zet de werkmap terug', () => {
    // Het gaf een pathspec-fout.
    let s = draai(NA_ADD(), 'git commit -m "een"');
    s = setFile(s, 'hello.txt', 'anders\n');
    const r = runCommand(s, 'git restore .');
    expect(r.ok).toBe(true);
    expect(r.newState.workingDir['hello.txt']).toBe('Hallo wereld.\n');
  });

  it('restore op een onbekend bestand mislukt', () => {
    const r = runCommand(draai(NA_ADD(), 'git commit -m "een"'), 'git restore nope.txt');
    expect(r.ok).toBe(false);
    expect(r.output).toBe("error: pathspec 'nope.txt' did not match any file(s) known to git");
  });

  it('restore --staged voor de eerste commit kan niet, rm --cached wel', () => {
    const s = NA_ADD();
    const r = runCommand(s, 'git restore --staged hello.txt');
    expect(r.ok).toBe(false);
    expect(r.output).toBe("fatal: could not resolve 'HEAD'");
    expect(r.newState.staged).toEqual(s.staged);

    const rm = runCommand(s, 'git rm --cached hello.txt');
    expect(rm.output).toBe("rm 'hello.txt'");
    expect(rm.newState.staged).toEqual({});
    expect(rm.newState.workingDir).toEqual(s.workingDir);
  });
});

describe('.gitignore volgt het bestand', () => {
  it('een weggegooide .gitignore negeert niets meer', () => {
    let s = draai(START(), 'git init');
    s = schrijfBestand(s, 'geheim.txt', 'w\n');
    s = schrijfBestand(s, '.gitignore', 'geheim.txt\n');
    expect(uitvoer(s, 'git status')).not.toContain('geheim.txt');
    s = deleteFile(s, '.gitignore');
    expect(s.ignored).toEqual([]);
    expect(uitvoer(s, 'git status')).toContain('\tgeheim.txt');
  });

  it('git restore .gitignore zet de regels terug', () => {
    let s = draai(START(), 'git init');
    s = schrijfBestand(s, '.gitignore', 'geheim.txt\n');
    s = draai(s, 'git add .', 'git commit -m "een"');
    s = deleteFile(s, '.gitignore');
    s = draai(s, 'git restore .gitignore');
    expect(inGitignore(s, 'geheim.txt')).toBe(true);
  });

  it('**/, ! en [..] zoals git (echte-git: naast-git.test.ts)', () => {
    const met = (regels: string) => schrijfBestand(START(), '.gitignore', regels);
    expect(inGitignore(met('**/geheim.txt'), 'geheim.txt')).toBe(true);
    expect(inGitignore(met('*.txt\n!hello.txt'), 'hello.txt')).toBe(false);
    expect(inGitignore(met('*.txt\n!hello.txt'), 'geheim.txt')).toBe(true);
    expect(inGitignore(met('[gG]eheim.txt'), 'Geheim.txt')).toBe(true);
    expect(inGitignore(met('geheim.txt/'), 'geheim.txt')).toBe(false);
  });
});

describe('de regel zoals een shell hem leest', () => {
  it('&& voert het volgende commando alleen uit als het vorige lukte', () => {
    const s = draai(START(), 'git init');
    const r = runCommand(s, 'git add . && git commit -m "een"');
    expect(r.ok).toBe(true);
    expect(r.newState.commits).toHaveLength(1);
    // Elk commando telt los voor een doel.
    expect(r.newState.commands.slice(-2)).toEqual(['git add .', 'git commit -m "een"']);

    const mis = runCommand(s, 'git add nope.txt && git commit -m "een"');
    expect(mis.ok).toBe(false);
    expect(mis.newState.commits).toHaveLength(0);
  });

  it('een ; aan het eind voert het commando uit; een && aan het eind wacht, en doet niets', () => {
    // `git status;` gaf een rode fout. Een regel die op && eindigt, voert
    // een terminal pas uit als de rest er is: eerst deed de simulator het
    // eerste deel al.
    const s = draai(START(), 'git init');
    const puntkomma = runCommand(s, 'git add . ;');
    expect(puntkomma.ok).toBe(true);
    expect(puntkomma.output).toBe('');
    expect(Object.keys(puntkomma.newState.staged ?? {})).not.toEqual([]);
    const open = runCommand(s, 'git add . &&');
    expect(open.ok).toBe(false);
    expect(open.output).toMatch(/^hint: na && hoort nog een commando/);
    expect(open.newState.staged).toEqual({});
  });

  it('een naam met een spatie tussen aanhalingstekens', () => {
    // Zo'n naam kon je aanmaken, maar met geen enkel commando gebruiken.
    const s = draai(emptyState({ 'mijn bestand.txt': 'a\n' }), 'git init');
    expect(Object.keys(draai(s, 'git add "mijn bestand.txt"').staged ?? {})).toEqual([
      'mijn bestand.txt',
    ]);
    expect(Object.keys(draai(s, 'git add mijn\\ bestand.txt').staged ?? {})).toEqual([
      'mijn bestand.txt',
    ]);
    const zonder = runCommand(s, 'git add mijn bestand.txt');
    expect(zonder.ok).toBe(false);
    expect(zonder.output).toContain('git add "mijn bestand.txt"');
  });

  it('zegt het als een aanhalingsteken openstaat of iets geen git is', () => {
    const s = draai(START(), 'git init', 'git add .');
    const open = runCommand(s, 'git commit -m "een');
    expect(open.ok).toBe(false);
    expect(open.newState.commits).toHaveLength(0);
    expect(open.output).toMatch(/^hint: /);
    expect(runCommand(s, 'git log | head').output).toMatch(/^hint: .*\|/);
    expect(runCommand(s, 'gitx status').output).toMatch(/^gitx: command not found/);
  });
});

describe('de terminal onthoudt wat je typte', () => {
  it('bewaart ook commandos die mislukten', () => {
    // De leerdoelen in scenarios.ts kijken naar s.commands; zou een mislukt
    // commando daar niet in komen, dan werkt het doel van stap 2 alleen bij
    // perfecte invoer.
    const s = draai(START(), 'git status', 'git init', 'git status');
    expect(s.commands).toEqual(['git status', 'git init', 'git status']);
  });

  it('slaat lege invoer over', () => {
    const s = draai(START(), 'git init', '   ', '');
    expect(s.commands).toEqual(['git init']);
  });
});

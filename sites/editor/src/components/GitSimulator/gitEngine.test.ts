import { describe, expect, it } from 'vitest';
import { type RepoState, addToIgnore, emptyState, runCommand, setFile } from './gitEngine';

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
    const r = runCommand(draai(START(), 'git init'), 'git push');
    expect(r.ok).toBe(false);
    expect(r.output).toContain('init, status, add, commit en log');
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
    expect(regels[2]).toBe('    twee');
    expect(uitvoer(s, 'git log').indexOf('twee')).toBeLessThan(
      uitvoer(s, 'git log').indexOf('een'),
    );
  });

  it('geeft elke commit een id van zeven tekens', () => {
    // Math.random() levert soms een korte hexweergave op; zonder aanvulling
    // kreeg een commit dan een id van één teken.
    for (let i = 0; i < 200; i++) {
      const s = draai(START(), 'git init', 'git add .', `git commit -m "nummer ${i}"`);
      expect(s.commits[0].id).toHaveLength(7);
    }
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

import { describe, expect, it } from 'vitest';
import { SUBCOMMANDOS, vulAan } from './autocomplete';
import { type RepoState, emptyState, runCommand } from './gitEngine';

// Tab-aanvulling scheelt niet alleen typwerk. Een leerling die `git stauts`
// typt krijgt een foutmelding over zijn typefout in plaats van over git, en dat
// leidt af van de les.

function repo(bestanden: Record<string, string> = { 'hello.txt': 'Hallo wereld.\n' }): RepoState {
  return runCommand(emptyState(bestanden), 'git init').newState;
}

describe('het eerste woord', () => {
  it('vult een leeg veld aan tot "git "', () => {
    expect(vulAan('', repo()).aangevuld).toBe('git ');
  });

  it('maakt "gi" af tot "git "', () => {
    expect(vulAan('gi', repo()).aangevuld).toBe('git ');
  });

  it('laat iets dat geen git is met rust', () => {
    expect(vulAan('ls', repo()).aangevuld).toBeNull();
  });
});

describe('het subcommando', () => {
  it('vult een unieke prefix helemaal aan', () => {
    expect(vulAan('git st', repo()).aangevuld).toBe('git status ');
    expect(vulAan('git lo', repo()).aangevuld).toBe('git log ');
  });

  it('stopt bij het gemeenschappelijke begin als er meerdere passen', () => {
    // 'c' past alleen op commit, maar een lege prefix past op alles.
    const r = vulAan('git ', repo());
    expect(r.kandidaten).toEqual([...SUBCOMMANDOS].sort());
    expect(r.aangevuld).toBe('git ');
  });

  it('toont de kandidaten als er meer dan een is', () => {
    // add en... alleen add begint met 'a'. Neem iets met echte concurrentie.
    const r = vulAan('git ', repo());
    expect(r.kandidaten.length).toBeGreaterThan(1);
  });

  it('vult niets aan bij een subcommando dat niet bestaat', () => {
    expect(vulAan('git zzz', repo()).aangevuld).toBeNull();
  });
});

describe('bestandsnamen achter git add', () => {
  it('maakt een bestand uit de werkmap af', () => {
    expect(vulAan('git add he', repo()).aangevuld).toBe('git add hello.txt ');
  });

  it('biedt ook de punt aan', () => {
    const r = vulAan('git add ', repo());
    expect(r.kandidaten).toContain('.');
    expect(r.kandidaten).toContain('hello.txt');
  });

  it('stopt bij het gemeenschappelijke deel van twee bestanden', () => {
    const r = vulAan('git add hel', repo({ 'hello.txt': 'a', 'held.txt': 'b' }));
    expect(r.aangevuld).toBe('git add hel');
    expect(r.kandidaten).toEqual(['held.txt', 'hello.txt']);
  });

  it('biedt een genegeerd bestand niet aan', () => {
    // Aanbieden wat git toch overslaat is misleidend.
    const s = { ...repo({ 'hello.txt': 'a', 'geheim.txt': 'b' }), ignored: ['geheim.txt'] };
    expect(vulAan('git add ', s).kandidaten).not.toContain('geheim.txt');
  });

  it('vult geen bestandsnaam aan achter git status', () => {
    expect(vulAan('git status hel', repo()).aangevuld).toBeNull();
  });
});

describe('git commit', () => {
  it('biedt de -m vlag aan, want zonder boodschap werkt commit niet', () => {
    expect(vulAan('git commit ', repo()).aangevuld).toBe('git commit -m ');
  });
});

describe('wat aanvulling oplevert werkt ook echt', () => {
  it('elk aangevuld commando wordt door de motor begrepen', () => {
    const state = repo();
    for (const invoer of ['gi', 'git st', 'git ad', 'git lo', 'git com']) {
      const { aangevuld } = vulAan(invoer, state);
      if (aangevuld === null || aangevuld.trim() === 'git') continue;
      const r = runCommand(
        state,
        `${aangevuld.trim()}${aangevuld.trim() === 'git add' ? ' .' : ''}`,
      );
      expect(r.output, `${invoer} -> ${aangevuld}`).not.toMatch(/is not a git command/);
    }
  });

  it('de aangeboden subcommandos zijn precies die de motor kent', () => {
    const state = repo();
    for (const sub of SUBCOMMANDOS) {
      const r = runCommand(state, `git ${sub}`);
      expect(r.output, sub).not.toMatch(/is not a git command/);
    }
  });
});

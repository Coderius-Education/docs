// De simulator drukt af wat echte git afdrukt, woordelijk en in het Engels.
// Dat is geen slordigheid maar het punt: tutorial 2 laat de leerling dezelfde
// commando's in VS Code typen, en als hij daar geen enkele regel herkent van
// wat hij hier geoefend heeft, is de oefening niets waard geweest. De
// schrijfgids staat Engels toe voor foutmeldingen; dit valt daaronder.
//
// Uitleg die git zelf niet geeft, zetten we op een `hint:`-regel in het
// Nederlands. Git gebruikt datzelfde voorvoegsel voor zijn eigen tips, dus de
// vorm klopt en de leerling leert die regels lezen.
//
// De strings hieronder zijn overgenomen van git 2.43 en worden bewaakt door
// echte-git.test.ts, die ze naast de uitvoer van de geïnstalleerde git legt.

/** Waar de repository "staat". Alleen voor de tekst van `git init`. */
const REPO_PAD = '/home/jij/git-oefenen/.git/';

const NIET_IN_REPO = 'fatal: not a git repository (or any of the parent directories): .git';

export type Commit = {
  id: string;
  message: string;
  parent: string | null;
  tree: Record<string, string>;
};

export type RepoState = {
  initialized: boolean;
  workingDir: Record<string, string>;
  staged: Record<string, string> | null;
  commits: Commit[];
  head: string | null;
  ignored: string[];
  commands: string[];
};

export type CommandResult = {
  newState: RepoState;
  output: string;
  ok: boolean;
};

export function emptyState(initialFiles: Record<string, string> = {}): RepoState {
  return {
    initialized: false,
    workingDir: { ...initialFiles },
    staged: null,
    commits: [],
    head: null,
    ignored: [],
    commands: [],
  };
}

function shortId(): string {
  // Altijd zeven tekens, net als de afgekorte hash die git toont. Math.random()
  // levert soms een korte hexweergave op ("0.5"), dus aanvullen tot zeven.
  return Math.random().toString(16).slice(2).padEnd(7, '0').slice(0, 7);
}

function committedTree(state: RepoState): Record<string, string> {
  if (!state.head) return {};
  const c = state.commits.find((x) => x.id === state.head);
  return c ? c.tree : {};
}

/**
 * Volgt git dit bestand al? Zodra het in een commit of in staging zit, kent git
 * het en blijft hij wijzigingen tonen.
 */
export function gevolgd(state: RepoState, name: string): boolean {
  return name in committedTree(state) || name in (state.staged ?? {});
}

/**
 * Wordt dit bestand genegeerd? `.gitignore` geldt alléén voor bestanden die git
 * nog niet volgt. Dat is precies de misvatting die leerlingen hebben — "zet het
 * in .gitignore en git vergeet het" — en die deze simulator eerst bevestigde
 * door ook gecommitte bestanden te verbergen.
 */
export function genegeerd(state: RepoState, name: string): boolean {
  return state.ignored.includes(name) && !gevolgd(state, name);
}

function visibleFiles(state: RepoState): string[] {
  return Object.keys(state.workingDir).filter((f) => !genegeerd(state, f));
}

function statusOutput(state: RepoState): string {
  if (!state.initialized) {
    return `${NIET_IN_REPO}\nhint: van deze map is nog geen repository gemaakt — begin met 'git init'`;
  }
  const head = committedTree(state);
  const staged = state.staged ?? {};
  const wd = state.workingDir;

  const stagedNew: string[] = [];
  const stagedModified: string[] = [];
  const modified: string[] = [];
  const untracked: string[] = [];

  // Op alfabet, zoals git: eerst stond een nieuw bestand achteraan, in de
  // volgorde van aanmaken.
  const allNames = [
    ...new Set<string>([...Object.keys(head), ...Object.keys(staged), ...visibleFiles(state)]),
  ].sort();

  for (const name of allNames) {
    const inHead = name in head;
    const inStaged = name in staged;
    const inWd = name in wd && !genegeerd(state, name);

    if (inStaged && !inHead) stagedNew.push(name);
    else if (inStaged && inHead && staged[name] !== head[name]) stagedModified.push(name);

    if (inWd && inStaged && wd[name] !== staged[name]) modified.push(name);
    else if (inWd && !inStaged && inHead && wd[name] !== head[name]) modified.push(name);
    else if (inWd && !inStaged && !inHead) untracked.push(name);
  }

  const geenCommits = state.commits.length === 0;
  const ietsGestaged = stagedNew.length > 0 || stagedModified.length > 0;

  // Git bouwt zijn status uit losse blokken met een lege regel ertussen. De
  // kop telt als eerste blok, dus 'On branch main' krijgt er alleen een lege
  // regel achter als er iets volgt.
  const blokken: string[][] = [];

  if (ietsGestaged) {
    // De tip om te unstagen verschilt: zonder commits bestaat er nog geen
    // versie om naar terug te zetten, dus noemt git een ander commando.
    const unstage = geenCommits
      ? '  (use "git rm --cached <file>..." to unstage)'
      : '  (use "git restore --staged <file>..." to unstage)';
    blokken.push([
      'Changes to be committed:',
      unstage,
      ...stagedNew.map((f) => `\tnew file:   ${f}`),
      ...stagedModified.map((f) => `\tmodified:   ${f}`),
    ]);
  }

  if (modified.length) {
    blokken.push([
      'Changes not staged for commit:',
      '  (use "git add <file>..." to update what will be committed)',
      '  (use "git restore <file>..." to discard changes in working directory)',
      ...modified.map((f) => `\tmodified:   ${f}`),
    ]);
  }

  if (untracked.length) {
    blokken.push([
      'Untracked files:',
      '  (use "git add <file>..." to include in what will be committed)',
      ...untracked.map((f) => `\t${f}`),
    ]);
  }

  // De slotregel die git kiest hangt af van wat het zwaarst weegt. Staat er
  // iets klaar om te committen, dan laat git hem helemaal weg.
  if (!ietsGestaged) {
    if (modified.length) {
      blokken.push(['no changes added to commit (use "git add" and/or "git commit -a")']);
    } else if (untracked.length) {
      blokken.push([
        'nothing added to commit but untracked files present (use "git add" to track)',
      ]);
    } else if (geenCommits) {
      blokken.push(['nothing to commit (create/copy files and use "git add" to track)']);
    } else {
      // Het enige geval waarin git geen lege regel invoegt.
      return 'On branch main\nnothing to commit, working tree clean';
    }
  }

  // Git scheidt zijn blokken met een lege regel, met één uitzondering: bestaat
  // er al een commit, dan plakt hij het eerste blok direct onder 'On branch
  // main'. Zonder commits staat 'No commits yet' ertussen en geldt de lege
  // regel wel.
  const kop = geenCommits ? 'On branch main\n\nNo commits yet' : 'On branch main';
  const rest = blokken.map((b) => b.join('\n'));
  if (rest.length === 0) return kop;

  const [eerste, ...verder] = rest;
  const begin = geenCommits ? `${kop}\n\n${eerste}` : `${kop}\n${eerste}`;
  return [begin, ...verder].join('\n\n');
}

function logOutput(state: RepoState): string {
  if (!state.initialized) {
    return `${NIET_IN_REPO}\nhint: van deze map is nog geen repository gemaakt — begin met 'git init'`;
  }
  if (state.commits.length === 0) {
    return [
      "fatal: your current branch 'main' does not have any commits yet",
      'hint: er valt nog niets te tonen — maak eerst een commit met \'git commit -m "..."\'',
    ].join('\n');
  }
  const lines: string[] = [];
  let id: string | null = state.head;
  let eerste = true;
  while (id) {
    const c = state.commits.find((x) => x.id === id);
    if (!c) break;
    // Git zet achter de nieuwste commit waar HEAD staat. Author en Date laat
    // deze simulator weg: hij kent geen naam en geen klok.
    lines.push(`commit ${c.id}${eerste ? ' (HEAD -> main)' : ''}`);
    lines.push('');
    lines.push(`    ${c.message}`);
    lines.push('');
    eerste = false;
    id = c.parent;
  }
  return lines.join('\n').trimEnd();
}

/** `git log --oneline`: per commit de korte id en de boodschap. */
function logKort(state: RepoState): string {
  const lines: string[] = [];
  let id: string | null = state.head;
  while (id) {
    const c = state.commits.find((x) => x.id === id);
    if (!c) break;
    lines.push(`${c.id.slice(0, 7)}${lines.length ? '' : ' (HEAD -> main)'} ${c.message}`);
    id = c.parent;
  }
  return lines.join('\n');
}

function parseAdd(rest: string): string[] | null {
  const arg = rest.trim();
  if (!arg) return null;
  if (arg === '.') return ['.'];
  return arg.split(/\s+/);
}

/**
 * De boodschap achter `-m`, en wat er daarna nog op de regel staat. Zonder
 * aanhalingstekens is de boodschap één woord, en leest git de rest als
 * namen van bestanden: `git commit -m eerste versie` zoekt een bestand
 * `versie`.
 */
function parseCommitMessage(rest: string): { boodschap: string; erna: string[] } | null {
  const m = rest.match(/^-m\s+(?:"([^"]*)"|'([^']*)'|(\S+))(?:\s+(.*))?$/);
  if (!m) return null;
  return {
    boodschap: m[1] ?? m[2] ?? m[3] ?? '',
    erna: (m[4] ?? '').split(/\s+/).filter(Boolean),
  };
}

export function runCommand(state: RepoState, input: string): CommandResult {
  const result = _runCommand(state, input);
  const trimmed = input.trim();
  if (!trimmed) return result;
  // Twee spaties achter elkaar tellen als één, zoals in een shell: `git  status`
  // werd uitgevoerd, maar het doel "voer git status uit" zag hem niet.
  return {
    ...result,
    newState: {
      ...result.newState,
      commands: [...state.commands, trimmed.replace(/\s+/g, ' ')],
    },
  };
}

function _runCommand(state: RepoState, input: string): CommandResult {
  const trimmed = input.trim();
  if (!trimmed) {
    return { newState: state, output: '', ok: true };
  }
  if (!trimmed.startsWith('git')) {
    return {
      newState: state,
      output: `${trimmed.split(/\s+/)[0]}: command not found\nhint: in deze simulator werken alleen commando's die met 'git' beginnen`,
      ok: false,
    };
  }

  const afterGit = trimmed.slice(3).trim();
  if (!afterGit) {
    return {
      newState: state,
      output: [
        'usage: git [-v | --version] [-h | --help] <command> [<args>]',
        'hint: deze simulator kent init, status, add, commit en log',
      ].join('\n'),
      ok: false,
    };
  }

  const spaceIdx = afterGit.indexOf(' ');
  const sub = spaceIdx === -1 ? afterGit : afterGit.slice(0, spaceIdx);
  const rest = spaceIdx === -1 ? '' : afterGit.slice(spaceIdx + 1);

  switch (sub) {
    case 'init': {
      if (state.initialized) {
        return {
          newState: state,
          output: `Reinitialized existing Git repository in ${REPO_PAD}`,
          ok: true,
        };
      }
      return {
        newState: { ...state, initialized: true, staged: {} },
        output: `Initialized empty Git repository in ${REPO_PAD}`,
        ok: true,
      };
    }

    case 'status': {
      return { newState: state, output: statusOutput(state), ok: state.initialized };
    }

    case 'add': {
      if (!state.initialized) {
        return {
          newState: state,
          output: `${NIET_IN_REPO}\nhint: van deze map is nog geen repository gemaakt — begin met 'git init'`,
          ok: false,
        };
      }
      const args = parseAdd(rest);
      if (!args) {
        return {
          newState: state,
          output: [
            'Nothing specified, nothing added.',
            'hint: noem een bestand (git add hello.txt) of alles tegelijk (git add .)',
          ].join('\n'),
          ok: false,
        };
      }
      const staged = { ...(state.staged ?? {}) };

      if (args[0] !== '.') {
        const missing = args.filter((f) => !(f in state.workingDir));
        if (missing.length) {
          return {
            newState: state,
            output: `fatal: pathspec '${missing[0]}' did not match any files`,
            ok: false,
          };
        }
        // Noem je een genegeerd bestand met naam, dan zwijgt git niet: hij legt
        // uit waarom hij het overslaat. Stil niets doen zou de leerling laten
        // denken dat het gelukt was.
        const overgeslagen = args.filter((f) => genegeerd(state, f));
        if (overgeslagen.length === args.length) {
          return {
            newState: state,
            output: [
              'The following paths are ignored by one of your .gitignore files:',
              ...overgeslagen,
              'hint: hoort dit bestand er wel in? Haal de regel dan uit .gitignore.',
            ].join('\n'),
            ok: false,
          };
        }
      }

      const targets =
        args[0] === '.' ? visibleFiles(state) : args.filter((f) => !genegeerd(state, f));
      for (const f of targets) {
        staged[f] = state.workingDir[f];
      }
      return { newState: { ...state, staged }, output: '', ok: true };
    }

    case 'commit': {
      if (!state.initialized) {
        return {
          newState: state,
          output: `${NIET_IN_REPO}\nhint: van deze map is nog geen repository gemaakt — begin met 'git init'`,
          ok: false,
        };
      }
      const geparsed = parseCommitMessage(rest.trim());
      if (geparsed?.erna.length) {
        return {
          newState: state,
          output: [
            `error: pathspec '${geparsed.erna[0]}' did not match any file(s) known to git`,
            'hint: zet de boodschap tussen aanhalingstekens: git commit -m "wat je veranderd hebt"',
          ].join('\n'),
          ok: false,
        };
      }
      const message = geparsed?.boodschap ?? null;
      if (message === null) {
        return {
          newState: state,
          output: [
            "error: switch `m' requires a value",
            'hint: geef je commit een boodschap mee: git commit -m "wat je veranderd hebt"',
          ].join('\n'),
          ok: false,
        };
      }
      const staged = state.staged ?? {};
      const head = committedTree(state);
      const stagedNames = Object.keys(staged);
      const realChange = stagedNames.length > 0 && stagedNames.some((k) => staged[k] !== head[k]);

      if (!realChange) {
        return {
          newState: state,
          output: statusOutput(state),
          ok: false,
        };
      }
      const newTree: Record<string, string> = { ...head, ...staged };
      const commit: Commit = {
        id: shortId(),
        message,
        parent: state.head,
        tree: newTree,
      };
      return {
        newState: {
          ...state,
          commits: [...state.commits, commit],
          head: commit.id,
          staged: {},
        },
        // Git zet er bij de allereerste commit '(root-commit)' bij: die heeft
        // als enige geen ouder.
        output: `[main ${state.head === null ? '(root-commit) ' : ''}${commit.id}] ${message}`,
        ok: true,
      };
    }

    case 'log': {
      const optie = rest.trim();
      if (optie && optie !== '--oneline') {
        return {
          newState: state,
          output: `fatal: unrecognized argument: ${optie.split(/\s+/)[0]}\nhint: deze simulator kent git log en git log --oneline`,
          ok: false,
        };
      }
      const kort = optie === '--oneline' && state.commits.length > 0;
      return {
        newState: state,
        output: kort ? logKort(state) : logOutput(state),
        ok: state.commits.length > 0,
      };
    }

    default:
      return {
        newState: state,
        output: `git: '${sub}' is not a git command. See 'git --help'.\nhint: deze simulator kent init, status, add, commit en log`,
        ok: false,
      };
  }
}

export function setFile(state: RepoState, name: string, content: string): RepoState {
  return { ...state, workingDir: { ...state.workingDir, [name]: content } };
}

/**
 * Een bestand opslaan zoals de leerling dat in de simulator doet. De
 * negeerlijst is een afgeleide van .gitignore: wie dat bestand opslaat, zet
 * hem opnieuw. Lege regels en regels met # ervoor slaat git ook over.
 */
export function schrijfBestand(state: RepoState, name: string, content: string): RepoState {
  const next = setFile(state, name, content);
  if (name !== '.gitignore') return next;
  return {
    ...next,
    ignored: content
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith('#')),
  };
}

export function deleteFile(state: RepoState, name: string): RepoState {
  const wd = { ...state.workingDir };
  delete wd[name];
  return { ...state, workingDir: wd };
}

export function addToIgnore(state: RepoState, name: string): RepoState {
  if (state.ignored.includes(name)) return state;
  return { ...state, ignored: [...state.ignored, name] };
}

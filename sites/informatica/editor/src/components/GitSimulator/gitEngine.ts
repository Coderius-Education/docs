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
  /** Veertig tekens, zoals een echte hash; git toont er meestal zeven. */
  id: string;
  message: string;
  /** Wanneer de commit gemaakt is, voor de regel Date van `git log`. */
  tijd?: number;
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

/** De naam en het adres in `git log`: die van de simulator, niet van de leerling. */
export const AUTEUR = 'Leerling <leerling@school.nl>';

function nieuweId(): string {
  // Veertig tekens, zoals de hash van git. `git log` toont hem helemaal,
  // `git commit` en `git log --oneline` de eerste zeven.
  let id = '';
  while (id.length < 40) id += Math.floor(Math.random() * 16).toString(16);
  return id;
}

const DAGEN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MAANDEN = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

/** Een tijdstip zoals `git log` het schrijft: `Fri Nov 13 19:16:10 2026 +0100`. */
export function gitDatum(tijd: number): string {
  const d = new Date(tijd);
  const twee = (n: number) => String(n).padStart(2, '0');
  const verschil = -d.getTimezoneOffset();
  const zone = `${verschil < 0 ? '-' : '+'}${twee(Math.floor(Math.abs(verschil) / 60))}${twee(Math.abs(verschil) % 60)}`;
  return `${DAGEN[d.getDay()]} ${MAANDEN[d.getMonth()]} ${d.getDate()} ${twee(d.getHours())}:${twee(d.getMinutes())}:${twee(d.getSeconds())} ${d.getFullYear()} ${zone}`;
}

/**
 * Staat deze naam in .gitignore? Een regel is een naam of een patroon:
 * `*.txt`, `geheim.?`, `/geheim.txt` (een / vooraan: alleen in de map van
 * .gitignore), `#` is commentaar. Eerst telde alleen een naam die er
 * letterlijk stond, en negeerde `*.txt` niets.
 */
export function inGitignore(state: RepoState, name: string): boolean {
  return state.ignored.some((regel) => {
    if (regel.startsWith('!') || regel.endsWith('/')) return false;
    const patroon = regel.replace(/^\//, '');
    const regex = patroon
      .replace(/[.+^${}()|[\]\\]/g, '\\$&')
      .replace(/\*/g, '[^/]*')
      .replace(/\?/g, '[^/]');
    return new RegExp(`^${regex}$`).test(name);
  });
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
  return inGitignore(state, name) && !gevolgd(state, name);
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
    // Git zet achter de nieuwste commit waar HEAD staat. De auteur is die
    // van de simulator; op je eigen computer staat daar wat je met git
    // config hebt ingesteld.
    lines.push(`commit ${c.id}${eerste ? ' (HEAD -> main)' : ''}`);
    lines.push(`Author: ${AUTEUR}`);
    lines.push(`Date:   ${gitDatum(c.tijd ?? Date.now())}`);
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
 * De woorden van een regel zoals een shell ze leest: aanhalingstekens
 * houden een boodschap bij elkaar, en `-m"eerste versie"` is één woord met
 * de boodschap erin.
 */
function woordenVan(rest: string): string[] {
  const woorden: string[] = [];
  let huidig: string | null = null;
  let quote: string | null = null;
  for (const ch of rest) {
    if (quote) {
      if (ch === quote) quote = null;
      else huidig = (huidig ?? '') + ch;
    } else if (ch === '"' || ch === "'") {
      quote = ch;
      huidig = huidig ?? '';
    } else if (/\s/.test(ch)) {
      if (huidig !== null) woorden.push(huidig);
      huidig = null;
    } else huidig = (huidig ?? '') + ch;
  }
  if (huidig !== null) woorden.push(huidig);
  return woorden;
}

type CommitArgs = {
  boodschap: string | null;
  alles: boolean;
  erna: string[];
  mZonderWaarde: boolean;
};

/**
 * `git commit` met zijn opties: `-m "…"`, `-m"…"`, `-a`, `-am "…"`. Zonder
 * aanhalingstekens is de boodschap één woord, en leest git de rest als
 * namen van bestanden: `git commit -m eerste versie` zoekt een bestand
 * `versie`.
 */
function parseCommit(rest: string): CommitArgs {
  const woorden = woordenVan(rest);
  const uit: CommitArgs = { boodschap: null, alles: false, erna: [], mZonderWaarde: false };
  for (let i = 0; i < woorden.length; i++) {
    const w = woorden[i];
    if (/^-[a-z]+$/.test(w) || /^-[a-z]*m.+$/.test(w)) {
      const m = w.indexOf('m');
      const vlaggen = m === -1 ? w.slice(1) : w.slice(1, m);
      if (vlaggen.includes('a')) uit.alles = true;
      if (m === -1) continue;
      if (m < w.length - 1) uit.boodschap = w.slice(m + 1);
      else if (i + 1 < woorden.length) uit.boodschap = woorden[++i];
      else uit.mZonderWaarde = true;
    } else uit.erna.push(w);
  }
  return uit;
}

/** -a: wat git al volgt en veranderd is, gaat eerst naar staging. */
function metAlles(state: RepoState): RepoState {
  const head = committedTree(state);
  const extra: Record<string, string> = {};
  for (const [naam, inhoud] of Object.entries(state.workingDir))
    if (naam in head && head[naam] !== inhoud) extra[naam] = inhoud;
  return { ...state, staged: { ...(state.staged ?? {}), ...extra } };
}

/** De commit zelf, als de boodschap klopt. */
function maakCommit(state: RepoState, message: string): CommandResult {
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
    id: nieuweId(),
    message,
    tijd: Date.now(),
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
    output: `[main ${state.head === null ? '(root-commit) ' : ''}${commit.id.slice(0, 7)}] ${message}`,
    ok: true,
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
      const args = parseCommit(rest);
      if (args.mZonderWaarde) {
        return {
          newState: state,
          output: [
            "error: switch `m' requires a value",
            'hint: geef je commit een boodschap mee: git commit -m "wat je veranderd hebt"',
          ].join('\n'),
          ok: false,
        };
      }
      if (args.erna.length) {
        return {
          newState: state,
          output: [
            `error: pathspec '${args.erna[0]}' did not match any file(s) known to git`,
            'hint: zet de boodschap tussen aanhalingstekens: git commit -m "wat je veranderd hebt"',
          ].join('\n'),
          ok: false,
        };
      }
      if (args.boodschap === null) {
        // Zonder -m opent git een editor voor de boodschap. De simulator
        // heeft er geen.
        return {
          newState: state,
          output: [
            'hint: zonder -m opent git een editor voor de boodschap; deze simulator heeft er geen.',
            'hint: geef de boodschap mee: git commit -m "wat je veranderd hebt"',
          ].join('\n'),
          ok: false,
        };
      }
      if (!args.boodschap.trim()) {
        return {
          newState: state,
          output: 'Aborting commit due to empty commit message.',
          ok: false,
        };
      }
      const message = args.boodschap;
      return maakCommit(args.alles ? metAlles(state) : state, message);
    }

    case 'log': {
      const woorden = woordenVan(rest);
      let kort = false;
      let hoeveel = Number.POSITIVE_INFINITY;
      for (let i = 0; i < woorden.length; i++) {
        const w = woorden[i];
        const getal = w.match(/^-(\d+)$/) ?? w.match(/^-n(\d+)$/) ?? w.match(/^--max-count=(\d+)$/);
        if (w === '--oneline') kort = true;
        else if (getal) hoeveel = Number(getal[1]);
        else if (w === '-n' && /^\d+$/.test(woorden[i + 1] ?? '')) hoeveel = Number(woorden[++i]);
        else {
          // Een optie van git die de simulator niet nadoet: git zou hem
          // gewoon uitvoeren, dus geen fatal. Iets wat git niet kent: wel.
          const naam = w.split('=')[0];
          return {
            newState: state,
            output: LOG_OPTIES_VAN_GIT.includes(naam)
              ? `hint: git kent ${naam} wel, maar deze simulator alleen git log, --oneline en -n.`
              : `fatal: unrecognized argument: ${w}`,
            ok: false,
          };
        }
      }
      if (state.commits.length === 0 || !state.initialized)
        return { newState: state, output: logOutput(state), ok: false };
      const alles = kort ? logKort(state) : logOutput(state);
      // -n: alleen de nieuwste commits. Bij het lange log zijn dat blokken
      // die met `commit ` beginnen.
      const delen = kort ? alles.split('\n') : alles.split(/\n\n(?=commit )/);
      return {
        newState: state,
        output: delen.slice(0, hoeveel).join(kort ? '\n' : '\n\n'),
        ok: true,
      };
    }

    case 'restore': {
      // `git restore --staged <bestand>` raadt git status zelf aan om iets
      // uit staging te halen. In stap 7 zat een leerling daar vast, en zei de
      // simulator dat restore geen git-commando was.
      const woorden = woordenVan(rest);
      const metStaged = woorden.includes('--staged');
      const namen = woorden.filter((w) => !w.startsWith('-'));
      if (!namen.length)
        return { newState: state, output: 'fatal: you must specify path(s) to restore', ok: false };
      const head = committedTree(state);
      const staged = { ...(state.staged ?? {}) };
      const wd = { ...state.workingDir };
      for (const naam of namen) {
        if (metStaged) {
          if (naam in head) staged[naam] = head[naam];
          else delete staged[naam];
        } else {
          const bron = staged[naam] ?? head[naam];
          if (bron === undefined)
            return {
              newState: state,
              output: `error: pathspec '${naam}' did not match any file(s) known to git`,
              ok: false,
            };
          wd[naam] = bron;
        }
      }
      // Wat gelijk is aan de laatste commit, staat niet meer klaar.
      for (const [naam, inhoud] of Object.entries(staged))
        if (head[naam] === inhoud) delete staged[naam];
      return { newState: { ...state, staged, workingDir: wd }, output: '', ok: true };
    }

    default:
      // Een commando dat git wel kent, maar de simulator niet: geen "is not
      // a git command", want dat is niet waar. git status raadt er zelf een
      // paar aan (git rm --cached).
      if (COMMANDOS_VAN_GIT.includes(sub)) {
        return {
          newState: state,
          output: [
            `hint: git kent '${sub}' wel, maar deze simulator niet. Op je eigen computer werkt het.`,
            'hint: zit je vast? Klik op herstart oefening.',
          ].join('\n'),
          ok: false,
        };
      }
      return {
        newState: state,
        output: `git: '${sub}' is not a git command. See 'git --help'.\nhint: deze simulator kent init, status, add, commit, log en restore`,
        ok: false,
      };
  }
}

/**
 * Wat er mis is met de naam van een nieuw bestand in de simulator, of null.
 * Opslaan zonder naam deed eerst niets en zei niets, en `gitignore` zonder
 * punt gaf geen enkele aanwijzing.
 */
export function bestandsnaamFout(naam: string, bestaand: Record<string, string>): string | null {
  if (!naam) return 'Geef het bestand een naam, bijvoorbeeld hello.txt.';
  if (naam.includes('/')) return 'Een naam zonder /: de simulator heeft geen mappen.';
  if (naam === 'gitignore') return 'Bedoel je .gitignore? Die naam begint met een punt.';
  if (naam in bestaand)
    return `Er is al een bestand ${naam}. Klik op bewerk ${naam} om het te veranderen.`;
  return null;
}

/** Opties van `git log` die git kent en de simulator niet nadoet. */
export const LOG_OPTIES_VAN_GIT = [
  '--graph',
  '--stat',
  '-p',
  '--patch',
  '--all',
  '--decorate',
  '--reverse',
  '--author',
  '--since',
  '--until',
  '--pretty',
  '--format',
  '--name-only',
  '--abbrev-commit',
];

/** Commando's die git kent en de simulator niet. echte-git.test.ts legt ze naast `git help -a`. */
export const COMMANDOS_VAN_GIT = [
  'branch',
  'checkout',
  'switch',
  'merge',
  'push',
  'pull',
  'clone',
  'diff',
  'reset',
  'stash',
  'remote',
  'fetch',
  'show',
  'tag',
  'mv',
  'rm',
  'config',
  'rebase',
  'revert',
  'blame',
  'help',
];

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

// De simulator drukt af wat echte git afdrukt, woordelijk en in het Engels.
// Dat is geen slordigheid maar het punt: tutorial 2 laat de leerling dezelfde
// commando's in VS Code typen, en als hij daar geen enkele regel herkent van
// wat hij hier geoefend heeft, is de oefening niets waard geweest. De
// schrijfgids staat Engels toe voor foutmeldingen; dit valt daaronder.
//
// Uitleg die git zelf niet geeft, zetten we op een `hint:`-regel in het
// Nederlands. Git gebruikt datzelfde voorvoegsel voor zijn eigen tips, dus de
// vorm klopt en de leerling leert die regels lezen. Waar git een lange lijst
// opties afdrukt (`usage: …`), staat alleen zijn eerste regel en daaronder
// een hint: veertig regels opties passen niet in de terminal van een stap.
//
// De strings hieronder zijn overgenomen van git 2.43 en worden bewaakt door
// echte-git.test.ts, die ze naast de uitvoer van de geïnstalleerde git legt.

/** Waar de repository "staat". Alleen voor de tekst van `git init`. */
const REPO_PAD = '/home/jij/git-oefenen/.git/';

/** De versie die `git --version` noemt: die waarmee de uitvoer is vergeleken. */
export const GIT_VERSIE = '2.43.0';

const NIET_IN_REPO = 'fatal: not a git repository (or any of the parent directories): .git';
const NIET_IN_REPO_HINT = `${NIET_IN_REPO}\nhint: van deze map is nog geen repository gemaakt — begin met 'git init'`;

/** Wat de simulator kent, voor de hints. */
const KENT = 'init, status, add, commit, log, restore en rm';

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
  /**
   * Staging, als verschil met de laatste commit: per bestand de inhoud die
   * klaarstaat, of null als de verwijdering klaarstaat. Na een commit is hij
   * leeg, en dat toont de zone Staging ook. Null zolang er geen repository is.
   */
  staged: Record<string, string | null> | null;
  commits: Commit[];
  head: string | null;
  ignored: string[];
  /** Alles wat de leerling typte, ook wat mislukte. */
  commands: string[];
  /**
   * Wat lukte. Een doel als "bekijk het log" telt `git log -1` wel en
   * `git log --foo` niet: dat laatste toont niets.
   */
  gelukt: string[];
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
    gelukt: [],
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
 * Een glob als reguliere expressie: `*`, `?` en `[abc]` (of `[!abc]`), en
 * een backslash maakt het volgende teken letterlijk.
 */
function globRegex(patroon: string, ster: string): string {
  let uit = '';
  for (let i = 0; i < patroon.length; i++) {
    const ch = patroon[i];
    if (ch === '\\' && i + 1 < patroon.length) {
      uit += patroon[++i].replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');
    } else if (ch === '*') uit += ster;
    else if (ch === '?') uit += '[^/]';
    else if (ch === '[') {
      const eind = patroon.indexOf(']', i + 2);
      if (eind === -1) uit += '\\[';
      else {
        let klasse = patroon.slice(i + 1, eind);
        if (klasse.startsWith('!')) klasse = `^${klasse.slice(1)}`;
        uit += `[${klasse.replace(/\\/g, '\\\\')}]`;
        i = eind;
      }
    } else uit += ch.replace(/[.+^${}()|[\]\\/]/g, '\\$&');
  }
  return uit;
}

/**
 * Doet deze regel uit .gitignore iets met dit bestand? Null als hij er niets
 * over zegt, anders of hij het negeert (`!` haalt het er weer uit).
 */
function regelZegt(regel: string, naam: string): boolean | null {
  let r = regel;
  let negeer = true;
  if (r.startsWith('!')) {
    negeer = false;
    r = r.slice(1);
  }
  // Een / achteraan: alleen een map. De simulator heeft alleen bestanden.
  if (r.endsWith('/') || !r) return null;
  // `**/` vooraan: in elke map, dus ook in deze. Een / vooraan: alleen in de
  // map van .gitignore, en dat is de enige map die er is.
  r = r.replace(/^(\*\*\/)+/, '').replace(/^\//, '');
  // Een / verderop wijst in een map, en die zijn er niet.
  if (r.replace(/\\./g, '').includes('/')) return null;
  return new RegExp(`^${globRegex(r, '[^/]*')}$`).test(naam) ? negeer : null;
}

/**
 * Staat deze naam in .gitignore? Een regel is een naam of een patroon:
 * `*.txt`, `geheim.?`, `[gG]eheim.txt`, `/geheim.txt` en `**​/geheim.txt`
 * (in de map van .gitignore), `!notitie.txt` (toch niet negeren). De laatste
 * regel die over een bestand iets zegt, telt, zoals bij git. Eerst telde
 * `!` niet en negeerde `**​/geheim.txt` niets.
 */
export function inGitignore(state: RepoState, name: string): boolean {
  let uit = false;
  for (const regel of state.ignored) {
    const zegt = regelZegt(regel, name);
    if (zegt !== null) uit = zegt;
  }
  return uit;
}

/** De regels van .gitignore die git leest: geen lege regels en geen `#`-commentaar. */
function regelsVanGitignore(inhoud: string): string[] {
  return inhoud
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#'));
}

function boomVan(state: RepoState, id: string | null): Record<string, string> {
  if (!id) return {};
  const c = state.commits.find((x) => x.id === id);
  return c ? c.tree : {};
}

function committedTree(state: RepoState): Record<string, string> {
  return boomVan(state, state.head);
}

/**
 * De hele index: wat de volgende commit wordt. De laatste commit met wat er
 * klaarstaat eroverheen.
 */
export function indexVan(state: RepoState): Record<string, string> {
  const idx = { ...committedTree(state) };
  for (const [naam, inhoud] of Object.entries(state.staged ?? {})) {
    if (inhoud === null) delete idx[naam];
    else idx[naam] = inhoud;
  }
  return idx;
}

/** Wat er klaarstaat als verschil tussen een index en een commit. */
function verschilMet(
  idx: Record<string, string>,
  boom: Record<string, string>,
): Record<string, string | null> {
  const staged: Record<string, string | null> = {};
  for (const [naam, inhoud] of Object.entries(idx))
    if (boom[naam] !== inhoud) staged[naam] = inhoud;
  for (const naam of Object.keys(boom)) if (!(naam in idx)) staged[naam] = null;
  return staged;
}

function metIndex(state: RepoState, idx: Record<string, string>): RepoState {
  return { ...state, staged: verschilMet(idx, committedTree(state)) };
}

/**
 * Volgt git dit bestand? Zodra het in de index staat (in een commit of in
 * staging, en niet als verwijdering klaargezet), kent git het en blijft hij
 * wijzigingen tonen.
 */
export function gevolgd(state: RepoState, name: string): boolean {
  return name in indexVan(state);
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

/** Staat dit bestand in een commit? Dan staat het in de geschiedenis. */
export function inEenCommit(state: RepoState, name: string): boolean {
  return state.commits.some((c) => name in c.tree);
}

/**
 * Een naam zoals git hem in zijn uitvoer zet. Een spatie mag, maar een
 * letter buiten ASCII, een aanhalingsteken of een backslash zet git tussen
 * aanhalingstekens, met de bytes als `\303\251` (`core.quotePath`).
 */
export function gitNaam(naam: string, spatie = false): string {
  // `git status -s` zet ook een naam met een spatie tussen aanhalingstekens.
  if (!/[^\x20-\x7e]|["\\]/.test(naam) && !(spatie && naam.includes(' '))) return naam;
  const kort: Record<number, string> = {
    7: 'a',
    8: 'b',
    9: 't',
    10: 'n',
    11: 'v',
    12: 'f',
    13: 'r',
  };
  let uit = '';
  for (const byte of new TextEncoder().encode(naam)) {
    if (byte === 0x22) uit += '\\"';
    else if (byte === 0x5c) uit += '\\\\';
    else if (kort[byte]) uit += `\\${kort[byte]}`;
    else if (byte < 0x20 || byte >= 0x7f) uit += `\\${byte.toString(8).padStart(3, '0')}`;
    else uit += String.fromCharCode(byte);
  }
  return `"${uit}"`;
}

type StatusOpties = {
  /** De status die `git commit` toont als er niets te committen is. */
  commit?: boolean;
  /** Bij `--amend`: vergelijk met de ouder van de laatste commit. */
  amend?: boolean;
  /** Alleen deze namen (`git status hello.txt`). */
  alleen?: (naam: string) => boolean;
};

type Indeling = {
  klaar: { naam: string; soort: 'new file' | 'modified' | 'deleted' }[];
  nietKlaar: { naam: string; soort: 'modified' | 'deleted' }[];
  untracked: string[];
};

/** Wat er klaarstaat, wat veranderd is en wat git nog niet kent, op alfabet. */
function deelIn(state: RepoState, ref: Record<string, string>, opties: StatusOpties): Indeling {
  const idx = indexVan(state);
  const wd = state.workingDir;
  const uit: Indeling = { klaar: [], nietKlaar: [], untracked: [] };
  // Op alfabet, zoals git, en een nieuw en een gewijzigd bestand door elkaar:
  // eerst stonden de nieuwe vooraan, in de volgorde van aanmaken.
  const namen = [...new Set([...Object.keys(ref), ...Object.keys(idx), ...Object.keys(wd)])]
    .filter((n) => opties.alleen?.(n) ?? true)
    .sort();
  for (const naam of namen) {
    const inRef = naam in ref;
    const inIdx = naam in idx;
    const inWd = naam in wd;
    if (inIdx && !inRef) uit.klaar.push({ naam, soort: 'new file' });
    else if (inIdx && inRef && idx[naam] !== ref[naam]) uit.klaar.push({ naam, soort: 'modified' });
    else if (inRef && !inIdx) uit.klaar.push({ naam, soort: 'deleted' });

    if (inIdx && !inWd) uit.nietKlaar.push({ naam, soort: 'deleted' });
    else if (inIdx && wd[naam] !== idx[naam]) uit.nietKlaar.push({ naam, soort: 'modified' });
    else if (inWd && !inIdx && !inGitignore(state, naam)) uit.untracked.push(naam);
  }
  return uit;
}

/** `new file:   `, `modified:   `, `deleted:    `: git lijnt de namen uit. */
const regel = (soort: string, naam: string) => `\t${`${soort}:`.padEnd(12)}${gitNaam(naam)}`;

function statusOutput(state: RepoState, opties: StatusOpties = {}): string {
  if (!state.initialized) return NIET_IN_REPO_HINT;
  const head = state.commits.find((c) => c.id === state.head);
  const ref = opties.amend ? boomVan(state, head?.parent ?? null) : committedTree(state);
  const { klaar, nietKlaar, untracked } = deelIn(state, ref, opties);

  const geenCommits = opties.amend ? !head?.parent : state.commits.length === 0;

  // Git bouwt zijn status uit losse blokken met een lege regel ertussen. De
  // kop telt als eerste blok, dus 'On branch main' krijgt er alleen een lege
  // regel achter als er iets volgt.
  const blokken: string[][] = [];

  if (klaar.length) {
    // De tip om te unstagen verschilt: zonder commits bestaat er nog geen
    // versie om naar terug te zetten, dus noemt git een ander commando.
    const unstage = geenCommits
      ? '  (use "git rm --cached <file>..." to unstage)'
      : '  (use "git restore --staged <file>..." to unstage)';
    blokken.push([
      'Changes to be committed:',
      unstage,
      ...klaar.map((k) => regel(k.soort, k.naam)),
    ]);
  }

  if (nietKlaar.length) {
    // Is er een bestand weg, dan noemt git ook rm.
    const weg = nietKlaar.some((k) => k.soort === 'deleted');
    blokken.push([
      'Changes not staged for commit:',
      `  (use "git ${weg ? 'add/rm' : 'add'} <file>..." to update what will be committed)`,
      '  (use "git restore <file>..." to discard changes in working directory)',
      ...nietKlaar.map((k) => regel(k.soort, k.naam)),
    ]);
  }

  if (untracked.length) {
    blokken.push([
      'Untracked files:',
      '  (use "git add <file>..." to include in what will be committed)',
      ...untracked.map((f) => `\t${gitNaam(f)}`),
    ]);
  }

  // De slotregel die git kiest hangt af van wat het zwaarst weegt. Staat er
  // iets klaar om te committen, dan laat git hem helemaal weg.
  if (!klaar.length) {
    if (opties.amend) blokken.push(['No changes']);
    else if (nietKlaar.length) {
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
  // main'. Zonder commits staat 'No commits yet' ertussen (bij `git commit`:
  // 'Initial commit') en geldt de lege regel wel.
  const kop = geenCommits
    ? `On branch main\n\n${opties.commit ? 'Initial commit' : 'No commits yet'}`
    : 'On branch main';
  const rest = blokken.map((b) => b.join('\n'));
  if (rest.length === 0) return kop;

  const [eerste, ...verder] = rest;
  const begin = geenCommits ? `${kop}\n\n${eerste}` : `${kop}\n${eerste}`;
  return [begin, ...verder].join('\n\n');
}

/** `git status -s`: per bestand twee letters, staging en werkmap. */
function statusKort(state: RepoState, opties: StatusOpties): string {
  const { klaar, nietKlaar, untracked } = deelIn(state, committedTree(state), opties);
  const letter = { 'new file': 'A', modified: 'M', deleted: 'D' } as const;
  const namen = [...new Set([...klaar, ...nietKlaar].map((k) => k.naam))].sort();
  const regels = namen.map((naam) => {
    const x = klaar.find((k) => k.naam === naam);
    const y = nietKlaar.find((k) => k.naam === naam);
    return `${x ? letter[x.soort] : ' '}${y ? letter[y.soort] : ' '} ${gitNaam(naam, true)}`;
  });
  return [...regels, ...untracked.map((n) => `?? ${gitNaam(n, true)}`)].join('\n');
}

/**
 * De woorden van een regel zoals een shell ze leest: aanhalingstekens
 * houden een boodschap of een naam met een spatie bij elkaar,
 * `-m"eerste versie"` is één woord met de boodschap erin, en een backslash
 * maakt het volgende teken gewoon (`mijn\ bestand.txt`). `open` is het
 * aanhalingsteken dat niet gesloten is; een shell wacht dan op meer.
 */
export function woordenVan(regel: string): { woorden: string[]; open: string | null } {
  const woorden: string[] = [];
  let huidig: string | null = null;
  let quote: string | null = null;
  for (let i = 0; i < regel.length; i++) {
    const ch = regel[i];
    if (quote) {
      if (ch === quote) quote = null;
      else if (quote === '"' && ch === '\\' && /["\\$`]/.test(regel[i + 1] ?? ''))
        huidig = (huidig ?? '') + regel[++i];
      else huidig = (huidig ?? '') + ch;
    } else if (ch === '"' || ch === "'") {
      quote = ch;
      huidig = huidig ?? '';
    } else if (ch === '\\' && i + 1 < regel.length) {
      huidig = (huidig ?? '') + regel[++i];
    } else if (/\s/.test(ch)) {
      if (huidig !== null) woorden.push(huidig);
      huidig = null;
    } else huidig = (huidig ?? '') + ch;
  }
  if (huidig !== null) woorden.push(huidig);
  return { woorden, open: quote };
}

/**
 * Welke namen een pathspec treft: `.` alles, een patroon met `*`, `?` of
 * `[…]` wat erop past (een `*` ook over een `/`, zoals in git), en anders
 * de naam zelf.
 */
function treft(spec: string, namen: string[]): string[] {
  if (spec === '.' || spec === './' || spec === ':/') return namen;
  if (/[*?[]/.test(spec)) {
    const regex = new RegExp(`^${globRegex(spec.replace(/^\.\//, ''), '.*')}$`);
    return namen.filter((n) => regex.test(n));
  }
  const naam = spec.replace(/^\.\//, '');
  return namen.includes(naam) ? [naam] : [];
}

/** Een naam met een spatie, als losse woorden getypt: `git add mijn bestand.txt`. */
function spatieHint(woorden: string[], state: RepoState, commando: string): string | null {
  const samen = woorden.join(' ');
  const namen = [...Object.keys(state.workingDir), ...Object.keys(indexVan(state))];
  const bedoeld = namen.find((n) => n.includes(' ') && samen.includes(n));
  return bedoeld
    ? `hint: een naam met een spatie zet je tussen aanhalingstekens: ${commando} "${bedoeld}"`
    : null;
}

type Opties = { vlaggen: Set<string>; namen: string[]; fout: string | null };

/**
 * Zet de woorden na een commando om in opties en namen. `bekend` zijn de
 * opties die de simulator nadoet, met hun korte en lange vorm; `vanGit` de
 * opties die git kent en de simulator niet. Een optie die git niet kent,
 * geeft dezelfde regel als in git (`error: unknown option`), zonder de
 * veertig regels `usage:` erna.
 */
function leesOpties(
  woorden: string[],
  commando: string,
  bekend: Record<string, string>,
  vanGit: string[],
  wat: string,
): Opties {
  const uit: Opties = { vlaggen: new Set(), namen: [], fout: null };
  let naDubbel = false;
  for (const w of woorden) {
    if (naDubbel || w === '-' || !w.startsWith('-')) {
      uit.namen.push(w);
      continue;
    }
    if (w === '--') {
      naDubbel = true;
      continue;
    }
    const losse = w.startsWith('--') ? [w.split('=')[0]] : [...w.slice(1)].map((l) => `-${l}`);
    for (const optie of losse) {
      if (bekend[optie]) {
        uit.vlaggen.add(bekend[optie]);
        continue;
      }
      const lang = optie.startsWith('--');
      uit.fout = vanGit.includes(optie)
        ? `hint: git kent ${optie} bij git ${commando} wel, maar deze simulator niet. ${wat}`
        : [
            lang
              ? `error: unknown option \`${optie.slice(2)}'`
              : `error: unknown switch \`${optie.slice(1)}'`,
            `hint: ${wat}`,
          ].join('\n');
      return uit;
    }
  }
  return uit;
}

function nietGelukt(state: RepoState, output: string): CommandResult {
  return { newState: state, output, ok: false };
}

/** `git add`: wat de leerling noemt, gaat zoals het nu is naar staging, ook een verwijdering. */
function gitAdd(state: RepoState, woorden: string[]): CommandResult {
  if (!state.initialized) return nietGelukt(state, NIET_IN_REPO_HINT);
  const { vlaggen, namen, fout } = leesOpties(
    woorden,
    'add',
    {
      '-A': 'alles',
      '--all': 'alles',
      '-u': 'gevolgd',
      '--update': 'gevolgd',
      '-f': 'forceer',
      '--force': 'forceer',
    },
    [
      '-v',
      '--verbose',
      '-n',
      '--dry-run',
      '-i',
      '--interactive',
      '-p',
      '--patch',
      '-e',
      '--edit',
      '-N',
      '--intent-to-add',
    ],
    'Deze simulator kent git add met een naam, git add . en git add -A.',
  );
  if (fout) return nietGelukt(state, fout);

  const idx = indexVan(state);
  const wd = state.workingDir;
  const alleNamen = [...new Set([...Object.keys(wd), ...Object.keys(idx)])].sort();
  const kandidaten = vlaggen.has('gevolgd') ? Object.keys(idx).sort() : alleNamen;

  let specs = namen;
  if (!specs.length) {
    // `git add -A` en `git add -u` zonder naam: de hele map.
    if (vlaggen.has('alles') || vlaggen.has('gevolgd')) specs = ['.'];
    // Git slaagt hier, met een melding: er ging niets mis, er gebeurde niets.
    else
      return {
        newState: state,
        output: [
          'Nothing specified, nothing added.',
          'hint: noem een bestand (git add hello.txt) of alles tegelijk (git add .)',
        ].join('\n'),
        ok: true,
      };
  }

  const doelen = new Set<string>();
  const overgeslagen: string[] = [];
  for (const spec of specs) {
    const getroffen = treft(spec, kandidaten);
    const letterlijk = getroffen.length === 1 && getroffen[0] === spec.replace(/^\.\//, '');
    // Een genegeerd bestand dat je met naam noemt, slaat git niet stil over:
    // hij legt uit waarom. Met `.` of een patroon zwijgt hij erover.
    const bruikbaar = getroffen.filter((n) => vlaggen.has('forceer') || !genegeerd(state, n));
    if (letterlijk && !bruikbaar.length) overgeslagen.push(getroffen[0]);
    // `git add .` met niets erin, of alleen genegeerde bestanden: geen fout.
    else if (!bruikbaar.length && spec !== '.' && spec !== './') {
      const extra = spatieHint(specs, state, 'git add');
      return nietGelukt(
        state,
        [`fatal: pathspec '${spec}' did not match any files`, ...(extra ? [extra] : [])].join('\n'),
      );
    }
    for (const n of bruikbaar) doelen.add(n);
  }

  const nieuw = { ...idx };
  for (const naam of doelen) {
    if (naam in wd) nieuw[naam] = wd[naam];
    else delete nieuw[naam];
  }
  const newState = metIndex(state, nieuw);
  if (overgeslagen.length) {
    return nietGelukt(
      newState,
      [
        'The following paths are ignored by one of your .gitignore files:',
        ...overgeslagen,
        'hint: hoort dit bestand er wel in? Haal de regel dan uit .gitignore.',
      ].join('\n'),
    );
  }
  return { newState, output: '', ok: true };
}

/**
 * `git rm`: haal een bestand uit git. Met `--cached` blijft het in de
 * werkmap staan en volgt git het niet meer: dat raadt `git status` aan om
 * iets uit staging te halen zolang er nog geen commit is.
 */
function gitRm(state: RepoState, woorden: string[]): CommandResult {
  if (!state.initialized) return nietGelukt(state, NIET_IN_REPO_HINT);
  const { vlaggen, namen, fout } = leesOpties(
    woorden,
    'rm',
    {
      '--cached': 'cached',
      '-r': 'recursief',
      '-f': 'forceer',
      '--force': 'forceer',
      '-q': 'stil',
      '--quiet': 'stil',
    },
    ['-n', '--dry-run', '--ignore-unmatch', '--sparse', '--pathspec-from-file'],
    'Deze simulator kent git rm <bestand> en git rm --cached <bestand>.',
  );
  if (fout) return nietGelukt(state, fout);
  if (!namen.length)
    return nietGelukt(state, 'fatal: No pathspec was given. Which files should I remove?');

  const idx = indexVan(state);
  const head = committedTree(state);
  const wd = state.workingDir;
  const doelen: string[] = [];
  for (const spec of namen) {
    const getroffen = treft(spec, Object.keys(idx).sort());
    if (!getroffen.length) {
      const extra = spatieHint(namen, state, 'git rm');
      const nietGevolgd = spec in wd && !extra;
      return nietGelukt(
        state,
        [
          `fatal: pathspec '${spec}' did not match any files`,
          ...(extra ? [extra] : []),
          ...(nietGevolgd ? [`hint: git volgt ${spec} niet: er valt niets uit git te halen.`] : []),
        ].join('\n'),
      );
    }
    if ((spec === '.' || spec === './') && !vlaggen.has('recursief'))
      return nietGelukt(state, `fatal: not removing '${spec}' recursively without -r`);
    for (const n of getroffen) if (!doelen.includes(n)) doelen.push(n);
  }

  if (!vlaggen.has('forceer')) {
    // Git weigert werk weg te gooien dat nergens anders staat.
    const beide: string[] = [];
    const klaar: string[] = [];
    const lokaal: string[] = [];
    for (const n of doelen) {
      const anders = idx[n] !== head[n];
      const inWd = n in wd;
      if (anders && inWd && wd[n] !== idx[n]) beide.push(n);
      else if (!vlaggen.has('cached') && anders) klaar.push(n);
      else if (!vlaggen.has('cached') && inWd && wd[n] !== idx[n]) lokaal.push(n);
    }
    const melding = (lijst: string[], wat: [string, string], tip: string) =>
      [
        `error: the following ${lijst.length === 1 ? `file ${wat[0]}` : `files ${wat[1]}`}`,
        ...lijst.map((n) => `    ${n}`),
        tip,
      ].join('\n');
    if (beide.length)
      return nietGelukt(
        state,
        melding(
          beide,
          [
            'has staged content different from both the\nfile and the HEAD:',
            'have staged content different from both the\nfile and the HEAD:',
          ],
          '(use -f to force removal)',
        ),
      );
    if (klaar.length)
      return nietGelukt(
        state,
        melding(
          klaar,
          ['has changes staged in the index:', 'have changes staged in the index:'],
          '(use --cached to keep the file, or -f to force removal)',
        ),
      );
    if (lokaal.length)
      return nietGelukt(
        state,
        melding(
          lokaal,
          ['has local modifications:', 'have local modifications:'],
          '(use --cached to keep the file, or -f to force removal)',
        ),
      );
  }

  const nieuw = { ...idx };
  const nieuweWd = { ...wd };
  for (const n of doelen) {
    delete nieuw[n];
    if (!vlaggen.has('cached')) delete nieuweWd[n];
  }
  return {
    newState: metIndex({ ...state, workingDir: nieuweWd }, nieuw),
    output: vlaggen.has('stil') ? '' : doelen.map((n) => `rm '${n}'`).join('\n'),
    ok: true,
  };
}

/**
 * `git restore`: zet de werkmap terug op wat in staging staat, of met
 * `--staged` staging op de laatste commit. `git status` raadt beide aan.
 */
function gitRestore(state: RepoState, woorden: string[]): CommandResult {
  if (!state.initialized) return nietGelukt(state, NIET_IN_REPO_HINT);
  const { vlaggen, namen, fout } = leesOpties(
    woorden,
    'restore',
    {
      '-S': 'staged',
      '--staged': 'staged',
      '-W': 'werkmap',
      '--worktree': 'werkmap',
      '-q': 'stil',
      '--quiet': 'stil',
    },
    [
      '-s',
      '--source',
      '-p',
      '--patch',
      '--overlay',
      '--no-overlay',
      '-m',
      '--merge',
      '--ours',
      '--theirs',
    ],
    'Deze simulator kent git restore <bestand> en git restore --staged <bestand>.',
  );
  if (fout) return nietGelukt(state, fout);
  if (!namen.length) return nietGelukt(state, 'fatal: you must specify path(s) to restore');

  const staged = vlaggen.has('staged');
  const werkmap = vlaggen.has('werkmap') || !staged;
  // Zonder commit is er geen versie om staging op terug te zetten.
  if (staged && !state.head) return nietGelukt(state, 'fatal: could not resolve HEAD');

  const head = committedTree(state);
  const idx = indexVan(state);
  // Met --staged telt ook wat alleen in de laatste commit staat (een
  // klaargezette verwijdering); anders alleen wat in staging staat.
  const bekend = Object.keys(staged ? { ...head, ...idx } : idx).sort();
  const doelen: string[] = [];
  for (const spec of namen) {
    const getroffen = treft(spec, bekend);
    if (!getroffen.length) {
      const extra = spatieHint(namen, state, 'git restore');
      return nietGelukt(
        state,
        [
          `error: pathspec '${spec}' did not match any file(s) known to git`,
          ...(extra ? [extra] : []),
        ].join('\n'),
      );
    }
    doelen.push(...getroffen);
  }

  const nieuw = { ...idx };
  const wd = { ...state.workingDir };
  for (const n of doelen) {
    if (staged) {
      if (n in head) nieuw[n] = head[n];
      else delete nieuw[n];
    }
    if (werkmap) {
      // Met --staged en --worktree samen komt alles uit de laatste commit.
      const bron = staged ? head[n] : idx[n];
      if (bron === undefined) delete wd[n];
      else wd[n] = bron;
    }
  }
  return { newState: metIndex({ ...state, workingDir: wd }, nieuw), output: '', ok: true };
}

/** De regels van een bestand, elk met zijn regeleinde; de laatste kan er een missen. */
function regelsVan(inhoud: string | undefined): string[] {
  return inhoud ? (inhoud.match(/[^\n]*\n|[^\n]+$/g) ?? []) : [];
}

/** Hoeveel regels erbij en eraf, zoals de kleinste diff ze telt. */
function telVerschil(oud: string | undefined, nieuw: string | undefined): [number, number] {
  const a = regelsVan(oud);
  const b = regelsVan(nieuw);
  // De langste gemeenschappelijke reeks regels: de rest is erbij of eraf.
  const rij = new Array(b.length + 1).fill(0);
  for (let i = 1; i <= a.length; i++) {
    let vorige = 0;
    for (let j = 1; j <= b.length; j++) {
      const hier = rij[j];
      rij[j] = a[i - 1] === b[j - 1] ? vorige + 1 : Math.max(rij[j], rij[j - 1]);
      vorige = hier;
    }
  }
  const gelijk = rij[b.length];
  return [b.length - gelijk, a.length - gelijk];
}

/**
 * De regels die `git commit` onder zijn eerste regel zet:
 * ` 1 file changed, 1 insertion(+)` en ` create mode 100644 hello.txt`.
 */
function samenvatting(oud: Record<string, string>, nieuw: Record<string, string>): string[] {
  const namen = [...new Set([...Object.keys(oud), ...Object.keys(nieuw)])]
    .filter((n) => oud[n] !== nieuw[n])
    .sort();
  if (!namen.length) return [' 0 files changed'];
  let erbij = 0;
  let eraf = 0;
  for (const n of namen) {
    const [plus, min] = telVerschil(oud[n], nieuw[n]);
    erbij += plus;
    eraf += min;
  }
  let regel = ` ${namen.length} ${namen.length === 1 ? 'file' : 'files'} changed`;
  // Zo telt git: nul regels erbij noemt hij alleen als er ook niets af ging.
  if (erbij || !eraf) regel += `, ${erbij} ${erbij === 1 ? 'insertion' : 'insertions'}(+)`;
  if (eraf || !erbij) regel += `, ${eraf} ${eraf === 1 ? 'deletion' : 'deletions'}(-)`;
  const modus = namen
    .filter((n) => !(n in oud) || !(n in nieuw))
    .map((n) => ` ${n in nieuw ? 'create' : 'delete'} mode 100644 ${gitNaam(n)}`);
  return [regel, ...modus];
}

type CommitArgs = {
  boodschap: string[];
  alles: boolean;
  amend: boolean;
  zonderBewerken: boolean;
  stil: boolean;
  paden: string[];
  fout: string | null;
};

/** Opties van `git commit` die git kent en de simulator niet nadoet. */
const COMMIT_OPTIES_VAN_GIT = [
  '--allow-empty',
  '--allow-empty-message',
  '--author',
  '--date',
  '--dry-run',
  '--edit',
  '--file',
  '--fixup',
  '--include',
  '--interactive',
  '--no-verify',
  '--only',
  '--patch',
  '--reedit-message',
  '--reuse-message',
  '--signoff',
  '--squash',
  '--template',
  '--untracked-files',
  '--verbose',
  '-C',
  '-F',
  '-c',
  '-e',
  '-i',
  '-n',
  '-o',
  '-p',
  '-s',
  '-t',
  '-u',
  '-v',
];

const COMMIT_UITLEG = 'Deze simulator kent git commit -m "…", -a, -am "…" en --amend -m "…".';

/**
 * `git commit` met zijn opties: `-m "…"`, `-m"…"`, `--message=…`, `-a`,
 * `-am "…"`, `--amend`. Zonder aanhalingstekens is de boodschap één woord,
 * en leest git de rest als namen van bestanden: `git commit -m eerste
 * versie` zoekt een bestand `versie`.
 */
function parseCommit(woorden: string[]): CommitArgs {
  const uit: CommitArgs = {
    boodschap: [],
    alles: false,
    amend: false,
    zonderBewerken: false,
    stil: false,
    paden: [],
    fout: null,
  };
  const onbekend = (optie: string) =>
    COMMIT_OPTIES_VAN_GIT.includes(optie.split('=')[0])
      ? `hint: git kent ${optie.split('=')[0]} bij git commit wel, maar deze simulator niet. ${COMMIT_UITLEG}`
      : [
          optie.startsWith('--')
            ? `error: unknown option \`${optie.slice(2).split('=')[0]}'`
            : `error: unknown switch \`${optie.slice(1)}'`,
          `hint: ${COMMIT_UITLEG}`,
        ].join('\n');
  let naDubbel = false;
  for (let i = 0; i < woorden.length && !uit.fout; i++) {
    const w = woorden[i];
    if (naDubbel || !w.startsWith('-') || w === '-') uit.paden.push(w);
    else if (w === '--') naDubbel = true;
    else if (w === '--all') uit.alles = true;
    else if (w === '--amend') uit.amend = true;
    else if (w === '--no-edit') uit.zonderBewerken = true;
    else if (w === '--quiet') uit.stil = true;
    else if (w.startsWith('--message=')) uit.boodschap.push(w.slice('--message='.length));
    else if (w === '--message') {
      if (i + 1 < woorden.length) uit.boodschap.push(woorden[++i]);
      else uit.fout = "error: option `message' requires a value";
    } else if (w.startsWith('--')) uit.fout = onbekend(w);
    else {
      // Losse letters achter één streepje: `-a`, `-am`, `-qam "…"`. Na de m
      // is de rest de boodschap, of anders het volgende woord.
      for (let j = 1; j < w.length; j++) {
        const l = w[j];
        if (l === 'a') uit.alles = true;
        else if (l === 'q') uit.stil = true;
        else if (l === 'm') {
          if (j + 1 < w.length) uit.boodschap.push(w.slice(j + 1));
          else if (i + 1 < woorden.length) uit.boodschap.push(woorden[++i]);
          else
            uit.fout = [
              "error: switch `m' requires a value",
              'hint: geef je commit een boodschap mee: git commit -m "wat je veranderd hebt"',
            ].join('\n');
          break;
        } else {
          uit.fout = onbekend(`-${l}`);
          break;
        }
      }
    }
  }
  return uit;
}

/** -a: wat git al volgt en veranderd of weg is, gaat eerst naar staging. */
function indexMetAlles(state: RepoState): Record<string, string> {
  const idx = indexVan(state);
  for (const naam of Object.keys(idx)) {
    if (naam in state.workingDir) idx[naam] = state.workingDir[naam];
    else delete idx[naam];
  }
  return idx;
}

function gitCommit(state: RepoState, woorden: string[]): CommandResult {
  if (!state.initialized) return nietGelukt(state, NIET_IN_REPO_HINT);
  const args = parseCommit(woorden);
  if (args.fout) return nietGelukt(state, args.fout);

  const vorige = state.commits.find((c) => c.id === state.head) ?? null;
  if (args.amend && !vorige) return nietGelukt(state, 'fatal: You have nothing to amend.');
  if (args.paden.length && args.alles)
    return nietGelukt(state, `fatal: paths '${args.paden[0]} ...' with -a does not make sense`);

  const head = committedTree(state);
  const idx = indexVan(state);
  const wd = state.workingDir;

  // Wat de commit wordt. Met namen erachter (`git commit -m "…" hello.txt`)
  // alleen die bestanden, zoals ze nu in de werkmap staan; wat verder
  // klaarstaat, blijft klaarstaan.
  let nieuweBoom: Record<string, string>;
  let indexNa: Record<string, string>;
  if (args.paden.length) {
    const gevolgdeNamen = Object.keys({ ...head, ...idx }).sort();
    const doelen: string[] = [];
    for (const spec of args.paden) {
      const getroffen = treft(spec, gevolgdeNamen);
      if (!getroffen.length) {
        const extra = spatieHint(args.paden, state, 'git add');
        const hint = extra
          ? extra
          : spec in wd
            ? `hint: git volgt ${spec} nog niet: zet het eerst klaar met git add ${spec}`
            : 'hint: hoort dit bij je boodschap? Zet de boodschap tussen aanhalingstekens: git commit -m "wat je veranderd hebt"';
        return nietGelukt(
          state,
          [`error: pathspec '${spec}' did not match any file(s) known to git`, hint].join('\n'),
        );
      }
      doelen.push(...getroffen);
    }
    const metPaden = (basis: Record<string, string>) => {
      const uit = { ...basis };
      for (const n of doelen) {
        if (n in wd) uit[n] = wd[n];
        else delete uit[n];
      }
      return uit;
    };
    nieuweBoom = metPaden(head);
    indexNa = metPaden(idx);
  } else {
    nieuweBoom = args.alles ? indexMetAlles(state) : idx;
    indexNa = nieuweBoom;
  }

  const ouder = args.amend ? (vorige?.parent ?? null) : state.head;
  const ouderBoom = boomVan(state, ouder);
  const gelijk = (a: Record<string, string>, b: Record<string, string>) =>
    Object.keys(a).length === Object.keys(b).length && Object.keys(a).every((n) => a[n] === b[n]);

  // Niets te committen: git toont dan zijn status, met de staging zoals die
  // voor deze commit gold, en maakt niets. Dat gaat vóór de boodschap: ook
  // `git commit` zonder -m en `git commit -m ""` tonen eerst dit.
  if (gelijk(nieuweBoom, ouderBoom)) {
    const zoals = metIndex(state, nieuweBoom);
    if (args.amend) {
      return nietGelukt(
        state,
        [
          'You asked to amend the most recent commit, but doing so would make',
          'it empty. You can repeat your command with --allow-empty, or you can',
          'remove the commit entirely with "git reset HEAD^".',
          statusOutput(zoals, { commit: true, amend: true }),
        ].join('\n'),
      );
    }
    return nietGelukt(state, statusOutput(zoals, { commit: true }));
  }

  let boodschap: string;
  if (args.boodschap.length) boodschap = schoon(args.boodschap.join('\n\n'));
  else if (args.amend && args.zonderBewerken && vorige) boodschap = vorige.message;
  else {
    // Zonder -m opent git een editor voor de boodschap. De simulator
    // heeft er geen.
    return nietGelukt(
      state,
      [
        'hint: zonder -m opent git een editor voor de boodschap; deze simulator heeft er geen.',
        'hint: geef de boodschap mee: git commit -m "wat je veranderd hebt"',
      ].join('\n'),
    );
  }
  if (!boodschap.trim()) return nietGelukt(state, 'Aborting commit due to empty commit message.');

  const commit: Commit = {
    id: nieuweId(),
    message: boodschap,
    // --amend houdt de datum van de commit die hij vervangt.
    tijd: args.amend && vorige ? (vorige.tijd ?? Date.now()) : Date.now(),
    parent: ouder,
    tree: nieuweBoom,
  };
  // --amend vervangt de laatste commit: de oude hoort niet meer bij de
  // geschiedenis van main.
  const commits = [...state.commits.filter((c) => !(args.amend && c.id === state.head)), commit];
  const newState: RepoState = {
    ...state,
    commits,
    head: commit.id,
    staged: verschilMet(indexNa, nieuweBoom),
  };
  // Git zet er bij de allereerste commit '(root-commit)' bij: die heeft als
  // enige geen ouder. Bij --amend niet, ook niet als hij de eerste vervangt.
  const kop = `[main ${!args.amend && ouder === null ? '(root-commit) ' : ''}${commit.id.slice(0, 7)}] ${boodschap.split('\n')[0]}`;
  const output = args.stil
    ? ''
    : [
        kop,
        ...(args.amend ? [` Date: ${gitDatum(commit.tijd ?? Date.now())}`] : []),
        ...samenvatting(ouderBoom, nieuweBoom),
      ].join('\n');
  return { newState, output, ok: true };
}

/**
 * De boodschap zoals git hem bewaart: zonder spaties aan het eind van een
 * regel en zonder lege regels voor- of achteraan.
 */
function schoon(boodschap: string): string {
  return boodschap
    .split('\n')
    .map((r) => r.trimEnd())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/^\n+|\n+$/g, '');
}

const AMBIGU = (w: string) =>
  [
    `fatal: ambiguous argument '${w}': unknown revision or path not in the working tree.`,
    "Use '--' to separate paths from revisions, like this:",
    "'git <command> [<revision>...] -- [<file>...]'",
  ].join('\n');

/**
 * Een revisie zoals git hem leest: `HEAD`, `main`, `@`, het begin van een
 * hash (minstens vier tekens), met `~2` of `^` erachter voor een ouder.
 */
function revisie(state: RepoState, w: string): string | null {
  const m = w.match(/^(HEAD|main|@|[0-9a-f]{4,40})((?:~\d*|\^\d*)*)$/);
  if (!m) return null;
  let id: string | null;
  if (/^[0-9a-f]+$/.test(m[1]) && m[1] !== 'main') {
    const passend = state.commits.filter((c) => c.id.startsWith(m[1]));
    id = passend.length === 1 ? passend[0].id : null;
  } else id = state.head;
  for (const stap of m[2].match(/[~^]\d*/g) ?? []) {
    const n = stap.length > 1 ? Number(stap.slice(1)) : 1;
    if (stap[0] === '^' && n > 1) return null;
    // `^` is de eerste ouder, `^0` de commit zelf; een tweede ouder is er niet.
    const keer = stap[0] === '^' ? Math.min(n, 1) : n;
    for (let i = 0; i < keer && id; i++)
      id = state.commits.find((c) => c.id === id)?.parent ?? null;
    if (!id) return null;
  }
  return id;
}

/** Hoeveel commits er onder deze liggen, deze meegeteld. */
function diepte(state: RepoState, id: string | null): number {
  let n = 0;
  for (let c = id; c; c = state.commits.find((x) => x.id === c)?.parent ?? null) n++;
  return n;
}

/** Een getal zoals git het leest met atoi: de cijfers vooraan, anders nul. */
function atoi(w: string): number {
  const m = w.match(/^\d+/);
  return m ? Number(m[0]) : 0;
}

function gitLog(state: RepoState, woorden: string[]): CommandResult {
  if (!state.initialized) return nietGelukt(state, NIET_IN_REPO_HINT);
  let kort = false;
  let versiering = true;
  let hoeveel = Number.POSITIVE_INFINITY;
  let start: string | null = null;
  const paden: string[] = [];
  let naDubbel = false;
  const geenOptieMeer = (w: string) =>
    nietGelukt(state, `fatal: option '${w}' must come before non-option arguments`);

  for (let i = 0; i < woorden.length; i++) {
    const w = woorden[i];
    if (naDubbel) {
      paden.push(w);
      continue;
    }
    if (w === '--') {
      naDubbel = true;
      continue;
    }
    // Na een bestandsnaam geen opties meer; na een revisie mag het wel.
    if (w.startsWith('-') && paden.length) return geenOptieMeer(w);
    if (w === '--oneline') kort = true;
    else if (w === '--no-decorate') versiering = false;
    else if (w === '--decorate' || w === '-q' || w === '--quiet') {
      // Doet niets dat je hier ziet: de versiering staat al aan, en -q
      // zwijgt alleen over een diff.
    } else if (/^-\d+$/.test(w)) hoeveel = Number(w.slice(1));
    else if (/^-\d+/.test(w))
      return nietGelukt(state, `fatal: '${w.slice(1)}': not a non-negative integer`);
    else if (w.startsWith('-n') && w.length > 2) hoeveel = atoi(w.slice(2));
    else if (w === '-n') {
      if (i + 1 >= woorden.length) return nietGelukt(state, 'error: -n requires an argument');
      hoeveel = atoi(woorden[++i]);
    } else if (w.startsWith('--max-count=')) hoeveel = atoi(w.slice('--max-count='.length));
    else if (w === '--max-count') {
      if (i + 1 >= woorden.length)
        return nietGelukt(state, "fatal: Option '--max-count' requires a value");
      hoeveel = atoi(woorden[++i]);
    } else if (w.startsWith('-')) {
      // Een optie van git die de simulator niet nadoet: git zou hem
      // gewoon uitvoeren, dus geen fatal. Iets wat git niet kent: wel.
      const naam = w.split('=')[0];
      return nietGelukt(
        state,
        LOG_OPTIES_VAN_GIT.includes(naam)
          ? `hint: git kent ${naam} wel, maar deze simulator alleen git log, --oneline en -n.`
          : `fatal: unrecognized argument: ${w}`,
      );
    } else {
      // Eerst een revisie (`main`, `HEAD~1`, een hash), anders een bestand.
      const id = paden.length ? null : revisie(state, w);
      // Twee revisies op één lijn: git toont de geschiedenis van allebei,
      // en dat is die van de nieuwste.
      if (id) start = start === null || diepte(state, id) > diepte(state, start) ? id : start;
      // Een bestand zonder `--` ervoor moet in de werkmap staan.
      else if (w in state.workingDir) paden.push(w);
      else if (paden.length && revisie(state, w))
        return nietGelukt(
          state,
          [
            `fatal: ${w}: no such path in the working tree.`,
            "Use 'git <command> -- <path>...' to specify paths that do not exist locally.",
          ].join('\n'),
        );
      else return nietGelukt(state, AMBIGU(w));
    }
  }

  if (state.commits.length === 0) {
    return nietGelukt(
      state,
      [
        "fatal: your current branch 'main' does not have any commits yet",
        'hint: er valt nog niets te tonen — maak eerst een commit met \'git commit -m "..."\'',
      ].join('\n'),
    );
  }

  const lijst: Commit[] = [];
  let id: string | null = start ?? state.head;
  while (id && lijst.length < hoeveel) {
    const c = state.commits.find((x) => x.id === id);
    if (!c) break;
    const ouder = boomVan(state, c.parent);
    // Met een bestandsnaam: alleen de commits die dat bestand veranderden.
    if (!paden.length || paden.some((p) => c.tree[p] !== ouder[p])) lijst.push(c);
    id = c.parent;
  }

  // Git zet achter de commit waar HEAD staat waar hij staat. De auteur is
  // die van de simulator; op je eigen computer staat daar wat je met git
  // config hebt ingesteld.
  const versierd = (c: Commit) => (versiering && c.id === state.head ? ' (HEAD -> main)' : '');
  const output = kort
    ? lijst.map((c) => `${c.id.slice(0, 7)}${versierd(c)} ${c.message.split('\n')[0]}`).join('\n')
    : lijst
        .map((c) =>
          [
            `commit ${c.id}${versierd(c)}`,
            `Author: ${AUTEUR}`,
            `Date:   ${gitDatum(c.tijd ?? Date.now())}`,
            '',
            ...c.message.split('\n').map((r) => `    ${r}`),
          ].join('\n'),
        )
        .join('\n\n');
  return { newState: state, output, ok: true };
}

function gitStatus(state: RepoState, woorden: string[]): CommandResult {
  if (!state.initialized) return nietGelukt(state, NIET_IN_REPO_HINT);
  const { vlaggen, namen, fout } = leesOpties(
    woorden,
    'status',
    { '-s': 'kort', '--short': 'kort' },
    [
      '-b',
      '--branch',
      '--porcelain',
      '--long',
      '-v',
      '--verbose',
      '-u',
      '--untracked-files',
      '--ignored',
      '--show-stash',
      '-z',
      '--column',
      '--no-column',
      '--ahead-behind',
      '--renames',
      '--no-renames',
    ],
    'Deze simulator kent git status en git status -s.',
  );
  if (fout) return nietGelukt(state, fout);
  const alleNamen = Object.keys({
    ...committedTree(state),
    ...indexVan(state),
    ...state.workingDir,
  });
  const getroffen = new Set(namen.flatMap((s) => treft(s, alleNamen)));
  const opties: StatusOpties = namen.length ? { alleen: (n) => getroffen.has(n) } : {};
  return {
    newState: state,
    output: vlaggen.has('kort') ? statusKort(state, opties) : statusOutput(state, opties),
    ok: true,
  };
}

/**
 * Wat er na `git` komt: eerst de opties van git zelf (`--version`,
 * `--no-pager`), dan het commando.
 */
function gitCommando(state: RepoState, woorden: string[]): CommandResult {
  let i = 1;
  while (i < woorden.length && woorden[i].startsWith('-')) {
    const w = woorden[i];
    if (w === '--version' || w === '-v')
      return { newState: state, output: `git version ${GIT_VERSIE}`, ok: true };
    if (w === '--no-pager' || w === '-P' || w === '-p' || w === '--paginate') {
      i++;
      continue;
    }
    if (w === '--help' || w === '-h')
      return nietGelukt(
        state,
        `hint: git toont hier zijn handleiding; deze simulator niet. Hij kent ${KENT}.`,
      );
    if (['-C', '-c', '--git-dir', '--work-tree', '--bare', '--exec-path'].includes(w.split('=')[0]))
      return nietGelukt(state, `hint: git kent ${w.split('=')[0]} wel, maar deze simulator niet.`);
    return nietGelukt(
      state,
      [
        `unknown option: ${w}`,
        'usage: git [-v | --version] [-h | --help] [-C <path>] [-c <name>=<value>]',
        `hint: deze simulator kent ${KENT}`,
      ].join('\n'),
    );
  }

  const sub = woorden[i];
  const args = woorden.slice(i + 1);
  if (sub === undefined) {
    return nietGelukt(
      state,
      [
        'usage: git [-v | --version] [-h | --help] [-C <path>] [-c <name>=<value>]',
        `hint: typ een commando na git, bijvoorbeeld git status. Deze simulator kent ${KENT}.`,
      ].join('\n'),
    );
  }

  switch (sub) {
    case 'init':
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
    case 'status':
      return gitStatus(state, args);
    case 'add':
      return gitAdd(state, args);
    case 'rm':
      return gitRm(state, args);
    case 'restore':
      return gitRestore(state, args);
    case 'commit':
      return gitCommit(state, args);
    case 'log':
      return gitLog(state, args);
    case 'version':
      return { newState: state, output: `git version ${GIT_VERSIE}`, ok: true };
    default:
      // Een commando dat git wel kent, maar de simulator niet: geen "is not
      // a git command", want dat is niet waar.
      if (COMMANDOS_VAN_GIT.includes(sub)) {
        return nietGelukt(
          state,
          [
            `hint: git kent '${sub}' wel, maar deze simulator niet. Op je eigen computer werkt het.`,
            `hint: deze simulator kent ${KENT}. Zit je vast? Klik op herstart oefening.`,
          ].join('\n'),
        );
      }
      return nietGelukt(
        state,
        `git: '${sub}' is not a git command. See 'git --help'.\nhint: deze simulator kent ${KENT}`,
      );
  }
}

/** Eén commando, zonder `&&` of `;`. */
function _runCommand(state: RepoState, input: string): CommandResult {
  const trimmed = input.trim();
  if (!trimmed) return { newState: state, output: '', ok: true };
  const { woorden, open } = woordenVan(trimmed);
  if (open) {
    return nietGelukt(
      state,
      `hint: een aanhalingsteken (${open}) staat open. Een terminal wacht dan op de rest; zet er een ${open} achter.`,
    );
  }
  if (woorden[0] !== 'git') {
    return nietGelukt(
      state,
      `${woorden[0] ?? trimmed}: command not found\nhint: in deze simulator werken alleen commando's die met 'git' beginnen`,
    );
  }
  return gitCommando(state, woorden);
}

type Deel = { commando: string; na: '&&' | '||' | ';' | null };

/**
 * Een regel met `&&`, `||` of `;` in losse commando's, zoals een shell:
 * `git add . && git commit -m "x"`. Tussen aanhalingstekens telt het niet.
 * Null als er iets in staat dat de simulator niet doet (`|`, `>`, `&`).
 */
function ketens(regel: string): Deel[] | string {
  const delen: Deel[] = [];
  let huidig = '';
  let quote: string | null = null;
  let vorige: Deel['na'] = null;
  for (let i = 0; i < regel.length; i++) {
    const ch = regel[i];
    if (quote) {
      if (ch === quote) quote = null;
      else if (ch === '\\' && quote === '"') {
        huidig += ch + (regel[++i] ?? '');
        continue;
      }
      huidig += ch;
      continue;
    }
    if (ch === '\\') {
      huidig += ch + (regel[++i] ?? '');
      continue;
    }
    if (ch === '"' || ch === "'") quote = ch;
    const twee = regel.slice(i, i + 2);
    if (twee === '&&' || twee === '||' || ch === ';') {
      delen.push({ commando: huidig, na: vorige });
      vorige = ch === ';' ? ';' : (twee as '&&' | '||');
      huidig = '';
      if (ch !== ';') i++;
      continue;
    }
    if (ch === '|' || ch === '>' || ch === '<' || ch === '&') return ch;
    huidig += ch;
  }
  delen.push({ commando: huidig, na: vorige });
  return delen;
}

/**
 * Een regel uit de terminal. `.gitignore` kan veranderen (`git restore
 * .gitignore`): de negeerlijst volgt dan mee.
 */
export function runCommand(state: RepoState, input: string): CommandResult {
  const delen = ketens(input);
  if (typeof delen === 'string') {
    return {
      ...nietGelukt(
        state,
        `hint: deze simulator doet geen ${delen}: typ één git-commando, of twee met && ertussen.`,
      ),
      newState: { ...state, commands: [...state.commands, input.trim().replace(/\s+/g, ' ')] },
    };
  }
  let st = state;
  const uitvoer: string[] = [];
  let ok = true;
  for (const { commando, na } of delen) {
    if ((na === '&&' && !ok) || (na === '||' && ok)) continue;
    const trimmed = commando.trim();
    if (!trimmed) {
      if (delen.length > 1) {
        ok = false;
        uitvoer.push('hint: tussen && of ; hoort een commando.');
      }
      continue;
    }
    const gitignoreVoor = st.workingDir['.gitignore'];
    const r = _runCommand(st, trimmed);
    // Twee spaties achter elkaar tellen als één, zoals in een shell: `git  status`
    // werd uitgevoerd, maar het doel "voer git status uit" zag hem niet.
    const netjes = trimmed.replace(/\s+/g, ' ');
    st = {
      ...r.newState,
      commands: [...st.commands, netjes],
      gelukt: r.ok ? [...(st.gelukt ?? []), netjes] : (st.gelukt ?? []),
    };
    st = volgGitignore(st, gitignoreVoor);
    if (r.output) uitvoer.push(r.output);
    ok = r.ok;
  }
  return { newState: st, output: uitvoer.join('\n'), ok };
}

/**
 * Wat er mis is met de naam van een nieuw bestand in de simulator, of null.
 * Opslaan zonder naam deed eerst niets en zei niets, en `gitignore` zonder
 * punt gaf geen enkele aanwijzing. Een spatie mag (je typt de naam dan
 * tussen aanhalingstekens); tekens die in een terminal iets anders betekenen,
 * niet.
 */
export function bestandsnaamFout(naam: string, bestaand: Record<string, string>): string | null {
  if (!naam) return 'Geef het bestand een naam, bijvoorbeeld hello.txt.';
  if (naam.includes('/')) return 'Een naam zonder /: de simulator heeft geen mappen.';
  if (naam === 'gitignore') return 'Bedoel je .gitignore? Die naam begint met een punt.';
  if (naam === '.' || naam === '..') return 'Die naam heeft de map zelf al. Kies een andere.';
  if (naam.startsWith('-'))
    return 'Een naam die met - begint, leest git als een optie. Kies een andere.';
  if (/["'\\$`*?[\]|&;<>]/.test(naam))
    return 'Gebruik in de naam alleen letters, cijfers, punten, streepjes en spaties: andere tekens betekenen in een terminal iets anders.';
  if (naam !== naam.trim()) return 'Een naam begint en eindigt niet met een spatie.';
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
  '--reverse',
  '--author',
  '--since',
  '--until',
  '--pretty',
  '--format',
  '--name-only',
  '--name-status',
  '--abbrev-commit',
  '--follow',
  '--grep',
];

/**
 * Commando's die git na 2.43 kreeg, met de versie waarin ze kwamen. Een
 * leerling met een nieuwere git thuis kan ze typen, en CI kan een nieuwere
 * git hebben dan 2.43: dan noemt `git help -a` ze ook.
 */
export const NIEUWER_DAN_243: Record<string, [number, number]> = {
  replay: [2, 44],
  refs: [2, 46],
  backfill: [2, 49],
  'diff-pairs': [2, 50],
  repo: [2, 52],
  'last-modified': [2, 52],
};

/**
 * Commando's die git 2.43 kent en de simulator niet: alles wat `git help -a`
 * onder de commando's noemt, plus `stage` (een andere naam voor add, die
 * `git help -a` niet noemt). echte-git.test.ts legt de lijst in beide
 * richtingen naast `git help -a`: een commando dat git kent, mag hier nooit
 * "is not a git command" krijgen.
 */
export const COMMANDOS_VAN_GIT = [
  'am',
  'archive',
  'bisect',
  'branch',
  'bundle',
  'checkout',
  'cherry-pick',
  'citool',
  'clean',
  'clone',
  'describe',
  'diff',
  'fetch',
  'format-patch',
  'gc',
  'gitk',
  'grep',
  'gui',
  'maintenance',
  'merge',
  'mv',
  'notes',
  'pull',
  'push',
  'range-diff',
  'rebase',
  'reset',
  'revert',
  'scalar',
  'shortlog',
  'show',
  'sparse-checkout',
  'stash',
  'submodule',
  'switch',
  'tag',
  'worktree',
  'config',
  'fast-export',
  'fast-import',
  'filter-branch',
  'mergetool',
  'pack-refs',
  'prune',
  'reflog',
  'remote',
  'repack',
  'replace',
  'annotate',
  'blame',
  'bugreport',
  'count-objects',
  'diagnose',
  'difftool',
  'fsck',
  'gitweb',
  'help',
  'instaweb',
  'merge-tree',
  'rerere',
  'show-branch',
  'verify-commit',
  'verify-tag',
  'whatchanged',
  'archimport',
  'cvsexportcommit',
  'cvsimport',
  'cvsserver',
  'imap-send',
  'p4',
  'quiltimport',
  'request-pull',
  'send-email',
  'svn',
  'apply',
  'checkout-index',
  'commit-graph',
  'commit-tree',
  'hash-object',
  'index-pack',
  'merge-file',
  'merge-index',
  'mktag',
  'mktree',
  'multi-pack-index',
  'pack-objects',
  'prune-packed',
  'read-tree',
  'symbolic-ref',
  'unpack-objects',
  'update-index',
  'update-ref',
  'write-tree',
  'cat-file',
  'cherry',
  'diff-files',
  'diff-index',
  'diff-tree',
  'for-each-ref',
  'for-each-repo',
  'get-tar-commit-id',
  'ls-files',
  'ls-remote',
  'ls-tree',
  'merge-base',
  'name-rev',
  'pack-redundant',
  'rev-list',
  'rev-parse',
  'show-index',
  'show-ref',
  'unpack-file',
  'var',
  'verify-pack',
  'daemon',
  'fetch-pack',
  'http-backend',
  'send-pack',
  'update-server-info',
  'check-attr',
  'check-ignore',
  'check-mailmap',
  'check-ref-format',
  'column',
  'credential',
  'credential-cache',
  'credential-store',
  'fmt-merge-msg',
  'hook',
  'interpret-trailers',
  'mailinfo',
  'mailsplit',
  'merge-one-file',
  'patch-id',
  'sh-i18n',
  'sh-setup',
  'stripspace',
  'stage',
  ...Object.keys(NIEUWER_DAN_243),
];

/** De commando's die de simulator zelf nadoet. */
export const COMMANDOS_VAN_SIMULATOR = [
  'add',
  'commit',
  'init',
  'log',
  'restore',
  'rm',
  'status',
  'version',
];

export function setFile(state: RepoState, name: string, content: string): RepoState {
  return { ...state, workingDir: { ...state.workingDir, [name]: content } };
}

/**
 * De negeerlijst is een afgeleide van .gitignore: verandert dat bestand
 * (opgeslagen, weggegooid, teruggezet met git restore), dan verandert hij
 * mee. Eerst bleef hij staan als je .gitignore weggooide, en stond het doel
 * van stap 7 op groen met een .gitignore die er niet meer was.
 */
function volgGitignore(state: RepoState, vorige: string | undefined): RepoState {
  const nu = state.workingDir['.gitignore'];
  if (nu === vorige) return state;
  return { ...state, ignored: nu === undefined ? [] : regelsVanGitignore(nu) };
}

/**
 * Een bestand opslaan zoals de leerling dat in de simulator doet. Lege
 * regels en regels met # ervoor in .gitignore slaat git ook over.
 */
export function schrijfBestand(state: RepoState, name: string, content: string): RepoState {
  const next = setFile(state, name, content);
  if (name !== '.gitignore') return next;
  return { ...next, ignored: regelsVanGitignore(content) };
}

/**
 * Een bestand weggooien, met de knop x in de simulator. Git ziet het dan als
 * verwijderd (`deleted:` in git status) zolang het gevolgd wordt.
 */
export function deleteFile(state: RepoState, name: string): RepoState {
  const wd = { ...state.workingDir };
  delete wd[name];
  const next = { ...state, workingDir: wd };
  return name === '.gitignore' ? { ...next, ignored: [] } : next;
}

export function addToIgnore(state: RepoState, name: string): RepoState {
  if (state.ignored.includes(name)) return state;
  return { ...state, ignored: [...state.ignored, name] };
}

import {
  type RepoState,
  deleteFile,
  genegeerd,
  gevolgd,
  inEenCommit,
  inGitignore,
  indexVan,
  runCommand,
  schrijfBestand,
} from './gitEngine';

// De oefeningen van de basis-tutorial staan hier en niet in de .mdx-pagina's.
// Reden: een doel dat je niet kunt halen is een stille bug — de leerling blijft
// proberen terwijl het vinkje nooit groen wordt. Vanuit een los bestand kan
// scenarios.test.ts elk doel daadwerkelijk naspelen; vanuit een JSX-prop in
// markdown kan dat niet.
//
// `oplossing` is de reeks commando's waarmee het doel te halen is. Dat is
// tegelijk de documentatie van wat de pagina verwacht én de invoer van de test.
// Heeft een scenario stappen nodig die je niet typt maar klikt (een bestand
// aanmaken), dan staan die in `handelingen`.

export type Handeling =
  | { soort: 'schrijf'; naam: string; inhoud: string }
  | { soort: 'verwijder'; naam: string };

export type Scenario = {
  id: string;
  initialFiles: Record<string, string>;
  /**
   * Wat er al gebeurd is als de leerling deze stap opent — het eindpunt van de
   * vorige stap. Zonder dit begint elke oefening weer bij `git init`, en typ je
   * in stap 7 zes regels aanloop voordat je aan de les toekomt. De simulator
   * voert deze commando's uit vóór het eerste scherm en toont ze in de
   * terminal, zodat je ziet waar je binnenkomt. Een stap begint waar de
   * vorige ophield: de voorbereiding is die van de vorige stap plus zijn
   * oplossing (scenarios.test.ts). Stap 6 en 7 begonnen eerst met één commit,
   * terwijl de leerling er in stap 5 net een tweede had gemaakt.
   */
  voorbereiding: (string | Handeling)[];
  objective: {
    description: string;
    check: (state: RepoState) => boolean;
    /**
     * Zegt het als het doel niet meer te halen is, met de echte reden, en
     * wat de leerling dan doet. Alleen als het echt niet meer kan: in stap 7
     * stond hier "begin opnieuw" terwijl `git restore --staged geheim.txt`
     * het nog oploste.
     */
    vast?: (state: RepoState) => string | null;
    /**
     * Zegt wat er nog in de weg staat als het doel wel te halen is, maar niet
     * meer met wat de beschrijving zegt. Staat in plaats van de beschrijving.
     */
    tip?: (state: RepoState) => string | null;
  };
  /** Wat de leerling zelf nog doet om het doel te halen, na de voorbereiding. */
  oplossing: (string | Handeling)[];
};

/** Eén stap van een voorbereiding of een oplossing: een commando, of iets met een bestand. */
export function doeStap(
  state: RepoState,
  stap: string | Handeling,
): { state: RepoState; output: string; ok: boolean } {
  if (typeof stap === 'string') {
    const r = runCommand(state, stap);
    return { state: r.newState, output: r.output, ok: r.ok };
  }
  if (stap.soort === 'verwijder')
    return { state: deleteFile(state, stap.naam), output: '', ok: true };
  return { state: schrijfBestand(state, stap.naam, stap.inhoud), output: '', ok: true };
}

const HELLO = { 'hello.txt': 'Hallo wereld.\n' };

/** Waar de leerling na stap 5 staat: twee commits. */
const NA_STAP_5: (string | Handeling)[] = [
  'git init',
  'git add .',
  'git commit -m "eerste versie"',
  { soort: 'schrijf', naam: 'hello.txt', inhoud: 'Hallo wereld.\nEn nog een regel.\n' },
  'git add .',
  'git commit -m "regel toegevoegd"',
];

export const SCENARIOS: Record<string, Scenario> = {
  'stap-1-init': {
    id: 'stap-1-init',
    initialFiles: HELLO,
    // De enige stap die bij nul begint: dit ís de les.
    voorbereiding: [],
    objective: {
      description: 'Voer git init uit op deze map.',
      check: (s) => s.initialized,
    },
    oplossing: ['git init'],
  },

  'stap-2-status': {
    id: 'stap-2-status',
    initialFiles: HELLO,
    voorbereiding: ['git init'],
    objective: {
      description: 'Voer git status uit. Je zou hello.txt als untracked moeten zien.',
      // Ook `git status -s`: elk status-commando dat lukte.
      check: (s) => s.initialized && s.gelukt.some((c) => /^git status(\s|$)/.test(c)),
    },
    oplossing: ['git status'],
  },

  'stap-3-add': {
    id: 'stap-3-add',
    initialFiles: HELLO,
    voorbereiding: ['git init'],
    objective: {
      description: 'Zet hello.txt klaar in staging.',
      check: (s) => s.initialized && s.staged !== null && 'hello.txt' in s.staged,
    },
    oplossing: ['git add hello.txt'],
  },

  'stap-4-commit': {
    id: 'stap-4-commit',
    initialFiles: HELLO,
    voorbereiding: ['git init', 'git add hello.txt'],
    objective: {
      description: 'Maak je eerste commit, met een boodschap als "eerste versie".',
      check: (s) => s.commits.length >= 1,
    },
    oplossing: ['git commit -m "eerste versie"'],
  },

  'stap-5-tweede-commit': {
    id: 'stap-5-tweede-commit',
    initialFiles: HELLO,
    voorbereiding: ['git init', 'git add .', 'git commit -m "eerste versie"'],
    objective: {
      description: 'Er staat er al een. Verander iets en maak een tweede commit.',
      check: (s) => s.commits.length >= 2,
    },
    oplossing: [
      { soort: 'schrijf', naam: 'hello.txt', inhoud: 'Hallo wereld.\nEn nog een regel.\n' },
      'git add .',
      'git commit -m "regel toegevoegd"',
    ],
  },

  'stap-6-log': {
    id: 'stap-6-log',
    initialFiles: HELLO,
    voorbereiding: NA_STAP_5,
    objective: {
      description: 'Bekijk de geschiedenis met git log.',
      // Elk log-commando dat het log toonde: ook `git log -1` en
      // `git log --oneline -n 2`, niet `git log --foo`. Eerst telden alleen
      // `git log` en `git log --oneline`.
      check: (s) =>
        s.commits.length >= 1 && s.gelukt.some((c) => /^git( -P| --no-pager)* log(\s|$)/.test(c)),
    },
    oplossing: ['git log'],
  },

  'stap-7-gitignore': {
    id: 'stap-7-gitignore',
    initialFiles: HELLO,
    voorbereiding: NA_STAP_5,
    objective: {
      description: 'Maak een .gitignore aan die geheim.txt negeert.',
      // Kijkt naar wat er nu is: geheim.txt staat in de werkmap, .gitignore
      // negeert het (een weggegooide .gitignore negeert niets meer), git volgt
      // het niet, en het wachtwoord staat in geen commit.
      check: (s) =>
        'geheim.txt' in s.workingDir && genegeerd(s, 'geheim.txt') && !inEenCommit(s, 'geheim.txt'),
      vast: (s) =>
        inEenCommit(s, 'geheim.txt') && !teRedden(s)
          ? 'geheim.txt staat al in een commit, en daar haalt .gitignore het niet meer uit: het wachtwoord blijft in de geschiedenis. Klik op herstart oefening en maak .gitignore voordat je git add doet.'
          : null,
      tip: (s) => {
        if (!inGitignore(s, 'geheim.txt'))
          return spatieVoorGeheim(s)
            ? 'In je .gitignore staat een spatie voor geheim.txt. Git leest die spatie als deel van de naam: haal hem weg.'
            : null;
        if (inEenCommit(s, 'geheim.txt')) {
          if (!teRedden(s)) return null;
          // Na git rm --cached staat het niet meer in de index: nog een keer
          // gaf `fatal: pathspec 'geheim.txt' did not match any files`.
          return gevolgd(s, 'geheim.txt')
            ? 'geheim.txt staat in je laatste commit. Haal het eruit met git rm --cached geheim.txt en vervang die commit met git commit --amend -m "…".'
            : 'git volgt geheim.txt niet meer, maar het staat nog in je laatste commit. Vervang die commit met git commit --amend -m "…".';
        }
        if (gevolgd(s, 'geheim.txt'))
          return 'git volgt geheim.txt nog: het staat in staging, en dan doet .gitignore niets. Haal het eruit met git restore --staged geheim.txt.';
        // Weggegooid met de knop x, of met git rm: dan valt er niets te
        // negeren, en bleef het doel open zonder dat iets zei waarom.
        return 'geheim.txt' in s.workingDir
          ? null
          : 'Je .gitignore negeert geheim.txt, maar geheim.txt staat niet in de werkmap. Maak het opnieuw met + nieuw bestand: dan zie je dat git het negeert.';
      },
    },
    oplossing: [
      { soort: 'schrijf', naam: 'geheim.txt', inhoud: 'wachtwoord123\n' },
      'git status',
      { soort: 'schrijf', naam: '.gitignore', inhoud: 'geheim.txt\n' },
      'git status',
    ],
  },
};

/**
 * Staat geheim.txt alleen in de laatste commit, en verandert die commit zonder
 * geheim.txt nog iets? Dan haalt `git rm --cached` met `git commit --amend`
 * het uit de geschiedenis. Anders zou --amend een lege commit maken, en die
 * weigert git (de simulator kent geen `git reset`).
 */
function teRedden(s: RepoState): boolean {
  const laatste = s.commits.find((c) => c.id === s.head);
  if (!laatste || s.commits.some((c) => c !== laatste && 'geheim.txt' in c.tree)) return false;
  const ouder = s.commits.find((c) => c.id === laatste.parent)?.tree ?? {};
  const zonder = Object.fromEntries(
    Object.entries(indexVan(s)).filter(([naam]) => naam !== 'geheim.txt'),
  );
  const namen = new Set([...Object.keys(zonder), ...Object.keys(ouder)]);
  return [...namen].some((n) => zonder[n] !== ouder[n]);
}

/**
 * Staat geheim.txt in .gitignore met een spatie of tab ervoor? Git leest die
 * als deel van de naam, en negeert geheim.txt dan niet.
 */
function spatieVoorGeheim(s: RepoState): boolean {
  return (s.workingDir['.gitignore'] ?? '')
    .split('\n')
    .some((r) => /^\s/.test(r) && r.trim() === 'geheim.txt');
}

export function scenario(id: string): Scenario {
  const gevonden = SCENARIOS[id];
  if (!gevonden) {
    throw new Error(
      `Onbekend simulator-scenario '${id}'. Bekend: ${Object.keys(SCENARIOS).join(', ')}`,
    );
  }
  return gevonden;
}

import {
  type RepoState,
  deleteFile,
  genegeerd,
  gevolgd,
  inGitignore,
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
     * Zegt het als het doel zo niet meer te halen is, en wat de leerling dan
     * doet. In stap 7 stond het doel op groen terwijl git `geheim.txt` gewoon
     * bleef volgen: wie eerst `git add .` typte, leerde zo het omgekeerde van
     * de les.
     */
    vast?: (state: RepoState) => string | null;
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
      check: (s) => s.initialized && s.commands.includes('git status'),
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
      check: (s) =>
        s.commits.length >= 1 && s.commands.some((c) => /^git log( --oneline)?$/.test(c)),
    },
    oplossing: ['git log'],
  },

  'stap-7-gitignore': {
    id: 'stap-7-gitignore',
    initialFiles: HELLO,
    voorbereiding: NA_STAP_5,
    objective: {
      description: 'Maak een .gitignore aan die geheim.txt negeert.',
      // Genegeerd is: in .gitignore, en nog niet door git gevolgd.
      check: (s) => genegeerd(s, 'geheim.txt'),
      vast: (s) =>
        inGitignore(s, 'geheim.txt') && gevolgd(s, 'geheim.txt')
          ? 'git volgt geheim.txt al, en dan doet .gitignore niets meer. Klik op herstart oefening en maak .gitignore vóórdat je git add doet.'
          : null,
    },
    oplossing: [
      { soort: 'schrijf', naam: 'geheim.txt', inhoud: 'wachtwoord123\n' },
      'git status',
      { soort: 'schrijf', naam: '.gitignore', inhoud: 'geheim.txt\n' },
      'git status',
    ],
  },
};

export function scenario(id: string): Scenario {
  const gevonden = SCENARIOS[id];
  if (!gevonden) {
    throw new Error(
      `Onbekend simulator-scenario '${id}'. Bekend: ${Object.keys(SCENARIOS).join(', ')}`,
    );
  }
  return gevonden;
}

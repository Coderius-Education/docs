import type { RepoState } from './gitEngine';

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
  objective: {
    description: string;
    check: (state: RepoState) => boolean;
  };
  /** Commando's en klikken die samen het doel halen, in volgorde. */
  oplossing: (string | Handeling)[];
};

const HELLO = { 'hello.txt': 'Hallo wereld.\n' };

export const SCENARIOS: Record<string, Scenario> = {
  'stap-1-init': {
    id: 'stap-1-init',
    initialFiles: HELLO,
    objective: {
      description: 'Voer git init uit op deze map.',
      check: (s) => s.initialized,
    },
    oplossing: ['git init'],
  },

  'stap-2-status': {
    id: 'stap-2-status',
    initialFiles: HELLO,
    objective: {
      description:
        'Voer eerst git init uit en daarna git status. Je zou hello.txt als niet-gevolgd moeten zien.',
      check: (s) => s.initialized && s.commands.some((c) => c.trim() === 'git status'),
    },
    oplossing: ['git init', 'git status'],
  },

  'stap-3-add': {
    id: 'stap-3-add',
    initialFiles: HELLO,
    objective: {
      description: 'Init, voeg hello.txt toe aan staging.',
      check: (s) => s.initialized && s.staged !== null && 'hello.txt' in s.staged,
    },
    oplossing: ['git init', 'git add hello.txt'],
  },

  'stap-4-commit': {
    id: 'stap-4-commit',
    initialFiles: HELLO,
    objective: {
      description: 'Maak je eerste commit met de boodschap "eerste versie".',
      check: (s) => s.commits.length >= 1,
    },
    oplossing: ['git init', 'git add hello.txt', 'git commit -m "eerste versie"'],
  },

  'stap-5-tweede-commit': {
    id: 'stap-5-tweede-commit',
    initialFiles: HELLO,
    objective: {
      description: 'Maak twee commits achter elkaar.',
      check: (s) => s.commits.length >= 2,
    },
    oplossing: [
      'git init',
      'git add .',
      'git commit -m "eerste versie"',
      { soort: 'schrijf', naam: 'hello.txt', inhoud: 'Hallo wereld.\nEn nog een regel.\n' },
      'git add .',
      'git commit -m "regel toegevoegd"',
    ],
  },

  'stap-6-log': {
    id: 'stap-6-log',
    initialFiles: HELLO,
    objective: {
      description: 'Maak een commit en bekijk daarna de geschiedenis met git log.',
      check: (s) => s.commits.length >= 1 && s.commands.some((c) => c.trim() === 'git log'),
    },
    oplossing: ['git init', 'git add .', 'git commit -m "eerste versie"', 'git log'],
  },

  'stap-7-gitignore': {
    id: 'stap-7-gitignore',
    initialFiles: HELLO,
    objective: {
      description: 'Maak een .gitignore aan die geheim.txt negeert.',
      check: (s) => s.ignored.includes('geheim.txt'),
    },
    oplossing: [
      'git init',
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

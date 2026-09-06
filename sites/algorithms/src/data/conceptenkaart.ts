// Data voor de conceptenkaart (/conceptenkaart): welke python-lessen zijn
// voorkennis voor welk algoritme. Dit spiegelt de <Voorkennis>-blokken in
// docs/**/*.mdx — src/data/voorkennis.test.ts bewaakt dat beide gelijk
// blijven (pnpm test).

export type PythonConcept = {
  /** Korte sleutel, gebruikt in voorkennisPerAlgoritme. */
  id: string;
  /** Canoniek Nederlands label. */
  label: string;
  /** Pad binnen de python-cursus, bv. '/docs/data/sets'. */
  to: string;
};

// Volgorde = lesvolgorde in de python-cursus; bepaalt de verticale volgorde
// van de linkerkolom op de kaart.
export const pythonConcepten: PythonConcept[] = [
  { id: 'f-strings', label: 'F-strings', to: '/docs/tekst/04a-f-strings' },
  { id: 'if-else', label: 'If en else', to: '/docs/beslissen/05b-if-else' },
  { id: 'and-or-elif', label: 'And, or en elif', to: '/docs/beslissen/05c-and-or-elif' },
  { id: 'for-loop', label: 'De for-loop', to: '/docs/herhalen/06a-for-loop' },
  { id: 'continue', label: 'Continue', to: '/docs/herhalen/06c-continue' },
  { id: 'break', label: 'Break', to: '/docs/herhalen/06d-break' },
  { id: 'while-loop', label: 'De while-loop', to: '/docs/herhalen/while-loop' },
  { id: 'functies', label: 'Functies en return-waarden', to: '/docs/functies/functies' },
  { id: 'parameters', label: 'Parameters', to: '/docs/functies/09a-parameters' },
  { id: 'return', label: 'Return-waarden', to: '/docs/functies/09b-return' },
  { id: 'lijsten', label: 'Lijsten', to: '/docs/data/10a-lijsten-basis' },
  { id: 'lijst-methoden', label: 'Lijst-methoden', to: '/docs/data/10b-lijst-methoden' },
  { id: 'dictionaries', label: 'Dictionaries', to: '/docs/data/11a-dictionaries-basis' },
  {
    id: 'itereren-dicts',
    label: 'Itereren over dictionaries',
    to: '/docs/data/11b-itereren-dictionaries',
  },
  { id: 'tuples', label: 'Tuples', to: '/docs/data/tuples' },
  { id: 'sets', label: 'Sets', to: '/docs/data/sets' },
];

// Gesleuteld op Algoritme.slug (zie ./algorithms); waarden zijn concept-id's.
export const voorkennisPerAlgoritme: Record<string, string[]> = {
  'lineair-zoeken': ['if-else', 'for-loop', 'functies', 'lijsten'],
  'vind-maximum': ['f-strings', 'if-else', 'for-loop', 'functies', 'lijsten'],
  'max-en-min': ['f-strings', 'if-else', 'and-or-elif', 'for-loop', 'return', 'lijsten', 'tuples'],
  'binair-zoeken': ['if-else', 'and-or-elif', 'while-loop', 'break', 'functies', 'lijsten', 'tuples'],
  'selection-sort': ['if-else', 'for-loop', 'functies', 'lijsten', 'tuples'],
  'bubble-sort': ['f-strings', 'if-else', 'for-loop', 'functies', 'lijsten', 'tuples'],
  'big-o': [
    'if-else',
    'and-or-elif',
    'for-loop',
    'while-loop',
    'functies',
    'lijst-methoden',
    'tuples',
  ],
  dijkstra: [
    'f-strings',
    'if-else',
    'for-loop',
    'continue',
    'while-loop',
    'functies',
    'lijsten',
    'dictionaries',
    'itereren-dicts',
    'tuples',
    'sets',
  ],
  minimax: [
    'f-strings',
    'if-else',
    'for-loop',
    'while-loop',
    'functies',
    'parameters',
    'return',
    'lijsten',
    'tuples',
    'sets',
  ],
  knapsack: ['f-strings', 'if-else', 'for-loop', 'functies', 'lijsten', 'tuples'],
  cfg: ['if-else', 'for-loop', 'functies', 'lijsten', 'lijst-methoden', 'tuples'],
  hanoi: ['if-else', 'functies', 'lijst-methoden', 'tuples'],
  pagerank: [
    'if-else',
    'for-loop',
    'while-loop',
    'functies',
    'dictionaries',
    'itereren-dicts',
    'sets',
  ],
};

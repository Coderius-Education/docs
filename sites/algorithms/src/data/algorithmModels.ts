import {
  traceBinarySearch,
  traceBubbleSort,
  traceLinearSearch,
  traceMaximum,
  traceMinAndMax,
  traceSelectionSort,
  type TraceStep,
} from '../lib/algorithmTraces';

export type AlgorithmModelId =
  | 'linear-search'
  | 'maximum'
  | 'min-and-max'
  | 'binary-search'
  | 'selection-sort'
  | 'bubble-sort';

export type AlgorithmInput = {
  values: number[];
  target?: number;
};

export type ExerciseTestCase = {
  label: string;
  args: unknown[];
  expected: unknown;
};

export type AlgorithmExercise = {
  functionName: string;
  starterCode: string;
  tests: ExerciseTestCase[];
};

export type AlgorithmControl = {
  key: keyof AlgorithmInput;
  label: string;
  kind: 'number-list' | 'number';
  help: string;
};

export type AlgorithmModelDefinition = {
  id: AlgorithmModelId;
  title: string;
  shortTitle: string;
  summary: string;
  controls: AlgorithmControl[];
  defaultInput: AlgorithmInput;
  trace: (input: AlgorithmInput) => TraceStep[];
  traceArgs: (input: AlgorithmInput) => unknown[];
  exercise: AlgorithmExercise;
};

function valuesOnly(input: AlgorithmInput): number[] {
  return input.values;
}

function targetOrZero(input: AlgorithmInput): number {
  return input.target ?? 0;
}

export const algorithmModels: AlgorithmModelDefinition[] = [
  {
    id: 'linear-search',
    title: 'Lineair zoeken',
    shortTitle: 'Lineair',
    summary: 'Loop van links naar rechts tot je het doel vindt.',
    controls: [
      {
        key: 'values',
        label: 'Lijst',
        kind: 'number-list',
        help: 'Gebruik komma-gescheiden getallen.',
      },
      {
        key: 'target',
        label: 'Doel',
        kind: 'number',
        help: 'Het getal dat je zoekt.',
      },
    ],
    defaultInput: {values: [3, 1, 4, 1, 5, 9, 2, 6], target: 5},
    trace: (input) => traceLinearSearch(input.values, targetOrZero(input)),
    traceArgs: (input) => [[...input.values], targetOrZero(input)],
    exercise: {
      functionName: 'zoek',
      starterCode: `def zoek(lijst, doel):
    # Schrijf je oplossing hier
    return None`,
      tests: [
        {label: 'gevonden in het midden', args: [[3, 1, 4, 1, 5], 5], expected: 4},
        {label: 'niet gevonden', args: [[3, 1, 4, 1, 5], 9], expected: -1},
        {label: 'lege lijst', args: [[], 7], expected: -1},
        {label: 'eerste match telt', args: [[7, 7, 7], 7], expected: 0},
      ],
    },
  },
  {
    id: 'maximum',
    title: 'Vind het maximum',
    shortTitle: 'Maximum',
    summary: 'Onthoud de grootste waarde tot nu toe.',
    controls: [
      {
        key: 'values',
        label: 'Lijst',
        kind: 'number-list',
        help: 'Gebruik een niet-lege lijst voor hetzelfde gedrag als de lescode.',
      },
    ],
    defaultInput: {values: [3, 7, 2, 9, 4]},
    trace: (input) => traceMaximum(valuesOnly(input)),
    traceArgs: (input) => [[...input.values]],
    exercise: {
      functionName: 'vind_maximum',
      starterCode: `def vind_maximum(lijst):
    # Schrijf je oplossing hier
    return None`,
      tests: [
        {label: 'positieve getallen', args: [[3, 7, 2, 9, 4]], expected: 9},
        {label: 'negatieve getallen', args: [[-3, -1, -7]], expected: -1},
        {label: 'een element', args: [[42]], expected: 42},
        {label: 'duplicaten', args: [[5, 5, 5]], expected: 5},
      ],
    },
  },
  {
    id: 'min-and-max',
    title: 'Max en min in een pass',
    shortTitle: 'Max en min',
    summary: 'Werk twee accumulators tegelijk bij.',
    controls: [
      {
        key: 'values',
        label: 'Lijst',
        kind: 'number-list',
        help: 'Gebruik een niet-lege lijst voor hetzelfde gedrag als de lescode.',
      },
    ],
    defaultInput: {values: [5, 2, 8, 1, 7, 4]},
    trace: (input) => traceMinAndMax(valuesOnly(input)),
    traceArgs: (input) => [[...input.values]],
    exercise: {
      functionName: 'max_en_min',
      starterCode: `def max_en_min(lijst):
    # Schrijf je oplossing hier
    return None`,
      tests: [
        {label: 'gemengde lijst', args: [[5, 2, 8, 1, 7, 4]], expected: [1, 8]},
        {label: 'negatieve getallen', args: [[-3, -1, -7]], expected: [-7, -1]},
        {label: 'een element', args: [[42]], expected: [42, 42]},
        {label: 'duplicaten', args: [[3, 3, 3]], expected: [3, 3]},
      ],
    },
  },
  {
    id: 'binary-search',
    title: 'Binair zoeken',
    shortTitle: 'Binair',
    summary: 'Halveer steeds het gesorteerde zoekgebied.',
    controls: [
      {
        key: 'values',
        label: 'Gesorteerde lijst',
        kind: 'number-list',
        help: 'Binair zoeken verwacht een gesorteerde lijst.',
      },
      {
        key: 'target',
        label: 'Doel',
        kind: 'number',
        help: 'Het getal dat je zoekt.',
      },
    ],
    defaultInput: {values: [1, 3, 5, 7, 9, 11, 13, 15], target: 4},
    trace: (input) => traceBinarySearch(input.values, targetOrZero(input)),
    traceArgs: (input) => [[...input.values], targetOrZero(input)],
    exercise: {
      functionName: 'binair_zoek',
      starterCode: `def binair_zoek(lijst, doel):
    # Schrijf je oplossing hier
    return None`,
      tests: [
        {label: 'gevonden', args: [[1, 3, 5, 7, 9], 7], expected: 3},
        {label: 'niet gevonden', args: [[1, 3, 5, 7, 9], 4], expected: -1},
        {label: 'lege lijst', args: [[], 5], expected: -1},
        {label: 'een element', args: [[42], 42], expected: 0},
      ],
    },
  },
  {
    id: 'selection-sort',
    title: 'Selection sort',
    shortTitle: 'Selection',
    summary: 'Kies steeds het kleinste van de rest en zet het vooraan.',
    controls: [
      {
        key: 'values',
        label: 'Lijst',
        kind: 'number-list',
        help: 'De visualisatie sorteert oplopend.',
      },
    ],
    defaultInput: {values: [5, 2, 8, 1, 4]},
    trace: (input) => traceSelectionSort(valuesOnly(input)),
    traceArgs: (input) => [[...input.values]],
    exercise: {
      functionName: 'selection_sort',
      starterCode: `def selection_sort(lijst):
    # Schrijf je oplossing hier
    return None`,
      tests: [
        {label: 'door elkaar', args: [[5, 2, 8, 1, 4]], expected: [1, 2, 4, 5, 8]},
        {label: 'al gesorteerd', args: [[1, 2, 3]], expected: [1, 2, 3]},
        {label: 'omgekeerd', args: [[3, 2, 1]], expected: [1, 2, 3]},
        {label: 'leeg', args: [[]], expected: []},
      ],
    },
  },
  {
    id: 'bubble-sort',
    title: 'Bubble sort',
    shortTitle: 'Bubble',
    summary: 'Vergelijk buren en stop vroeg als er niets wisselt.',
    controls: [
      {
        key: 'values',
        label: 'Lijst',
        kind: 'number-list',
        help: 'De visualisatie sorteert oplopend met early-exit.',
      },
    ],
    defaultInput: {values: [3, 1, 4, 1, 5]},
    trace: (input) => traceBubbleSort(valuesOnly(input)),
    traceArgs: (input) => [[...input.values]],
    exercise: {
      functionName: 'bubble_sort',
      starterCode: `def bubble_sort(lijst):
    # Schrijf je oplossing hier
    return None`,
      tests: [
        {label: 'door elkaar', args: [[3, 1, 4, 1, 5]], expected: [1, 1, 3, 4, 5]},
        {label: 'al gesorteerd', args: [[1, 2, 3]], expected: [1, 2, 3]},
        {label: 'omgekeerd', args: [[3, 2, 1]], expected: [1, 2, 3]},
        {label: 'leeg', args: [[]], expected: []},
      ],
    },
  },
];

export function getAlgorithmModel(
  id: AlgorithmModelId,
): AlgorithmModelDefinition {
  const model = algorithmModels.find((entry) => entry.id === id);
  if (!model) {
    throw new Error(`Onbekend algoritme-model: ${id}`);
  }
  return model;
}

import type {
  AlgorithmExercise,
  AlgorithmInput,
  AlgorithmModelId,
} from './algorithmModels';

export type SteppingStoneModelId =
  | 'linear-iterate'
  | 'linear-compare'
  | 'linear-return-index'
  | 'linear-not-found'
  | 'maximum-compare'
  | 'maximum-loop'
  | 'maximum-initialization'
  | 'minmax-initialize'
  | 'minmax-update'
  | 'minmax-return'
  | 'binary-bounds'
  | 'binary-middle'
  | 'binary-compare'
  | 'binary-loop'
  | 'binary-not-found'
  | 'selection-min-index'
  | 'selection-swap'
  | 'selection-subrange'
  | 'selection-loop'
  | 'bubble-compare-neighbors'
  | 'bubble-swap'
  | 'bubble-one-pass'
  | 'bubble-multiple-passes'
  | 'bubble-early-exit';

export type SteppingStoneVisual = {
  input: AlgorithmInput;
  focusStep: number;
  hint: string;
};

export type SteppingStoneModelDefinition = {
  id: SteppingStoneModelId;
  algorithm: AlgorithmModelId;
  title: string;
  summary: string;
  visual: SteppingStoneVisual;
  exercise: AlgorithmExercise;
};

export const steppingStoneModels: SteppingStoneModelDefinition[] = [
  {
    id: 'linear-iterate',
    algorithm: 'linear-search',
    title: 'Door de lijst lopen',
    summary: 'Controleer of je elk element precies een keer bezoekt.',
    visual: {
      input: {values: [3, 1, 4, 1, 5], target: 5},
      focusStep: 1,
      hint: 'Let op de actieve cel: die schuift bij elke stap een positie naar rechts.',
    },
    exercise: {
      functionName: 'waarden_een_voor_een',
      starterCode: `def waarden_een_voor_een(lijst):
    resultaat = []
    # Schrijf je oplossing hier
    return resultaat`,
      tests: [
        {label: 'standaard lijst', args: [[3, 1, 4, 1, 5]], expected: [3, 1, 4, 1, 5]},
        {label: 'lege lijst', args: [[]], expected: []},
        {label: 'negatieve getallen', args: [[-2, 0, 6]], expected: [-2, 0, 6]},
      ],
    },
  },
  {
    id: 'linear-compare',
    algorithm: 'linear-search',
    title: 'Vergelijken met het doel',
    summary: 'Oefen de boolean die zegt of de huidige waarde raak is.',
    visual: {
      input: {values: [3, 1, 4, 1, 5], target: 4},
      focusStep: 2,
      hint: 'De vergelijking gebeurt tussen de actieve waarde en het doelgetal.',
    },
    exercise: {
      functionName: 'is_doel',
      starterCode: `def is_doel(waarde, doel):
    # Schrijf je oplossing hier
    return None`,
      tests: [
        {label: 'raak', args: [4, 4], expected: true},
        {label: 'mis', args: [3, 4], expected: false},
        {label: 'negatieve match', args: [-2, -2], expected: true},
      ],
    },
  },
  {
    id: 'linear-return-index',
    algorithm: 'linear-search',
    title: 'Index teruggeven',
    summary: 'Return de index zodra je de eerste match ziet.',
    visual: {
      input: {values: [3, 1, 4, 1, 5], target: 1},
      focusStep: 2,
      hint: 'Bij de eerste match stopt de functie meteen; latere matches tellen niet meer.',
    },
    exercise: {
      functionName: 'zoek_gevonden',
      starterCode: `def zoek_gevonden(lijst, doel):
    # Schrijf je oplossing hier
    return None`,
      tests: [
        {label: 'waarde in het midden', args: [[3, 1, 4, 1, 5], 4], expected: 2},
        {label: 'eerste match telt', args: [[3, 1, 4, 1, 5], 1], expected: 1},
        {label: 'eerste element', args: [[7, 8, 9], 7], expected: 0},
      ],
    },
  },
  {
    id: 'linear-not-found',
    algorithm: 'linear-search',
    title: 'Niet gevonden',
    summary: 'Plaats de fallback pas na de lus.',
    visual: {
      input: {values: [3, 1, 4, 1, 5], target: 9},
      focusStep: 6,
      hint: 'Als de actieve index voorbij het laatste element is, mag pas -1 terugkomen.',
    },
    exercise: {
      functionName: 'zoek',
      starterCode: `def zoek(lijst, doel):
    # Schrijf je oplossing hier
    return None`,
      tests: [
        {label: 'gevonden', args: [[3, 1, 4, 1, 5], 4], expected: 2},
        {label: 'niet gevonden', args: [[3, 1, 4, 1, 5], 9], expected: -1},
        {label: 'lege lijst', args: [[], 9], expected: -1},
      ],
    },
  },
  {
    id: 'maximum-compare',
    algorithm: 'maximum',
    title: 'Maximum bijwerken',
    summary: 'Kies tussen het oude maximum en de nieuwe waarde.',
    visual: {
      input: {values: [3, 7, 2, 9, 4]},
      focusStep: 2,
      hint: 'De max-markering springt alleen wanneer de actieve waarde groter is.',
    },
    exercise: {
      functionName: 'update_maximum',
      starterCode: `def update_maximum(max_tot_nu_toe, nieuw):
    # Schrijf je oplossing hier
    return None`,
      tests: [
        {label: 'nieuw wint', args: [3, 7], expected: 7},
        {label: 'oud blijft', args: [7, 2], expected: 7},
        {label: 'negatief', args: [-3, -1], expected: -1},
      ],
    },
  },
  {
    id: 'maximum-loop',
    algorithm: 'maximum',
    title: 'Vergelijking herhalen',
    summary: 'Gebruik dezelfde update bij elke waarde in de lijst.',
    visual: {
      input: {values: [3, 7, 2, 9, 4]},
      focusStep: 4,
      hint: 'Elke actieve waarde krijgt dezelfde vraag: is dit groter dan het maximum tot nu toe?',
    },
    exercise: {
      functionName: 'maximum_met_start_nul',
      starterCode: `def maximum_met_start_nul(lijst):
    max_tot_nu_toe = 0
    # Schrijf je oplossing hier
    return max_tot_nu_toe`,
      tests: [
        {label: 'positieve lijst', args: [[3, 7, 2, 9, 4]], expected: 9},
        {label: 'een update', args: [[1, 5, 2]], expected: 5},
        {label: 'geen lege lijst nodig', args: [[6]], expected: 6},
      ],
    },
  },
  {
    id: 'maximum-initialization',
    algorithm: 'maximum',
    title: 'Veilige startwaarde',
    summary: 'Start met een echte waarde uit de lijst.',
    visual: {
      input: {values: [-3, -1, -7]},
      focusStep: 2,
      hint: 'De max-markering begint op index 0, niet op een verzonnen waarde zoals 0.',
    },
    exercise: {
      functionName: 'vind_maximum',
      starterCode: `def vind_maximum(lijst):
    # Schrijf je oplossing hier
    return None`,
      tests: [
        {label: 'positieve lijst', args: [[3, 7, 2, 9, 4]], expected: 9},
        {label: 'alleen negatief', args: [[-3, -1, -7]], expected: -1},
        {label: 'een element', args: [[42]], expected: 42},
      ],
    },
  },
  {
    id: 'minmax-initialize',
    algorithm: 'min-and-max',
    title: 'Twee startwaardes',
    summary: 'Zet klein en groot allebei op het eerste element.',
    visual: {
      input: {values: [5, 2, 8, 1, 7, 4]},
      focusStep: 0,
      hint: 'In de eerste stap wijzen min en max naar dezelfde echte lijstwaarde.',
    },
    exercise: {
      functionName: 'start_min_en_max',
      starterCode: `def start_min_en_max(lijst):
    # Schrijf je oplossing hier
    return None`,
      tests: [
        {label: 'standaard lijst', args: [[5, 2, 8]], expected: [5, 5]},
        {label: 'negatieve lijst', args: [[-3, -1, -7]], expected: [-3, -3]},
        {label: 'een element', args: [[42]], expected: [42, 42]},
      ],
    },
  },
  {
    id: 'minmax-update',
    algorithm: 'min-and-max',
    title: 'Klein en groot updaten',
    summary: 'Werk twee accumulators bij in dezelfde lus.',
    visual: {
      input: {values: [5, 2, 8, 1, 7, 4]},
      focusStep: 4,
      hint: 'Soms verandert klein, soms groot, en soms geen van beide.',
    },
    exercise: {
      functionName: 'max_en_min_los',
      starterCode: `def max_en_min_los(lijst):
    # Schrijf je oplossing hier
    return None`,
      tests: [
        {label: 'gemengde lijst', args: [[5, 2, 8, 1, 7, 4]], expected: [1, 8]},
        {label: 'alleen negatief', args: [[-5, -1, -9, -2]], expected: [-9, -1]},
        {label: 'allemaal gelijk', args: [[3, 3, 3]], expected: [3, 3]},
      ],
    },
  },
  {
    id: 'minmax-return',
    algorithm: 'min-and-max',
    title: 'Tuple teruggeven',
    summary: 'Return twee waardes in een vaste volgorde: klein, groot.',
    visual: {
      input: {values: [5, 2, 8, 1, 7, 4]},
      focusStep: 7,
      hint: 'De eindstap combineert de twee accumulators tot een antwoord.',
    },
    exercise: {
      functionName: 'max_en_min',
      starterCode: `def max_en_min(lijst):
    # Schrijf je oplossing hier
    return None`,
      tests: [
        {label: 'standaard lijst', args: [[5, 2, 8, 1, 7, 4]], expected: [1, 8]},
        {label: 'een element', args: [[42]], expected: [42, 42]},
        {label: 'negatieve lijst', args: [[-3, -1, -7]], expected: [-7, -1]},
      ],
    },
  },
  {
    id: 'binary-bounds',
    algorithm: 'binary-search',
    title: 'Zoekgrenzen',
    summary: 'Bereken de eerste en laatste geldige index.',
    visual: {
      input: {values: [1, 3, 5, 7, 9, 11, 13, 15], target: 11},
      focusStep: 0,
      hint: 'Laag en hoog omsluiten het deel van de lijst dat nog mogelijk is.',
    },
    exercise: {
      functionName: 'grenzen',
      starterCode: `def grenzen(lijst):
    # Schrijf je oplossing hier
    return None`,
      tests: [
        {label: 'acht elementen', args: [[1, 3, 5, 7, 9, 11, 13, 15]], expected: [0, 7]},
        {label: 'een element', args: [[42]], expected: [0, 0]},
        {label: 'lege lijst', args: [[]], expected: [0, -1]},
      ],
    },
  },
  {
    id: 'binary-middle',
    algorithm: 'binary-search',
    title: 'Midden berekenen',
    summary: 'Gebruik integerdeling zodat de midden-index altijd een geheel getal is.',
    visual: {
      input: {values: [1, 3, 5, 7, 9, 11, 13, 15], target: 11},
      focusStep: 1,
      hint: 'De mid-markering valt altijd tussen laag en hoog.',
    },
    exercise: {
      functionName: 'midden_van',
      starterCode: `def midden_van(laag, hoog):
    # Schrijf je oplossing hier
    return None`,
      tests: [
        {label: 'hele lijst', args: [0, 7], expected: 3},
        {label: 'een element', args: [4, 4], expected: 4},
        {label: 'deelgebied', args: [2, 5], expected: 3},
      ],
    },
  },
  {
    id: 'binary-compare',
    algorithm: 'binary-search',
    title: 'Helft kiezen',
    summary: 'Vergelijk het midden en geef aan welk zoekgebied overblijft.',
    visual: {
      input: {values: [1, 3, 5, 7, 9, 11, 13, 15], target: 11},
      focusStep: 2,
      hint: 'Na de vergelijking wordt de linker- of rechterhelft weggegooid.',
    },
    exercise: {
      functionName: 'een_binaire_stap',
      starterCode: `def een_binaire_stap(lijst, doel, laag, hoog):
    # Return ["gevonden", midden], ["rechts", nieuw_laag, hoog] of ["links", laag, nieuw_hoog]
    # Schrijf je oplossing hier
    return None`,
      tests: [
        {label: 'rechter helft', args: [[1, 3, 5, 7, 9, 11, 13, 15], 11, 0, 7], expected: ['rechts', 4, 7]},
        {label: 'linker helft', args: [[1, 3, 5, 7, 9, 11, 13, 15], 3, 0, 7], expected: ['links', 0, 2]},
        {label: 'direct gevonden', args: [[1, 3, 5, 7, 9], 5, 0, 4], expected: ['gevonden', 2]},
      ],
    },
  },
  {
    id: 'binary-loop',
    algorithm: 'binary-search',
    title: 'Herhalen met while',
    summary: 'Blijf halveren zolang het zoekgebied niet leeg is.',
    visual: {
      input: {values: [1, 3, 5, 7, 9, 11, 13, 15], target: 11},
      focusStep: 3,
      hint: 'De tweede ronde gebruikt de grenzen die in de eerste ronde zijn overgebleven.',
    },
    exercise: {
      functionName: 'binair_zoek_tot_gevonden',
      starterCode: `def binair_zoek_tot_gevonden(lijst, doel):
    # Schrijf je oplossing hier
    return None`,
      tests: [
        {label: 'gevonden rechts', args: [[1, 3, 5, 7, 9, 11, 13, 15], 11], expected: 5},
        {label: 'gevonden links', args: [[1, 3, 5, 7, 9, 11, 13, 15], 3], expected: 1},
        {label: 'een element', args: [[42], 42], expected: 0},
      ],
    },
  },
  {
    id: 'binary-not-found',
    algorithm: 'binary-search',
    title: 'Niet gevonden',
    summary: 'Return -1 wanneer laag voorbij hoog schuift.',
    visual: {
      input: {values: [1, 3, 5, 7, 9, 11, 13, 15], target: 4},
      focusStep: 5,
      hint: 'Laag groter dan hoog betekent: er is geen geldig zoekgebied meer.',
    },
    exercise: {
      functionName: 'binair_zoek',
      starterCode: `def binair_zoek(lijst, doel):
    # Schrijf je oplossing hier
    return None`,
      tests: [
        {label: 'gevonden', args: [[1, 3, 5, 7, 9], 7], expected: 3},
        {label: 'niet gevonden', args: [[1, 3, 5, 7, 9], 4], expected: -1},
        {label: 'lege lijst', args: [[], 5], expected: -1},
      ],
    },
  },
  {
    id: 'selection-min-index',
    algorithm: 'selection-sort',
    title: 'Index van kleinste',
    summary: 'Bewaar de positie van de kleinste waarde, niet alleen de waarde zelf.',
    visual: {
      input: {values: [5, 2, 8, 1, 4]},
      focusStep: 3,
      hint: 'De min-markering beweegt wanneer de scan een kleinere waarde vindt.',
    },
    exercise: {
      functionName: 'index_van_kleinste',
      starterCode: `def index_van_kleinste(lijst):
    # Schrijf je oplossing hier
    return None`,
      tests: [
        {label: 'standaard lijst', args: [[5, 2, 8, 1, 4]], expected: 3},
        {label: 'eerste is kleinste', args: [[10, 20, 30]], expected: 0},
        {label: 'gelijke waardes', args: [[3, 3, 3]], expected: 0},
      ],
    },
  },
  {
    id: 'selection-swap',
    algorithm: 'selection-sort',
    title: 'Twee plekken ruilen',
    summary: 'Swap twee indexen zonder een waarde kwijt te raken.',
    visual: {
      input: {values: [5, 2, 8, 1, 4]},
      focusStep: 6,
      hint: 'Bij een swap wisselen twee cellen tegelijk van rol.',
    },
    exercise: {
      functionName: 'swap',
      starterCode: `def swap(lijst, i, j):
    # Schrijf je oplossing hier
    return lijst`,
      tests: [
        {label: 'voorste met kleinste', args: [[5, 2, 8, 1, 4], 0, 3], expected: [1, 2, 8, 5, 4]},
        {label: 'buren', args: [[1, 2, 3], 1, 2], expected: [1, 3, 2]},
        {label: 'zelfde plek', args: [[4, 5], 0, 0], expected: [4, 5]},
      ],
    },
  },
  {
    id: 'selection-subrange',
    algorithm: 'selection-sort',
    title: 'Zoeken vanaf start',
    summary: 'Zoek het kleinste alleen in het ongesorteerde deel.',
    visual: {
      input: {values: [1, 2, 8, 5, 4]},
      focusStep: 8,
      hint: 'De gesorteerde prefix blijft met rust; de scan begint pas bij i.',
    },
    exercise: {
      functionName: 'index_van_kleinste_vanaf',
      starterCode: `def index_van_kleinste_vanaf(lijst, start):
    # Schrijf je oplossing hier
    return None`,
      tests: [
        {label: 'hele lijst', args: [[1, 2, 8, 5, 4], 0], expected: 0},
        {label: 'vanaf 2', args: [[1, 2, 8, 5, 4], 2], expected: 4},
        {label: 'laatste twee', args: [[1, 2, 8, 5, 4], 3], expected: 4},
      ],
    },
  },
  {
    id: 'selection-loop',
    algorithm: 'selection-sort',
    title: 'Buitenste lus',
    summary: 'Herhaal zoeken en swappen voor elke positie.',
    visual: {
      input: {values: [5, 2, 8, 1, 4]},
      focusStep: 10,
      hint: 'Na elke ronde groeit de gesorteerde prefix links.',
    },
    exercise: {
      functionName: 'selection_sort',
      starterCode: `def selection_sort(lijst):
    # Schrijf je oplossing hier
    return None`,
      tests: [
        {label: 'standaard lijst', args: [[5, 2, 8, 1, 4]], expected: [1, 2, 4, 5, 8]},
        {label: 'al gesorteerd', args: [[1, 2, 3]], expected: [1, 2, 3]},
        {label: 'leeg', args: [[]], expected: []},
      ],
    },
  },
  {
    id: 'bubble-compare-neighbors',
    algorithm: 'bubble-sort',
    title: 'Buren vergelijken',
    summary: 'Detecteer of twee opeenvolgende waardes verkeerd staan.',
    visual: {
      input: {values: [3, 1, 4, 1, 5]},
      focusStep: 1,
      hint: 'Bubble sort kijkt steeds naar een paar buren: i en i+1.',
    },
    exercise: {
      functionName: 'staan_buren_fout',
      starterCode: `def staan_buren_fout(lijst, i):
    # Schrijf je oplossing hier
    return None`,
      tests: [
        {label: 'fout paar', args: [[3, 1, 4, 1, 5], 0], expected: true},
        {label: 'goed paar', args: [[3, 1, 4, 1, 5], 1], expected: false},
        {label: 'later fout paar', args: [[3, 1, 4, 1, 5], 2], expected: true},
      ],
    },
  },
  {
    id: 'bubble-swap',
    algorithm: 'bubble-sort',
    title: 'Swap als buren fout staan',
    summary: 'Ruil alleen wanneer links groter is dan rechts.',
    visual: {
      input: {values: [3, 1, 4, 1, 5]},
      focusStep: 2,
      hint: 'Bij een fout paar zie je de swap-markering op beide buren.',
    },
    exercise: {
      functionName: 'swap_als_fout',
      starterCode: `def swap_als_fout(lijst, i):
    # Schrijf je oplossing hier
    return lijst`,
      tests: [
        {label: 'swap nodig', args: [[3, 1, 4, 1, 5], 0], expected: [1, 3, 4, 1, 5]},
        {label: 'geen swap', args: [[1, 3, 4, 1, 5], 1], expected: [1, 3, 4, 1, 5]},
        {label: 'later paar', args: [[1, 3, 4, 1, 5], 2], expected: [1, 3, 1, 4, 5]},
      ],
    },
  },
  {
    id: 'bubble-one-pass',
    algorithm: 'bubble-sort',
    title: 'Een pass',
    summary: 'Loop langs alle buren zodat de grootste naar achteren borrelt.',
    visual: {
      input: {values: [4, 2, 7, 1, 3]},
      focusStep: 5,
      hint: 'Na een volledige pass staat de grootste waarde rechts op zijn plek.',
    },
    exercise: {
      functionName: 'een_pass',
      starterCode: `def een_pass(lijst):
    # Schrijf je oplossing hier
    return None`,
      tests: [
        {label: 'standaard lijst', args: [[3, 1, 4, 1, 5]], expected: [1, 3, 1, 4, 5]},
        {label: 'omgekeerd', args: [[5, 4, 3, 2, 1]], expected: [4, 3, 2, 1, 5]},
        {label: 'al gesorteerd', args: [[1, 2, 3]], expected: [1, 2, 3]},
      ],
    },
  },
  {
    id: 'bubble-multiple-passes',
    algorithm: 'bubble-sort',
    title: 'Meerdere passes',
    summary: 'Herhaal de pass vaak genoeg om de hele lijst te sorteren.',
    visual: {
      input: {values: [3, 1, 4, 1, 5]},
      focusStep: 8,
      hint: 'De gesorteerde suffix rechts groeit na elke ronde.',
    },
    exercise: {
      functionName: 'bubble_sort_basis',
      starterCode: `def bubble_sort_basis(lijst):
    # Schrijf je oplossing hier
    return None`,
      tests: [
        {label: 'standaard lijst', args: [[3, 1, 4, 1, 5]], expected: [1, 1, 3, 4, 5]},
        {label: 'omgekeerd', args: [[5, 4, 3, 2, 1]], expected: [1, 2, 3, 4, 5]},
        {label: 'leeg', args: [[]], expected: []},
      ],
    },
  },
  {
    id: 'bubble-early-exit',
    algorithm: 'bubble-sort',
    title: 'Early-exit',
    summary: 'Stop zodra een hele ronde geen swap meer had.',
    visual: {
      input: {values: [1, 2, 3, 4, 5]},
      focusStep: 5,
      hint: 'Zonder swap in een ronde weet je dat de lijst klaar is.',
    },
    exercise: {
      functionName: 'bubble_sort_met_rondes',
      starterCode: `def bubble_sort_met_rondes(lijst):
    rondes = 0
    # Schrijf je oplossing hier
    return lijst, rondes`,
      tests: [
        {label: 'al gesorteerd stopt snel', args: [[1, 2, 3, 4]], expected: [[1, 2, 3, 4], 1]},
        {label: 'bijna gesorteerd', args: [[1, 3, 2, 4]], expected: [[1, 2, 3, 4], 2]},
        {label: 'omgekeerd', args: [[3, 2, 1]], expected: [[1, 2, 3], 2]},
      ],
    },
  },
];

export function getSteppingStoneModel(
  id: SteppingStoneModelId,
): SteppingStoneModelDefinition {
  const model = steppingStoneModels.find((entry) => entry.id === id);
  if (!model) {
    throw new Error(`Onbekend bouwsteen-model: ${id}`);
  }
  return model;
}

export type TraceMarkers = {
  activeIndex?: number;
  compareIndex?: number;
  compareWithIndex?: number;
  maxIndex?: number;
  minIndex?: number;
  low?: number;
  high?: number;
  mid?: number;
  outerIndex?: number;
  scanIndex?: number;
  swapA?: number;
  swapB?: number;
  sortedFrom?: number;
  sortedUntil?: number;
  foundIndex?: number;
};

export type TraceStats = {
  steps: number;
  comparisons?: number;
  swaps?: number;
  passes?: number;
};

export type TraceResult =
  | number
  | number[]
  | string
  | null
  | {
      min: number;
      max: number;
    };

export type TraceStep = {
  id: string;
  title: string;
  description: string;
  array: number[];
  markers: TraceMarkers;
  stats: TraceStats;
  result?: TraceResult;
};

function copy(values: number[]): number[] {
  return [...values];
}

export function traceLinearSearch(values: number[], target: number): TraceStep[] {
  const steps: TraceStep[] = [];
  let comparisons = 0;

  steps.push({
    id: 'linear-start',
    title: 'Start',
    description: `We zoeken ${target} van links naar rechts.`,
    array: copy(values),
    markers: {},
    stats: {steps: 0, comparisons},
  });

  for (let i = 0; i < values.length; i += 1) {
    comparisons += 1;
    const found = values[i] === target;
    steps.push({
      id: `linear-check-${i}`,
      title: `Controleer index ${i}`,
      description: found
        ? `${values[i]} is gelijk aan ${target}. We stoppen en geven index ${i} terug.`
        : `${values[i]} is niet gelijk aan ${target}. We gaan door.`,
      array: copy(values),
      markers: {
        activeIndex: i,
        compareIndex: i,
        foundIndex: found ? i : undefined,
      },
      stats: {steps: i + 1, comparisons},
      result: found ? i : undefined,
    });
    if (found) return steps;
  }

  steps.push({
    id: 'linear-not-found',
    title: 'Niet gevonden',
    description: `Geen enkel element was gelijk aan ${target}. Het resultaat is -1.`,
    array: copy(values),
    markers: {},
    stats: {steps: values.length, comparisons},
    result: -1,
  });

  return steps;
}

export function traceMaximum(values: number[]): TraceStep[] {
  if (values.length === 0) {
    return [
      {
        id: 'maximum-empty',
        title: 'Lege lijst',
        description: 'Een lege lijst heeft geen maximum.',
        array: [],
        markers: {},
        stats: {steps: 0, comparisons: 0},
        result: null,
      },
    ];
  }

  const steps: TraceStep[] = [
    {
      id: 'maximum-start',
      title: 'Startwaarde',
      description: `We starten met ${values[0]} als grootste tot nu toe.`,
      array: copy(values),
      markers: {activeIndex: 0, maxIndex: 0},
      stats: {steps: 0, comparisons: 0},
      result: values[0],
    },
  ];
  let maxIndex = 0;
  let comparisons = 0;

  for (let i = 0; i < values.length; i += 1) {
    comparisons += 1;
    const nextIsBigger = values[i] > values[maxIndex];
    if (nextIsBigger) maxIndex = i;
    steps.push({
      id: `maximum-check-${i}`,
      title: `Vergelijk index ${i}`,
      description: nextIsBigger
        ? `${values[i]} is groter, dus dit wordt het nieuwe maximum.`
        : `${values[i]} is niet groter dan ${values[maxIndex]}. Het maximum blijft staan.`,
      array: copy(values),
      markers: {activeIndex: i, compareIndex: i, maxIndex},
      stats: {steps: i + 1, comparisons},
      result: values[maxIndex],
    });
  }

  return steps;
}

export function traceMinAndMax(values: number[]): TraceStep[] {
  if (values.length === 0) {
    return [
      {
        id: 'minmax-empty',
        title: 'Lege lijst',
        description: 'Een lege lijst heeft geen minimum of maximum.',
        array: [],
        markers: {},
        stats: {steps: 0, comparisons: 0},
        result: null,
      },
    ];
  }

  const steps: TraceStep[] = [
    {
      id: 'minmax-start',
      title: 'Startwaardes',
      description: `We starten met ${values[0]} als minimum en maximum.`,
      array: copy(values),
      markers: {activeIndex: 0, minIndex: 0, maxIndex: 0},
      stats: {steps: 0, comparisons: 0},
      result: {min: values[0], max: values[0]},
    },
  ];
  let minIndex = 0;
  let maxIndex = 0;
  let comparisons = 0;

  for (let i = 0; i < values.length; i += 1) {
    comparisons += 1;
    let description: string;
    if (values[i] < values[minIndex]) {
      minIndex = i;
      description = `${values[i]} is kleiner, dus dit wordt het nieuwe minimum.`;
    } else {
      comparisons += 1;
      if (values[i] > values[maxIndex]) {
        maxIndex = i;
        description = `${values[i]} is groter, dus dit wordt het nieuwe maximum.`;
      } else {
        description = `${values[i]} verandert het minimum en maximum niet.`;
      }
    }

    steps.push({
      id: `minmax-check-${i}`,
      title: `Vergelijk index ${i}`,
      description,
      array: copy(values),
      markers: {activeIndex: i, compareIndex: i, minIndex, maxIndex},
      stats: {steps: i + 1, comparisons},
      result: {min: values[minIndex], max: values[maxIndex]},
    });
  }

  return steps;
}

export function traceBinarySearch(values: number[], target: number): TraceStep[] {
  const steps: TraceStep[] = [];
  let low = 0;
  let high = values.length - 1;
  let comparisons = 0;
  let stepCount = 0;

  steps.push({
    id: 'binary-start',
    title: 'Start',
    description: `Het zoekgebied loopt van index ${low} tot ${high}.`,
    array: copy(values),
    markers: {low, high},
    stats: {steps: stepCount, comparisons},
  });

  while (low <= high) {
    stepCount += 1;
    const mid = Math.floor((low + high) / 2);
    comparisons += 1;
    const current = values[mid];

    if (current === target) {
      steps.push({
        id: `binary-found-${mid}`,
        title: `Midden is index ${mid}`,
        description: `${current} is gelijk aan ${target}. We geven index ${mid} terug.`,
        array: copy(values),
        markers: {low, high, mid, activeIndex: mid, foundIndex: mid},
        stats: {steps: stepCount, comparisons},
        result: mid,
      });
      return steps;
    }

    if (current < target) {
      const oldLow = low;
      low = mid + 1;
      steps.push({
        id: `binary-right-${mid}`,
        title: `Midden is index ${mid}`,
        description: `${current} is te klein. Alles tot en met index ${mid} valt af.`,
        array: copy(values),
        markers: {low, high, mid, activeIndex: mid, sortedUntil: oldLow - 1},
        stats: {steps: stepCount, comparisons},
      });
    } else {
      const oldHigh = high;
      high = mid - 1;
      steps.push({
        id: `binary-left-${mid}`,
        title: `Midden is index ${mid}`,
        description: `${current} is te groot. Alles vanaf index ${mid} valt af.`,
        array: copy(values),
        markers: {low, high, mid, activeIndex: mid, sortedFrom: oldHigh + 1},
        stats: {steps: stepCount, comparisons},
      });
    }
  }

  steps.push({
    id: 'binary-not-found',
    title: 'Niet gevonden',
    description: `Laag is ${low} en hoog is ${high}. Het zoekgebied is leeg, dus het resultaat is -1.`,
    array: copy(values),
    markers: {low, high},
    stats: {steps: stepCount, comparisons},
    result: -1,
  });

  return steps;
}

export function traceSelectionSort(values: number[]): TraceStep[] {
  const list = copy(values);
  const steps: TraceStep[] = [
    {
      id: 'selection-start',
      title: 'Start',
      description: 'We zoeken telkens het kleinste element van het ongesorteerde deel.',
      array: copy(list),
      markers: {sortedUntil: -1},
      stats: {steps: 0, comparisons: 0, swaps: 0},
    },
  ];
  let comparisons = 0;
  let swaps = 0;

  for (let i = 0; i < list.length; i += 1) {
    let minIndex = i;
    steps.push({
      id: `selection-round-${i}`,
      title: `Ronde ${i + 1}`,
      description: `Zoek het kleinste element vanaf index ${i}.`,
      array: copy(list),
      markers: {outerIndex: i, minIndex, sortedUntil: i - 1},
      stats: {steps: steps.length, comparisons, swaps},
    });

    for (let j = i; j < list.length; j += 1) {
      comparisons += 1;
      const foundNewMin = list[j] < list[minIndex];
      if (foundNewMin) minIndex = j;
      steps.push({
        id: `selection-scan-${i}-${j}`,
        title: `Scan index ${j}`,
        description: foundNewMin
          ? `${list[j]} is kleiner. De minimum-kandidaat schuift naar index ${j}.`
          : `${list[j]} is niet kleiner dan de huidige minimum-kandidaat.`,
        array: copy(list),
        markers: {
          outerIndex: i,
          scanIndex: j,
          compareIndex: j,
          minIndex,
          sortedUntil: i - 1,
        },
        stats: {steps: steps.length, comparisons, swaps},
      });
    }

    [list[i], list[minIndex]] = [list[minIndex], list[i]];
    swaps += 1;
    steps.push({
      id: `selection-swap-${i}-${minIndex}`,
      title: `Swap index ${i} en ${minIndex}`,
      description: `Zet de minimum-kandidaat op positie ${i}.`,
      array: copy(list),
      markers: {
        outerIndex: i,
        minIndex: i,
        swapA: i,
        swapB: minIndex,
        sortedUntil: i,
      },
      stats: {steps: steps.length, comparisons, swaps},
    });
  }

  steps.push({
    id: 'selection-done',
    title: 'Klaar',
    description: 'De hele lijst is gesorteerd.',
    array: copy(list),
    markers: {sortedUntil: list.length - 1},
    stats: {steps: steps.length, comparisons, swaps},
    result: 'gesorteerd',
  });

  return steps;
}

export function traceBubbleSort(values: number[]): TraceStep[] {
  const list = copy(values);
  const steps: TraceStep[] = [
    {
      id: 'bubble-start',
      title: 'Start',
      description: 'We vergelijken steeds twee buren en swappen als ze verkeerd staan.',
      array: copy(list),
      markers: {},
      stats: {steps: 0, comparisons: 0, swaps: 0, passes: 0},
    },
  ];
  let comparisons = 0;
  let swaps = 0;
  let passes = 0;
  const n = list.length;

  for (let round = 0; round < n - 1; round += 1) {
    passes += 1;
    let swapped = false;
    steps.push({
      id: `bubble-pass-${round}`,
      title: `Pass ${round + 1}`,
      description: 'Begin een nieuwe pass. Als er niets wisselt, zijn we klaar.',
      array: copy(list),
      markers: {sortedFrom: n - round},
      stats: {steps: steps.length, comparisons, swaps, passes},
    });

    for (let i = 0; i < n - 1 - round; i += 1) {
      comparisons += 1;
      const shouldSwap = list[i] > list[i + 1];
      steps.push({
        id: `bubble-compare-${round}-${i}`,
        title: `Vergelijk index ${i} en ${i + 1}`,
        description: shouldSwap
          ? `${list[i]} is groter dan ${list[i + 1]}, dus we wisselen.`
          : `${list[i]} en ${list[i + 1]} staan al goed.`,
        array: copy(list),
        markers: {
          activeIndex: i,
          compareIndex: i,
          compareWithIndex: i + 1,
          sortedFrom: n - round,
        },
        stats: {steps: steps.length, comparisons, swaps, passes},
      });

      if (shouldSwap) {
        [list[i], list[i + 1]] = [list[i + 1], list[i]];
        swaps += 1;
        swapped = true;
        steps.push({
          id: `bubble-swap-${round}-${i}`,
          title: `Swap index ${i} en ${i + 1}`,
          description: 'De grootste van dit paar schuift een plek naar rechts.',
          array: copy(list),
          markers: {
            activeIndex: i + 1,
            swapA: i,
            swapB: i + 1,
            sortedFrom: n - round,
          },
          stats: {steps: steps.length, comparisons, swaps, passes},
        });
      }
    }

    if (!swapped) {
      steps.push({
        id: `bubble-early-exit-${round}`,
        title: 'Vroeg klaar',
        description: 'Er was een hele pass zonder swaps. De lijst is gesorteerd.',
        array: copy(list),
        markers: {sortedFrom: 0},
        stats: {steps: steps.length, comparisons, swaps, passes},
        result: 'gesorteerd',
      });
      return steps;
    }
  }

  steps.push({
    id: 'bubble-done',
    title: 'Klaar',
    description: 'Alle nodige passes zijn uitgevoerd.',
    array: copy(list),
    markers: {sortedFrom: 0},
    stats: {steps: steps.length, comparisons, swaps, passes},
    result: 'gesorteerd',
  });

  return steps;
}

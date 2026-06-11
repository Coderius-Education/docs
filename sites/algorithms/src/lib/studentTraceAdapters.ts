import type {AlgorithmInput, AlgorithmModelId} from '../data/algorithmModels';
import type {TraceMarkers, TraceResult, TraceStep} from './algorithmTraces';

export type RawPythonTraceFrame = {
  event: 'line' | 'return' | 'exception';
  line: number | null;
  locals: Record<string, unknown>;
  returnValue?: unknown;
};

function asNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function asInteger(value: unknown): number | undefined {
  const number = asNumber(value);
  return number !== undefined && Number.isInteger(number) ? number : undefined;
}

function asNumberArray(value: unknown): number[] | undefined {
  if (!Array.isArray(value)) return undefined;
  if (!value.every((item) => typeof item === 'number' && Number.isFinite(item))) {
    return undefined;
  }
  return value as number[];
}

function localNumber(
  locals: Record<string, unknown>,
  names: string[],
): number | undefined {
  for (const name of names) {
    const number = asNumber(locals[name]);
    if (number !== undefined) return number;
  }
  return undefined;
}

function localInteger(
  locals: Record<string, unknown>,
  names: string[],
): number | undefined {
  for (const name of names) {
    const number = asInteger(locals[name]);
    if (number !== undefined) return number;
  }
  return undefined;
}

function localArray(
  locals: Record<string, unknown>,
  fallback: number[],
): number[] {
  const named = asNumberArray(locals.lijst);
  if (named) return [...named];

  for (const value of Object.values(locals)) {
    const array = asNumberArray(value);
    if (array) return [...array];
  }

  return [...fallback];
}

function indexOfValue(values: number[], value: unknown): number | undefined {
  const number = asNumber(value);
  if (number === undefined) return undefined;
  const index = values.indexOf(number);
  return index >= 0 ? index : undefined;
}

function markerSignature(markers: TraceMarkers): string {
  return JSON.stringify(
    Object.entries(markers)
      .filter(([, value]) => value !== undefined)
      .sort(([a], [b]) => a.localeCompare(b)),
  );
}

function stepSignature(array: number[], markers: TraceMarkers): string {
  return `${JSON.stringify(array)}|${markerSignature(markers)}`;
}

function detectSwap(
  previous: number[] | undefined,
  current: number[],
): [number, number] | undefined {
  if (!previous || previous.length !== current.length) return undefined;
  const changed = current
    .map((value, index) => (value !== previous[index] ? index : -1))
    .filter((index) => index >= 0);
  if (changed.length !== 2) return undefined;
  const [a, b] = changed;
  if (previous[a] === current[b] && previous[b] === current[a]) {
    return [a, b];
  }
  return undefined;
}

function resultToTraceResult(
  algorithm: AlgorithmModelId,
  result: unknown,
): TraceResult | undefined {
  if (result === undefined) return undefined;
  if (algorithm === 'min-and-max' && Array.isArray(result) && result.length >= 2) {
    const min = asNumber(result[0]);
    const max = asNumber(result[1]);
    if (min !== undefined && max !== undefined) return {min, max};
  }
  const number = asNumber(result);
  if (number !== undefined) return number;
  const array = asNumberArray(result);
  if (array) return [...array];
  if (result === null) return null;
  return String(result);
}

function frameTitle(algorithm: AlgorithmModelId, index: number): string {
  const labelByAlgorithm: Record<AlgorithmModelId, string> = {
    'linear-search': 'Lineair zoeken',
    maximum: 'Vind maximum',
    'min-and-max': 'Max en min',
    'binary-search': 'Binair zoeken',
    'selection-sort': 'Selection sort',
    'bubble-sort': 'Bubble sort',
  };
  return `${labelByAlgorithm[algorithm]} - stap ${index + 1}`;
}

function describeMarkers(markers: TraceMarkers): string {
  const parts: string[] = [];
  if (markers.activeIndex !== undefined) parts.push(`actieve index ${markers.activeIndex}`);
  if (markers.low !== undefined) parts.push(`laag=${markers.low}`);
  if (markers.high !== undefined) parts.push(`hoog=${markers.high}`);
  if (markers.mid !== undefined) parts.push(`midden=${markers.mid}`);
  if (markers.minIndex !== undefined) parts.push(`min index ${markers.minIndex}`);
  if (markers.maxIndex !== undefined) parts.push(`max index ${markers.maxIndex}`);
  if (markers.swapA !== undefined && markers.swapB !== undefined) {
    parts.push(`swap ${markers.swapA}<->${markers.swapB}`);
  }
  return parts.length > 0
    ? `Deze stap komt uit jouw Python-code: ${parts.join(', ')}.`
    : 'Deze stap komt uit jouw Python-code.';
}

function markersForFrame(
  algorithm: AlgorithmModelId,
  locals: Record<string, unknown>,
  values: number[],
  previousValues: number[] | undefined,
): TraceMarkers {
  const swap = detectSwap(previousValues, values);
  const markers: TraceMarkers = {};

  if (algorithm === 'linear-search') {
    const i = localInteger(locals, ['i', 'index']);
    if (i !== undefined) {
      markers.activeIndex = i;
      markers.compareIndex = i;
    }
    return markers;
  }

  if (algorithm === 'maximum') {
    const i =
      localInteger(locals, ['i', 'index']) ?? indexOfValue(values, locals.waarde);
    const maxIndex =
      localInteger(locals, ['max_index', 'maximum_index', 'grootste_index']) ??
      indexOfValue(values, locals.maximum) ??
      indexOfValue(values, locals.max_tot_nu_toe) ??
      indexOfValue(values, locals.grootste);
    if (i !== undefined) {
      markers.activeIndex = i;
      markers.compareIndex = i;
    }
    if (maxIndex !== undefined) markers.maxIndex = maxIndex;
    return markers;
  }

  if (algorithm === 'min-and-max') {
    const i =
      localInteger(locals, ['i', 'index']) ?? indexOfValue(values, locals.waarde);
    const minIndex =
      localInteger(locals, ['min_index', 'klein_index', 'minimum_index']) ??
      indexOfValue(values, locals.klein) ??
      indexOfValue(values, locals.minimum);
    const maxIndex =
      localInteger(locals, ['max_index', 'groot_index', 'maximum_index']) ??
      indexOfValue(values, locals.groot) ??
      indexOfValue(values, locals.maximum);
    if (i !== undefined) {
      markers.activeIndex = i;
      markers.compareIndex = i;
    }
    if (minIndex !== undefined) markers.minIndex = minIndex;
    if (maxIndex !== undefined) markers.maxIndex = maxIndex;
    return markers;
  }

  if (algorithm === 'binary-search') {
    const low = localInteger(locals, ['laag', 'low']);
    const high = localInteger(locals, ['hoog', 'high']);
    const mid = localInteger(locals, ['midden', 'mid']);
    if (low !== undefined) markers.low = low;
    if (high !== undefined) markers.high = high;
    if (mid !== undefined) {
      markers.mid = mid;
      markers.activeIndex = mid;
      markers.compareIndex = mid;
    }
    return markers;
  }

  if (algorithm === 'selection-sort') {
    const i = localInteger(locals, ['i']);
    const j = localInteger(locals, ['j']);
    const minIndex = localInteger(locals, ['min_index', 'kleinste_index']);
    if (i !== undefined) {
      markers.outerIndex = i;
      markers.sortedUntil = swap ? i : i - 1;
    }
    if (j !== undefined) {
      markers.scanIndex = j;
      markers.compareIndex = j;
    }
    if (minIndex !== undefined) markers.minIndex = minIndex;
    if (swap) {
      markers.swapA = swap[0];
      markers.swapB = swap[1];
    }
    return markers;
  }

  const round = localInteger(locals, ['ronde', 'round']);
  const i = localInteger(locals, ['i']);
  if (i !== undefined) {
    markers.activeIndex = i;
    markers.compareIndex = i;
    if (i + 1 < values.length) markers.compareWithIndex = i + 1;
  }
  if (round !== undefined) markers.sortedFrom = values.length - round;
  if (swap) {
    markers.swapA = swap[0];
    markers.swapB = swap[1];
  }
  return markers;
}

export function adaptStudentTrace(
  algorithm: AlgorithmModelId,
  input: AlgorithmInput,
  frames: RawPythonTraceFrame[],
  result?: unknown,
): TraceStep[] {
  if (frames.length === 0) {
    return [
      {
        id: 'student-empty',
        title: 'Geen trace',
        description: 'De functie leverde geen traceerbare stappen op.',
        array: [...input.values],
        markers: {},
        stats: {steps: 0},
        result: resultToTraceResult(algorithm, result),
      },
    ];
  }

  const semanticFrames = frames.filter((frame) => frame.event !== 'return');
  if (semanticFrames.length === 0) {
    return [
      {
        id: 'student-return-only',
        title: 'Resultaat',
        description: 'De functie gaf direct een resultaat terug.',
        array: [...input.values],
        markers: {},
        stats: {steps: 1},
        result: resultToTraceResult(algorithm, result),
      },
    ];
  }

  let previousValues: number[] | undefined;
  let previousSignature: string | undefined;
  let swaps = 0;
  const steps: TraceStep[] = [];

  for (const frame of semanticFrames) {
    const values = localArray(frame.locals, previousValues ?? input.values);
    const markers = markersForFrame(algorithm, frame.locals, values, previousValues);
    const signature = stepSignature(values, markers);
    previousValues = values;
    if (signature === previousSignature) continue;
    previousSignature = signature;

    if (markers.swapA !== undefined && markers.swapB !== undefined) swaps += 1;

    const step: TraceStep = {
      id: `student-${steps.length}`,
      title: frameTitle(algorithm, steps.length),
      description: describeMarkers(markers),
      array: values,
      markers,
      stats: {
        steps: steps.length + 1,
        swaps:
          algorithm === 'selection-sort' || algorithm === 'bubble-sort'
            ? swaps
            : undefined,
      },
      result: undefined,
    };
    steps.push(step);
  }

  steps[steps.length - 1] = {
    ...steps[steps.length - 1],
    result: resultToTraceResult(algorithm, result),
  };

  return steps;
}

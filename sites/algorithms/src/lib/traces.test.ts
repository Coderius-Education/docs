import { describe, expect, it } from 'vitest';
import { algorithmModels } from '../data/algorithmModels';
import { steppingStoneModels } from '../data/steppingStoneModels';
import {
  traceBinarySearch,
  traceBubbleSort,
  traceLinearSearch,
  traceMaximum,
  traceMinAndMax,
  traceSelectionSort,
} from './algorithmTraces';
import { adaptStudentTrace } from './studentTraceAdapters';

// De referentietraces en de adapters die een Python-trace van een leerling
// omzetten naar markers voor de visualisatie. Dit stond eerst in
// scripts/test-traces.mjs, een los script dat nergens in CI draaide: 877
// regels logica waar niets op lette. Nu draait het in de blokkerende
// test-job, met dezelfde gevallen.

function laatsteStap<T>(stappen: T[]): T {
  expect(stappen.length).toBeGreaterThan(0);
  return stappen[stappen.length - 1];
}

describe('referentietraces', () => {
  it('lineair zoeken vindt het laatste element', () => {
    const stap = laatsteStap(traceLinearSearch([3, 1, 4, 1, 5], 5));
    expect(stap.result).toBe(4);
    expect(stap.markers.activeIndex).toBe(4);
  });

  it('maximum van louter negatieve getallen', () => {
    const stap = laatsteStap(traceMaximum([-3, -1, -7]));
    expect(stap.result).toBe(-1);
    expect(stap.markers.maxIndex).toBe(1);
  });

  it('min en max tegelijk', () => {
    const stap = laatsteStap(traceMinAndMax([5, 2, 8, 1, 7, 4]));
    expect(stap.result).toEqual({ min: 1, max: 8 });
    expect(stap.markers.minIndex).toBe(3);
    expect(stap.markers.maxIndex).toBe(2);
  });

  it('binair zoeken naar een ontbrekend element eindigt met laag > hoog', () => {
    const stap = laatsteStap(traceBinarySearch([1, 3, 5, 7, 9, 11, 13, 15], 4));
    expect(stap.result).toBe(-1);
    expect(Number(stap.markers.low)).toBeGreaterThan(Number(stap.markers.high));
  });

  it('selection sort telt zijn swaps', () => {
    const stap = laatsteStap(traceSelectionSort([5, 2, 8, 1, 4]));
    expect(stap.array).toEqual([1, 2, 4, 5, 8]);
    expect(stap.result).toBe('gesorteerd');
    expect(stap.stats.swaps).toBe(5);
  });

  it('bubble sort op een gesorteerde lijst stopt na één ronde zonder swaps', () => {
    const stap = laatsteStap(traceBubbleSort([1, 2, 3, 4, 5]));
    expect(stap.array).toEqual([1, 2, 3, 4, 5]);
    expect(stap.result).toBe('gesorteerd');
    expect(stap.stats.passes).toBe(1);
    expect(stap.stats.swaps).toBe(0);
  });
});

describe('de catalogus van algoritme-modellen', () => {
  it('bevat de zes algoritmes in leerlijn-volgorde', () => {
    expect(algorithmModels.map((m) => m.id)).toEqual([
      'linear-search',
      'maximum',
      'min-and-max',
      'binary-search',
      'selection-sort',
      'bubble-sort',
    ]);
  });

  it.each(algorithmModels.map((m) => [m.id, m] as const))(
    '%s heeft een werkende trace, startcode en tests',
    (_id, model) => {
      expect(typeof model.title).toBe('string');
      expect(model.defaultInput.values.length).toBeGreaterThan(0);
      expect(model.exercise.starterCode).toContain(`def ${model.exercise.functionName}`);
      expect(model.exercise.starterCode).toContain('Schrijf je oplossing hier');
      expect(model.exercise.tests.length).toBeGreaterThanOrEqual(3);
      expect(model.trace(model.defaultInput).length).toBeGreaterThan(0);
      expect(Array.isArray(model.traceArgs(model.defaultInput))).toBe(true);
    },
  );
});

describe('de stepping-stone-modellen', () => {
  it('zijn er vierentwintig, met unieke ids', () => {
    expect(steppingStoneModels).toHaveLength(24);
    expect(new Set(steppingStoneModels.map((m) => m.id)).size).toBe(24);
  });

  it.each(steppingStoneModels.map((m) => [m.id, m] as const))(
    '%s hoort bij een bekend algoritme en heeft een werkende visualisatie',
    (_id, model) => {
      const algoritme = algorithmModels.find((m) => m.id === model.algorithm);
      expect(algoritme, `onbekend algoritme ${model.algorithm}`).toBeDefined();
      if (!algoritme) return;
      expect(typeof model.title).toBe('string');
      expect(typeof model.summary).toBe('string');
      expect(typeof model.visual.hint).toBe('string');
      expect(Array.isArray(model.visual.input.values)).toBe(true);
      expect(model.visual.focusStep).toBeGreaterThanOrEqual(0);
      expect(model.exercise.starterCode).toContain(`def ${model.exercise.functionName}`);
      expect(model.exercise.starterCode).toContain('Schrijf je oplossing hier');
      expect(model.exercise.tests.length).toBeGreaterThanOrEqual(2);
      expect(algoritme.trace(model.visual.input).length).toBeGreaterThan(0);
    },
  );
});

describe('adaptStudentTrace — van Python-frames naar markers', () => {
  it('binair zoeken: laag, hoog en midden volgen de locals', () => {
    const lijst = [1, 3, 5, 7, 9];
    const stappen = adaptStudentTrace(
      'binary-search',
      { values: lijst, target: 7 },
      [
        { event: 'line', line: 4, locals: { lijst, doel: 7, laag: 0, hoog: 4 } },
        { event: 'line', line: 5, locals: { lijst, doel: 7, laag: 0, hoog: 4, midden: 2 } },
        { event: 'line', line: 9, locals: { lijst, doel: 7, laag: 3, hoog: 4, midden: 2 } },
      ],
      undefined,
    );
    expect(stappen[1].markers.low).toBe(0);
    expect(stappen[1].markers.high).toBe(4);
    expect(stappen[1].markers.mid).toBe(2);
    expect(stappen[2].markers.low).toBe(3);
  });

  it('min en max: de indexen volgen de gevonden waarden', () => {
    const lijst = [5, 2, 8, 1];
    const stappen = adaptStudentTrace(
      'min-and-max',
      { values: lijst },
      [
        { event: 'line', line: 2, locals: { lijst, klein: 5, groot: 5 } },
        { event: 'line', line: 5, locals: { lijst, waarde: 8, klein: 2, groot: 8 } },
      ],
      [1, 8],
    );
    expect(stappen[0].markers.minIndex).toBe(0);
    expect(stappen[0].markers.maxIndex).toBe(0);
    expect(stappen[1].markers.minIndex).toBe(1);
    expect(stappen[1].markers.maxIndex).toBe(2);
    expect(stappen[stappen.length - 1].result).toEqual({ min: 1, max: 8 });
  });

  it('bubble sort: een swap wordt herkend aan de veranderde lijst', () => {
    const stappen = adaptStudentTrace(
      'bubble-sort',
      { values: [3, 1, 4] },
      [
        { event: 'line', line: 5, locals: { lijst: [3, 1, 4], ronde: 0, i: 0 } },
        { event: 'line', line: 7, locals: { lijst: [1, 3, 4], ronde: 0, i: 0, geswapt: true } },
      ],
      [1, 3, 4],
    );
    expect(stappen[1].array).toEqual([1, 3, 4]);
    expect(stappen[1].markers.swapA).toBe(0);
    expect(stappen[1].markers.swapB).toBe(1);
    expect(stappen[1].stats.swaps).toBe(1);
  });

  it('lineair zoeken: elke bezochte index krijgt een marker, het resultaat volgt de return', () => {
    const lijst = [3, 1, 4, 1, 5];
    const frame = (line: number, extra: Record<string, unknown>) => ({
      event: 'line' as const,
      line,
      locals: { lijst, doel: 5, ...extra },
    });
    const stappen = adaptStudentTrace(
      'linear-search',
      { values: lijst, target: 5 },
      [
        frame(2, {}),
        frame(3, { i: 0, waarde: 3 }),
        frame(2, { i: 0, waarde: 3 }),
        frame(3, { i: 1, waarde: 1 }),
        frame(2, { i: 1, waarde: 1 }),
        frame(3, { i: 2, waarde: 4 }),
        frame(2, { i: 2, waarde: 4 }),
        frame(3, { i: 3, waarde: 1 }),
        frame(2, { i: 3, waarde: 1 }),
        frame(3, { i: 4, waarde: 5 }),
        frame(4, { i: 4, waarde: 5 }),
        {
          event: 'return' as const,
          line: 4,
          locals: { lijst, doel: 5, i: 4, waarde: 5 },
          returnValue: 4,
        },
      ],
      4,
    );
    const bezocht = stappen
      .map((s) => s.markers.activeIndex)
      .filter((index) => index !== undefined);
    expect(bezocht).toEqual([0, 1, 2, 3, 4]);
    expect(stappen[stappen.length - 1].result).toBe(4);
  });
});

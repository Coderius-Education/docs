import { describe, expect, it } from 'vitest';
import { formatValue } from './traceUtils';

describe('formatValue', () => {
  it('None heet geen, ook als Pyodide er undefined van maakt', () => {
    // De code-oefening van het model meldde "verwacht 3; kreeg undefined".
    expect(formatValue(null)).toBe('geen');
    expect(formatValue(undefined)).toBe('geen');
    expect(formatValue([1, undefined])).toBe('[1, geen]');
  });
});

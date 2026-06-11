import type {ExerciseTestCase} from '@site/src/data/algorithmModels';
import type {
  TraceMarkers,
  TraceResult,
  TraceStep,
} from '@site/src/lib/algorithmTraces';

export type PyProxyLike = {
  toJs: (opts?: {dict_converter?: typeof Object.fromEntries}) => unknown;
  destroy?: () => void;
};

export function formatValue(value: unknown): string {
  if (value === null) return 'geen';
  if (Array.isArray(value)) return `[${value.map(formatValue).join(', ')}]`;
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

export function formatArguments(args: unknown[]): string {
  return args.map(formatValue).join(', ');
}

export function formatResult(result: TraceResult | undefined): string {
  if (result === undefined) return '-';
  if (typeof result === 'object' && result !== null && 'min' in result) {
    return `min ${result.min}, max ${result.max}`;
  }
  return formatValue(result);
}

export function clampStep(index: number, steps: TraceStep[]): number {
  if (steps.length === 0) return 0;
  return Math.min(Math.max(index, 0), steps.length - 1);
}

export function markerLabels(index: number, markers: TraceMarkers): string[] {
  const labels: string[] = [];
  if (markers.low === index) labels.push('laag');
  if (markers.high === index) labels.push('hoog');
  if (markers.mid === index) labels.push('mid');
  if (markers.minIndex === index) labels.push('min');
  if (markers.maxIndex === index) labels.push('max');
  if (markers.outerIndex === index) labels.push('i');
  if (markers.scanIndex === index) labels.push('j');
  if (markers.foundIndex === index) labels.push('raak');
  if (markers.swapA === index || markers.swapB === index) labels.push('swap');
  return labels;
}

export function isSortedMarker(
  index: number,
  markers: TraceMarkers,
): boolean {
  return (
    (markers.sortedUntil !== undefined && index <= markers.sortedUntil) ||
    (markers.sortedFrom !== undefined && index >= markers.sortedFrom)
  );
}

export function isOutsideSearchWindow(
  index: number,
  markers: TraceMarkers,
): boolean {
  if (markers.low === undefined || markers.high === undefined) return false;
  return index < markers.low || index > markers.high;
}

export function filterTraceback(raw: string): string {
  const lines = raw.split('\n');
  let lineNumber: string | null = null;
  for (const line of lines) {
    const match = line.match(/File "<exec>", line (\d+)/);
    if (match) lineNumber = match[1];
  }

  const errorLine =
    [...lines]
      .reverse()
      .find((line) => /^[A-Z]\w*(Error|Exception)/.test(line.trim())) ??
    [...lines].reverse().find((line) => line.trim().length > 0) ??
    raw;

  return (lineNumber ? `Fout op regel ${lineNumber}\n` : '') + errorLine.trim();
}

export function buildPythonHarness(
  code: string,
  functionName: string,
  tests: ExerciseTestCase[],
): string {
  const testsJson = JSON.stringify(tests);
  return `${code}

import copy as _coderius_copy
import json as _coderius_json

def _coderius_normalize(value):
    if isinstance(value, tuple):
        return [_coderius_normalize(v) for v in value]
    if isinstance(value, list):
        return [_coderius_normalize(v) for v in value]
    return value

_coderius_tests = _coderius_json.loads(${JSON.stringify(testsJson)})
_coderius_results = []
for _coderius_test in _coderius_tests:
    try:
        _coderius_args = _coderius_copy.deepcopy(_coderius_test["args"])
        _coderius_expected = _coderius_normalize(_coderius_test["expected"])
        _coderius_actual = _coderius_normalize(${functionName}(*_coderius_args))
        _coderius_results.append({
            "label": _coderius_test["label"],
            "passed": _coderius_actual == _coderius_expected,
            "expected": _coderius_expected,
            "actual": _coderius_actual,
            "error": None,
        })
    except Exception as _coderius_exc:
        _coderius_results.append({
            "label": _coderius_test["label"],
            "passed": False,
            "expected": _coderius_test.get("expected"),
            "actual": None,
            "error": f"{type(_coderius_exc).__name__}: {_coderius_exc}",
        })

_coderius_results`;
}

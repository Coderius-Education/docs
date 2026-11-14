import { HighlightedEditor } from '@coderius/python-runner/HighlightedEditor';
import { useInLesTab } from '@coderius/shared/components/LesTabs/paneel';
import { meetRuimte, pasHoogte } from '@coderius/shared/components/LesTabs/pasHoogte';
import clsx from 'clsx';
import type React from 'react';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
// Relatief, niet via @site, en zonder useBaseUrl (dat geeft index.tsx mee):
// zo kan de test (AlgorithmModel.test.tsx) het model renderen zonder de
// bundler van Docusaurus.
import {
  type AlgorithmInput,
  type AlgorithmModelId,
  type ExerciseTestCase,
  getAlgorithmModel,
} from '../../data/algorithmModels';
import type { TraceStep } from '../../lib/algorithmTraces';
import { type RawPythonTraceFrame, adaptStudentTrace } from '../../lib/studentTraceAdapters';
import {
  type PyProxyLike,
  buildPythonHarness,
  clampStep,
  filterTraceback,
  formatArguments,
  formatResult,
  formatValue,
  isOutsideSearchWindow,
  isSortedMarker,
  markerLabels,
} from '../../lib/traceUtils';
import { type PyodideInterface, loadPyodideOnce, warmupPyodide } from '../PyRunner/usePyodide';
import styles from './styles.module.css';

/**
 * Lager wordt de code-oefening in een les-tabblad niet: de werkbalk, een
 * regel of tien code en de eerste testgevallen.
 */
export const MIN_OEFENING = 300;
/** De kop boven de editor, tot hij gemeten is. */
const PANEELKOP = 38;
/** De binnenrand van de code-oefening (1rem boven en onder) en de rand van de editor. */
const BINNENRAND = 2 * 16 + 2;

export type AlgorithmModelProps = {
  algorithm: AlgorithmModelId;
  /**
   * Alleen de visualisatie: geen tabs, geen code-oefening en geen bron-
   * schakelaar. Voor de bekijk-pagina's, waar de leerling nog geen eigen
   * code heeft; Pyodide wordt dan ook niet opgewarmd.
   */
  alleenVisualisatie?: boolean;
};

type InputDraft = {
  values: string;
  target: string;
};

type ParsedInput = { input: AlgorithmInput; error: null } | { input: null; error: string };

type ParsedExerciseTests =
  | { tests: ExerciseTestCase[]; error: null }
  | { tests: ExerciseTestCase[]; error: string };

type ExerciseStatus = 'idle' | 'loading' | 'running' | 'done' | 'error';

type TestRunResult = {
  label: string;
  passed: boolean;
  expected: unknown;
  actual: unknown;
  error: string | null;
};

type StudentTraceRun = {
  trace: RawPythonTraceFrame[];
  result: unknown;
  error: string | null;
};

function inputToDraft(input: AlgorithmInput): InputDraft {
  return {
    values: input.values.join(', '),
    target: String(input.target ?? ''),
  };
}

function parseNumberList(raw: string): number[] {
  const trimmed = raw.trim();
  if (!trimmed) return [];
  const withoutBrackets = trimmed.replace(/^\[/, '').replace(/\]$/, '');
  return withoutBrackets.split(',').map((part) => {
    const value = Number(part.trim());
    if (!Number.isFinite(value)) {
      throw new Error(`"${part.trim()}" is geen geldig getal.`);
    }
    return value;
  });
}

function parseInput(draft: InputDraft, needsTarget: boolean): ParsedInput {
  try {
    const values = parseNumberList(draft.values);
    const input: AlgorithmInput = { values };
    if (needsTarget) {
      const target = Number(draft.target);
      if (!Number.isFinite(target)) {
        return { input: null, error: 'Vul een geldig doelgetal in.' };
      }
      input.target = target;
    }
    return { input, error: null };
  } catch (error) {
    return {
      input: null,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

function parseExerciseTests(raw: string): ParsedExerciseTests {
  try {
    const parsed = JSON.parse(raw) as ExerciseTestCase[];
    if (!Array.isArray(parsed)) {
      return { tests: [], error: 'Tests moeten een JSON-lijst zijn.' };
    }
    for (const [index, test] of parsed.entries()) {
      if (
        !test ||
        typeof test.label !== 'string' ||
        !Array.isArray(test.args) ||
        !('expected' in test)
      ) {
        return {
          tests: [],
          error: `Test ${index + 1} heeft label, args en expected nodig.`,
        };
      }
    }
    return { tests: parsed, error: null };
  } catch (error) {
    return {
      tests: [],
      error: error instanceof Error ? error.message : 'Tests zijn geen geldige JSON.',
    };
  }
}

function buildStudentTraceHarness(code: string, functionName: string, args: unknown[]): string {
  const argsJson = JSON.stringify(args);
  return `${code}

import copy as _coderius_copy
import json as _coderius_json
import sys as _coderius_sys

def _coderius_safe(value, depth=0):
    if depth > 4:
        return repr(value)
    if value is None or isinstance(value, (bool, int, float, str)):
        return value
    if isinstance(value, (list, tuple)):
        return [_coderius_safe(item, depth + 1) for item in list(value)[:40]]
    if isinstance(value, dict):
        return {
            str(key): _coderius_safe(item, depth + 1)
            for key, item in list(value.items())[:40]
        }
    return repr(value)

def _coderius_safe_locals(frame_locals):
    blocked = {"_coderius_trace", "_coderius_safe", "_coderius_safe_locals"}
    return {
        str(key): _coderius_safe(value)
        for key, value in frame_locals.items()
        if not str(key).startswith("__") and key not in blocked
    }

_coderius_args = _coderius_json.loads(${JSON.stringify(argsJson)})
_coderius_trace = []
_coderius_result = None
_coderius_error = None

try:
    _coderius_function = ${functionName}
    _coderius_target_code = _coderius_function.__code__

    def _coderius_tracer(frame, event, arg):
        if frame.f_code is _coderius_target_code and event in ("line", "return"):
            record = {
                "event": event,
                "line": frame.f_lineno,
                "locals": _coderius_safe_locals(frame.f_locals),
            }
            if event == "return":
                record["returnValue"] = _coderius_safe(arg)
            _coderius_trace.append(record)
        return _coderius_tracer

    _coderius_sys.settrace(_coderius_tracer)
    try:
        _coderius_result = _coderius_function(*_coderius_copy.deepcopy(_coderius_args))
    finally:
        _coderius_sys.settrace(None)
except Exception as _coderius_exc:
    _coderius_sys.settrace(None)
    _coderius_error = f"{type(_coderius_exc).__name__}: {_coderius_exc}"

{
    "trace": _coderius_trace,
    "result": _coderius_safe(_coderius_result),
    "error": _coderius_error,
}`;
}

export default function Model({
  algorithm,
  alleenVisualisatie = false,
  pyodideIndexURL,
}: AlgorithmModelProps & { pyodideIndexURL: string }): React.ReactElement {
  const model = getAlgorithmModel(algorithm);
  const pyodideRef = useRef<PyodideInterface | null>(null);

  // Warm Pyodide alvast op in de achtergrond (zie warmupPyodide).
  useEffect(() => {
    if (!alleenVisualisatie) warmupPyodide(pyodideIndexURL);
  }, [pyodideIndexURL, alleenVisualisatie]);
  const [activeTab, setActiveTab] = useState<'visual' | 'exercise'>('visual');
  const [draft, setDraft] = useState<InputDraft>(() => inputToDraft(model.defaultInput));
  const [stepIndex, setStepIndex] = useState(0);
  const [code, setCode] = useState(model.exercise.starterCode);
  const [testsDraft, setTestsDraft] = useState(() => JSON.stringify(model.exercise.tests, null, 2));
  const [exerciseStatus, setExerciseStatus] = useState<ExerciseStatus>('idle');
  const [exerciseMessage, setExerciseMessage] = useState('');
  const [testResults, setTestResults] = useState<TestRunResult[]>([]);
  const [stdout, setStdout] = useState('');
  const [stderr, setStderr] = useState('');
  const [traceMode, setTraceMode] = useState<'reference' | 'student'>('reference');
  const [studentSteps, setStudentSteps] = useState<TraceStep[] | null>(null);
  const [studentTraceMessage, setStudentTraceMessage] = useState('');

  // In een les-tabblad moet het model op het scherm passen, en even hoog
  // blijven: bij een wissel tussen Visualisatie en Code-oefening, en voor en na
  // Run tests. De code-oefening krijgt de hoogte van de visualisatie (en
  // minstens MIN_OEFENING), maar niet meer dan er op het scherm over is na de
  // rest van het paneel (pasHoogte.ts); de visualisatie wordt nooit lager dan
  // de oefening. Een lange uitvoer schuift in de kolom met de tests, lange
  // code in de editor. Op een smal scherm scrolt de leerling, en verandert er
  // niets.
  const inTab = useInLesTab();
  const meetHoogte = inTab && !alleenVisualisatie;
  const lijfRef = useRef<HTMLDivElement>(null);
  const visueelRef = useRef<HTMLDivElement>(null);
  const kopRef = useRef<HTMLDivElement>(null);
  /** De hoogte van de visualisatie zonder ondergrens, zoals laatst gemeten. */
  const visueelHoogte = useRef(0);
  const [hoogte, setHoogte] = useState<number | null>(null);
  // biome-ignore lint/correctness/useExhaustiveDependencies: bij een wissel van Visualisatie naar Code-oefening is er een ander element om te meten
  useLayoutEffect(() => {
    const lijf = lijfRef.current;
    const paneel = lijf?.closest<HTMLElement>('[data-les-tab]');
    if (!meetHoogte || !lijf || !paneel || typeof ResizeObserver === 'undefined') return;
    const breed = window.matchMedia('(min-width: 997px)');
    const meet = () => {
      if (!breed.matches) return setHoogte(null);
      // Een model in een dicht tabblad heeft geen maten.
      if (lijf.clientWidth === 0) return;
      const visueel = visueelRef.current;
      if (visueel) visueelHoogte.current = visueel.offsetHeight;
      const doel = Math.max(visueelHoogte.current, MIN_OEFENING);
      const ruimte = meetRuimte(lijf, paneel, doel);
      if (ruimte) setHoogte(pasHoogte(ruimte, MIN_OEFENING));
    };
    meet();
    const kijker = new ResizeObserver(meet);
    kijker.observe(paneel);
    if (visueelRef.current) kijker.observe(visueelRef.current);
    window.addEventListener('resize', meet);
    breed.addEventListener('change', meet);
    return () => {
      kijker.disconnect();
      window.removeEventListener('resize', meet);
      breed.removeEventListener('change', meet);
    };
  }, [meetHoogte, activeTab]);

  useEffect(() => {
    setDraft(inputToDraft(model.defaultInput));
    setStepIndex(0);
    setCode(model.exercise.starterCode);
    setTestsDraft(JSON.stringify(model.exercise.tests, null, 2));
    setTestResults([]);
    setStdout('');
    setStderr('');
    setExerciseStatus('idle');
    setExerciseMessage('');
    setTraceMode('reference');
    setStudentSteps(null);
    setStudentTraceMessage('');
  }, [model]);

  const needsTarget = model.controls.some((control) => control.key === 'target');
  const parsedInput = useMemo(() => parseInput(draft, needsTarget), [draft, needsTarget]);
  const testPreview = useMemo(() => parseExerciseTests(testsDraft), [testsDraft]);
  const referenceSteps = useMemo(
    () => (parsedInput.input ? model.trace(parsedInput.input) : []),
    [model, parsedInput],
  );
  const visibleSteps = traceMode === 'student' && studentSteps ? studentSteps : referenceSteps;
  const safeStepIndex = clampStep(stepIndex, visibleSteps);
  const currentStep = visibleSteps[safeStepIndex];

  useEffect(() => {
    setStepIndex((current) => clampStep(current, visibleSteps));
  }, [visibleSteps]);

  const updateDraft = useCallback((key: keyof InputDraft, value: string) => {
    setDraft((current) => ({ ...current, [key]: value }));
    setStepIndex(0);
    setTraceMode('reference');
    setStudentSteps(null);
    setStudentTraceMessage('');
  }, []);

  const handleCodeChange = useCallback((next: string) => {
    setCode(next);
    setTraceMode('reference');
    setStudentSteps(null);
    setStudentTraceMessage('');
  }, []);

  const runExerciseTests = useCallback(async () => {
    setExerciseStatus('loading');
    setExerciseMessage('Python wordt geladen...');
    setTestResults([]);
    setStdout('');
    setStderr('');

    const parsedTests = parseExerciseTests(testsDraft);
    if (parsedTests.error) {
      setExerciseStatus('error');
      setExerciseMessage(parsedTests.error);
      return;
    }
    const tests = parsedTests.tests;

    try {
      if (!pyodideRef.current) {
        pyodideRef.current = await loadPyodideOnce(pyodideIndexURL);
      }
      const py = pyodideRef.current;
      let out = '';
      let err = '';
      py.setStdout({
        batched: (value) => {
          out += `${value}\n`;
        },
      });
      py.setStderr({
        batched: (value) => {
          err += `${value}\n`;
        },
      });
      setExerciseStatus('running');
      setExerciseMessage('Tests draaien...');

      const result = await py.runPythonAsync(
        buildPythonHarness(code, model.exercise.functionName, tests),
      );
      const proxy = result as PyProxyLike;
      const jsResult =
        proxy && typeof proxy.toJs === 'function'
          ? proxy.toJs({ dict_converter: Object.fromEntries })
          : result;
      proxy?.destroy?.();
      setStdout(out);
      setStderr(err);
      setTestResults(jsResult as TestRunResult[]);
      setExerciseStatus('done');
      setExerciseMessage('Tests klaar');
    } catch (error) {
      setExerciseStatus('error');
      setExerciseMessage(filterTraceback(error instanceof Error ? error.message : String(error)));
    }
  }, [code, model.exercise.functionName, pyodideIndexURL, testsDraft]);

  const runStudentTrace = useCallback(async () => {
    if (!parsedInput.input) {
      setExerciseStatus('error');
      setExerciseMessage(parsedInput.error);
      return;
    }

    setExerciseStatus('loading');
    setExerciseMessage('Python wordt geladen...');
    setStudentTraceMessage('');
    setStdout('');
    setStderr('');

    try {
      if (!pyodideRef.current) {
        pyodideRef.current = await loadPyodideOnce(pyodideIndexURL);
      }
      const py = pyodideRef.current;
      let out = '';
      let err = '';
      py.setStdout({
        batched: (value) => {
          out += `${value}\n`;
        },
      });
      py.setStderr({
        batched: (value) => {
          err += `${value}\n`;
        },
      });
      setExerciseStatus('running');
      setExerciseMessage('Jouw code wordt getraceerd...');

      const result = await py.runPythonAsync(
        buildStudentTraceHarness(
          code,
          model.exercise.functionName,
          model.traceArgs(parsedInput.input),
        ),
      );
      const proxy = result as PyProxyLike;
      const jsResult =
        proxy && typeof proxy.toJs === 'function'
          ? proxy.toJs({ dict_converter: Object.fromEntries })
          : result;
      proxy?.destroy?.();
      const traceRun = jsResult as StudentTraceRun;
      const nextSteps = adaptStudentTrace(
        model.id,
        parsedInput.input,
        traceRun.trace ?? [],
        traceRun.result,
      );

      setStdout(out);
      setStderr(err);
      setStudentSteps(nextSteps);
      setTraceMode('student');
      setStepIndex(0);
      setActiveTab('visual');
      setExerciseStatus(traceRun.error ? 'error' : 'done');
      setExerciseMessage(traceRun.error ?? 'Trace klaar');
      setStudentTraceMessage(
        traceRun.error
          ? `Jouw code stopte met een fout: ${traceRun.error}`
          : 'Je kijkt nu naar de stappen van jouw Python-code.',
      );
    } catch (error) {
      setExerciseStatus('error');
      setExerciseMessage(filterTraceback(error instanceof Error ? error.message : String(error)));
    }
  }, [code, model, parsedInput, pyodideIndexURL]);

  const busy = exerciseStatus === 'loading' || exerciseStatus === 'running';
  // De editor vult de code-oefening; langere code schuift erin.
  const editorMax =
    hoogte === null ? undefined : hoogte - BINNENRAND - (kopRef.current?.offsetHeight ?? PANEELKOP);
  const passedCount = testResults.filter((result) => result.passed).length;

  const testgevallen = (
    <>
      <div className={styles.testList}>
        <div className={styles.testsHeader}>
          <span>Testgevallen</span>
          <span>{testPreview.tests.length} tests</span>
        </div>
        {testPreview.error ? (
          <div className={styles.inputError}>{testPreview.error}</div>
        ) : (
          testPreview.tests.map((test, index) => (
            <div key={`${test.label}-${index}`} className={styles.testItem}>
              <strong>{test.label}</strong>
              <p>
                <span>Input</span> {`${model.exercise.functionName}(${formatArguments(test.args)})`}
              </p>
              <p>
                <span>Verwacht</span> {formatValue(test.expected)}
              </p>
            </div>
          ))
        )}
      </div>
      <details className={styles.advancedTests}>
        <summary>Testgevallen aanpassen</summary>
        <label className={styles.testsEditor}>
          <span>JSON</span>
          <textarea
            value={testsDraft}
            onChange={(event) => setTestsDraft(event.target.value)}
            spellCheck={false}
            disabled={busy}
          />
        </label>
      </details>
    </>
  );
  const uitkomsten = (
    <>
      <div className={styles.exerciseActions}>
        <button
          type="button"
          className={styles.runButton}
          onClick={runExerciseTests}
          disabled={busy}
        >
          {busy ? 'Bezig...' : 'Draai de tests'}
        </button>
        <button
          type="button"
          className={styles.traceButton}
          onClick={runStudentTrace}
          disabled={busy}
        >
          Visualiseer mijn code
        </button>
      </div>
      {exerciseMessage && (
        <output
          className={clsx(styles.exerciseStatus, {
            [styles.exerciseError]: exerciseStatus === 'error',
          })}
          aria-live="polite"
          aria-atomic="true"
        >
          {exerciseMessage}
        </output>
      )}
      {testResults.length > 0 && (
        <div className={styles.results}>
          <strong>
            {passedCount}/{testResults.length} tests goed
          </strong>
          {testResults.map((result) => (
            <div
              key={result.label}
              className={clsx(styles.resultRow, {
                [styles.resultPass]: result.passed,
                [styles.resultFail]: !result.passed,
              })}
            >
              <span>{result.passed ? 'goed' : 'fout'}</span>
              <div>
                <strong>{result.label}</strong>
                {result.error ? (
                  <p>{result.error}</p>
                ) : (
                  <p>
                    verwacht {formatValue(result.expected)}; kreeg {formatValue(result.actual)}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      {(stdout || stderr) && (
        <pre className={styles.consoleOutput}>{[stdout, stderr].filter(Boolean).join('\n')}</pre>
      )}
    </>
  );
  return (
    <section
      className={clsx(styles.model, inTab && styles.inTab)}
      aria-label={`${model.title} model`}
    >
      <div className={styles.header}>
        <div>
          {/* In een tabblad zegt de werkvorm al wat dit is. */}
          {!inTab && <p className={styles.kicker}>Interactief model</p>}
          {/* Geen <h2>: de koppen van een les zijn haar tabbladen en stappen,
              en een kop van het model hoort daar niet tussen. */}
          {/* Een kop voor een schermlezer, met de maat van de titel: een <h2>
              kreeg in een tabblad de opmaak van de les. */}
          {/* biome-ignore lint/a11y/useSemanticElements: een <h2> neemt de opmaak van de les over */}
          <p className={styles.title} role="heading" aria-level={3}>
            {model.title}
          </p>
          <p className={styles.summary}>{model.summary}</p>
        </div>
        {!alleenVisualisatie && (
          <div className={styles.tabs} role="tablist" aria-label="Modelweergave">
            <button
              type="button"
              className={clsx(styles.tab, activeTab === 'visual' && styles.tabActive)}
              onClick={() => setActiveTab('visual')}
            >
              Visualisatie
            </button>
            <button
              type="button"
              className={clsx(styles.tab, activeTab === 'exercise' && styles.tabActive)}
              onClick={() => setActiveTab('exercise')}
            >
              Code-oefening
            </button>
          </div>
        )}
      </div>

      <div
        ref={lijfRef}
        style={
          hoogte === null
            ? undefined
            : activeTab === 'visual'
              ? { minHeight: hoogte }
              : { height: hoogte }
        }
      >
        {alleenVisualisatie || activeTab === 'visual' ? (
          <div className={styles.visualGrid} ref={visueelRef}>
            <div className={styles.controls}>
              {model.controls.map((control) => (
                <label key={control.key} className={styles.field}>
                  <span>{control.label}</span>
                  <input
                    value={control.key === 'values' ? draft.values : draft.target}
                    type="text"
                    inputMode={control.kind === 'number' ? 'decimal' : 'text'}
                    onChange={(event) =>
                      updateDraft(
                        control.key === 'values' ? 'values' : 'target',
                        event.target.value,
                      )
                    }
                    aria-describedby={`${model.id}-${control.key}-help`}
                  />
                  <small id={`${model.id}-${control.key}-help`}>{control.help}</small>
                </label>
              ))}
              {parsedInput.error && <div className={styles.inputError}>{parsedInput.error}</div>}
            </div>

            <div className={styles.stage}>
              <div className={styles.metrics}>
                {!alleenVisualisatie && (
                  <span>
                    Bron {traceMode === 'student' && studentSteps ? 'mijn code' : 'referentie'}
                  </span>
                )}
                <span>
                  Stap {visibleSteps.length ? safeStepIndex : 0}/
                  {Math.max(visibleSteps.length - 1, 0)}
                </span>
                <span>Vergelijkingen {currentStep?.stats.comparisons ?? 0}</span>
                {currentStep?.stats.swaps !== undefined && (
                  <span>Swaps {currentStep.stats.swaps}</span>
                )}
                {currentStep?.stats.passes !== undefined && (
                  <span>Passes {currentStep.stats.passes}</span>
                )}
                <span>Resultaat {formatResult(currentStep?.result)}</span>
              </div>

              {!alleenVisualisatie && (
                <div className={styles.sourceToggle} aria-label="Trace bron">
                  <button
                    type="button"
                    className={clsx(
                      styles.sourceButton,
                      traceMode === 'reference' && styles.sourceButtonActive,
                    )}
                    onClick={() => {
                      setTraceMode('reference');
                      setStepIndex(0);
                    }}
                  >
                    Referentie
                  </button>
                  <button
                    type="button"
                    className={clsx(
                      styles.sourceButton,
                      traceMode === 'student' && styles.sourceButtonActive,
                    )}
                    onClick={() => {
                      if (studentSteps) {
                        setTraceMode('student');
                        setStepIndex(0);
                      }
                    }}
                    disabled={!studentSteps}
                  >
                    Mijn code
                  </button>
                  {/* Op dezelfde regel als de knoppen: zo wordt de visualisatie
                    niet hoger als hij de stappen van jouw code toont. */}
                  {studentTraceMessage && traceMode === 'student' && (
                    <output className={styles.traceNotice} aria-live="polite" aria-atomic="true">
                      {studentTraceMessage}
                    </output>
                  )}
                </div>
              )}

              <div className={styles.array} aria-label="Algoritme status">
                {(currentStep?.array ?? []).map((value, index) => {
                  const markers = currentStep?.markers ?? {};
                  const labels = markerLabels(index, markers);
                  const active =
                    markers.activeIndex === index ||
                    markers.compareIndex === index ||
                    markers.compareWithIndex === index ||
                    markers.mid === index;
                  return (
                    <div
                      key={`${index}-${value}`}
                      className={clsx(styles.cell, {
                        [styles.cellActive]: active,
                        [styles.cellMin]: markers.minIndex === index,
                        [styles.cellMax]: markers.maxIndex === index,
                        [styles.cellSwap]: markers.swapA === index || markers.swapB === index,
                        [styles.cellFound]: markers.foundIndex === index,
                        [styles.cellSorted]: isSortedMarker(index, markers),
                        [styles.cellMuted]: isOutsideSearchWindow(index, markers),
                      })}
                    >
                      <span className={styles.cellIndex}>{index}</span>
                      <strong>{value}</strong>
                      <span className={styles.cellLabels}>{labels.join(' ')}</span>
                    </div>
                  );
                })}
              </div>

              {currentStep && (
                <div className={styles.explanation}>
                  {/* biome-ignore lint/a11y/useSemanticElements: een <h3> neemt de opmaak van de les over */}
                  <p className={styles.stepTitle} role="heading" aria-level={4}>
                    {currentStep.title}
                  </p>
                  <p>{currentStep.description}</p>
                </div>
              )}

              <div className={styles.stepper}>
                <button
                  type="button"
                  onClick={() => setStepIndex(0)}
                  disabled={safeStepIndex === 0}
                >
                  Eerste
                </button>
                <button
                  type="button"
                  onClick={() => setStepIndex((index) => Math.max(index - 1, 0))}
                  disabled={safeStepIndex === 0}
                >
                  Vorige
                </button>
                <input
                  type="range"
                  min={0}
                  max={Math.max(visibleSteps.length - 1, 0)}
                  value={safeStepIndex}
                  onChange={(event) => setStepIndex(Number(event.target.value))}
                  aria-label="Stap"
                />
                <button
                  type="button"
                  onClick={() =>
                    setStepIndex((index) => Math.min(index + 1, visibleSteps.length - 1))
                  }
                  disabled={safeStepIndex >= visibleSteps.length - 1}
                >
                  Volgende
                </button>
                <button
                  type="button"
                  onClick={() => setStepIndex(Math.max(visibleSteps.length - 1, 0))}
                  disabled={safeStepIndex >= visibleSteps.length - 1}
                >
                  Laatste
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className={styles.exerciseGrid}>
            <div className={styles.editorPanel}>
              <div className={styles.panelHeader} ref={kopRef}>
                <span>Python</span>
                <button
                  type="button"
                  onClick={() => handleCodeChange(model.exercise.starterCode)}
                  disabled={busy}
                >
                  Reset
                </button>
              </div>
              <HighlightedEditor
                code={code}
                onChange={handleCodeChange}
                disabled={busy}
                minHeight={editorMax === undefined ? 300 : Math.min(300, editorMax)}
                maxHeight={editorMax}
                ariaLabel={`${model.title} Python code`}
              />
            </div>

            <div className={styles.testsPanel}>
              {/* In een tabblad staan de knoppen en de uitkomsten boven de
                  testgevallen, ook in de DOM: met CSS `order` liep de Tab-toets
                  eerst langs de lijst en dan pas naar de knoppen. */}
              {inTab && uitkomsten}
              {testgevallen}
              {!inTab && uitkomsten}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

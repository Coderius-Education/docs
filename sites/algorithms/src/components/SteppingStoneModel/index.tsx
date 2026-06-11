import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import clsx from 'clsx';
import useBaseUrl from '@docusaurus/useBaseUrl';
import {HighlightedEditor} from '@site/src/components/PythonPlayground';
import {getAlgorithmModel} from '@site/src/data/algorithmModels';
import {
  getSteppingStoneModel,
  type SteppingStoneModelId,
} from '@site/src/data/steppingStoneModels';
import {type TraceStep} from '@site/src/lib/algorithmTraces';
import {
  loadPyodideOnce,
  type PyodideInterface,
} from '@site/src/components/PyRunner/usePyodide';
import {
  buildPythonHarness,
  clampStep,
  filterTraceback,
  formatArguments,
  formatResult,
  formatValue,
  isOutsideSearchWindow,
  isSortedMarker,
  markerLabels,
  type PyProxyLike,
} from '@site/src/lib/traceUtils';
import styles from './styles.module.css';

type SteppingStoneModelProps = {
  stone: SteppingStoneModelId;
};

type ExerciseStatus = 'idle' | 'loading' | 'running' | 'done' | 'error';

type TestRunResult = {
  label: string;
  passed: boolean;
  expected: unknown;
  actual: unknown;
  error: string | null;
};

export default function SteppingStoneModel({
  stone,
}: SteppingStoneModelProps): React.ReactElement {
  const checkpoint = getSteppingStoneModel(stone);
  const algorithm = getAlgorithmModel(checkpoint.algorithm);
  const pyodideIndexURL = useBaseUrl('/pyodide/');
  const pyodideRef = useRef<PyodideInterface | null>(null);
  const steps = useMemo(
    () => algorithm.trace(checkpoint.visual.input),
    [algorithm, checkpoint.visual.input],
  );
  const [stepIndex, setStepIndex] = useState(() =>
    clampStep(checkpoint.visual.focusStep, steps),
  );
  const [code, setCode] = useState(checkpoint.exercise.starterCode);
  const [status, setStatus] = useState<ExerciseStatus>('idle');
  const [message, setMessage] = useState('');
  const [results, setResults] = useState<TestRunResult[]>([]);
  const [stdout, setStdout] = useState('');
  const [stderr, setStderr] = useState('');

  useEffect(() => {
    setStepIndex(clampStep(checkpoint.visual.focusStep, steps));
    setCode(checkpoint.exercise.starterCode);
    setStatus('idle');
    setMessage('');
    setResults([]);
    setStdout('');
    setStderr('');
  }, [checkpoint, steps]);

  const safeStepIndex = clampStep(stepIndex, steps);
  const currentStep = steps[safeStepIndex];
  const busy = status === 'loading' || status === 'running';
  const passedCount = results.filter((result) => result.passed).length;

  const runTests = useCallback(async () => {
    setStatus('loading');
    setMessage('Python wordt geladen...');
    setResults([]);
    setStdout('');
    setStderr('');

    try {
      if (!pyodideRef.current) {
        pyodideRef.current = await loadPyodideOnce(pyodideIndexURL);
      }
      const py = pyodideRef.current;
      let out = '';
      let err = '';
      py.setStdout({batched: (value) => (out += value + '\n')});
      py.setStderr({batched: (value) => (err += value + '\n')});
      setStatus('running');
      setMessage('Feedbacktests draaien...');

      const result = await py.runPythonAsync(
        buildPythonHarness(
          code,
          checkpoint.exercise.functionName,
          checkpoint.exercise.tests,
        ),
      );
      const proxy = result as PyProxyLike;
      const jsResult =
        proxy && typeof proxy.toJs === 'function'
          ? proxy.toJs({dict_converter: Object.fromEntries})
          : result;
      proxy?.destroy?.();
      setStdout(out);
      setStderr(err);
      setResults(jsResult as TestRunResult[]);
      setStatus('done');
      setMessage('Feedback klaar');
    } catch (error) {
      setStatus('error');
      setMessage(
        filterTraceback(error instanceof Error ? error.message : String(error)),
      );
    }
  }, [checkpoint.exercise, code, pyodideIndexURL]);

  return (
    <section className={styles.checkpoint} aria-label={`${checkpoint.title} bouwsteenmodel`}>
      <div className={styles.header}>
        <div>
          <p className={styles.kicker}>Bouwsteen model</p>
          <h2>{checkpoint.title}</h2>
          <p>{checkpoint.summary}</p>
        </div>
      </div>

      <div className={styles.grid}>
        <div className={styles.visualPanel}>
          <div className={styles.metrics}>
            <span>
              Stap {steps.length ? safeStepIndex : 0}/{Math.max(steps.length - 1, 0)}
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

          <div className={styles.array} aria-label="Bouwsteen visualisatie">
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
                    [styles.cellSwap]:
                      markers.swapA === index || markers.swapB === index,
                    [styles.cellFound]: markers.foundIndex === index,
                    [styles.cellSorted]: isSortedMarker(index, markers),
                    [styles.cellMuted]: isOutsideSearchWindow(index, markers),
                  })}>
                  <span className={styles.cellIndex}>{index}</span>
                  <strong>{value}</strong>
                  <span className={styles.cellLabels}>{labels.join(' ')}</span>
                </div>
              );
            })}
          </div>

          {currentStep && (
            <div className={styles.explanation}>
              <strong>{currentStep.title}</strong>
              <p>{currentStep.description}</p>
              <p>{checkpoint.visual.hint}</p>
            </div>
          )}

          <div className={styles.stepper}>
            <button
              type="button"
              onClick={() => setStepIndex((index) => Math.max(index - 1, 0))}
              disabled={safeStepIndex === 0}>
              Vorige
            </button>
            <input
              type="range"
              min={0}
              max={Math.max(steps.length - 1, 0)}
              value={safeStepIndex}
              onChange={(event) => setStepIndex(Number(event.target.value))}
              aria-label="Bouwsteen stap"
            />
            <button
              type="button"
              onClick={() =>
                setStepIndex((index) => Math.min(index + 1, steps.length - 1))
              }
              disabled={safeStepIndex >= steps.length - 1}>
              Volgende
            </button>
          </div>
        </div>

        <div className={styles.exercisePanel}>
          <div className={styles.panelHeader}>
            <span>Feedback</span>
            <button
              type="button"
              onClick={() => setCode(checkpoint.exercise.starterCode)}
              disabled={busy}>
              Reset
            </button>
          </div>
          <HighlightedEditor
            code={code}
            onChange={setCode}
            disabled={busy}
            minHeight={190}
            ariaLabel={`${checkpoint.title} Python feedbackcode`}
          />
          <div className={styles.testList}>
            {checkpoint.exercise.tests.map((test, index) => (
              <div key={`${test.label}-${index}`} className={styles.testItem}>
                <strong>{test.label}</strong>
                <p>
                  <span>Input</span>{' '}
                  {`${checkpoint.exercise.functionName}(${formatArguments(test.args)})`}
                </p>
                <p>
                  <span>Verwacht</span> {formatValue(test.expected)}
                </p>
              </div>
            ))}
          </div>
          <button
            type="button"
            className={styles.runButton}
            onClick={runTests}
            disabled={busy}>
            {busy ? 'Bezig...' : 'Check mijn bouwsteen'}
          </button>
          {message && (
            <div
              className={clsx(styles.status, {
                [styles.statusError]: status === 'error',
              })}
              role="status"
              aria-live="polite"
              aria-atomic="true">
              {message}
            </div>
          )}
          {results.length > 0 && (
            <div className={styles.results}>
              <strong>
                {passedCount}/{results.length} tests goed
              </strong>
              {results.map((result) => (
                <div
                  key={result.label}
                  className={clsx(styles.resultRow, {
                    [styles.resultPass]: result.passed,
                    [styles.resultFail]: !result.passed,
                  })}>
                  <span>{result.passed ? 'PASS' : 'FAIL'}</span>
                  <div>
                    <strong>{result.label}</strong>
                    {result.error ? (
                      <p>{result.error}</p>
                    ) : (
                      <p>
                        verwacht {formatValue(result.expected)}; kreeg{' '}
                        {formatValue(result.actual)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          {(stdout || stderr) && (
            <pre className={styles.consoleOutput}>
              {[stdout, stderr].filter(Boolean).join('\n')}
            </pre>
          )}
        </div>
      </div>
    </section>
  );
}

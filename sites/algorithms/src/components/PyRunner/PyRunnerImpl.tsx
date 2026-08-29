import type {
  Opname,
  PyodideInterface as StapPyodide,
} from '@coderius/python-runner/PyodideProvider';
import { tracePython } from '@coderius/python-runner/PyodideProvider';
import Stapper from '@coderius/python-runner/Stapper';
import useBaseUrl from '@docusaurus/useBaseUrl';
import { HighlightedEditor } from '@site/src/components/PythonPlayground';
import clsx from 'clsx';
import type React from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import styles from './styles.module.css';
import {
  type PyodideInterface,
  hasPyodideStarted,
  loadPyodideOnce,
  warmupPyodide,
} from './usePyodide';

// Approximate textarea-rows → pixel-height mapping. Matches the editor's
// line-height (1.5) × font-size (0.9rem ≈ 14.4px) plus vertical padding
// (0.85rem × 2 ≈ 27px). Used so callers can keep passing `rows` props.
const LINE_HEIGHT_PX = 22;
const EDITOR_PADDING_PX = 28;

export type PyRunnerProps = {
  initialCode?: string;
  children?: string;
  editable?: boolean;
  packages?: string[];
  rows?: number;
};

const MATPLOTLIB_SETUP = `
import matplotlib
matplotlib.use('AGG')
import matplotlib.pyplot as _coderius_plt
import io as _coderius_io, base64 as _coderius_b64

# plt.show() kan niets tonen met de AGG-backend en geeft dan een
# UserWarning op stderr die leerlingen als foutmelding zien. De plots
# worden na afloop via _coderius_collect_plots opgehaald, dus show()
# mag een no-op zijn.
_coderius_plt.show = lambda *args, **kwargs: None

def _coderius_collect_plots():
    images = []
    for num in _coderius_plt.get_fignums():
        fig = _coderius_plt.figure(num)
        buf = _coderius_io.BytesIO()
        fig.savefig(buf, format='png', bbox_inches='tight')
        images.append(_coderius_b64.b64encode(buf.getvalue()).decode('ascii'))
    _coderius_plt.close('all')
    return images
`;

function dedent(code: string): string {
  const lines = code.replace(/^\n/, '').replace(/\s+$/, '').split('\n');
  const indents = lines
    .filter((l) => l.trim().length > 0)
    .map((l) => l.match(/^[ \t]*/)?.[0].length ?? 0);
  const min = indents.length ? Math.min(...indents) : 0;
  return lines.map((l) => l.slice(min)).join('\n');
}

// Squeeze a Python traceback down to the line number and final error line.
// Example output: "Fout op regel 3\nNameError: name 'x' is not defined"
function filterTraceback(raw: string): string {
  const lines = raw.split('\n');

  let lineNumber: string | null = null;
  for (const line of lines) {
    const match = line.match(/File "<exec>", line (\d+)/);
    if (match) lineNumber = match[1];
  }

  let errorLine = '';
  for (let i = lines.length - 1; i >= 0; i--) {
    const trimmed = lines[i].trim();
    if (trimmed && /^[A-Z]\w*(Error|Exception|Warning)/.test(trimmed)) {
      errorLine = trimmed;
      break;
    }
  }
  if (!errorLine) {
    for (let i = lines.length - 1; i >= 0; i--) {
      if (lines[i].trim()) {
        errorLine = lines[i].trim();
        break;
      }
    }
  }
  if (!errorLine) return raw;

  return (lineNumber ? `Fout op regel ${lineNumber}\n` : '') + errorLine;
}

export default function PyRunnerImpl({
  initialCode,
  children,
  editable = true,
  packages,
  rows = 10,
}: PyRunnerProps): React.ReactElement {
  const source = useMemo(() => dedent(initialCode ?? children ?? ''), [initialCode, children]);
  const [code, setCode] = useState(source);
  const [status, setStatus] = useState<'idle' | 'loading' | 'running' | 'done' | 'error'>('idle');
  const [statusMsg, setStatusMsg] = useState<string>('');
  const [stdout, setStdout] = useState<string>('');
  const [stderr, setStderr] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [plots, setPlots] = useState<string[]>([]);
  const [opname, setOpname] = useState<Opname | null>(null);
  // De code van het moment van opnemen: de leerling mag intussen doortypen,
  // en dan zouden de regelnummers uit de opname naar de verkeerde regels wijzen.
  const [opnameCode, setOpnameCode] = useState('');
  const pyodideRef = useRef<PyodideInterface | null>(null);
  const matplotlibLoadedRef = useRef(false);
  const pyodideIndexURL = useBaseUrl('/pyodide/');

  const needsMatplotlib = useMemo(() => /\b(matplotlib|pyplot|plt\.)\b/.test(code), [code]);

  // Start de Pyodide-download op de achtergrond zodra de pagina idle is, zodat
  // de eerste "Voer uit" (bijna) direct start. Wheels voor matplotlib worden
  // alleen meegewarmd als de startercode ze nodig heeft (dat is ~39 MB extra,
  // gerechtvaardigd op matplotlib-lespagina's, verspilling elders).
  useEffect(() => {
    const wantsMatplotlib = /\b(matplotlib|pyplot|plt\.)\b/.test(source);
    const warmPackages = [...(packages ?? []), ...(wantsMatplotlib ? ['matplotlib'] : [])];
    warmupPyodide(pyodideIndexURL, warmPackages.length > 0 ? warmPackages : undefined);
  }, [source, packages, pyodideIndexURL]);

  const handleRun = useCallback(async () => {
    setStdout('');
    setStderr('');
    setErrorMsg('');
    setPlots([]);
    setOpname(null);
    try {
      if (!pyodideRef.current) {
        setStatus('loading');
        setStatusMsg(
          hasPyodideStarted()
            ? 'Python wordt geladen…'
            : 'Python wordt geladen (eenmalig, ~14 MB)…',
        );
        pyodideRef.current = await loadPyodideOnce(pyodideIndexURL);
      }
      const py = pyodideRef.current;

      // Let op: geen [...set]-spread hier. Docusaurus compileert spreads in
      // loose mode naar [].concat(set), waardoor de Set als één element
      // doorgegeven wordt en pyodide's loadPackage crasht ("t.replace is
      // not a function"). Array.from werkt wel op een Set.
      const extraPackages = new Set<string>(packages ?? []);
      if (needsMatplotlib) extraPackages.add('matplotlib');
      if (extraPackages.size > 0) {
        const packageList = Array.from(extraPackages);
        setStatus('loading');
        setStatusMsg(`Pakketten laden: ${packageList.join(', ')}…`);
        await py.loadPackage(packageList);
      }

      let out = '';
      let err = '';
      py.setStdout({
        batched: (s) => {
          out += `${s}\n`;
        },
      });
      py.setStderr({
        batched: (s) => {
          // Eenmalige, onschuldige melding bij de eerste matplotlib-import;
          // voor leerlingen alleen maar ruis.
          if (s.includes('building the font cache')) return;
          err += `${s}\n`;
        },
      });

      if (needsMatplotlib && !matplotlibLoadedRef.current) {
        await py.runPythonAsync(MATPLOTLIB_SETUP);
        matplotlibLoadedRef.current = true;
      }

      setStatus('running');
      setStatusMsg('Bezig met uitvoeren…');
      await py.runPythonAsync(code);

      if (needsMatplotlib && matplotlibLoadedRef.current) {
        const result = await py.runPythonAsync('_coderius_collect_plots()');
        const arr =
          // @ts-expect-error PyProxy has toJs
          typeof result?.toJs === 'function' ? result.toJs() : (result as string[]);
        if (Array.isArray(arr) && arr.length > 0) setPlots(arr as string[]);
      }

      setStdout(out);
      setStderr(err);
      setStatus('done');
      setStatusMsg(err ? 'Klaar — met meldingen' : 'Klaar');
    } catch (e: unknown) {
      const raw = e instanceof Error ? e.message : String(e);
      setErrorMsg(filterTraceback(raw));
      setStatus('error');
      setStatusMsg('Er ging iets mis');
    }
  }, [code, needsMatplotlib, packages, pyodideIndexURL]);

  // Zelfde voorbereiding als handleRun (Pyodide, pakketten, matplotlib-setup),
  // maar dan opnemen met tracePython in plaats van draaien: de leerling bladert
  // daarna per regel door de variabelen en de uitvoer, net als in de
  // python-cursus. De opnemer draait de code onder een eigen bestandsnaam, dus
  // de regelnummers kloppen exact met de editor.
  const handleStap = useCallback(async () => {
    setStdout('');
    setStderr('');
    setErrorMsg('');
    setPlots([]);
    setOpname(null);
    try {
      if (!pyodideRef.current) {
        setStatus('loading');
        setStatusMsg(
          hasPyodideStarted()
            ? 'Python wordt geladen…'
            : 'Python wordt geladen (eenmalig, ~14 MB)…',
        );
        pyodideRef.current = await loadPyodideOnce(pyodideIndexURL);
      }
      const py = pyodideRef.current;

      const extraPackages = new Set<string>(packages ?? []);
      if (needsMatplotlib) extraPackages.add('matplotlib');
      if (extraPackages.size > 0) {
        const packageList = Array.from(extraPackages);
        setStatus('loading');
        setStatusMsg(`Pakketten laden: ${packageList.join(', ')}…`);
        await py.loadPackage(packageList);
      }
      if (needsMatplotlib && !matplotlibLoadedRef.current) {
        await py.runPythonAsync(MATPLOTLIB_SETUP);
        matplotlibLoadedRef.current = true;
      }

      setStatus('running');
      setStatusMsg('Bezig met opnemen…');
      setOpnameCode(code);
      // Het echte pyodide-object heeft ook setStdin; het smalle type hier niet.
      setOpname(await tracePython(py as unknown as StapPyodide, code));
      setStatus('done');
      setStatusMsg('Klaar');
    } catch (e: unknown) {
      const raw = e instanceof Error ? e.message : String(e);
      setErrorMsg(filterTraceback(raw));
      setStatus('error');
      setStatusMsg('Er ging iets mis');
    }
  }, [code, needsMatplotlib, packages, pyodideIndexURL]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        const target = e.target as HTMLTextAreaElement;
        const start = target.selectionStart;
        const end = target.selectionEnd;
        setCode(`${code.substring(0, start)}    ${code.substring(end)}`);
        requestAnimationFrame(() => {
          target.selectionStart = target.selectionEnd = start + 4;
        });
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleRun();
      }
    },
    [code, handleRun],
  );

  const handleReset = useCallback(() => {
    setCode(source);
    setStdout('');
    setStderr('');
    setErrorMsg('');
    setPlots([]);
    setOpname(null);
    setStatus('idle');
    setStatusMsg('');
  }, [source]);

  const busy = status === 'loading' || status === 'running';
  const hasOutput =
    stdout.length > 0 || stderr.length > 0 || errorMsg.length > 0 || plots.length > 0;

  return (
    <div className={styles.runner}>
      <div className={styles.toolbar}>
        <span className={styles.label}>Python</span>
        <div className={styles.actions}>
          {editable && (
            <button
              type="button"
              onClick={handleReset}
              disabled={busy}
              className={clsx('button button--sm button--secondary')}
            >
              ↺ Reset
            </button>
          )}
          <button
            type="button"
            onClick={handleStap}
            disabled={busy}
            title="Loop regel voor regel door je code en zie wat elke variabele doet"
            className={clsx('button button--sm button--secondary')}
          >
            Stap voor stap
          </button>
          <button
            type="button"
            onClick={handleRun}
            disabled={busy}
            className={clsx('button button--sm button--primary')}
          >
            {busy ? '… bezig' : '▶ Voer uit'}
          </button>
        </div>
      </div>
      <HighlightedEditor
        code={code}
        onChange={setCode}
        onKeyDown={handleKeyDown}
        readOnly={!editable}
        disabled={busy}
        minHeight={rows * LINE_HEIGHT_PX + EDITOR_PADDING_PX}
      />
      {statusMsg && (
        <div
          className={clsx(styles.status, {
            [styles.statusError]: status === 'error',
            [styles.statusBusy]: busy,
          })}
        >
          {statusMsg}
        </div>
      )}
      {opname && <Stapper code={opnameCode} opname={opname} onSluiten={() => setOpname(null)} />}
      {hasOutput && (
        <div className={styles.output}>
          {stdout && <pre className={styles.stdout}>{stdout}</pre>}
          {stderr && <pre className={clsx(styles.stdout, styles.stderr)}>{stderr}</pre>}
          {errorMsg && <pre className={clsx(styles.stdout, styles.error)}>{errorMsg}</pre>}
          {plots.map((b64, i) => (
            <img
              key={b64}
              src={`data:image/png;base64,${b64}`}
              alt={`Plot ${i + 1}`}
              className={styles.plot}
            />
          ))}
        </div>
      )}
    </div>
  );
}

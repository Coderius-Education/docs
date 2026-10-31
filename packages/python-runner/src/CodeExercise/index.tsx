import BrowserOnly from '@docusaurus/BrowserOnly';
import type React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { HighlightedEditor } from '../HighlightedEditor';
import type { Opname, PyodideInterface } from '../PyodideProvider';
import Stapper from '../Stapper';
import Tekening from '../Tekening';
import type { Tekening as TekeningData } from '../Tekening/tekening';
import styles from './styles.module.css';

function CodeExerciseInner({ starterCode }: { starterCode: string }) {
  const [code, setCode] = useState(starterCode);
  const [output, setOutput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [opname, setOpname] = useState<Opname | null>(null);
  const [tekening, setTekening] = useState<TekeningData | null>(null);
  // De code zoals hij was toen de opname werd gemaakt: de leerling mag intussen
  // doortypen, en dan zouden de regelnummers uit de opname naar de verkeerde
  // regels wijzen.
  const [opnameCode, setOpnameCode] = useState('');
  const pyodideRef = useRef<PyodideInterface | null>(null);

  useEffect(() => {
    let cancelled = false;
    // Dynamic import to avoid SSR issues
    import('../PyodideProvider').then(({ getPyodide }) => {
      getPyodide()
        .then((pyodide) => {
          if (!cancelled) {
            pyodideRef.current = pyodide;
            setIsLoading(false);
          }
        })
        .catch((err) => {
          if (!cancelled) {
            setOutput(`Fout bij het laden van Python: ${err}`);
            setIsLoading(false);
          }
        });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Laadde Python niet (geen netwerk, een CDN dat de school blokkeert), dan
  // probeert een klik op Uitvoeren of Stap voor stap het opnieuw. Eerst stond
  // de knop aan maar deed hij niets, onder een foutmelding die bleef staan.
  const zorgVoorPyodide = useCallback(async (): Promise<PyodideInterface | null> => {
    if (pyodideRef.current) return pyodideRef.current;
    setIsLoading(true);
    setOutput('');
    try {
      const { getPyodide } = await import('../PyodideProvider');
      pyodideRef.current = await getPyodide();
      return pyodideRef.current;
    } catch (err) {
      setOutput(`Fout bij het laden van Python: ${err}`);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const execCode = useCallback(async () => {
    if (isRunning) return;
    const pyodide = await zorgVoorPyodide();
    if (!pyodide) return;
    setIsRunning(true);
    setOutput('');
    setOpname(null);
    setTekening(null);
    try {
      const { haalTekening, runPython } = await import('../PyodideProvider');
      const result = await runPython(pyodide, code, { turtle: true });
      setOutput(result);
      setTekening(haalTekening(pyodide));
    } catch (err) {
      setOutput(err instanceof Error ? err.message : String(err));
    } finally {
      setIsRunning(false);
    }
  }, [code, isRunning, zorgVoorPyodide]);

  const stapCode = useCallback(async () => {
    if (isRunning) return;
    const pyodide = await zorgVoorPyodide();
    if (!pyodide) return;
    setIsRunning(true);
    setOutput('');
    setTekening(null);
    try {
      const { tracePython } = await import('../PyodideProvider');
      setOpnameCode(code);
      setOpname(await tracePython(pyodide, code, undefined, { turtle: true }));
    } catch (err) {
      setOutput(err instanceof Error ? err.message : String(err));
    } finally {
      setIsRunning(false);
    }
  }, [code, isRunning, zorgVoorPyodide]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      // Tab, Shift+Tab en Enter regelt HighlightedEditor zelf; hier alleen Ctrl+Enter.
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        execCode();
      }
    },
    [execCode],
  );

  return (
    <div className={styles.exercise}>
      <div className={styles.editorSection}>
        <div className={styles.toolbar}>
          <span className={styles.label}>Probeer het zelf</span>
          <div className={styles.buttons}>
            <button
              type="button"
              className={styles.resetButton}
              onClick={() => setCode(starterCode)}
              title="Reset naar begincode"
            >
              Reset
            </button>
            <button
              type="button"
              className={styles.stapButton}
              onClick={stapCode}
              disabled={isLoading || isRunning}
              title="Loop regel voor regel door je code en zie wat elke variabele doet"
            >
              Stap voor stap
            </button>
            <button
              type="button"
              className={styles.runButton}
              onClick={execCode}
              disabled={isLoading || isRunning}
            >
              {isLoading ? 'Laden...' : isRunning ? 'Bezig...' : '▶ Uitvoeren'}
            </button>
          </div>
        </div>
        <HighlightedEditor
          code={code}
          onChange={setCode}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
          minHeight={120}
        />
      </div>
      {opname && <Stapper code={opnameCode} opname={opname} onSluiten={() => setOpname(null)} />}
      {tekening && <Tekening tekening={tekening} />}
      {output && <pre className={styles.output}>{output}</pre>}
      {isLoading && <div className={styles.loading}>Python wordt geladen...</div>}
    </div>
  );
}

export default function CodeExercise({ children }: { children: string }) {
  const code = (children || '').trim();
  return (
    <BrowserOnly
      fallback={
        <div className={styles.exercise}>
          <pre>{code}</pre>
        </div>
      }
    >
      {() => <CodeExerciseInner starterCode={code} />}
    </BrowserOnly>
  );
}

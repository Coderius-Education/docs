import type React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { HighlightedEditor } from '../HighlightedEditor';
import {
  type Opname,
  type PyodideInterface,
  getPyodide,
  runPython,
  tracePython,
} from '../PyodideProvider';
import Stapper from '../Stapper';
const DEFAULT_CODE = `# Schrijf hier je Python code
print("Hallo, wereld!")

for i in range(5):
    print(f"Getal: {i}")
`;
import styles from './styles.module.css';

// Blijft hiervandaan te importeren; de component zelf woont een map hoger.
export { HighlightedEditor };

export default function PythonPlayground(): React.JSX.Element {
  const [code, setCode] = useState(DEFAULT_CODE);
  const [output, setOutput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [opname, setOpname] = useState<Opname | null>(null);
  // De code van het moment van opnemen: de leerling mag intussen doortypen, en
  // dan zouden de regelnummers uit de opname naar de verkeerde regels wijzen.
  const [opnameCode, setOpnameCode] = useState('');
  const pyodideRef = useRef<PyodideInterface | null>(null);

  useEffect(() => {
    let cancelled = false;
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
    return () => {
      cancelled = true;
    };
  }, []);

  const execCode = useCallback(async () => {
    if (!pyodideRef.current || isRunning) return;
    setIsRunning(true);
    setOutput('');
    setOpname(null);
    try {
      const result = await runPython(pyodideRef.current, code);
      setOutput(result);
    } catch (err) {
      setOutput(`Fout:\n${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsRunning(false);
    }
  }, [code, isRunning]);

  const stapCode = useCallback(async () => {
    if (!pyodideRef.current || isRunning) return;
    setIsRunning(true);
    setOutput('');
    try {
      setOpnameCode(code);
      setOpname(await tracePython(pyodideRef.current, code));
    } catch (err) {
      setOutput(`Fout:\n${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsRunning(false);
    }
  }, [code, isRunning]);

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
    <div className={styles.playground}>
      <div className={styles.editorSection}>
        <div className={styles.toolbar}>
          <span className={styles.label}>Python Code</span>
          <div className={styles.knoppen}>
            <button
              type="button"
              className={styles.clearButton}
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
              {isLoading ? 'Python laden...' : isRunning ? 'Bezig...' : '▶ Uitvoeren'}
            </button>
          </div>
        </div>
        <HighlightedEditor
          code={code}
          onChange={setCode}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
        />
        <div className={styles.hint}>Tip: Ctrl+Enter om uit te voeren, Tab voor inspringen</div>
      </div>
      {opname && <Stapper code={opnameCode} opname={opname} onSluiten={() => setOpname(null)} />}
      <div className={styles.outputSection}>
        <div className={styles.toolbar}>
          <span className={styles.label}>Output</span>
          <button type="button" className={styles.clearButton} onClick={() => setOutput('')}>
            Wissen
          </button>
        </div>
        <pre className={styles.output}>
          {isLoading
            ? 'Python wordt geladen (dit kan een paar seconden duren)...'
            : output || 'Klik op "Uitvoeren" om je code te draaien.'}
        </pre>
      </div>
    </div>
  );
}

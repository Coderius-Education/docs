import React, { useState, useRef, useCallback, useEffect } from 'react';
import BrowserOnly from '@docusaurus/BrowserOnly';
import { HighlightedEditor } from '../PythonPlayground';
import styles from './styles.module.css';

function CodeExerciseInner({ starterCode }: { starterCode: string }) {
  const [code, setCode] = useState(starterCode);
  const [output, setOutput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const pyodideRef = useRef<any>(null);

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
    return () => { cancelled = true; };
  }, []);

  const execCode = useCallback(async () => {
    if (!pyodideRef.current || isRunning) return;
    setIsRunning(true);
    setOutput('');
    try {
      const { runPython } = await import('../PyodideProvider');
      const result = await runPython(pyodideRef.current, code);
      setOutput(result);
    } catch (err: any) {
      setOutput(err.message || String(err));
    } finally {
      setIsRunning(false);
    }
  }, [code, isRunning]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        const target = e.target as HTMLTextAreaElement;
        const start = target.selectionStart;
        const end = target.selectionEnd;
        setCode(code.substring(0, start) + '    ' + code.substring(end));
        requestAnimationFrame(() => {
          target.selectionStart = target.selectionEnd = start + 4;
        });
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        execCode();
      }
    },
    [code, execCode],
  );

  return (
    <div className={styles.exercise}>
      <div className={styles.editorSection}>
        <div className={styles.toolbar}>
          <span className={styles.label}>Probeer het zelf</span>
          <div className={styles.buttons}>
            <button
              className={styles.resetButton}
              onClick={() => setCode(starterCode)}
              title="Reset naar begincode"
            >
              Reset
            </button>
            <button
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
      {output && (
        <pre className={styles.output}>{output}</pre>
      )}
      {isLoading && (
        <div className={styles.loading}>Python wordt geladen...</div>
      )}
    </div>
  );
}

export default function CodeExercise({ children }: { children: string }) {
  const code = (children || '').trim();
  return (
    <BrowserOnly fallback={<div className={styles.exercise}><pre>{code}</pre></div>}>
      {() => <CodeExerciseInner starterCode={code} />}
    </BrowserOnly>
  );
}

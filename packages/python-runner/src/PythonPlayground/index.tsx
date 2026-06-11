import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Highlight, themes } from 'prism-react-renderer';
import { getPyodide, runPython } from '../PyodideProvider';
import styles from './styles.module.css';

// Lees de kleurmodus rechtstreeks van het `data-theme`-attribuut op <html> i.p.v.
// via useColorMode uit @docusaurus/theme-common. Dat vermijdt een import van
// theme-common in dit gedeelde package: met pnpm krijgt het anders een eigen
// fysieke kopie van theme-common, wat in de sites een tweede React-context
// oplevert ("Hook ... outside Provider", ReactContextError tijdens SSG).
function useColorMode(): { colorMode: 'light' | 'dark' } {
  const [colorMode, setColorMode] = useState<'light' | 'dark'>(() =>
    typeof document !== 'undefined' &&
    document.documentElement.getAttribute('data-theme') === 'dark'
      ? 'dark'
      : 'light',
  );
  useEffect(() => {
    const read = () =>
      setColorMode(
        document.documentElement.getAttribute('data-theme') === 'dark'
          ? 'dark'
          : 'light',
      );
    read();
    const observer = new MutationObserver(read);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });
    return () => observer.disconnect();
  }, []);
  return { colorMode };
}

const DEFAULT_CODE = `# Schrijf hier je Python code
print("Hallo, wereld!")

for i in range(5):
    print(f"Getal: {i}")
`;

export function HighlightedEditor({
  code,
  onChange,
  onKeyDown,
  disabled,
  minHeight = 250,
}: {
  code: string;
  onChange: (value: string) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  disabled: boolean;
  minHeight?: number;
}) {
  const { colorMode } = useColorMode();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const preRef = useRef<HTMLPreElement>(null);

  const gutterRef = useRef<HTMLDivElement>(null);

  const handleScroll = () => {
    if (textareaRef.current && preRef.current) {
      preRef.current.scrollTop = textareaRef.current.scrollTop;
      preRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
    if (textareaRef.current && gutterRef.current) {
      gutterRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  const lineCount = code.split('\n').length;
  const theme = colorMode === 'dark' ? themes.dracula : themes.github;

  return (
    <div className={styles.editorWrapper} style={{ minHeight }}>
      <div ref={gutterRef} className={styles.gutter} aria-hidden="true">
        {Array.from({ length: lineCount }, (_, i) => (
          <div key={i} className={styles.gutterLine}>{i + 1}</div>
        ))}
      </div>
      <Highlight theme={theme} code={code} language="python">
        {({ tokens, getLineProps, getTokenProps, style }) => (
          <pre
            ref={preRef}
            className={styles.highlightPre}
            style={{ ...style, minHeight }}
            aria-hidden="true"
          >
            {tokens.map((line, i) => (
              <div key={i} {...getLineProps({ line })}>
                {line.map((token, key) => (
                  <span key={key} {...getTokenProps({ token })} />
                ))}
              </div>
            ))}
            <br />
          </pre>
        )}
      </Highlight>
      <textarea
        ref={textareaRef}
        className={styles.editorTextarea}
        value={code}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        onScroll={handleScroll}
        spellCheck={false}
        placeholder="Schrijf hier je Python code..."
        disabled={disabled}
      />
    </div>
  );
}

export default function PythonPlayground(): React.JSX.Element {
  const [code, setCode] = useState(DEFAULT_CODE);
  const [output, setOutput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const pyodideRef = useRef<any>(null);

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
    return () => { cancelled = true; };
  }, []);

  const execCode = useCallback(async () => {
    if (!pyodideRef.current || isRunning) return;
    setIsRunning(true);
    setOutput('');
    try {
      const result = await runPython(pyodideRef.current, code);
      setOutput(result);
    } catch (err: any) {
      setOutput(`Fout:\n${err.message}`);
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
    <div className={styles.playground}>
      <div className={styles.editorSection}>
        <div className={styles.toolbar}>
          <span className={styles.label}>Python Code</span>
          <button
            className={styles.runButton}
            onClick={execCode}
            disabled={isLoading || isRunning}
          >
            {isLoading ? 'Python laden...' : isRunning ? 'Bezig...' : '▶ Uitvoeren'}
          </button>
        </div>
        <HighlightedEditor
          code={code}
          onChange={setCode}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
        />
        <div className={styles.hint}>Tip: Ctrl+Enter om uit te voeren, Tab voor inspringen</div>
      </div>
      <div className={styles.outputSection}>
        <div className={styles.toolbar}>
          <span className={styles.label}>Output</span>
          <button
            className={styles.clearButton}
            onClick={() => setOutput('')}
          >
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

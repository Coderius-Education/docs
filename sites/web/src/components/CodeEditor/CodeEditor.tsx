import React, { lazy, Suspense, useState, useEffect, useCallback, useRef } from 'react';
import BrowserOnly from '@docusaurus/BrowserOnly';
import { PreviewPane } from './PreviewPane';
import { buildDoc } from './buildDoc';
import { useDebounce } from './useDebounce';
import styles from './CodeEditor.module.css';

const EditorPane = lazy(() =>
  import('./EditorPane').then((mod) => ({ default: mod.EditorPane }))
);

type Tab = 'html' | 'css' | 'javascript';

const TAB_LABELS: Record<Tab, string> = {
  html: 'index.html',
  css: 'style.css',
  javascript: 'script.js',
};

interface CodeEditorProps {
  initialHtml?: string;
  initialCss?: string;
  initialJs?: string;
  height?: string;
  livePreview?: boolean;
  debounceMs?: number;
}

function CodeEditorInner({
  initialHtml = '',
  initialCss = '',
  initialJs = '',
  height = '420px',
  livePreview = true,
  debounceMs = 600,
}: CodeEditorProps) {
  const [activeTab, setActiveTab] = useState<Tab>('html');
  const [html, setHtml] = useState(initialHtml);
  const [css, setCss] = useState(initialCss);
  const [js, setJs] = useState(initialJs);
  const [srcDoc, setSrcDoc] = useState(() => livePreview ? buildDoc(initialHtml, initialCss, initialJs) : '');
  const [consoleLogs, setConsoleLogs] = useState<{ level: string; text: string }[]>([]);
  const consoleBodyRef = useRef<HTMLDivElement>(null);

  const debouncedHtml = useDebounce(html, debounceMs);
  const debouncedCss = useDebounce(css, debounceMs);
  const debouncedJs = useDebounce(js, debounceMs);

  useEffect(() => {
    if (livePreview) {
      setConsoleLogs([]);
      setSrcDoc(buildDoc(debouncedHtml, debouncedCss, debouncedJs));
    }
  }, [debouncedHtml, debouncedCss, debouncedJs, livePreview]);

  const handleRun = useCallback(() => {
    setConsoleLogs([]);
    setSrcDoc(buildDoc(html, css, js));
  }, [html, css, js]);

  const handleReset = useCallback(() => {
    if (window.confirm('Weet je zeker dat je terug wilt naar de startcode? Je huidige wijzigingen gaan verloren.')) {
      setHtml(initialHtml);
      setCss(initialCss);
      setJs(initialJs);
      setConsoleLogs([]);
      setSrcDoc(livePreview ? buildDoc(initialHtml, initialCss, initialJs) : '');
    }
  }, [initialHtml, initialCss, initialJs, livePreview]);

  useEffect(() => {
    function handler(e: MessageEvent) {
      if (e.data?.source === 'code-editor' && e.data?.type === 'console') {
        setConsoleLogs(prev => [...prev, { level: e.data.level, text: e.data.text }]);
      }
    }
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  useEffect(() => {
    if (consoleBodyRef.current) {
      consoleBodyRef.current.scrollTop = consoleBodyRef.current.scrollHeight;
    }
  }, [consoleLogs]);

  const handlers: Record<Tab, (v: string) => void> = {
    html: setHtml,
    css: setCss,
    javascript: setJs,
  };

  const values: Record<Tab, string> = {
    html,
    css,
    javascript: js,
  };

  const visibleTabs: Tab[] = ['html', 'css', ...(initialJs !== '' ? ['javascript' as Tab] : [])];

  return (
    <div className={styles.container}>
      <div className={styles.editorSide} style={{ height }}>
        <div className={styles.tabBar}>
          {visibleTabs.map((tab) => (
            <button
              key={tab}
              className={`${styles.tab} ${activeTab === tab ? styles.tabActive : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {TAB_LABELS[tab]}
            </button>
          ))}
          {!livePreview && (
            <button className={styles.runButton} onClick={handleRun}>
              ▶ Run
            </button>
          )}
          <button className={styles.resetButton} onClick={handleReset} title="Terug naar startcode">
            ↺ Reset
          </button>
        </div>
        <div className={styles.paneWrapper}>
          <Suspense fallback={<div className={styles.loading}>Editor laden...</div>}>
            <EditorPane
              key={activeTab}
              language={activeTab}
              value={values[activeTab]}
              onChange={handlers[activeTab]}
              height={height}
            />
          </Suspense>
        </div>
      </div>
      <div className={styles.previewColumn} style={{ height }}>
        <PreviewPane srcDoc={srcDoc} />
        {visibleTabs.includes('javascript') && (
          <div className={styles.consolePanel}>
            <div className={styles.consolePanelHeader}>
              <span>Console</span>
              {consoleLogs.length > 0 && (
                <button className={styles.consoleClear} onClick={() => setConsoleLogs([])}>wissen</button>
              )}
            </div>
            <div className={styles.consolePanelBody} ref={consoleBodyRef}>
              {consoleLogs.length === 0
                ? <span className={styles.consolePlaceholder}>Nog geen uitvoer. Gebruik console.log() om hier iets te tonen.</span>
                : consoleLogs.map((log, i) => (
                  <div key={i} className={`${styles.consoleLine} ${styles['consoleLevel_' + log.level]}`}>
                    {log.text}
                  </div>
                ))
              }
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function CodeEditor(props: CodeEditorProps) {
  return (
    <BrowserOnly fallback={<div className={styles.loading}>Editor laden...</div>}>
      {() => <CodeEditorInner {...props} />}
    </BrowserOnly>
  );
}

export default CodeEditor;

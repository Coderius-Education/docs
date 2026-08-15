import { matomoPagePath, matomoTrackEvent } from '@coderius/shared/matomo';
import BrowserOnly from '@docusaurus/BrowserOnly';
import React, { lazy, Suspense, useState, useEffect, useCallback, useRef } from 'react';
import styles from './CodeEditor.module.css';
import { PreviewPane } from './PreviewPane';
import { buildDoc } from './buildDoc';
import { useDebounce } from './useDebounce';

const EditorPane = lazy(() => import('./EditorPane').then((mod) => ({ default: mod.EditorPane })));

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
  const [srcDoc, setSrcDoc] = useState(() =>
    livePreview ? buildDoc(initialHtml, initialCss, initialJs) : '',
  );
  const [consoleLogs, setConsoleLogs] = useState<{ level: string; text: string }[]>([]);
  const consoleBodyRef = useRef<HTMLDivElement>(null);
  const editedRef = useRef(false);

  // Telt hoe een oefening gebruikt wordt, zodat we per les kunnen zien of
  // leerlingen hem echt draaien of alleen lezen. Alleen de actie en het
  // paginapad gaan naar Matomo — nooit de code uit de editor.
  const trackEditor = useCallback((action: string) => {
    matomoTrackEvent('Editor', action, matomoPagePath());
  }, []);

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
    trackEditor('Run');
  }, [html, css, js, trackEditor]);

  const handleReset = useCallback(() => {
    if (
      window.confirm(
        'Weet je zeker dat je terug wilt naar de startcode? Je huidige wijzigingen gaan verloren.',
      )
    ) {
      setHtml(initialHtml);
      setCss(initialCss);
      setJs(initialJs);
      setConsoleLogs([]);
      setSrcDoc(livePreview ? buildDoc(initialHtml, initialCss, initialJs) : '');
      // Pas na de bevestiging: een geannuleerde reset is geen reset.
      trackEditor('Reset');
    }
  }, [initialHtml, initialCss, initialJs, livePreview, trackEditor]);

  useEffect(() => {
    function handler(e: MessageEvent) {
      if (e.data?.source === 'code-editor' && e.data?.type === 'console') {
        setConsoleLogs((prev) => [...prev, { level: e.data.level, text: e.data.text }]);
      }
    }
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: consoleLogs triggert bewust een her-scroll bij nieuwe regels; de body zelf leest alleen de ref.
  useEffect(() => {
    if (consoleBodyRef.current) {
      consoleBodyRef.current.scrollTop = consoleBodyRef.current.scrollHeight;
    }
  }, [consoleLogs]);

  const values: Record<Tab, string> = {
    html,
    css,
    javascript: js,
  };

  // Bij live preview is er geen Run-knop; daar is "de leerling heeft de
  // startcode aangepast" het signaal dat de oefening gemaakt is. Eén keer per
  // editor, en alleen bij inhoud die van de startcode afwijkt — CodeMirror
  // geeft bij een tabwissel of een reset opnieuw de startcode door, en dat is
  // geen bewerking.
  //
  // useCallback houdt de identiteit stabiel zolang je in hetzelfde tabblad
  // typt; anders herconfigureert CodeMirror zijn change-listener bij elke
  // toetsaanslag. De deps wisselen in de praktijk alleen bij een tabwissel, en
  // die remount de editor toch al (zie `key` hieronder).
  const handleChange = useCallback(
    (value: string) => {
      const setters: Record<Tab, (v: string) => void> = {
        html: setHtml,
        css: setCss,
        javascript: setJs,
      };
      const initialValues: Record<Tab, string> = {
        html: initialHtml,
        css: initialCss,
        javascript: initialJs,
      };
      setters[activeTab](value);
      if (!editedRef.current && value !== initialValues[activeTab]) {
        editedRef.current = true;
        trackEditor('Bewerkt');
      }
    },
    [activeTab, initialHtml, initialCss, initialJs, trackEditor],
  );

  const visibleTabs: Tab[] = ['html', 'css', ...(initialJs !== '' ? ['javascript' as Tab] : [])];

  return (
    <div className={styles.container}>
      <div className={styles.editorSide} style={{ height }}>
        <div className={styles.tabBar}>
          {visibleTabs.map((tab) => (
            <button
              type="button"
              key={tab}
              className={`${styles.tab} ${activeTab === tab ? styles.tabActive : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {TAB_LABELS[tab]}
            </button>
          ))}
          {!livePreview && (
            <button type="button" className={styles.runButton} onClick={handleRun}>
              ▶ Run
            </button>
          )}
          <button
            type="button"
            className={styles.resetButton}
            onClick={handleReset}
            title="Terug naar startcode"
          >
            ↺ Reset
          </button>
        </div>
        <div className={styles.paneWrapper}>
          <Suspense fallback={<div className={styles.loading}>Editor laden...</div>}>
            <EditorPane
              key={activeTab}
              language={activeTab}
              value={values[activeTab]}
              onChange={handleChange}
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
                <button
                  type="button"
                  className={styles.consoleClear}
                  onClick={() => setConsoleLogs([])}
                >
                  wissen
                </button>
              )}
            </div>
            <div className={styles.consolePanelBody} ref={consoleBodyRef}>
              {consoleLogs.length === 0 ? (
                <span className={styles.consolePlaceholder}>
                  Nog geen uitvoer. Gebruik console.log() om hier iets te tonen.
                </span>
              ) : (
                consoleLogs.map((log, i) => (
                  <div
                    key={`${i}-${log.text}`}
                    className={`${styles.consoleLine} ${styles[`consoleLevel_${log.level}`]}`}
                  >
                    {log.text}
                  </div>
                ))
              )}
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

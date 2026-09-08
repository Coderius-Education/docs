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
  /** Gestapeld: code bovenaan, uitvoer en console eronder over de volle
   *  breedte (js-basics); zonder deze prop staan editor en preview naast
   *  elkaar (html-css). Gestapeld groeit de editor mee met de code, met
   *  `height` als maximum. */
  stacked?: boolean;
  /** Maximumhoogte van het voorbeeld in gestapelde vorm; het voorbeeld
   *  groeit tot dit maximum mee met zijn inhoud. */
  previewHeight?: string;
}

function CodeEditorInner({
  initialHtml = '',
  initialCss = '',
  initialJs = '',
  height = '420px',
  livePreview = true,
  debounceMs = 600,
  stacked = false,
  previewHeight = '340px',
}: CodeEditorProps) {
  const [activeTab, setActiveTab] = useState<Tab>('html');
  const [html, setHtml] = useState(initialHtml);
  const [css, setCss] = useState(initialCss);
  const [js, setJs] = useState(initialJs);
  const [srcDoc, setSrcDoc] = useState(() =>
    livePreview ? buildDoc(initialHtml, initialCss, initialJs) : '',
  );
  const [consoleLogs, setConsoleLogs] = useState<{ level: string; text: string }[]>([]);
  const [previewInhoud, setPreviewInhoud] = useState<number | null>(null);
  // Het oefenveld staat in de contentkolom van Docusaurus, en die is
  // begrensd: op een laptop van 1440px is de editor ~490px en het voorbeeld
  // 327px, smaller dan een telefoon. Voor een Make-opdracht is dat te krap.
  const [uitgeklapt, setUitgeklapt] = useState(false);
  const knopRef = useRef<HTMLButtonElement>(null);
  const consoleBodyRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

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
    if (
      window.confirm(
        'Weet je zeker dat je terug wilt naar de startcode? Je huidige wijzigingen gaan verloren.',
      )
    ) {
      setHtml(initialHtml);
      setCss(initialCss);
      setJs(initialJs);
      setConsoleLogs([]);
      setPreviewInhoud(null);
      setSrcDoc(livePreview ? buildDoc(initialHtml, initialCss, initialJs) : '');
    }
  }, [initialHtml, initialCss, initialJs, livePreview]);

  // Escape sluit, en de pagina eronder mag niet meescrollen zolang het veld
  // het scherm vult.
  useEffect(() => {
    if (!uitgeklapt) return;
    const opToets = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setUitgeklapt(false);
    };
    const vorigeOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', opToets);
    return () => {
      window.removeEventListener('keydown', opToets);
      document.body.style.overflow = vorigeOverflow;
    };
  }, [uitgeklapt]);

  // De focus terug naar de knop waarmee je uitklapte, anders staat hij na het
  // sluiten bovenaan de pagina en moet je met Tab terugzoeken. Alleen ná een
  // keer uitklappen: bij het laden van de pagina mag een oefenveld de focus
  // niet naar zich toe trekken.
  const isUitgeklaptGeweest = useRef(false);
  useEffect(() => {
    if (uitgeklapt) {
      isUitgeklaptGeweest.current = true;
    } else if (isUitgeklaptGeweest.current) {
      knopRef.current?.focus({ preventScroll: true });
    }
  }, [uitgeklapt]);

  useEffect(() => {
    function handler(e: MessageEvent) {
      // Alleen berichten van het eigen voorbeeld: er staan meerdere velden
      // op een lespagina, en die mogen elkaars console en hoogte niet zien.
      if (e.source !== iframeRef.current?.contentWindow) return;
      if (e.data?.source !== 'code-editor') return;
      if (e.data.type === 'console') {
        setConsoleLogs((prev) => [...prev, { level: e.data.level, text: e.data.text }]);
      } else if (e.data.type === 'height' && typeof e.data.height === 'number') {
        setPreviewInhoud(e.data.height);
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

  const veld = (
    <div
      className={[
        styles.container,
        stacked ? styles.containerStacked : '',
        uitgeklapt ? styles.containerUitgeklapt : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className={styles.editorSide} style={{ height: stacked ? 'auto' : height }}>
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
          <span className={styles.tabBarKnoppen}>
            {!livePreview && (
              <button type="button" className={styles.runButton} onClick={handleRun}>
                ▶ Run
              </button>
            )}
            <button
              type="button"
              ref={knopRef}
              className={styles.groterButton}
              onClick={() => setUitgeklapt((aan) => !aan)}
              title={
                uitgeklapt
                  ? 'Terug naar de les (of druk op Escape)'
                  : 'Gebruik het hele scherm voor dit oefenveld'
              }
              aria-pressed={uitgeklapt}
            >
              <span className={styles.groterIcoon} aria-hidden="true">
                {uitgeklapt ? '\u2715' : '\u21F1\u21F2'}
              </span>
              {uitgeklapt ? 'Sluiten (Esc)' : 'Groter'}
            </button>
            <button
              type="button"
              className={styles.resetButton}
              onClick={handleReset}
              title="Terug naar startcode"
            >
              ↺ Reset
            </button>
          </span>
        </div>
        <div className={styles.paneWrapper}>
          <Suspense fallback={<div className={styles.loading}>Editor laden...</div>}>
            <EditorPane
              key={activeTab}
              language={activeTab}
              value={values[activeTab]}
              onChange={handlers[activeTab]}
              // Uitgeklapt vult de editor zijn helft van het scherm. In de
              // gestapelde vorm meet hij zich normaal naar de code, met de
              // height-prop als maximum; dat maximum is de lespagina-hoogte en
              // liet uitgeklapt 150px van de editorkant leeg staan.
              height={uitgeklapt ? '100%' : height}
              autoHeight={stacked && !uitgeklapt}
            />
          </Suspense>
        </div>
      </div>
      <div className={styles.previewColumn} style={stacked ? undefined : { height }}>
        <PreviewPane
          srcDoc={srcDoc}
          innerRef={iframeRef}
          // Gestapeld eindigt het voorbeeld waar zijn inhoud eindigt, zodat een
          // veld met twee regels uitvoer geen half scherm beslaat. Uitgeklapt
          // is dat juist verkeerd: dan bleef het voorbeeld 160px hoog terwijl
          // er 450px voor hem klaarstond.
          hoogte={
            stacked && !uitgeklapt
              ? `${Math.min(Math.max(previewInhoud ?? 160, 100), Number.parseInt(previewHeight, 10))}px`
              : undefined
          }
        />
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

  // Bewust geen portal en geen remount: het veld blijft op dezelfde plek in de
  // React-boom staan en wordt alleen anders gepositioneerd. Zou het verhuizen,
  // dan koppelt de editor opnieuw aan en is de leerling zijn undo-geschiedenis
  // kwijt op het moment dat hij juist meer ruimte vroeg.
  return veld;
}

export function CodeEditor(props: CodeEditorProps) {
  return (
    <BrowserOnly fallback={<div className={styles.loading}>Editor laden...</div>}>
      {() => <CodeEditorInner {...props} />}
    </BrowserOnly>
  );
}

export default CodeEditor;

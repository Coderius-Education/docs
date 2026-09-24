import BrowserOnly from '@docusaurus/BrowserOnly';
import React, {
  lazy,
  Suspense,
  useState,
  useEffect,
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
} from 'react';
import styles from './CodeEditor.module.css';
import { PreviewPane } from './PreviewPane';
import { buildDoc } from './buildDoc';
import { heeftJavaScript } from './heeftJs';
import { VoorbeeldNavigatie } from './navigatie';
import { useDebounce } from './useDebounce';
import { type OpslagStand, useOpslag } from './useOpslag';
import { kanVolledigScherm, schermStand } from './volledigScherm';

const EditorPane = lazy(() => import('./EditorPane').then((mod) => ({ default: mod.EditorPane })));

type Tab = 'html' | 'css' | 'javascript';

// Het scrollslot telt hoe vaak het gezet is. Er staan vier oefenvelden op een
// js-basics-pagina; zou elk exemplaar zijn eigen vorige waarde bewaren en
// terugzetten, dan kan een tweede veld `hidden` opslaan als "de vorige stand"
// en dat bij het sluiten terugzetten. De pagina blijft dan onscrollbaar tot je
// ververst.
let scrollSloten = 0;
let overflowVoorSlot = '';

function zetScrollSlot(aan: boolean): void {
  if (aan) {
    if (scrollSloten === 0) {
      overflowVoorSlot = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
    }
    scrollSloten += 1;
    return;
  }
  scrollSloten = Math.max(0, scrollSloten - 1);
  if (scrollSloten === 0) document.body.style.overflow = overflowVoorSlot;
}

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
  // De id waaraan dit veld de berichten van zijn eigen voorbeeld herkent; zie
  // buildDoc waarom dat niet met e.source kan.
  const [veldId] = useState(() => Math.random().toString(36).slice(2));
  const [srcDoc, setSrcDoc] = useState(() =>
    livePreview ? buildDoc(initialHtml, initialCss, initialJs, veldId) : '',
  );
  const [consoleLogs, setConsoleLogs] = useState<{ level: string; text: string }[]>([]);
  const [previewInhoud, setPreviewInhoud] = useState<number | null>(null);
  // Het oefenveld staat in de contentkolom van Docusaurus, en die is
  // begrensd: op een laptop van 1440px is de editor ~490px en het voorbeeld
  // 327px, smaller dan een telefoon. Voor een Make-opdracht is dat te krap.
  const [uitgeklapt, setUitgeklapt] = useState(false);
  // Echt volledig scherm naast Groter: ook de adresbalk en de tabs weg. De
  // stand volgt alleen `fullscreenchange`, want de browser beslist zelf
  // wanneer hij eindigt (Esc, F11, de melding bovenin).
  const [volledig, setVolledig] = useState(false);
  const [kanVolledig] = useState(() => kanVolledigScherm(document, document.documentElement));
  const groot = uitgeklapt || volledig;
  const stand = schermStand(uitgeklapt, volledig);
  const containerRef = useRef<HTMLDivElement>(null);
  const knopRef = useRef<HTMLButtonElement>(null);
  const volledigKnopRef = useRef<HTMLButtonElement>(null);
  const consoleBodyRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Volgt de leerling een link in zijn voorbeeld, dan is zijn pagina weg en
  // werkt de Terug-knop van de browser niet in een srcdoc-iframe. De eigen
  // pagina meldt zich en meldt het als hij verlaten wordt (buildDoc);
  // navigatie.ts maakt daar "weg" of niet van. De knop, en Reset, laden de
  // eigen pagina opnieuw door de iframe te vervangen (`versie` is zijn key).
  const [navigatie] = useState(() => new VoorbeeldNavigatie());
  const [weg, setWeg] = useState(false);
  const [versie, setVersie] = useState(0);
  // De berichten komen als losse taken binnen; de handler leest dan de srcDoc
  // die op dat moment in de iframe staat, niet die van zijn eigen render.
  const srcDocRef = useRef(srcDoc);
  useLayoutEffect(() => {
    srcDocRef.current = srcDoc;
  }, [srcDoc]);
  const herlaadEigenPagina = useCallback(() => {
    setWeg(false);
    setVersie((n) => n + 1);
  }, []);

  // Het werk van de leerling blijft bewaard in deze browser (opslag.ts).
  const huidig = useMemo(() => ({ html, css, js }), [html, css, js]);
  const opslag = useOpslag({
    start: { html: initialHtml, css: initialCss, js: initialJs },
    huidig,
    containerRef,
    onHerstel: (code) => {
      setHtml(code.html);
      setCss(code.css);
      setJs(code.js);
      if (livePreview) setSrcDoc(buildDoc(code.html, code.css, code.js, veldId));
    },
  });

  const debouncedHtml = useDebounce(html, debounceMs);
  const debouncedCss = useDebounce(css, debounceMs);
  const debouncedJs = useDebounce(js, debounceMs);

  useEffect(() => {
    if (livePreview) {
      setConsoleLogs([]);
      setSrcDoc(buildDoc(debouncedHtml, debouncedCss, debouncedJs, veldId));
    }
  }, [debouncedHtml, debouncedCss, debouncedJs, livePreview, veldId]);

  const handleRun = useCallback(() => {
    setConsoleLogs([]);
    setSrcDoc(buildDoc(html, css, js, veldId));
  }, [html, css, js, veldId]);

  const handleReset = useCallback(() => {
    if (
      window.confirm(
        'Weet je zeker dat je terug wilt naar de startcode? Je huidige wijzigingen gaan verloren, ook de versie die in deze browser bewaard is.',
      )
    ) {
      opslag.wis();
      setHtml(initialHtml);
      setCss(initialCss);
      setJs(initialJs);
      setConsoleLogs([]);
      setPreviewInhoud(null);
      setSrcDoc(livePreview ? buildDoc(initialHtml, initialCss, initialJs, veldId) : '');
      // Ongewijzigde code geeft dezelfde srcDoc en dus geen herlaad; na een
      // gevolgde link bleef het voorbeeld dan op de vreemde pagina staan.
      herlaadEigenPagina();
    }
  }, [initialHtml, initialCss, initialJs, livePreview, herlaadEigenPagina, veldId, opslag.wis]);

  // Escape sluit, en de pagina eronder mag niet meescrollen zolang het veld
  // het scherm vult.
  useEffect(() => {
    if (!uitgeklapt) return;
    const opToets = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      // CodeMirror gebruikt Escape zelf: het sluit de suggestielijst
      // (completionKeymap) en het schrapt een meervoudige of niet-lege
      // selectie (simplifySelection). Beide roepen preventDefault aan maar
      // geen stopPropagation, dus het event komt hier ook langs. Zonder deze
      // regel klapte het hele veld dicht zodra je een lijst wegdrukte of een
      // selectie ophief, midden in het typen. Een tweede druk sluit wel.
      if (e.defaultPrevented) return;
      setUitgeklapt(false);
    };
    zetScrollSlot(true);
    window.addEventListener('keydown', opToets);
    return () => {
      window.removeEventListener('keydown', opToets);
      zetScrollSlot(false);
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

  // Volledig scherm zet dezelfde container in de bovenste laag van de
  // browser. Niets verhuist in de React-boom, dus ook hier blijft de
  // undo-geschiedenis staan. Escape hoeven we niet af te vangen: die pakt de
  // browser zelf, en hij meldt het einde met fullscreenchange.
  const uitgeklaptRef = useRef(uitgeklapt);
  uitgeklaptRef.current = uitgeklapt;
  const isVolledigGeweest = useRef(false);
  useEffect(() => {
    const bijWissel = () => {
      const aan = document.fullscreenElement === containerRef.current;
      setVolledig(aan);
      if (aan) {
        isVolledigGeweest.current = true;
      } else if (isVolledigGeweest.current) {
        isVolledigGeweest.current = false;
        // Kwam je uit Groter, dan sta je daar weer en is de Groter-knop
        // ("Sluiten") de logische volgende; anders de knop waarmee je begon.
        (uitgeklaptRef.current ? knopRef : volledigKnopRef).current?.focus({
          preventScroll: true,
        });
      }
    };
    document.addEventListener('fullscreenchange', bijWissel);
    return () => {
      document.removeEventListener('fullscreenchange', bijWissel);
      // Verdwijnt het veld terwijl het het scherm vult (de leerling navigeert
      // weg), dan zou de browser op een leeg volledig scherm blijven staan.
      if (document.fullscreenElement && document.fullscreenElement === containerRef.current) {
        void document.exitFullscreen();
      }
    };
  }, []);

  const wisselVolledig = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    if (document.fullscreenElement === container) {
      void document.exitFullscreen();
      return;
    }
    // Weigert de browser toch (geen klik meer als gebruikersactie, een
    // beleid op een beheerd apparaat), dan is Groter het beste wat er is.
    container.requestFullscreen().catch(() => setUitgeklapt(true));
  }, []);

  useEffect(() => {
    function handler(e: MessageEvent) {
      // Alleen berichten van het eigen voorbeeld: er staan meerdere velden
      // op een lespagina, en die mogen elkaars console en hoogte niet zien.
      // Aan de id, niet aan e.source: na een navigatie naar een andere site
      // komt het bericht van pagehide al van een ander window.
      if (e.data?.source !== 'code-editor' || e.data.veld !== veldId) return;
      if (e.data.type === 'console') {
        // Uitvoer klapt de console open, ook in een html-css-veld: wie daar
        // een console.log typt, moet het resultaat niet hoeven zoeken.
        setConsoleOpen(true);
        setConsoleLogs((prev) => [...prev, { level: e.data.level, text: e.data.text }]);
      } else if (e.data.type === 'height' && typeof e.data.height === 'number') {
        setPreviewInhoud(e.data.height);
      } else if (e.data.type === 'escape') {
        setUitgeklapt(false);
      } else if (e.data.type === 'eigen' || e.data.type === 'verlaten') {
        const stand = navigatie.bericht(e.data.type, srcDocRef.current);
        if (stand !== 'ongewijzigd') setWeg(stand === 'weg');
      }
    }
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [navigatie, veldId]);

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

  // De console staat er altijd, als balk onder het voorbeeld. In een veld
  // zonder JavaScript (de html-css-lessen) is hij dicht, zodat het voorbeeld
  // zijn ruimte houdt; een klik of uitvoer klapt hem open. Komt er JavaScript
  // in het veld, ook alleen in een onclick, dan gaat hij één keer vanzelf
  // open en blijft dan open: wegtypen en terugtypen van een handler liet het
  // voorbeeld eronder anders op en neer springen.
  const [consoleOpen, setConsoleOpen] = useState(() => heeftJavaScript(initialHtml, initialJs));
  const [jsGezien, setJsGezien] = useState(consoleOpen);
  if (!jsGezien && heeftJavaScript(html, js)) {
    setJsGezien(true);
    setConsoleOpen(true);
  }

  const veld = (
    <div
      ref={containerRef}
      data-zaad={opslag.zaad}
      className={[
        styles.container,
        stacked ? styles.containerStacked : '',
        groot ? styles.containerUitgeklapt : '',
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
            <OpslagMelding stand={opslag.stand} />
            {!livePreview && (
              <button type="button" className={styles.runButton} onClick={handleRun}>
                ▶ Run
              </button>
            )}
            {stand !== 'volledig' && (
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
            )}
            {kanVolledig && (
              <button
                type="button"
                ref={volledigKnopRef}
                className={stand === 'volledig' ? styles.groterButton : styles.volledigButton}
                onClick={wisselVolledig}
                title={
                  stand === 'volledig'
                    ? 'Terug (of druk op Escape)'
                    : 'Ook de balken van de browser weg: het oefenveld op het hele beeldscherm'
                }
                aria-pressed={stand === 'volledig'}
              >
                {stand === 'volledig' ? 'Sluiten (Esc)' : 'Volledig scherm'}
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
          </span>
        </div>
        <div className={styles.paneWrapper}>
          {!opslag.geladen ? (
            <div className={styles.loading}>Editor laden...</div>
          ) : (
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
                height={groot ? '100%' : height}
                autoHeight={stacked && !groot}
              />
            </Suspense>
          )}
        </div>
      </div>
      <div className={styles.previewColumn} style={stacked ? undefined : { height }}>
        <PreviewPane
          srcDoc={srcDoc}
          innerRef={iframeRef}
          weg={weg}
          onTerug={herlaadEigenPagina}
          versie={versie}
          // Gestapeld eindigt het voorbeeld waar zijn inhoud eindigt, zodat een
          // veld met twee regels uitvoer geen half scherm beslaat. Uitgeklapt
          // is dat juist verkeerd: dan bleef het voorbeeld 160px hoog terwijl
          // er 450px voor hem klaarstond.
          hoogte={
            stacked && !groot
              ? `${Math.min(Math.max(previewInhoud ?? 160, 100), Number.parseInt(previewHeight, 10))}px`
              : undefined
          }
        />
        <div className={`${styles.consolePanel} ${consoleOpen ? '' : styles.consolePanelDicht}`}>
          <div className={styles.consolePanelHeader}>
            <button
              type="button"
              className={styles.consoleToggle}
              onClick={() => setConsoleOpen((open) => !open)}
              aria-expanded={consoleOpen}
              title={consoleOpen ? 'Console inklappen' : 'Console openklappen'}
            >
              <span aria-hidden="true">{consoleOpen ? '\u25BE' : '\u25B8'}</span> Console
              {!consoleOpen && consoleLogs.length > 0 && ` (${consoleLogs.length})`}
            </button>
            {consoleOpen && consoleLogs.length > 0 && (
              <button
                type="button"
                className={styles.consoleClear}
                onClick={() => setConsoleLogs([])}
              >
                wissen
              </button>
            )}
          </div>
          {consoleOpen && (
            <div className={styles.consolePanelBody} ref={consoleBodyRef}>
              {consoleLogs.length === 0 ? (
                <span className={styles.consolePlaceholder}>
                  {jsGezien
                    ? 'Nog geen uitvoer. Gebruik console.log() om hier iets te tonen.'
                    : 'Nog geen JavaScript in deze pagina. Gebruik je console.log(), dan verschijnt de uitvoer hier.'}
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
          )}
        </div>
      </div>
    </div>
  );

  // Bewust geen portal en geen remount: het veld blijft op dezelfde plek in de
  // React-boom staan en wordt alleen anders gepositioneerd. Zou het verhuizen,
  // dan koppelt de editor opnieuw aan en is de leerling zijn undo-geschiedenis
  // kwijt op het moment dat hij juist meer ruimte vroeg.
  return veld;
}

// Alleen iets te zeggen als er iets bewaard is, of juist niet kan worden.
// Een veld dat de leerling nog niet aanraakte, blijft stil.
function OpslagMelding({ stand }: { stand: OpslagStand }) {
  if (stand === 'leeg') return null;
  if (stand === 'bewaard') {
    return (
      <output
        className={styles.opslagMelding}
        title="Je code staat in deze browser op dit apparaat. Op een andere computer, in een privévenster of na het wissen van je browsergegevens is hij er niet."
      >
        Bewaard in deze browser
      </output>
    );
  }
  return (
    <output className={`${styles.opslagMelding} ${styles.opslagFout}`}>
      {stand === 'vol'
        ? 'Niet bewaard: de opslag van je browser is vol. Kopieer je code als je hem wilt houden.'
        : 'Niet bewaard: deze browser slaat hier niets op (privévenster?). Kopieer je code als je hem wilt houden.'}
    </output>
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

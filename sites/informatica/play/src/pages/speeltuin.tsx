import Keuzelijst from '@coderius/shared/components/Keuzelijst';
import { bevestig } from '@coderius/shared/dialoog';
import { useOpslag } from '@coderius/shared/oefenveld/useOpslag';
import BrowserOnly from '@docusaurus/BrowserOnly';
import Layout from '@theme/Layout';
import type React from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { codeerDeelLink } from '../lib/deellink';
import {
  SPEELTUIN_START,
  type SpeeltuinWerk,
  beginVanAdres,
  leesEigenAdres,
  speeltuinOpslag,
  standaardCode,
  zetEigenAdres,
} from '../lib/speeltuin-opslag';
import styles from './speeltuin.module.css';

// De runner-modules zijn plain JS en laden lui; hun types komen uit de bron.
type Engine = typeof import('../components/CodeRunner/engine');
type Shared = typeof import('../components/SharedRunner');
type Preset = typeof import('../components/CodeRunner/presets')['presets'][number];
type CodeEditorComponent = React.ComponentType<{
  value: string;
  onChange: (code: string) => void;
  readOnly?: boolean;
  height?: string;
}>;
type ConsoleLine = { text: string; isError: boolean };
type PendingRun = { code: string; mode: string; lineOffset: number; ingevoegd: number[] };

function PlaygroundInner() {
  // Waar de speeltuin mee opent: de startcode (en daarna het bewaarde werk),
  // of de code uit het adres. Zie beginVanAdres.
  const [begin] = useState(() => beginVanAdres(window.location.hash, leesEigenAdres()));
  const [code, setCode] = useState(begin.code);
  const [mode, setMode] = useState<string>(begin.modus);
  const [isRunning, setIsRunning] = useState(false);
  const [presetsOpen, setPresetsOpen] = useState(false);
  const [consoleLines, setConsoleLines] = useState<ConsoleLine[]>([]);
  const presetsRef = useRef<HTMLDivElement>(null);
  const slotRef = useRef<HTMLDivElement>(null);
  const consoleRef = useRef<HTMLDivElement>(null);
  const pendingRunRef = useRef<PendingRun | null>(null);

  const ownerId = useMemo(() => 'speeltuin', []);

  // Lazy-load heavier components + the SharedRunner module (which pulls in
  // engine.js as a side-effect). Page-load stays light if the user never runs.
  const [CodeEditor, setCodeEditor] = useState<CodeEditorComponent | null>(null);
  const [engine, setEngine] = useState<Engine | null>(null);
  const [shared, setShared] = useState<Shared | null>(null);
  const [presets, setPresets] = useState<Preset[]>([]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: mount-only — prewarmt Pyodide met de begincode; latere bewerkingen mogen dit niet opnieuw triggeren (dat zou de dynamic imports herladen).
  useEffect(() => {
    Promise.all([
      import('../components/CodeRunner/CodeEditor'),
      import('../components/CodeRunner/engine'),
      import('../components/CodeRunner/presets'),
      import('../components/SharedRunner'),
    ]).then(([editorMod, engineMod, presetsMod, sharedMod]) => {
      setCodeEditor(() => editorMod.default);
      setEngine(engineMod);
      setPresets(presetsMod.presets);
      setShared(sharedMod);
      // Prewarm Pyodide via SharedRunner as soon as the page is mounted.
      sharedMod.schedule(code);
    });
  }, []);

  // De code van de leerling blijft bewaard in deze browser, zoals in de
  // speeltuinen van de lessen. Code uit een gedeelde link bewaart hij niet:
  // die zou het eigen werk overschrijven.
  const veldRef = useRef<HTMLDivElement>(null);
  const huidig = useMemo<SpeeltuinWerk>(() => ({ code, modus: mode }), [code, mode]);
  const bewaard = useOpslag<SpeeltuinWerk>({
    opslag: begin.gedeeld ? null : speeltuinOpslag,
    start: SPEELTUIN_START,
    huidig,
    containerRef: veldRef,
    onHerstel: (werk) => {
      setCode(werk.code);
      setMode(werk.modus);
    },
  });
  const overOpslag = begin.gedeeld
    ? 'Deze code komt uit een link en wordt niet in deze browser bewaard. Je eigen code staat er nog: open de Speeltuin via het menu.'
    : bewaard.stand === 'vol'
      ? 'Niet bewaard: de opslag van je browser is vol. Kopieer je code als je hem wilt houden.'
      : bewaard.stand === 'geweigerd'
        ? 'Niet bewaard: deze browser slaat hier niets op (privévenster?). Kopieer je code als je hem wilt houden.'
        : 'Je code blijft bewaard in deze browser.';

  // Het adres volgt de code, zodat je hem met de link kunt delen. Wat deze
  // tab zelf schreef, onthoudt hij: herladen is dan geen gedeelde link.
  useEffect(() => {
    const timeout = setTimeout(() => {
      try {
        const params = new URLSearchParams();
        params.set('code', codeerDeelLink(code));
        params.set('mode', mode);
        window.history.replaceState(null, '', `#${params.toString()}`);
        if (!begin.gedeeld) zetEigenAdres(params.toString());
      } catch {}
    }, 500);
    return () => clearTimeout(timeout);
  }, [code, mode, begin.gedeeld]);

  // Close presets dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (presetsRef.current && !presetsRef.current.contains(e.target as Node)) {
        setPresetsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Auto-scroll console
  // biome-ignore lint/correctness/useExhaustiveDependencies: consoleLines triggert bewust een her-scroll; de body zelf leest alleen de ref.
  useEffect(() => {
    if (consoleRef.current) {
      consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
    }
  }, [consoleLines]);

  // Release the shared iframe on unmount (navigation away).
  useEffect(() => {
    return () => {
      if (shared) shared.stop(ownerId);
    };
  }, [shared, ownerId]);

  const appendLine = useCallback((text: string, isError: boolean) => {
    setConsoleLines((prev) => [...prev, { text, isError }]);
  }, []);

  const handleRun = useCallback(() => {
    if (!engine || !shared) return;
    setConsoleLines([]);

    let userPythonCode = code;
    let lineOffset = 0;
    let ingevoegd: number[] = [];
    if (mode === 'pygame') {
      const wrapped = engine.ensureAsync(code);
      userPythonCode = wrapped.code;
      lineOffset = wrapped.lineOffset;
      ingevoegd = wrapped.ingevoegd;
    } else if (!userPythonCode.includes('start_program')) {
      userPythonCode = `${userPythonCode}\nplay.start_program()`;
    }

    pendingRunRef.current = { code: userPythonCode, mode, lineOffset, ingevoegd };
    setIsRunning(true);
  }, [code, mode, engine, shared]);

  const handleStop = useCallback(() => {
    if (shared) shared.stop(ownerId);
    setIsRunning(false);
  }, [shared, ownerId]);

  // Fire requestRun only after the slot is in the DOM.
  useEffect(() => {
    if (!isRunning || !pendingRunRef.current || !slotRef.current || !shared) return;
    const params = pendingRunRef.current;
    pendingRunRef.current = null;
    shared.requestRun({
      ownerId,
      slotEl: slotRef.current,
      code: params.code,
      mode: params.mode,
      lineOffset: params.lineOffset,
      ingevoegd: params.ingevoegd,
      listeners: {
        onStdout: (text: string) => appendLine(text, false),
        onStderr: (text: string) => appendLine(text, true),
        onDone: () => {
          /* keep canvas visible */
        },
        onError: (msg: string, fatal: boolean) => {
          appendLine(msg, true);
          if (fatal) setIsRunning(false);
        },
        onPreempted: () => setIsRunning(false),
      },
    });
  }, [isRunning, ownerId, shared, appendLine]);

  // Eigen code: niet de startcode en geen voorbeeld. Die gaat bij een
  // voorbeeld of Reset verloren, ook in de opslag: dan eerst vragen.
  const eigenCode = code !== standaardCode(mode) && !presets.some((p) => p.code === code);

  async function loadPreset(preset: Preset) {
    setPresetsOpen(false);
    if (
      eigenCode &&
      !(await bevestig(
        'Het voorbeeld vervangt je code, ook de versie die in deze browser bewaard is.',
        {
          titel: 'Voorbeeld laden?',
          bevestigLabel: 'Laad het voorbeeld',
          gevaarlijk: true,
        },
      ))
    )
      return;
    setCode(preset.code);
    setMode(preset.mode);
    handleStop();
  }

  async function handleReset() {
    if (
      eigenCode &&
      !(await bevestig('Je code gaat verloren, ook de versie die in deze browser bewaard is.', {
        titel: 'Terug naar de startcode?',
        bevestigLabel: 'Reset',
        gevaarlijk: true,
      }))
    )
      return;
    bewaard.wis();
    setCode(standaardCode(mode));
    handleStop();
  }

  if (!CodeEditor) {
    return <div className={styles.loading}>Speeltuin laden...</div>;
  }

  return (
    <div ref={veldRef} className={styles.playground} data-zaad={bewaard.zaad || undefined}>
      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.toolbarLeft}>
          {!isRunning ? (
            <button
              type="button"
              onClick={handleRun}
              className={styles.runButton}
              disabled={!code.trim()}
            >
              &#x25B6; Uitvoeren
            </button>
          ) : (
            <button type="button" onClick={handleStop} className={styles.stopButton}>
              &#x23F9; Stop
            </button>
          )}
          <Keuzelijst
            label="Bibliotheek"
            waarde={mode}
            opties={[
              { waarde: 'play', label: 'play' },
              { waarde: 'pygame', label: 'pygame-ce' },
            ]}
            onKies={(nieuw) => {
              setMode(nieuw);
              handleStop();
            }}
            className={styles.modeSelect}
          />
        </div>
        <div className={styles.toolbarRight}>
          <div className={styles.presetsWrapper} ref={presetsRef}>
            <button
              type="button"
              onClick={() => setPresetsOpen(!presetsOpen)}
              className={styles.presetsButton}
            >
              Voorbeelden &#x25BC;
            </button>
            {presetsOpen && (
              <div className={styles.presetsDropdown}>
                {presets.map((p) => (
                  <button
                    type="button"
                    key={p.name}
                    onClick={() => loadPreset(p)}
                    className={styles.presetItem}
                  >
                    <span className={styles.presetName}>{p.name}</span>
                    <span className={styles.presetBadge}>{p.mode}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <button type="button" onClick={handleReset} className={styles.resetButton}>
            Reset
          </button>
        </div>
      </div>

      {/* Split view */}
      <div className={styles.splitView}>
        <div className={styles.editorPanel}>
          <CodeEditor value={code} onChange={setCode} readOnly={!bewaard.geladen} height="100%" />
        </div>
        <div className={styles.outputPanel}>
          {isRunning ? (
            <>
              <div ref={slotRef} className={styles.outputFrame} style={{ background: '#1a1a2e' }}>
                {/* SharedRunner positions its iframe over this slot */}
              </div>
              <div ref={consoleRef} className={styles.consolePanel}>
                {consoleLines.length === 0 ? (
                  <span className={styles.consolePlaceholder}>
                    Console - output van print() verschijnt hier
                  </span>
                ) : (
                  consoleLines.map((line, i) => (
                    <span
                      key={`${i}-${line.text}`}
                      className={line.isError ? styles.errLine : undefined}
                    >
                      {line.text}
                    </span>
                  ))
                )}
              </div>
            </>
          ) : (
            <div className={styles.outputPlaceholder}>
              <div className={styles.placeholderIcon}>&#x1F3AE;</div>
              <p>
                Klik op <strong>Uitvoeren</strong> om je code te starten
              </p>
              <p className={styles.placeholderHint}>
                Kies een voorbeeld uit het menu of schrijf je eigen code
              </p>
              <p className={styles.placeholderHint}>{overOpslag}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Speeltuin() {
  return (
    <Layout title="Speeltuin" description="Probeer Python game code direct in je browser">
      <BrowserOnly fallback={<div style={{ padding: '2rem', textAlign: 'center' }}>Laden...</div>}>
        {() => <PlaygroundInner />}
      </BrowserOnly>
    </Layout>
  );
}

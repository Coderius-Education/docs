import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Layout from '@theme/Layout';
import BrowserOnly from '@docusaurus/BrowserOnly';
import styles from './speeltuin.module.css';

const DEFAULT_CODE_PLAY = `import play

play.set_backdrop('white')

play.new_circle(color='red', radius=80)
`;

const DEFAULT_CODE_PYGAME = `import pygame

pygame.init()

scherm = pygame.display.set_mode((800, 600))
pygame.display.set_caption("Mijn spel")

actief = True

while actief:
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            actief = False

    scherm.fill((30, 30, 30))
    pygame.display.flip()

pygame.quit()
`;

function PlaygroundInner() {
  const [code, setCode] = useState(DEFAULT_CODE_PLAY);
  const [mode, setMode] = useState('play');
  const [isRunning, setIsRunning] = useState(false);
  const [presetsOpen, setPresetsOpen] = useState(false);
  const [consoleLines, setConsoleLines] = useState([]);
  const presetsRef = useRef(null);
  const slotRef = useRef(null);
  const consoleRef = useRef(null);
  const pendingRunRef = useRef(null);

  const ownerId = useMemo(() => 'speeltuin', []);

  // Lazy-load heavier components + the SharedRunner module (which pulls in
  // engine.js as a side-effect). Page-load stays light if the user never runs.
  const [CodeEditor, setCodeEditor] = useState(null);
  const [engine, setEngine] = useState(null);
  const [shared, setShared] = useState(null);
  const [presets, setPresets] = useState([]);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load from URL hash on mount
  useEffect(() => {
    try {
      const hash = window.location.hash.slice(1);
      const params = new URLSearchParams(hash);
      const encodedCode = params.get('code');
      const hashMode = params.get('mode');
      if (encodedCode) {
        setCode(decodeURIComponent(atob(encodedCode)));
      }
      if (hashMode === 'play' || hashMode === 'pygame') {
        setMode(hashMode);
      }
    } catch {}
  }, []);

  // Update URL hash on code change (debounced)
  useEffect(() => {
    const timeout = setTimeout(() => {
      try {
        const params = new URLSearchParams();
        params.set('code', btoa(encodeURIComponent(code)));
        params.set('mode', mode);
        window.history.replaceState(null, '', `#${params.toString()}`);
      } catch {}
    }, 500);
    return () => clearTimeout(timeout);
  }, [code, mode]);

  // Close presets dropdown on outside click
  useEffect(() => {
    function handleClick(e) {
      if (presetsRef.current && !presetsRef.current.contains(e.target)) {
        setPresetsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Auto-scroll console
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

  function appendLine(text, isError) {
    setConsoleLines((prev) => [...prev, { text, isError }]);
  }

  const handleRun = useCallback(() => {
    if (!engine || !shared) return;
    setConsoleLines([]);

    let userPythonCode = code;
    let lineOffset = 0;
    if (mode === 'pygame') {
      const wrapped = engine.ensureAsync(code);
      userPythonCode = wrapped.code;
      lineOffset = wrapped.lineOffset;
    } else if (!userPythonCode.includes('start_program')) {
      userPythonCode = userPythonCode + '\nplay.start_program()';
    }

    pendingRunRef.current = { code: userPythonCode, mode, lineOffset };
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
      listeners: {
        onStdout: (text) => appendLine(text, false),
        onStderr: (text) => appendLine(text, true),
        onDone: () => { /* keep canvas visible */ },
        onError: (msg, fatal) => {
          appendLine(msg, true);
          if (fatal) setIsRunning(false);
        },
        onStopped: () => setIsRunning(false),
        onPreempted: () => setIsRunning(false),
      },
    });
  }, [isRunning, ownerId, shared]);

  function loadPreset(preset) {
    setCode(preset.code);
    setMode(preset.mode);
    handleStop();
    setPresetsOpen(false);
  }

  function handleReset() {
    setCode(mode === 'pygame' ? DEFAULT_CODE_PYGAME : DEFAULT_CODE_PLAY);
    handleStop();
  }

  if (!CodeEditor) {
    return <div className={styles.loading}>Speeltuin laden...</div>;
  }

  return (
    <div className={styles.playground}>
      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.toolbarLeft}>
          {!isRunning ? (
            <button onClick={handleRun} className={styles.runButton} disabled={!code.trim()}>
              &#x25B6; Uitvoeren
            </button>
          ) : (
            <button onClick={handleStop} className={styles.stopButton}>
              &#x23F9; Stop
            </button>
          )}
          <select
            value={mode}
            onChange={(e) => { setMode(e.target.value); handleStop(); }}
            className={styles.modeSelect}
          >
            <option value="play">play</option>
            <option value="pygame">pygame-ce</option>
          </select>
        </div>
        <div className={styles.toolbarRight}>
          <div className={styles.presetsWrapper} ref={presetsRef}>
            <button
              onClick={() => setPresetsOpen(!presetsOpen)}
              className={styles.presetsButton}
            >
              Voorbeelden &#x25BC;
            </button>
            {presetsOpen && (
              <div className={styles.presetsDropdown}>
                {presets.map((p, i) => (
                  <button
                    key={i}
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
          <button onClick={handleReset} className={styles.resetButton}>
            Reset
          </button>
        </div>
      </div>

      {/* Split view */}
      <div className={styles.splitView}>
        <div className={styles.editorPanel}>
          <CodeEditor value={code} onChange={setCode} height="100%" />
        </div>
        <div className={styles.outputPanel}>
          {isRunning ? (
            <>
              <div
                ref={slotRef}
                className={styles.outputFrame}
                style={{ background: '#1a1a2e' }}
              >
                {/* SharedRunner positions its iframe over this slot */}
              </div>
              <div
                ref={consoleRef}
                className={styles.consolePanel}
              >
                {consoleLines.length === 0 ? (
                  <span className={styles.consolePlaceholder}>Console - output van print() verschijnt hier</span>
                ) : (
                  consoleLines.map((line, i) => (
                    <span key={i} className={line.isError ? styles.errLine : undefined}>{line.text}</span>
                  ))
                )}
              </div>
            </>
          ) : (
            <div className={styles.outputPlaceholder}>
              <div className={styles.placeholderIcon}>&#x1F3AE;</div>
              <p>Klik op <strong>Uitvoeren</strong> om je code te starten</p>
              <p className={styles.placeholderHint}>
                Kies een voorbeeld uit het menu of schrijf je eigen code
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Speeltuin() {
  return (
    <Layout
      title="Speeltuin"
      description="Probeer Python game code direct in je browser"
    >
      <BrowserOnly fallback={<div style={{ padding: '2rem', textAlign: 'center' }}>Laden...</div>}>
        {() => <PlaygroundInner />}
      </BrowserOnly>
    </Layout>
  );
}

import Keuzelijst from '@coderius/shared/components/Keuzelijst';
import BrowserOnly from '@docusaurus/BrowserOnly';
import React, { useEffect, useRef } from 'react';
import CodeEditor from './CodeEditor';
import styles from './Sidebar.module.css';
import { useCodeRunner } from './context';
import { buildSrcDoc } from './engine';
import { beantwoordWielen } from './wielen';

function SidebarInner() {
  const { isOpen, code, mode, isRunning, setCode, setMode, setIsRunning, close } = useCodeRunner();

  // Close on Escape
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && isOpen) {
        close();
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, close]);

  // Lock body scroll when sidebar is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  function handleRun() {
    setIsRunning(true);
  }

  function handleStop() {
    setIsRunning(false);
  }

  const srcDoc = isRunning ? buildSrcDoc({ code, mode }) : null;

  // De iframe heeft een opaque origin en vraagt de wheels aan deze pagina.
  const uitvoerRef = useRef(null);
  useEffect(() => {
    function onMessage(e) {
      beantwoordWielen(e, uitvoerRef.current?.contentWindow);
    }
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        // biome-ignore lint/a11y/useKeyWithClickEvents: decoratieve overlay, geen tab-stop; Escape sluit de sidebar al (zie de globale keydown-listener hierboven).
        <div className={styles.backdrop} onClick={close} />
      )}

      {/* Sidebar panel */}
      <div className={`${styles.sidebar} ${isOpen ? styles.open : ''}`}>
        {/* Header */}
        <div className={styles.header}>
          <span className={styles.headerTitle}>Code Runner</span>
          <div className={styles.headerActions}>
            <Keuzelijst
              label="Bibliotheek"
              waarde={mode}
              opties={[
                { waarde: 'play', label: 'play' },
                { waarde: 'pygame', label: 'pygame-ce' },
              ]}
              onKies={setMode}
              className={styles.modeSelect}
            />
            <button
              type="button"
              onClick={close}
              className={styles.closeButton}
              aria-label="Sluiten"
            >
              &times;
            </button>
          </div>
        </div>

        {/* Code editor */}
        <div className={styles.editorArea}>
          <CodeEditor value={code} onChange={setCode} height="100%" />
        </div>

        {/* Action buttons */}
        <div className={styles.toolbar}>
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
        </div>

        {/* Output area */}
        {isRunning && srcDoc && (
          <div className={styles.outputArea}>
            {/* Bewust zonder allow-same-origin: alle informatica-cursussen delen één
                origin, en leerlingcode hoort niet bij hun opslag te kunnen. De
                wheels komen via de pagina (wielen.js). */}
            <iframe
              ref={uitvoerRef}
              title="Uitvoer van je code"
              srcDoc={srcDoc}
              className={styles.outputFrame}
              sandbox="allow-scripts allow-downloads"
            />
          </div>
        )}

        {!isRunning && (
          <div className={styles.placeholder}>
            <p>
              Klik op <strong>Uitvoeren</strong> om je code te starten.
            </p>
          </div>
        )}
      </div>
    </>
  );
}

export default function Sidebar() {
  return <BrowserOnly fallback={null}>{() => <SidebarInner />}</BrowserOnly>;
}

import React, { useEffect } from 'react';
import BrowserOnly from '@docusaurus/BrowserOnly';
import { useCodeRunner } from './context';
import CodeEditor from './CodeEditor';
import { buildSrcDoc } from './engine';
import styles from './Sidebar.module.css';

function SidebarInner() {
  const {
    isOpen,
    code,
    mode,
    isRunning,
    setCode,
    setMode,
    setIsRunning,
    close,
  } = useCodeRunner();

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
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  function handleRun() {
    setIsRunning(true);
  }

  function handleStop() {
    setIsRunning(false);
  }

  const srcDoc = isRunning
    ? buildSrcDoc({ code, mode })
    : null;

  return (
    <>
      {/* Backdrop */}
      {isOpen && <div className={styles.backdrop} onClick={close} />}

      {/* Sidebar panel */}
      <div className={`${styles.sidebar} ${isOpen ? styles.open : ''}`}>
        {/* Header */}
        <div className={styles.header}>
          <span className={styles.headerTitle}>Code Runner</span>
          <div className={styles.headerActions}>
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value)}
              className={styles.modeSelect}
            >
              <option value="play">play</option>
              <option value="pygame">pygame-ce</option>
            </select>
            <button onClick={close} className={styles.closeButton} aria-label="Sluiten">
              &times;
            </button>
          </div>
        </div>

        {/* Code editor */}
        <div className={styles.editorArea}>
          <CodeEditor
            value={code}
            onChange={setCode}
            height="100%"
          />
        </div>

        {/* Action buttons */}
        <div className={styles.toolbar}>
          {!isRunning ? (
            <button onClick={handleRun} className={styles.runButton} disabled={!code.trim()}>
              &#x25B6; Uitvoeren
            </button>
          ) : (
            <button onClick={handleStop} className={styles.stopButton}>
              &#x23F9; Stop
            </button>
          )}
        </div>

        {/* Output area */}
        {isRunning && srcDoc && (
          <div className={styles.outputArea}>
            {/* allow-same-origin is required to fetch local wheel files (/whl/*.whl)
                from the same origin. Removing it gives the iframe a null origin,
                which causes the wheel fetch to fail due to CORS. */}
            <iframe
              srcDoc={srcDoc}
              className={styles.outputFrame}
              sandbox="allow-scripts allow-same-origin allow-downloads"
            />
          </div>
        )}

        {!isRunning && (
          <>
            <div className={styles.placeholder}>
              <p>Klik op <strong>Uitvoeren</strong> om je code te starten.</p>
            </div>
          </>
        )}
      </div>
    </>
  );
}

export default function Sidebar() {
  return (
    <BrowserOnly fallback={null}>
      {() => <SidebarInner />}
    </BrowserOnly>
  );
}

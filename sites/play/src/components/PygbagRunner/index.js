import React, { useState, useEffect, useRef, useMemo } from 'react';
import BrowserOnly from '@docusaurus/BrowserOnly';
import CodeEditor from '../CodeRunner/CodeEditor';
import { ensureAsync, detectMode } from '../CodeRunner/engine';
import { schedule, requestRun, stop as sharedStop } from '../SharedRunner';
import styles from './styles.module.css';

let nextOwnerId = 1;

function PygbagRunnerInner({ code, title, width, height, mode }) {
  const [editableCode, setEditableCode] = useState(code);
  const [isRunning, setIsRunning] = useState(false);
  const [consoleLines, setConsoleLines] = useState([]);
  const [copied, setCopied] = useState(false);

  const ownerId = useMemo(() => nextOwnerId++, []);
  const slotRef = useRef(null);
  const consoleRef = useRef(null);
  const pendingRunRef = useRef(null);

  // Determine execution mode: explicit prop > auto-detect from code
  const execMode = mode || detectMode(editableCode) || 'pygame';
  const canRunInBrowser = !!code;
  const displayHeight = height || 450;

  // Tell SharedRunner about this code at mount so its iframe boots with the
  // superset of needed packages.
  useEffect(() => {
    if (canRunInBrowser) schedule(code);
  }, [canRunInBrowser, code]);

  // Auto-scroll console to bottom when new lines arrive
  useEffect(() => {
    if (consoleRef.current) {
      consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
    }
  }, [consoleLines]);

  // Stop our run if the component unmounts (page navigation, etc).
  useEffect(() => () => sharedStop(ownerId), [ownerId]);

  function appendLine(text, isError) {
    setConsoleLines((prev) => [...prev, { text, isError }]);
  }

  function handleCopy() {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(editableCode).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }).catch(() => {});
    }
  }

  function handleRun() {
    setConsoleLines([]);

    // Prepare code per mode. Play-mode appends start_program() if missing;
    // pygame-mode wraps user code in async main and exposes a line offset
    // so the iframe can correct traceback line numbers.
    let userPythonCode = editableCode;
    let lineOffset = 0;
    if (execMode === 'pygame') {
      const wrapped = ensureAsync(editableCode);
      userPythonCode = wrapped.code;
      lineOffset = wrapped.lineOffset;
    } else if (!userPythonCode.includes('start_program')) {
      userPythonCode = userPythonCode + '\nplay.start_program()';
    }

    // Park the run params until React has rendered the slot div (effect below).
    pendingRunRef.current = { code: userPythonCode, mode: execMode, lineOffset };
    setIsRunning(true);
  }

  // Fire the run only AFTER the slot is in the DOM — otherwise slotRef.current
  // is null and SharedRunner has no anchor to position over.
  useEffect(() => {
    if (!isRunning || !pendingRunRef.current || !slotRef.current) return;
    const { code, mode, lineOffset } = pendingRunRef.current;
    pendingRunRef.current = null;
    requestRun({
      ownerId,
      slotEl: slotRef.current,
      code,
      mode,
      lineOffset,
      listeners: {
        onStdout: (text) => appendLine(text, false),
        onStderr: (text) => appendLine(text, true),
        onDone: () => { /* keep canvas visible until user stops */ },
        onError: (msg, fatal) => {
          appendLine(msg, true);
          if (fatal) setIsRunning(false);
        },
        onStopped: () => setIsRunning(false),
        onPreempted: () => setIsRunning(false),
      },
    });
  }, [isRunning, ownerId]);

  function handleStop() {
    sharedStop(ownerId);
    setIsRunning(false);
  }

  return (
    <div className={styles.runner}>
      <div className={styles.header}>
        <span className={styles.title}>{title || 'Python Game'}</span>
        {isRunning ? (
          <button onClick={handleStop} className={styles.stopButton}>
            &#x23F9; Stop
          </button>
        ) : (
          <span className={styles.badge}>
            {execMode === 'play' ? 'play' : 'pygame-ce'}
          </span>
        )}
      </div>

      {isRunning ? (
        <>
          <div
            ref={slotRef}
            className={styles.canvasArea}
            style={{ height: displayHeight, background: '#1a1a2e' }}
          >
            {/* SharedRunner positions its iframe over this slot via fixed CSS */}
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
        <>
          <div className={styles.codeSection}>
            <CodeEditor value={editableCode} onChange={setEditableCode} height="auto" />
          </div>
          <div className={styles.actions}>
            {canRunInBrowser && (
              <button onClick={handleRun} className={styles.playButton}>
                &#x25B6; Speel in browser
              </button>
            )}
            <button onClick={handleCopy} className={styles.copyButton}>
              {copied ? '✓ Gekopieerd' : 'Kopieer code'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default function PygbagRunner(props) {
  return (
    <BrowserOnly fallback={<div>Spel laden...</div>}>
      {() => <PygbagRunnerInner {...props} />}
    </BrowserOnly>
  );
}

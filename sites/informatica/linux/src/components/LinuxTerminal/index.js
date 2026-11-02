import BrowserOnly from '@docusaurus/BrowserOnly';
import React, { useEffect, useRef, useCallback, useState } from 'react';
import { promptPad } from './filesystem';
import { OPDRACHTEN, maakSessie, volgDoelen } from './opdrachten';
import styles from './styles.module.css';

/**
 * LinuxTerminal — Interactive browser-based Linux terminal simulator.
 *
 * Uses xterm.js for terminal rendering with a simulated shell that supports
 * the commands of the Linux course.
 *
 * Props:
 *   title         - Display name in terminal header
 *   filesystem    - Additional filesystem entries to merge (for module-specific files)
 *   initialCommands - Array of commands to auto-execute on startup
 *   opdracht      - Id van een opdracht uit opdrachten.ts ('1.4.a'): een verse
 *                   terminal met de doelen erboven, die afvinken terwijl je typt
 */
function LinuxTerminalInner({ title, filesystem: extraFs, initialCommands, opdracht }) {
  const doelen = opdracht ? OPDRACHTEN[opdracht] : null;
  if (opdracht && !doelen) throw new Error(`LinuxTerminal: onbekende opdracht ${opdracht}`);
  const termRef = useRef(null);
  const xtermRef = useRef(null);
  const lineBuffer = useRef('');
  const history = useRef([]);
  const historyIndex = useRef(-1);
  const sessieRef = useRef(null);
  if (sessieRef.current === null) {
    sessieRef.current = maakSessie(extraFs, { clear: () => xtermRef.current?.clear() });
  }
  const klaarRef = useRef([]);
  const [klaar, setKlaar] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const getPrompt = useCallback(() => {
    const display = promptPad(sessieRef.current.cwd);
    return `\x1b[1;32mstudent@oefenpc\x1b[0m:\x1b[1;34m${display}\x1b[0m$ `;
  }, []);

  const writePrompt = useCallback(
    (term) => {
      term.write(`\r\n${getPrompt()}`);
    },
    [getPrompt],
  );

  const handleCommand = useCallback(
    (term, line) => {
      if (!line.trim()) {
        writePrompt(term);
        return;
      }

      // Add to history
      history.current.unshift(line);
      if (history.current.length > 50) history.current.pop();
      historyIndex.current = -1;

      const { results, stand } = sessieRef.current.typ(line);
      if (doelen) {
        klaarRef.current = volgDoelen(doelen, klaarRef.current, stand);
        setKlaar(klaarRef.current);
      }

      for (const result of results) {
        if (result.output) {
          // Write each line separately for proper terminal rendering
          // Een bestand eindigt met een regeleinde (echo > bestand); de
          // prompt komt toch al op een nieuwe regel.
          const lines = result.output.replace(/\n$/, '').split('\n');
          for (const l of lines) {
            term.write(`\r\n${l}`);
          }
        }
      }

      writePrompt(term);
    },
    [writePrompt, doelen],
  );

  const welkom = useCallback(
    (term) => {
      term.writeln('\x1b[1;32m  Oefenterminal\x1b[0m');
      term.writeln("\x1b[90m  Typ help voor een lijst met commando's.\x1b[0m");
      term.write(getPrompt());
    },
    [getPrompt],
  );

  // Een verse start zonder de pagina te herladen: herladen gooit ook het werk
  // in de andere terminals op de pagina weg.
  const opnieuw = useCallback(() => {
    const term = xtermRef.current;
    if (!term) return;
    sessieRef.current = maakSessie(extraFs, { clear: () => xtermRef.current?.clear() });
    lineBuffer.current = '';
    history.current = [];
    historyIndex.current = -1;
    klaarRef.current = [];
    setKlaar([]);
    term.reset();
    welkom(term);
    term.focus();
  }, [extraFs, welkom]);

  useEffect(() => {
    let isMounted = true;
    let term = null;

    (async () => {
      const { Terminal } = await import('@xterm/xterm');
      const { FitAddon } = await import('@xterm/addon-fit');

      if (!isMounted || !termRef.current) return;

      term = new Terminal({
        cursorBlink: true,
        cursorStyle: 'block',
        theme: {
          background: '#1e1e1e',
          foreground: '#d4d4d4',
          cursor: '#d4d4d4',
          green: '#27c93f',
          blue: '#5c9eff',
          brightGreen: '#27c93f',
          brightBlue: '#5c9eff',
        },
        fontFamily: '"Fira Code", "Cascadia Code", Menlo, Monaco, "Courier New", monospace',
        fontSize: 14,
        lineHeight: 1.2,
        convertEol: true,
        // Bij een opdracht minder hoog: er staan er een paar op een pagina.
        rows: doelen ? 12 : 24,
      });

      const fitAddon = new FitAddon();
      term.loadAddon(fitAddon);
      term.open(termRef.current);

      // Small delay to ensure container is sized
      requestAnimationFrame(() => {
        if (isMounted) fitAddon.fit();
      });

      welkom(term);

      // Handle keyboard input
      term.onData((data) => {
        const code = data.charCodeAt(0);

        if (code === 13) {
          // Enter
          const line = lineBuffer.current;
          lineBuffer.current = '';
          handleCommand(term, line);
        } else if (code === 127 || code === 8) {
          // Backspace
          if (lineBuffer.current.length > 0) {
            lineBuffer.current = lineBuffer.current.slice(0, -1);
            term.write('\b \b');
          }
        } else if (code === 3) {
          // Ctrl+C
          lineBuffer.current = '';
          term.write('^C');
          writePrompt(term);
        } else if (code === 12) {
          // Ctrl+L (clear)
          term.clear();
          term.write(getPrompt() + lineBuffer.current);
        } else if (data === '\x1b[A') {
          // Arrow up - history
          if (historyIndex.current < history.current.length - 1) {
            historyIndex.current++;
            const entry = history.current[historyIndex.current];
            // Clear current line
            term.write(
              `\r${getPrompt()}${' '.repeat(lineBuffer.current.length)}\r${getPrompt()}${entry}`,
            );
            lineBuffer.current = entry;
          }
        } else if (data === '\x1b[B') {
          // Arrow down - history
          if (historyIndex.current > 0) {
            historyIndex.current--;
            const entry = history.current[historyIndex.current];
            term.write(
              `\r${getPrompt()}${' '.repeat(lineBuffer.current.length)}\r${getPrompt()}${entry}`,
            );
            lineBuffer.current = entry;
          } else if (historyIndex.current === 0) {
            historyIndex.current = -1;
            term.write(`\r${getPrompt()}${' '.repeat(lineBuffer.current.length)}\r${getPrompt()}`);
            lineBuffer.current = '';
          }
        } else if (data === '\x1b[C' || data === '\x1b[D') {
          // Arrow left/right - ignore for simplicity
        } else if (code === 9) {
          // Tab - ignore
        } else if (code >= 32) {
          // Printable character
          lineBuffer.current += data;
          term.write(data);
        }
      });

      xtermRef.current = term;
      setIsLoaded(true);

      // Execute initial commands
      if (initialCommands && initialCommands.length > 0) {
        for (const cmd of initialCommands) {
          term.write(cmd);
          lineBuffer.current = cmd;
          handleCommand(term, cmd);
        }
      }

      // Handle resize
      const resizeObserver = new ResizeObserver(() => {
        if (isMounted) fitAddon.fit();
      });
      resizeObserver.observe(termRef.current);

      // Store cleanup ref
      term._resizeObserver = resizeObserver;
    })();

    return () => {
      isMounted = false;
      if (term) {
        if (term._resizeObserver) term._resizeObserver.disconnect();
        term.dispose();
      }
    };
  }, [getPrompt, handleCommand, writePrompt, initialCommands, welkom, doelen]);

  const allesKlaar = doelen?.doelen.every((_, i) => klaar[i]);

  return (
    <div className={styles.terminal}>
      <div className={styles.header}>
        <div className={styles.dots}>
          <span className={styles.dotRed} />
          <span className={styles.dotYellow} />
          <span className={styles.dotGreen} />
        </div>
        <span className={styles.title}>
          {title || (opdracht ? `Oefenterminal voor opdracht ${opdracht}` : 'Oefenterminal')}
        </span>
      </div>
      {doelen && (
        <div className={styles.doelen}>
          <ul>
            {doelen.doelen.map((doel, i) => (
              <li key={doel.tekst} className={klaar[i] ? styles.gehaald : undefined}>
                <span className={styles.vinkje} aria-hidden="true">
                  {klaar[i] ? '✓' : '○'}
                </span>
                <span className={styles.srOnly}>{klaar[i] ? 'Gehaald: ' : 'Nog niet: '}</span>
                {doel.tekst}
              </li>
            ))}
          </ul>
          <p className={styles.status} aria-live="polite">
            {allesKlaar
              ? 'Klaar. Kijk in het antwoord hieronder of je het ook zo deed.'
              : doelen.opVolgorde
                ? 'Doe het in deze volgorde. Het vinkje komt zodra je het gedaan hebt.'
                : 'Het vinkje komt zodra je het gedaan hebt.'}
          </p>
        </div>
      )}
      <div
        ref={termRef}
        className={doelen ? `${styles.body} ${styles.bodyOpdracht}` : styles.body}
      />
      <div className={styles.footer}>
        <button type="button" className={styles.opnieuw} onClick={opnieuw} disabled={!isLoaded}>
          Opnieuw beginnen
        </button>
        <a
          className={styles.footerLink}
          href="https://bellard.org/jslinux/vm.html?url=alpine-x86.cfg&mem=256"
          target="_blank"
          rel="noopener noreferrer"
        >
          Volledige Linux nodig? Open JSLinux ↗
        </a>
      </div>
    </div>
  );
}

export default function LinuxTerminal(props) {
  return (
    <BrowserOnly fallback={<div className={styles.fallback}>Terminal laden...</div>}>
      {() => <LinuxTerminalInner {...props} />}
    </BrowserOnly>
  );
}

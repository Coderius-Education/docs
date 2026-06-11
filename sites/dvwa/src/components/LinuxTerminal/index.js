import React, { useEffect, useRef, useCallback, useState } from 'react';
import BrowserOnly from '@docusaurus/BrowserOnly';
import styles from './styles.module.css';
import { createFilesystem } from './filesystem';
import { executeCommandLine } from './commands';

/**
 * LinuxTerminal — Interactive browser-based Linux terminal simulator.
 *
 * Uses xterm.js for terminal rendering with a simulated shell that supports
 * common Linux commands needed for DVWA security exercises.
 *
 * Props:
 *   title         - Display name in terminal header
 *   filesystem    - Additional filesystem entries to merge (for module-specific files)
 *   initialCommands - Array of commands to auto-execute on startup
 *   filter        - Function (input) => filteredInput for simulating DVWA filtering
 */
function LinuxTerminalInner({ title, filesystem: extraFs, initialCommands, filter }) {
  const termRef = useRef(null);
  const xtermRef = useRef(null);
  const lineBuffer = useRef('');
  const history = useRef([]);
  const historyIndex = useRef(-1);
  const cwdRef = useRef('/home/student');
  const fsRef = useRef(createFilesystem(extraFs));
  const [isLoaded, setIsLoaded] = useState(false);

  const getPrompt = useCallback(() => {
    const cwd = cwdRef.current;
    const display = cwd === '/home/student' ? '~' : cwd;
    return `\x1b[1;32mstudent@dvwa\x1b[0m:\x1b[1;34m${display}\x1b[0m$ `;
  }, []);

  const writePrompt = useCallback((term) => {
    term.write('\r\n' + getPrompt());
  }, [getPrompt]);

  const handleCommand = useCallback((term, line) => {
    if (!line.trim()) {
      writePrompt(term);
      return;
    }

    // Add to history
    history.current.unshift(line);
    if (history.current.length > 50) history.current.pop();
    historyIndex.current = -1;

    // Apply DVWA filter if provided
    let processedLine = line;
    if (filter) {
      processedLine = filter(line);
    }

    const env = {
      cwd: cwdRef.current,
      fs: fsRef.current,
      setCwd: (newCwd) => { cwdRef.current = newCwd; },
      clear: () => { term.clear(); },
    };

    const results = executeCommandLine(processedLine, env);

    for (const result of results) {
      if (result.output) {
        // Write each line separately for proper terminal rendering
        const lines = result.output.split('\n');
        for (const l of lines) {
          term.write('\r\n' + l);
        }
      }
    }

    writePrompt(term);
  }, [filter, writePrompt]);

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
      });

      const fitAddon = new FitAddon();
      term.loadAddon(fitAddon);
      term.open(termRef.current);

      // Small delay to ensure container is sized
      requestAnimationFrame(() => {
        if (isMounted) fitAddon.fit();
      });

      // Welcome message
      term.writeln('\x1b[1;32m  Welcome to DVWA Linux Terminal\x1b[0m');
      term.writeln('\x1b[90m  Type "help" voor beschikbare commando\'s.\x1b[0m');
      term.write(getPrompt());

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
            term.write('\r' + getPrompt() + ' '.repeat(lineBuffer.current.length) + '\r' + getPrompt() + entry);
            lineBuffer.current = entry;
          }
        } else if (data === '\x1b[B') {
          // Arrow down - history
          if (historyIndex.current > 0) {
            historyIndex.current--;
            const entry = history.current[historyIndex.current];
            term.write('\r' + getPrompt() + ' '.repeat(lineBuffer.current.length) + '\r' + getPrompt() + entry);
            lineBuffer.current = entry;
          } else if (historyIndex.current === 0) {
            historyIndex.current = -1;
            term.write('\r' + getPrompt() + ' '.repeat(lineBuffer.current.length) + '\r' + getPrompt());
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
  }, [getPrompt, handleCommand, writePrompt, initialCommands]);

  return (
    <div className={styles.terminal}>
      <div className={styles.header}>
        <div className={styles.dots}>
          <span className={styles.dotRed} />
          <span className={styles.dotYellow} />
          <span className={styles.dotGreen} />
        </div>
        <span className={styles.title}>{title || 'Linux Terminal'}</span>
      </div>
      <div ref={termRef} className={styles.body} />
      <div className={styles.footer}>
        <span className={styles.footerInfo}>Gesimuleerde terminal</span>
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

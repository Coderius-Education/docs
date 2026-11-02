import BrowserOnly from '@docusaurus/BrowserOnly';
import React, { useEffect, useRef, useCallback, useState } from 'react';
import { promptPad } from './filesystem';
import { OPDRACHTEN, maakSessie, volgDoelen } from './opdrachten';
import { LEEG, plekVan, toets, verplaats, zichtbaar } from './regel';
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
  const standRef = useRef(LEEG);
  // De rij in de buffer waar de prompt staat: een lange regel loopt over
  // meer schermregels, en opnieuw tekenen begint daar.
  const promptRij = useRef(0);
  const netLeeg = useRef(false);
  const sessieRef = useRef(null);
  if (sessieRef.current === null) {
    sessieRef.current = maakSessie(extraFs ?? doelen?.bestanden, {
      clear: () => {
        netLeeg.current = true;
      },
    });
  }
  const klaarRef = useRef([]);
  const [klaar, setKlaar] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const getPrompt = useCallback(() => {
    const display = promptPad(sessieRef.current.cwd);
    return `\x1b[1;32mstudent@oefenpc\x1b[0m:\x1b[1;34m${display}\x1b[0m$ `;
  }, []);

  // Schrijft de prompt, en onthoudt op welke rij hij staat.
  const schrijfPrompt = useCallback(
    (term, ervoor = '') => {
      term.write(`${ervoor}${getPrompt()}`, () => {
        const b = term.buffer.active;
        promptRij.current = b.baseY + b.cursorY;
      });
    },
    [getPrompt],
  );

  const writePrompt = useCallback(
    (term) => {
      // Na clear een leeg scherm met de prompt bovenaan, zoals bash.
      if (netLeeg.current) {
        netLeeg.current = false;
        term.write('\x1b[H\x1b[2J\x1b[3J');
        schrijfPrompt(term);
        return;
      }
      schrijfPrompt(term, '\r\n');
    },
    [schrijfPrompt],
  );

  const handleCommand = useCallback(
    (term, line) => {
      if (!line.trim()) {
        writePrompt(term);
        return;
      }

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
      schrijfPrompt(term);
    },
    [schrijfPrompt],
  );

  // Een verse start zonder de pagina te herladen: herladen gooit ook het werk
  // in de andere terminals op de pagina weg.
  const opnieuw = useCallback(() => {
    const term = xtermRef.current;
    if (!term) return;
    sessieRef.current = maakSessie(extraFs ?? doelen?.bestanden, {
      clear: () => {
        netLeeg.current = true;
      },
    });
    standRef.current = LEEG;
    klaarRef.current = [];
    setKlaar([]);
    term.reset();
    welkom(term);
    term.focus();
  }, [extraFs, welkom, doelen]);

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

      // De regel tekenen na een toets. Typ je aan het eind, dan komt alleen
      // het nieuwe teken erbij; anders de hele regel opnieuw, met de cursor
      // op zijn plek.
      const teken = (oud, nieuw) => {
        if (
          oud.cursor === oud.tekst.length &&
          nieuw.cursor === nieuw.tekst.length &&
          nieuw.tekst.startsWith(oud.tekst)
        ) {
          term.write(nieuw.tekst.slice(oud.tekst.length));
          return;
        }
        // Terug naar de rij van de prompt, alles opnieuw, en de rest van
        // het scherm leeg: de regel kan korter zijn geworden.
        const b = term.buffer.active;
        const omhoog = Math.max(0, b.baseY + b.cursorY - promptRij.current);
        const prompt = getPrompt();
        term.write(`${omhoog ? `\x1b[${omhoog}A` : ''}\r${prompt}${nieuw.tekst}\x1b[J`, () => {
          const na = term.buffer.active;
          const { rij, kolom } = plekVan(zichtbaar(prompt), nieuw.cursor, term.cols);
          term.write(verplaats(na.baseY + na.cursorY, promptRij.current + rij, kolom));
        });
      };

      // Na een nieuwe prompt de regel er weer achter, met de cursor op zijn
      // plek. Dat laatste pas als xterm de prompt heeft verwerkt: dan weet
      // schrijfPrompt op welke rij hij staat.
      const naPrompt = (stand) => {
        const eind = { ...stand, cursor: stand.tekst.length };
        teken(LEEG, eind);
        if (stand.cursor < stand.tekst.length) term.write('', () => teken(eind, stand));
      };

      const verwerk = (data) => {
        const oud = standRef.current;
        const { stand, actie, opties } = toets(oud, data, sessieRef.current);
        if (actie === 'uitvoeren') {
          standRef.current = LEEG;
          handleCommand(term, stand.tekst);
        } else if (actie === 'afbreken') {
          teken(oud, { ...oud, cursor: oud.tekst.length });
          term.write('^C');
          standRef.current = LEEG;
          writePrompt(term);
        } else if (actie === 'leeg') {
          term.write('\x1b[H\x1b[2J\x1b[3J');
          standRef.current = stand;
          schrijfPrompt(term);
          naPrompt(stand);
        } else if (actie === 'opties') {
          // De tweede Tab: wat er past, en dan de regel opnieuw.
          term.write(`\r\n${opties.join('  ')}`);
          standRef.current = stand;
          schrijfPrompt(term, '\r\n');
          naPrompt(stand);
        } else {
          standRef.current = stand;
          teken(oud, stand);
        }
      };

      term.onData((data) => {
        // Een escape-reeks (pijltje, Home) is één toets; geplakte tekst gaat
        // teken voor teken, met een regeleinde als Enter.
        if (data.startsWith('\x1b')) verwerk(data);
        else for (const ch of data.replace(/\r\n/g, '\r')) verwerk(ch);
      });

      xtermRef.current = term;
      setIsLoaded(true);

      // Execute initial commands
      if (initialCommands && initialCommands.length > 0) {
        for (const cmd of initialCommands) {
          term.write(cmd);
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
  }, [getPrompt, handleCommand, writePrompt, initialCommands, welkom, doelen, schrijfPrompt]);

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
        <span className={styles.hint}>Tab vult aan, ↑ haalt terug</span>
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

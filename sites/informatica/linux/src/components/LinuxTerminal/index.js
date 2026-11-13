import { LesNaast, LesNaastPlek, useBreed, useInLesTab } from '@coderius/shared/components/LesTabs';
import { pasHoogte } from '@coderius/shared/components/LesTabs/pasHoogte';
import BrowserOnly from '@docusaurus/BrowserOnly';
import React, { useEffect, useLayoutEffect, useRef, useCallback, useState } from 'react';
import { promptPad } from './filesystem';
import { OPDRACHTEN, maakSessie, volgDoelen } from './opdrachten';
import {
  LEEG,
  inKolommen,
  maakUitweg,
  omKolommen,
  plekVan,
  toets,
  verplaats,
  zichtbaar,
} from './regel';
import styles from './styles.module.css';

// In een les-tabblad staat de terminal naast de les (<LesNaast>): op een
// breed scherm in de kolom rechts van de tekst, zo hoog als het scherm
// toelaat. Hoger dan 24 regels wordt hij niet, lager dan acht ook niet.
const RIJ = 18;
const RAND = 24;
const HOOGSTE = 24 * RIJ + RAND;
const LAAGSTE = 8 * RIJ + RAND;

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
  const naam = title || (opdracht ? `Oefenterminal voor opdracht ${opdracht}` : 'Oefenterminal');
  const termRef = useRef(null);
  const wortelRef = useRef(null);
  const xtermRef = useRef(null);
  // In een tabblad op een breed scherm staat de terminal in de kolom naast
  // de les, en past zijn hoogte zich aan het scherm aan.
  const inTab = useInLesTab();
  const inKolom = useBreed() && inTab;
  const [hoogte, setHoogte] = useState(null);
  useLayoutEffect(() => {
    const wortel = wortelRef.current;
    const body = termRef.current;
    if (!inKolom || !wortel || !body) {
      setHoogte(null);
      return;
    }
    const meet = () => {
      // Naast een tabblad met een eigen terminal is deze niet te zien.
      if (wortel.offsetWidth === 0) return;
      const b = body.getBoundingClientRect();
      const w = wortel.getBoundingClientRect();
      // De terminal plakt onder de rij tabbladen: zijn plek op de pagina is
      // die van de kolom, niet waar hij na het scrollen staat.
      const kolom = wortel.closest('[data-les-naast]')?.getBoundingClientRect() ?? w;
      setHoogte(
        pasHoogte(
          {
            scherm: window.innerHeight,
            boven: b.top - w.top + kolom.top + window.scrollY,
            onder: w.bottom - b.bottom,
            max: HOOGSTE,
          },
          LAAGSTE,
        ),
      );
    };
    meet();
    // De doelen boven de terminal worden langer of korter, en de kolom
    // verschijnt als een ander tabblad opengaat.
    const kijker = new ResizeObserver(meet);
    kijker.observe(wortel);
    if (wortel.parentElement) kijker.observe(wortel.parentElement);
    window.addEventListener('resize', meet);
    return () => {
      kijker.disconnect();
      window.removeEventListener('resize', meet);
    };
  }, [inKolom]);
  const standRef = useRef(LEEG);
  // De rij in de buffer waar de prompt staat: een lange regel loopt over
  // meer schermregels, en opnieuw tekenen begint daar.
  const promptRij = useRef(0);
  const netLeeg = useRef(false);
  const sessieRef = useRef(null);
  const nieuweSessie = useCallback(
    () =>
      maakSessie(extraFs ?? doelen?.bestanden, {
        clear: () => {
          netLeeg.current = true;
        },
        // `ls` zet zijn namen in kolommen op de breedte van de terminal.
        kolommen: () => xtermRef.current?.cols ?? 80,
      }),
    [extraFs, doelen],
  );
  if (sessieRef.current === null) {
    sessieRef.current = nieuweSessie();
  }
  const klaarRef = useRef([]);
  const [klaar, setKlaar] = useState([]);
  // Waarom het volgende doel zo niet meer te halen is (opdrachten.ts, `vast`).
  const [vast, setVast] = useState(null);
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
        setVast(doelen.vast?.(stand, klaarRef.current) ?? null);
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
      for (const r of omKolommen("Typ help voor een lijst met commando's.", term.cols))
        term.writeln(`\x1b[90m${r}\x1b[0m`);
      schrijfPrompt(term);
    },
    [schrijfPrompt],
  );

  // Een verse start zonder de pagina te herladen: herladen gooit ook het werk
  // in de andere terminals op de pagina weg.
  const opnieuw = useCallback(() => {
    const term = xtermRef.current;
    if (!term) return;
    sessieRef.current = nieuweSessie();
    standRef.current = LEEG;
    klaarRef.current = [];
    setKlaar([]);
    setVast(null);
    term.reset();
    welkom(term);
    term.focus();
  }, [nieuweSessie, welkom]);

  useEffect(() => {
    let isMounted = true;
    let term = null;

    // Een terminal in een tabblad dat dicht is, heeft geen maten: xterm zou
    // dan op twee kolommen passen en de welkomsttekst daarop afbreken. Hij
    // start dus pas als hij te zien is, en past zich daarna alleen aan
    // zolang hij te zien is.
    const teZien = () => !!termRef.current && termRef.current.clientWidth > 0;
    let passer = null;
    const wachter = new ResizeObserver(() => {
      if (!teZien()) return;
      if (passer) passer.fit();
      else if (!gestart) start();
    });
    let gestart = false;

    const start = async () => {
      gestart = true;
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
        // Naast de les is de terminal smaller: iets kleinere letters, zodat
        // een regel van `ls -l` (zestig tekens) op één regel past.
        fontSize: inTab ? 13 : 14,
        lineHeight: 1.2,
        convertEol: true,
        // Bij een opdracht minder hoog: er staan er een paar op een pagina.
        // In een tabblad ook: op een smal scherm staat hij onder de tekst.
        rows: doelen || inTab ? 12 : 24,
        // De regels staan anders alleen op een canvas of in een boom met
        // aria-hidden: voor een schermlezer bestond de uitvoer niet. Met
        // deze modus houdt xterm een leesbare kopie bij en meldt het nieuwe
        // uitvoer in een live-regio.
        screenReaderMode: true,
      });
      // Esc en dan Tab laat de terminal los (regel.js, maakUitweg).
      const uitweg = maakUitweg();
      term.attachCustomKeyEventHandler(uitweg);
      term.textarea?.addEventListener('blur', uitweg.vergeet);

      const fitAddon = new FitAddon();
      term.loadAddon(fitAddon);
      term.open(termRef.current);
      term.textarea?.setAttribute('aria-label', `Invoer van de ${naam.toLowerCase()}`);
      // Meteen passend maken, zodat de welkomsttekst op de echte breedte
      // wordt afgebroken; het tweede fit vangt een container die nog groeit.
      if (teZien()) fitAddon.fit();
      passer = fitAddon;

      // Small delay to ensure container is sized
      requestAnimationFrame(() => {
        if (isMounted && teZien()) fitAddon.fit();
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
          term.write(`\r\n${inKolommen(opties, term.cols).replace(/\n/g, '\r\n')}`);
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
    };

    wachter.observe(termRef.current);
    if (teZien()) start();

    return () => {
      isMounted = false;
      wachter.disconnect();
      if (term) term.dispose();
    };
  }, [
    getPrompt,
    handleCommand,
    writePrompt,
    initialCommands,
    welkom,
    doelen,
    schrijfPrompt,
    inTab,
    naam,
  ]);

  const allesKlaar = doelen?.doelen.every((_, i) => klaar[i]);

  return (
    <div
      ref={wortelRef}
      className={inKolom ? `${styles.terminal} ${styles.inKolom}` : styles.terminal}
      data-terminal={opdracht || 'les'}
      // biome-ignore lint/a11y/useSemanticElements: een fieldset tekent een eigen kader om de terminal.
      role="group"
      aria-label={naam}
    >
      <div className={styles.header}>
        <div className={styles.dots}>
          <span className={styles.dotRed} />
          <span className={styles.dotYellow} />
          <span className={styles.dotGreen} />
        </div>
        <span className={styles.title}>{naam}</span>
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
              ? 'Klaar. Kijk in het antwoord of je het ook zo deed.'
              : vast
                ? vast
                : doelen.opVolgorde
                  ? 'Doe het in deze volgorde. Het vinkje komt zodra je het gedaan hebt.'
                  : 'Het vinkje komt zodra je het gedaan hebt.'}
          </p>
        </div>
      )}
      <div
        ref={termRef}
        className={doelen || inTab ? `${styles.body} ${styles.bodyOpdracht}` : styles.body}
        style={hoogte ? { height: `${hoogte}px`, minHeight: 0 } : undefined}
      />
      <div className={styles.footer}>
        <button type="button" className={styles.opnieuw} onClick={opnieuw} disabled={!isLoaded}>
          Opnieuw beginnen
        </button>
        <span className={styles.hint}>Tab vult aan, ↑ haalt terug, Esc en dan Tab gaat verder</span>
      </div>
    </div>
  );
}

// Tot de terminal er is. In een tabblad houdt de terminal van de les alleen
// zijn kolom vrij (<LesNaastPlek>): een blok "Terminal laden" in de tekst
// duwde de les eerst omlaag, en daarna versprong hij.
function Wacht({ heleLes }) {
  const inTab = useInLesTab();
  if (inTab && heleLes) return <LesNaastPlek heleLes />;
  return <div className={styles.fallback}>Terminal laden...</div>;
}

export default function LinuxTerminal(props) {
  return (
    <BrowserOnly fallback={<Wacht heleLes={!props.opdracht} />}>
      {() => (
        // De terminal van de les hoort bij elk scherm; die van een opdracht
        // bij zijn eigen tabblad.
        <LesNaast heleLes={!props.opdracht}>
          <LinuxTerminalInner {...props} />
        </LesNaast>
      )}
    </BrowserOnly>
  );
}

import { acceptCompletion, completionStatus } from '@codemirror/autocomplete';
import { indentMore } from '@codemirror/commands';
import { python } from '@codemirror/lang-python';
import { indentUnit } from '@codemirror/language';
import { type Extension, Prec } from '@codemirror/state';
import { Decoration, EditorView, keymap } from '@codemirror/view';
import CodeMirror from '@uiw/react-codemirror';
import clsx from 'clsx';
import type React from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

// Lees de kleurmodus van het `data-theme`-attribuut op <html> i.p.v. via
// useColorMode uit @docusaurus/theme-common. Met pnpm krijgt theme-common
// anders een tweede fysieke kopie, wat een tweede React-context oplevert
// ("Hook ... outside the <ColorModeProvider>") en deze pagina laat crashen.
// Zelfde patroon als MonacoPane/PythonPlayground in de gedeelde packages.
function useColorMode(): { colorMode: 'light' | 'dark' } {
  const [colorMode, setColorMode] = useState<'light' | 'dark'>(() =>
    typeof document !== 'undefined' &&
    document.documentElement.getAttribute('data-theme') === 'dark'
      ? 'dark'
      : 'light',
  );
  useEffect(() => {
    const read = () =>
      setColorMode(
        document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light',
      );
    read();
    const observer = new MutationObserver(read);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });
    return () => observer.disconnect();
  }, []);
  return { colorMode };
}

import { friendlyError } from './errorMessages';
import { BoardFS } from './filesystem';
import {
  DEFAULT_LEAPHY_BRANCH,
  DEFAULT_LEAPHY_REPO,
  type InstallProgress,
  installLeaphyLibrary,
} from './leaphyInstaller';
import { type PythonFout, splitsFoutSegmenten, vindLaatsteFout } from './pythonErrors';
import { SerialClient } from './serial';
import styles from './styles.module.css';
import { TEMPLATES } from './templates';

const DEBUG_DOCS_URL =
  '/docs/Microcontrollers/Arduino Nano RP2040 Connect/Tutorial-debuggen/debuggen';

/** Markeert één regel in de editor als foutregel. */
function foutRegelExtension(regel: number, klasse: string): Extension {
  return EditorView.decorations.compute(['doc'], (state) => {
    if (regel < 1 || regel > state.doc.lines) return Decoration.none;
    return Decoration.set([Decoration.line({ class: klasse }).range(state.doc.line(regel).from)]);
  });
}

function foutSignatuur(fout: PythonFout): string {
  return `${fout.type}|${fout.melding}|${fout.regel}`;
}

const pythonTabExtensions = [
  python(),
  indentUnit.of('    '),
  EditorView.contentAttributes.of({ 'data-indent-with-tab': 'true' }),
  Prec.highest(
    keymap.of([
      {
        key: 'Tab',
        run: (view) => {
          if (completionStatus(view.state) === 'active') {
            return acceptCompletion(view);
          }
          return indentMore(view);
        },
      },
    ]),
  ),
];

const STORAGE_KEY = 'webMicroEditor.code';
const FILE_STORAGE_KEY = 'webMicroEditor.currentFile';
const LEAPHY_REPO_STORAGE_KEY = 'webMicroEditor.leaphyRepo';
const LEAPHY_BRANCH_STORAGE_KEY = 'webMicroEditor.leaphyBranch';

// Officiële MicroPython-firmware voor de Arduino Nano RP2040 Connect.
// Nieuwe versie? Pak de laatste .uf2 van de download-pagina hieronder en werk
// deze twee regels bij.
const MICROPYTHON_UF2_URL =
  'https://micropython.org/resources/firmware/ARDUINO_NANO_RP2040_CONNECT-20260406-v1.28.0.uf2';
const MICROPYTHON_VERSION = 'v1.28.0';
const MICROPYTHON_DOWNLOAD_PAGE = 'https://micropython.org/download/ARDUINO_NANO_RP2040_CONNECT/';

type Status = 'disconnected' | 'connected' | 'busy';

export default function WebMicroEditor(): React.JSX.Element {
  const supported = useMemo(() => SerialClient.isSupported(), []);
  const { colorMode } = useColorMode();
  const clientRef = useRef<SerialClient | null>(null);
  const replRef = useRef<HTMLDivElement | null>(null);

  const [code, setCode] = useState<string>(() => {
    if (typeof window === 'undefined') return TEMPLATES[0].code;
    return localStorage.getItem(STORAGE_KEY) ?? TEMPLATES[0].code;
  });
  const [currentFile, setCurrentFile] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(FILE_STORAGE_KEY);
  });
  // Baseline copy of code as last loaded/saved — used to detect unsaved changes.
  const [loadedCode, setLoadedCode] = useState<string>(() => {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem(STORAGE_KEY) ?? TEMPLATES[0].code;
  });
  const [status, setStatus] = useState<Status>('disconnected');
  const [replText, setReplText] = useState<string>('');
  const [progress, setProgress] = useState<InstallProgress | null>(null);
  const [files, setFiles] = useState<Array<{ name: string; isDir: boolean; path: string }> | null>(
    null,
  );
  const [currentDir, setCurrentDir] = useState<string>('/');
  const [showFlashHelp, setShowFlashHelp] = useState<boolean>(false);
  const [leaphyRepo, setLeaphyRepo] = useState<string>(() => {
    if (typeof window === 'undefined') return DEFAULT_LEAPHY_REPO;
    return localStorage.getItem(LEAPHY_REPO_STORAGE_KEY) ?? DEFAULT_LEAPHY_REPO;
  });
  const [leaphyBranch, setLeaphyBranch] = useState<string>(() => {
    if (typeof window === 'undefined') return DEFAULT_LEAPHY_BRANCH;
    return localStorage.getItem(LEAPHY_BRANCH_STORAGE_KEY) ?? DEFAULT_LEAPHY_BRANCH;
  });
  const [replInput, setReplInput] = useState<string>('');
  const [replHistory, setReplHistory] = useState<string[]>([]);
  const [replHistoryIndex, setReplHistoryIndex] = useState<number>(-1);
  const [foutWeggedrukt, setFoutWeggedrukt] = useState<string | null>(null);

  const isDirty = code !== loadedCode;

  // De laatste Python-fout uit de REPL-stroom, voor de banner en de
  // regelmarkering. Wissen van de REPL (bij elke Run) reset dit vanzelf.
  const fout = useMemo(() => vindLaatsteFout(replText), [replText]);
  const foutZichtbaar = fout !== null && foutSignatuur(fout) !== foutWeggedrukt;

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, code);
    }
  }, [code]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (currentFile === null) localStorage.removeItem(FILE_STORAGE_KEY);
    else localStorage.setItem(FILE_STORAGE_KEY, currentFile);
  }, [currentFile]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(LEAPHY_REPO_STORAGE_KEY, leaphyRepo);
    }
  }, [leaphyRepo]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(LEAPHY_BRANCH_STORAGE_KEY, leaphyBranch);
    }
  }, [leaphyBranch]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: replText triggert bewust een her-scroll bij nieuwe REPL-output; de body zelf leest alleen de ref.
  useEffect(() => {
    const el = replRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [replText]);

  const appendRepl = useCallback((text: string) => {
    setReplText((prev) => {
      const next = (prev + text).slice(-20000); // cap at ~20KB
      return next;
    });
  }, []);

  const clearRepl = useCallback(() => setReplText(''), []);

  const setBusy = useCallback(() => setStatus('busy'), []);
  const setIdle = useCallback(() => setStatus('connected'), []);

  const connect = useCallback(async () => {
    if (!supported) return;
    if (clientRef.current) return;
    const client = new SerialClient();
    client.onData = appendRepl;
    client.onDisconnect = () => {
      clientRef.current = null;
      setStatus('disconnected');
      appendRepl('\n[verbinding verbroken]\n');
    };
    try {
      await client.connect();
      clientRef.current = client;
      setStatus('connected');
      appendRepl('[verbonden]\n');
    } catch (err) {
      appendRepl(`[verbinden mislukt: ${friendlyError(err)}]\n`);
    }
  }, [supported, appendRepl]);

  const disconnect = useCallback(async () => {
    const c = clientRef.current;
    if (!c) return;
    await c.disconnect();
    clientRef.current = null;
    setStatus('disconnected');
  }, []);

  const runOnBoard = useCallback(async () => {
    const c = clientRef.current;
    if (!c) return;
    if (
      currentFile &&
      currentFile !== '/main.py' &&
      !confirm(
        `Run schrijft je code naar /main.py, niet naar het geopende ${currentFile}. Doorgaan?`,
      )
    ) {
      return;
    }
    setBusy();
    clearRepl();
    appendRepl('[uploaden naar main.py...]\n');
    try {
      const fs = new BoardFS(c);
      await fs.writeFile('/main.py', code);
      setCurrentFile('/main.py');
      setLoadedCode(code);
      appendRepl('[main.py opgeslagen, soft reboot]\n');
      await c.softReboot();
      setIdle();
    } catch (err) {
      appendRepl(`\n[fout: ${friendlyError(err)}]\n`);
      setIdle();
    }
  }, [code, currentFile, appendRepl, clearRepl, setBusy, setIdle]);

  const saveCurrent = useCallback(async () => {
    const c = clientRef.current;
    if (!c || !currentFile) return;
    setBusy();
    try {
      const fs = new BoardFS(c);
      await fs.writeFile(currentFile, code);
      setLoadedCode(code);
      appendRepl(`[opgeslagen: ${currentFile}]\n`);
      setIdle();
    } catch (err) {
      appendRepl(`\n[opslaan mislukt: ${friendlyError(err)}]\n`);
      setIdle();
    }
  }, [code, currentFile, appendRepl, setBusy, setIdle]);

  const openFile = useCallback(
    async (path: string) => {
      const c = clientRef.current;
      if (!c) return;
      if (isDirty && !confirm('Niet-opgeslagen wijzigingen worden overschreven. Doorgaan?')) return;
      setBusy();
      try {
        const fs = new BoardFS(c);
        const bytes = await fs.readFile(path);
        const text = new TextDecoder('utf-8', { fatal: false }).decode(bytes);
        setCode(text);
        setLoadedCode(text);
        setCurrentFile(path);
        appendRepl(`[geopend: ${path}]\n`);
        setIdle();
      } catch (err) {
        appendRepl(`\n[openen mislukt: ${friendlyError(err)}]\n`);
        setIdle();
      }
    },
    [isDirty, appendRepl, setBusy, setIdle],
  );

  const newFile = useCallback(() => {
    if (isDirty && !confirm('Niet-opgeslagen wijzigingen worden overschreven. Doorgaan?')) return;
    setCode('');
    setLoadedCode('');
    setCurrentFile(null);
  }, [isDirty]);

  const stop = useCallback(async () => {
    const c = clientRef.current;
    if (!c) return;
    try {
      await c.interrupt();
      appendRepl('\n[KeyboardInterrupt verstuurd]\n');
    } catch (err) {
      appendRepl(`\n[stop mislukt: ${friendlyError(err)}]\n`);
    }
  }, [appendRepl]);

  const herstart = useCallback(async () => {
    const c = clientRef.current;
    if (!c) return;
    clearRepl();
    appendRepl('[herstart: main.py draait opnieuw]\n');
    try {
      await c.softReboot();
    } catch (err) {
      appendRepl(`\n[herstart mislukt: ${friendlyError(err)}]\n`);
    }
  }, [appendRepl, clearRepl]);

  // Ctrl+S hoort niet de browser-opslaan-dialoog te openen. Is er een los
  // bestand open, dan slaat hij dat op; anders volstaat de melding dat de
  // browser al automatisch bewaart (Run schrijft naar het board).
  const saveShortcut = useCallback(() => {
    if (currentFile && currentFile !== '/main.py' && clientRef.current) {
      saveCurrent();
    } else {
      appendRepl('[je code staat automatisch bewaard in de browser]\n');
    }
  }, [currentFile, saveCurrent, appendRepl]);

  // Sneltoetsen via een ref, zodat de CodeMirror-extensies stabiel blijven
  // terwijl de callbacks per toetsaanslag veranderen (ze hangen aan `code`).
  const actiesRef = useRef<{ run: () => void; save: () => void }>({
    run: () => {},
    save: () => {},
  });
  useEffect(() => {
    actiesRef.current = { run: runOnBoard, save: saveShortcut };
  });

  const sneltoetsen = useMemo(
    () =>
      Prec.highest(
        keymap.of([
          {
            key: 'Mod-Enter',
            run: () => {
              actiesRef.current.run();
              return true;
            },
          },
          {
            key: 'Mod-s',
            run: () => {
              actiesRef.current.save();
              return true;
            },
          },
        ]),
      ),
    [],
  );

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.defaultPrevented || !(e.ctrlKey || e.metaKey)) return;
      if (e.key.toLowerCase() === 's') {
        e.preventDefault();
        actiesRef.current.save();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        actiesRef.current.run();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const editorExtensions = useMemo(() => {
    const ext: Extension[] = [...pythonTabExtensions, sneltoetsen];
    if (foutZichtbaar && fout?.regel && fout.bron === 'main.py' && currentFile === '/main.py') {
      ext.push(foutRegelExtension(fout.regel, styles.foutRegel));
    }
    return ext;
  }, [sneltoetsen, fout, foutZichtbaar, currentFile]);

  const installLib = useCallback(async () => {
    const c = clientRef.current;
    if (!c) return;
    setBusy();
    setProgress({ done: 0, total: 0, current: 'lijst ophalen...' });
    try {
      const fs = new BoardFS(c);
      await installLeaphyLibrary(fs, (p) => setProgress(p), {
        repo: leaphyRepo,
        branch: leaphyBranch,
      });
      setProgress(null);
      const isDefault =
        leaphyRepo === DEFAULT_LEAPHY_REPO && leaphyBranch === DEFAULT_LEAPHY_BRANCH;
      appendRepl(
        isDefault
          ? '\n[Leaphy-library geïnstalleerd]\n'
          : `\n[Leaphy-library geïnstalleerd vanaf ${leaphyRepo}@${leaphyBranch}]\n`,
      );
      setIdle();
    } catch (err) {
      setProgress(null);
      appendRepl(`\n[installer mislukt: ${friendlyError(err)}]\n`);
      setIdle();
    }
  }, [appendRepl, setBusy, setIdle, leaphyRepo, leaphyBranch]);

  const sendReplLine = useCallback(() => {
    const c = clientRef.current;
    if (!c || status !== 'connected') return;
    const line = replInput;
    c.typeLine(line).catch((err) => {
      appendRepl(`\n[typen mislukt: ${friendlyError(err)}]\n`);
    });
    setReplHistory((prev) => [...prev, line]);
    setReplHistoryIndex(-1);
    setReplInput('');
  }, [status, replInput, appendRepl]);

  const handleReplKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        sendReplLine();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setReplHistoryIndex((idx) => {
          if (replHistory.length === 0) return idx;
          const next = idx === -1 ? replHistory.length - 1 : Math.max(0, idx - 1);
          setReplInput(replHistory[next]);
          return next;
        });
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setReplHistoryIndex((idx) => {
          if (idx === -1) return -1;
          const next = idx + 1;
          if (next >= replHistory.length) {
            setReplInput('');
            return -1;
          }
          setReplInput(replHistory[next]);
          return next;
        });
      }
    },
    [sendReplLine, replHistory],
  );

  const refreshFiles = useCallback(
    async (dir = currentDir) => {
      const c = clientRef.current;
      if (!c) return;
      setBusy();
      try {
        const fs = new BoardFS(c);
        const items = await fs.listdir(dir);
        const withPaths = items.map((it) => ({
          ...it,
          path: dir.endsWith('/') ? dir + it.name : `${dir}/${it.name}`,
        }));
        // Toon alleen .py-bestanden en de lib-map. In de root verbergen we andere
        // mappen; binnen lib blijven submappen zichtbaar zodat je kunt bladeren.
        const visible = withPaths.filter((it) =>
          it.isDir ? (dir === '/' ? it.name === 'lib' : true) : it.name.endsWith('.py'),
        );
        setFiles(visible);
        setCurrentDir(dir);
        setIdle();
      } catch (err) {
        appendRepl(`\n[bestandslijst mislukt: ${friendlyError(err)}]\n`);
        setIdle();
      }
    },
    [currentDir, appendRepl, setBusy, setIdle],
  );

  const deleteFile = useCallback(
    async (path: string) => {
      const c = clientRef.current;
      if (!c) return;
      if (!confirm(`'${path}' verwijderen van het board?`)) return;
      setBusy();
      try {
        const fs = new BoardFS(c);
        await fs.remove(path);
        appendRepl(`[verwijderd: ${path}]\n`);
        if (currentFile === path) {
          setCurrentFile(null);
        }
        await refreshFiles();
      } catch (err) {
        appendRepl(`\n[verwijderen mislukt: ${friendlyError(err)}]\n`);
        setIdle();
      }
    },
    [appendRepl, refreshFiles, setBusy, setIdle, currentFile],
  );

  const applyTemplate = useCallback(
    (id: string) => {
      if (!id) return;
      const t = TEMPLATES.find((x) => x.id === id);
      if (!t) return;
      if (isDirty && !confirm('Niet-opgeslagen wijzigingen worden overschreven. Doorgaan?')) return;
      setCode(t.code);
      setLoadedCode(t.code);
      setCurrentFile(null);
    },
    [isDirty],
  );

  const downloadFirmware = useCallback(() => {
    // micropython.org levert het bestand als octet-stream, dus de browser
    // downloadt het direct — geen fetch/CORS nodig.
    const a = document.createElement('a');
    a.href = MICROPYTHON_UF2_URL;
    a.rel = 'noopener';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setShowFlashHelp(true);
  }, []);

  if (!supported) {
    return (
      <div className={styles.root}>
        <div className={styles.warning}>
          <strong>Deze browser ondersteunt WebSerial niet.</strong>
          <p>
            Gebruik Google Chrome of Microsoft Edge (versie 89+) om met het board te kunnen praten
            vanuit de browser. Werkt dat niet? Volg dan de Thonny-instructies onder{' '}
            <a href="/docs/Microcontrollers/Arduino Nano RP2040 Connect/Tutorial-installatie/2_editor">
              Tutorial installatie
            </a>
            .
          </p>
        </div>
      </div>
    );
  }

  const connected = status !== 'disconnected';

  return (
    <div className={styles.root}>
      <div className={styles.toolbar}>
        <span
          className={clsx(
            styles.status,
            status === 'disconnected' && styles.statusDisconnected,
            status === 'connected' && styles.statusConnected,
            status === 'busy' && styles.statusBusy,
          )}
        >
          <span className={styles.statusDot} />
          {status === 'disconnected' && 'Niet verbonden'}
          {status === 'connected' && 'Verbonden'}
          {status === 'busy' && 'Bezig...'}
        </span>

        {!connected && (
          <button type="button" className={clsx(styles.btn, styles.btnPrimary)} onClick={connect}>
            Verbind met board
          </button>
        )}
        {connected && (
          <button
            type="button"
            className={styles.btn}
            onClick={disconnect}
            disabled={status === 'busy'}
          >
            Verbreek
          </button>
        )}

        <button
          type="button"
          className={clsx(styles.btn, styles.btnPrimary)}
          onClick={runOnBoard}
          disabled={!connected || status === 'busy'}
          title="Schrijft de code naar /main.py en herstart het board"
        >
          Run op board
        </button>
        {currentFile && currentFile !== '/main.py' && (
          <button
            type="button"
            className={styles.btn}
            onClick={saveCurrent}
            disabled={!connected || status === 'busy' || !isDirty}
            title={`Schrijft de code naar ${currentFile} (geen reboot)`}
          >
            Opslaan
          </button>
        )}
        <button
          type="button"
          className={clsx(styles.btn, styles.btnDanger)}
          onClick={stop}
          disabled={!connected}
          title="Onderbreek het draaiende programma (KeyboardInterrupt)"
        >
          Stop
        </button>
        <button
          type="button"
          className={styles.btn}
          onClick={herstart}
          disabled={!connected || status === 'busy'}
          title="Herstart het board; main.py draait dan opnieuw"
        >
          Herstart
        </button>
        <button
          type="button"
          className={styles.btn}
          onClick={newFile}
          title="Leeg de editor (begin een nieuw bestand)"
        >
          Nieuw
        </button>

        <span className={styles.spacer} />

        <button
          type="button"
          className={styles.btn}
          onClick={() => (files === null ? refreshFiles('/') : setFiles(null))}
          disabled={!connected || status === 'busy'}
        >
          {files === null ? 'Bestanden op board' : 'Verberg bestanden'}
        </button>

        <select
          className={styles.select}
          aria-label="Voorbeeld laden"
          defaultValue=""
          onChange={(e) => {
            applyTemplate(e.target.value);
            e.target.value = '';
          }}
        >
          <option value="" disabled>
            Voorbeeld laden...
          </option>
          {TEMPLATES.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      {!connected && (
        <div className={styles.startHulp}>
          <strong>Zo werkt het</strong>
          <ol>
            <li>Sluit het board met een USB-kabel aan op je computer.</li>
            <li>
              Klik op <strong>Verbind met board</strong> en kies je board in de lijst.
            </li>
            <li>
              Klik op <strong>Run op board</strong> om de code uit de editor te draaien.
            </li>
          </ol>
          <p>
            Splinternieuw board, of werkt <code>import leaphymicropython</code> niet? Doe dan eerst
            de eenmalige stappen onder <strong>Board instellen</strong> hieronder.
          </p>
        </div>
      )}

      <details className={styles.setup}>
        <summary>Board instellen (eenmalig)</summary>
        <div className={styles.setupBody}>
          <p>
            Twee stappen die je per board maar één keer doet: MicroPython op het board zetten, en
            daarna de Leaphy-library installeren.
          </p>
          <div className={styles.setupActies}>
            <button
              type="button"
              className={styles.btn}
              onClick={downloadFirmware}
              title={`Download de MicroPython-firmware (${MICROPYTHON_VERSION}) om op het board te flashen`}
            >
              1. MicroPython-firmware ({MICROPYTHON_VERSION})
            </button>
            <button
              type="button"
              className={styles.btn}
              onClick={installLib}
              disabled={!connected || status === 'busy'}
              title={connected ? undefined : 'Verbind eerst met het board'}
            >
              2. Installeer Leaphy-library
            </button>
          </div>
          <details className={styles.leaphyAdvanced}>
            <summary>Geavanceerd: andere Leaphy-bron</summary>
            <div className={styles.leaphyAdvancedFields}>
              <label className={styles.leaphyAdvancedField}>
                Repo
                <input
                  type="text"
                  value={leaphyRepo}
                  onChange={(e) => setLeaphyRepo(e.target.value)}
                  placeholder={DEFAULT_LEAPHY_REPO}
                />
              </label>
              <label className={styles.leaphyAdvancedField}>
                Branch
                <input
                  type="text"
                  value={leaphyBranch}
                  onChange={(e) => setLeaphyBranch(e.target.value)}
                  placeholder={DEFAULT_LEAPHY_BRANCH}
                />
              </label>
              {(leaphyRepo !== DEFAULT_LEAPHY_REPO || leaphyBranch !== DEFAULT_LEAPHY_BRANCH) && (
                <button
                  type="button"
                  className={styles.btn}
                  onClick={() => {
                    setLeaphyRepo(DEFAULT_LEAPHY_REPO);
                    setLeaphyBranch(DEFAULT_LEAPHY_BRANCH);
                  }}
                >
                  Terug naar standaard
                </button>
              )}
            </div>
          </details>
        </div>
      </details>

      {progress && (
        <div className={styles.progress}>
          <span>
            Bezig met installeren: {progress.current}
            {progress.total > 0 && ` (${progress.done}/${progress.total})`}
          </span>
          {progress.total > 0 && (
            <progress className={styles.progressBalk} value={progress.done} max={progress.total} />
          )}
        </div>
      )}

      {foutZichtbaar && fout && (
        <div className={styles.foutBanner}>
          <div className={styles.foutBannerHead}>
            <strong>
              {fout.type}
              {fout.regel !== null && ` op regel ${fout.regel}`}
            </strong>
            <button
              type="button"
              className={styles.fileDelete}
              onClick={() => setFoutWeggedrukt(foutSignatuur(fout))}
              title="Sluiten"
            >
              ✕
            </button>
          </div>
          {fout.melding && <code className={styles.foutBannerMelding}>{fout.melding}</code>}
          <p className={styles.foutBannerUitleg}>
            {fout.uitleg} Kom je er niet uit? Kijk op de{' '}
            <a href={DEBUG_DOCS_URL} target="_blank" rel="noreferrer">
              Debuggen-pagina
            </a>
            .
          </p>
        </div>
      )}

      {showFlashHelp && (
        <div className={styles.flashHelp}>
          <div className={styles.flashHelpHead}>
            <strong>MicroPython flashen ({MICROPYTHON_VERSION})</strong>
            <button
              type="button"
              className={styles.fileDelete}
              onClick={() => setShowFlashHelp(false)}
              title="Sluiten"
            >
              ✕
            </button>
          </div>
          <ol>
            <li>
              De download van het <code>.uf2</code>-bestand start automatisch. Komt hij niet?{' '}
              <a href={MICROPYTHON_UF2_URL}>Download hem dan hier</a>.
            </li>
            <li>
              Druk <strong>twee keer snel achter elkaar</strong> op de reset-knop van het board. Er
              verschijnt nu een nieuwe schijf met de naam <code>RPI-RP2</code>.
            </li>
            <li>
              Sleep het gedownloade <code>.uf2</code>-bestand op die <code>RPI-RP2</code>-schijf.
            </li>
            <li>
              Het board herstart vanzelf met MicroPython. Klik daarna op{' '}
              <strong>Verbind met board</strong>.
            </li>
          </ol>
          <p className={styles.flashHelpFoot}>
            Andere versie nodig? Kies hem op de{' '}
            <a href={MICROPYTHON_DOWNLOAD_PAGE}>officiële MicroPython-pagina</a>.
          </p>
        </div>
      )}

      <div className={styles.workArea}>
        {files !== null && (
          <div className={styles.workPaneNarrow}>
            <div className={styles.fileLabel}>
              <span>Bestanden op board</span>
            </div>
            <div className={styles.fileList}>
              <div className={styles.fileDirHeader}>
                {currentDir}
                {currentDir !== '/' && (
                  <button
                    type="button"
                    className={clsx(styles.fileDelete, styles.fileUp)}
                    onClick={() => {
                      const parent = currentDir.replace(/\/[^/]+\/?$/, '') || '/';
                      refreshFiles(parent);
                    }}
                    title="Naar de bovenliggende map"
                  >
                    ↑ omhoog
                  </button>
                )}
              </div>
              {files.length === 0 && <div>(leeg)</div>}
              {files.map((f) => (
                <div className={styles.fileRow} key={f.name}>
                  <span className={styles.fileKind}>{f.isDir ? 'map' : 'bestand'}</span>
                  <button
                    type="button"
                    className={styles.fileName}
                    onClick={() => (f.isDir ? refreshFiles(f.path) : openFile(f.path))}
                    title={f.isDir ? 'Open map' : 'Open in editor'}
                  >
                    {f.name}
                  </button>
                  <button
                    type="button"
                    className={styles.fileDelete}
                    onClick={() => deleteFile(f.path)}
                    title={`Verwijder ${f.name} van het board`}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className={styles.workPaneWide}>
          <div className={styles.fileLabel}>
            <span>
              Bewerkt: <code>{currentFile ?? 'Nieuw bestand'}</code>
              {isDirty && (
                <span className={styles.dirtyMark} title="niet-opgeslagen wijzigingen">
                  {' '}
                  •
                </span>
              )}
            </span>
          </div>

          <div className={styles.editorWrap}>
            <CodeMirror
              value={code}
              onChange={setCode}
              extensions={editorExtensions}
              theme={colorMode === 'dark' ? 'dark' : 'light'}
              height="380px"
              basicSetup={{
                lineNumbers: true,
                highlightActiveLine: true,
                foldGutter: true,
                autocompletion: true,
                indentOnInput: true,
              }}
            />
          </div>
        </div>

        <div className={styles.workPane}>
          <div className={styles.replWrap}>
            <div className={styles.replHeader}>
              <span className={styles.replLabel}>REPL-output</span>
              <button
                type="button"
                className={clsx(styles.btn, styles.btnKlein)}
                onClick={clearRepl}
              >
                Wis
              </button>
            </div>
            <div className={styles.repl} ref={replRef}>
              {replText
                ? (() => {
                    let positie = 0;
                    return splitsFoutSegmenten(replText).map((segment) => {
                      const key = positie;
                      positie += segment.tekst.length;
                      return segment.fout ? (
                        <span key={key} className={styles.replFout}>
                          {segment.tekst}
                        </span>
                      ) : (
                        <span key={key}>{segment.tekst}</span>
                      );
                    });
                  })()
                : '(geen output)'}
            </div>
            <input
              type="text"
              className={styles.replInput}
              value={replInput}
              onChange={(e) => setReplInput(e.target.value)}
              onKeyDown={handleReplKeyDown}
              disabled={status !== 'connected'}
              placeholder=">>> voer een regel in"
              spellCheck={false}
              autoComplete="off"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

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

import { leesEditorHash } from './codeLink';
import { friendlyError } from './errorMessages';
import { BoardFS } from './filesystem';
import {
  DEFAULT_LEAPHY_BRANCH,
  DEFAULT_LEAPHY_REPO,
  type InstallProgress,
  LEAPHY_META_PATH,
  type LeaphyMeta,
  installLeaphyLibrary,
} from './leaphyInstaller';
import { MAX_REEKSEN, voegSample } from './plotter';
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

const PLOT_KLEUREN = ['#4fc3f7', '#ffb74d', '#81c784', '#e57373'];

/** Tekent de meetreeksen als lijnen; schaal past zich aan de data aan. */
function tekenPlot(canvas: HTMLCanvasElement, samples: number[][]): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const b = canvas.width;
  const h = canvas.height;
  ctx.fillStyle = '#1e1e1e';
  ctx.fillRect(0, 0, b, h);
  if (samples.length < 2) {
    ctx.fillStyle = '#9a9a9a';
    ctx.font = '13px monospace';
    ctx.fillText('wachten op getallen in de uitvoer...', 10, 22);
    return;
  }
  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;
  for (const s of samples) {
    for (const v of s) {
      if (v < min) min = v;
      if (v > max) max = v;
    }
  }
  if (min === max) {
    min -= 1;
    max += 1;
  }
  const reeksen = Math.min(MAX_REEKSEN, Math.max(...samples.map((s) => s.length)));
  const x = (i: number) => 4 + (i / (samples.length - 1)) * (b - 8);
  const y = (v: number) => h - 6 - ((v - min) / (max - min)) * (h - 28);
  for (let r = 0; r < reeksen; r++) {
    ctx.strokeStyle = PLOT_KLEUREN[r];
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    let begonnen = false;
    samples.forEach((s, i) => {
      if (s[r] === undefined) return;
      if (begonnen) ctx.lineTo(x(i), y(s[r]));
      else {
        ctx.moveTo(x(i), y(s[r]));
        begonnen = true;
      }
    });
    ctx.stroke();
  }
  // legenda: de laatste waarde per reeks, in de reekskleur
  ctx.font = '12px monospace';
  const laatste = samples[samples.length - 1];
  let tx = 8;
  for (let r = 0; r < reeksen; r++) {
    const label = laatste[r] === undefined ? '-' : String(laatste[r]);
    ctx.fillStyle = PLOT_KLEUREN[r];
    ctx.fillText(label, tx, 15);
    tx += ctx.measureText(label).width + 16;
  }
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
const FONT_STORAGE_KEY = 'webMicroEditor.fontSize';

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
  // Kwam de laatste <stdin>-uitvoer van "Test direct" (editorcode) of van een
  // los getypte REPL-regel? Alleen in het eerste geval mag een <stdin>-fout
  // een regel in de editor markeren.
  const [stdinVanTest, setStdinVanTest] = useState<boolean>(false);
  const [portLabel, setPortLabel] = useState<string | null>(null);
  const [plotterAan, setPlotterAan] = useState<boolean>(false);
  const [fontSize, setFontSize] = useState<number>(() => {
    if (typeof window === 'undefined') return 14;
    const bewaard = Number(localStorage.getItem(FONT_STORAGE_KEY));
    return bewaard >= 12 && bewaard <= 24 ? bewaard : 14;
  });
  const samplesRef = useRef<number[][]>([]);
  const lineBufRef = useRef<string>('');
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  // Verhoogd bij elk nieuw sample; de tekenloop slaat identieke frames over.
  const plotVersieRef = useRef<number>(0);
  // Spiegel van `status` voor de sneltoetsen: die moeten dezelfde
  // busy-blokkering hebben als de uitgeschakelde toolbar-knoppen.
  const statusRef = useRef<Status>('disconnected');
  useEffect(() => {
    statusRef.current = status;
  }, [status]);

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
    // Voed de plotter met complete regels; de rest wacht op de volgende chunk.
    lineBufRef.current += text;
    const delen = lineBufRef.current.split('\n');
    lineBufRef.current = delen.pop() ?? '';
    // Niet trimmen: de inspringing van traceback-regels is juist het signaal
    // waarmee de plotter ze herkent en overslaat.
    for (const regel of delen) {
      if (voegSample(samplesRef.current, regel)) plotVersieRef.current += 1;
    }

    setReplText((prev) => {
      const next = (prev + text).slice(-20000); // cap at ~20KB
      return next;
    });
  }, []);

  const clearRepl = useCallback(() => {
    samplesRef.current = [];
    lineBufRef.current = '';
    plotVersieRef.current += 1;
    setFoutWeggedrukt(null);
    setReplText('');
  }, []);

  // Code die via "Open in de editor" onder een lesvoorbeeld meekomt (#code=…).
  // biome-ignore lint/correctness/useExhaustiveDependencies: bewust alleen bij mount; `code` is daar nog de beginstand.
  useEffect(() => {
    const geladen = leesEditorHash(window.location.hash);
    if (geladen === null) return;
    // Pas ná de keuze de hash strippen: wie annuleert (bv. om eerst eigen
    // code te kopiëren) houdt zo een URL die de lescode opnieuw aanbiedt.
    if (
      code.trim() !== '' &&
      code !== geladen &&
      !confirm('De code uit de les vervangt je huidige code in de editor. Doorgaan?')
    ) {
      return;
    }
    window.history.replaceState(null, '', window.location.pathname);
    setCode(geladen);
    setLoadedCode(geladen);
    setCurrentFile(null);
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(FONT_STORAGE_KEY, String(fontSize));
    }
  }, [fontSize]);

  // De plotter tekent op een eigen ritme vanuit de sample-ref, zodat een
  // print-loop van 100 Hz geen 100 React-renders per seconde veroorzaakt.
  // Zonder nieuwe samples wordt er ook niet hertekend (batterij/beamer).
  useEffect(() => {
    if (!plotterAan) return;
    let raf = 0;
    let getekend = -1;
    const teken = () => {
      if (canvasRef.current && plotVersieRef.current !== getekend) {
        tekenPlot(canvasRef.current, samplesRef.current);
        getekend = plotVersieRef.current;
      }
      raf = requestAnimationFrame(teken);
    };
    raf = requestAnimationFrame(teken);
    return () => cancelAnimationFrame(raf);
  }, [plotterAan]);

  const setBusy = useCallback(() => setStatus('busy'), []);
  // Valt de verbinding weg tijdens een operatie, dan mag de afronding daarvan
  // de door onDisconnect gezette status niet terug op 'connected' zetten.
  const setIdle = useCallback(
    () => setStatus(clientRef.current ? 'connected' : 'disconnected'),
    [],
  );

  const connect = useCallback(async () => {
    if (!supported) return;
    if (clientRef.current) return;
    const client = new SerialClient();
    client.onData = appendRepl;
    client.onDisconnect = () => {
      clientRef.current = null;
      setStatus('disconnected');
      setPortLabel(null);
      appendRepl('\n[verbinding verbroken]\n');
    };
    try {
      await client.connect();
      clientRef.current = client;
      setStatus('connected');
      const info = client.portInfo;
      setPortLabel(
        info?.usbVendorId === 0x2341 ? 'Arduino' : info?.usbVendorId === 0x2e8a ? 'RP2040' : null,
      );
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
    setPortLabel(null);
  }, []);

  const runOnBoard = useCallback(async () => {
    const c = clientRef.current;
    if (!c || statusRef.current === 'busy') return;
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
    if (!c || !currentFile || statusRef.current === 'busy') return;
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

  /** Draait de editor-code eenmalig via de raw REPL, zonder main.py aan te raken. */
  const testDirect = useCallback(async () => {
    const c = clientRef.current;
    if (!c || statusRef.current === 'busy') return;
    setBusy();
    clearRepl();
    setStdinVanTest(true);
    appendRepl('[test zonder opslaan — Stop onderbreekt]\n');
    try {
      await c.runCode(code, 0, appendRepl);
    } catch (err) {
      appendRepl(`\n[test mislukt: ${friendlyError(err)}]\n`);
    }
    setIdle();
  }, [code, appendRepl, clearRepl, setBusy, setIdle]);

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
    if (!c || statusRef.current === 'busy') return;
    clearRepl();
    appendRepl('[herstart: main.py draait opnieuw]\n');
    try {
      // Eerst onderbreken: Ctrl-D werkt alleen vanuit de REPL-prompt. Tijdens
      // een draaiende while True-loop zou hij anders genegeerd worden
      // (mpremote doet dit om dezelfde reden).
      await c.interrupt();
      await new Promise((r) => setTimeout(r, 100));
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

  // <stdin>-tracebacks passen alleen op de editorbuffer als ze uit "Test
  // direct" komen (een los getypte REPL-regel heeft ook <stdin>); main.py-
  // fouten alleen markeren als main.py ook echt openstaat.
  const foutRegelInEditor =
    (fout?.bron === '<stdin>' && stdinVanTest) ||
    (fout?.bron === 'main.py' && currentFile === '/main.py');

  const editorExtensions = useMemo(() => {
    const ext: Extension[] = [...pythonTabExtensions, sneltoetsen];
    if (foutZichtbaar && fout?.regel && foutRegelInEditor) {
      ext.push(foutRegelExtension(fout.regel, styles.foutRegel));
    }
    return ext;
  }, [sneltoetsen, fout, foutZichtbaar, foutRegelInEditor]);

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
    setStdinVanTest(false);
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

  const saveAs = useCallback(async () => {
    const c = clientRef.current;
    if (!c || statusRef.current === 'busy') return;
    const invoer = prompt('Bestandsnaam op het board:', currentFile ?? '/mijn_script.py');
    if (!invoer || !invoer.trim()) return;
    let pad = invoer.trim();
    if (!pad.startsWith('/')) pad = `/${pad}`;
    if (!pad.includes('.')) pad = `${pad}.py`;
    setBusy();
    try {
      const fs = new BoardFS(c);
      await fs.writeFile(pad, code);
      setCurrentFile(pad);
      setLoadedCode(code);
      appendRepl(`[opgeslagen: ${pad}]\n`);
      if (files !== null) await refreshFiles();
      setIdle();
    } catch (err) {
      appendRepl(`\n[opslaan mislukt: ${friendlyError(err)}]\n`);
      setIdle();
    }
  }, [code, currentFile, files, refreshFiles, appendRepl, setBusy, setIdle]);

  /** Toont welke Leaphy-library op het board staat (herkomst-stempel van de installer). */
  const checkLibrary = useCallback(async () => {
    const c = clientRef.current;
    if (!c) return;
    setBusy();
    const fs = new BoardFS(c);
    try {
      const meta: LeaphyMeta = JSON.parse(
        new TextDecoder().decode(await fs.readFile(LEAPHY_META_PATH)),
      );
      appendRepl(
        `[library op board: ${meta.repo}@${meta.branch}, geïnstalleerd op ${meta.installedAt.slice(0, 10)}]\n`,
      );
    } catch {
      // Geen stempel: kijk of de library er überhaupt staat. Faalt ook dat,
      // dan is het een verbindingsprobleem — niet "geen library" melden.
      try {
        const lib = await fs.listdir('/lib');
        appendRepl(
          lib.some((i) => i.name === 'leaphymicropython')
            ? '[library aanwezig; herkomst onbekend (niet via deze editor geïnstalleerd)]\n'
            : '[geen leaphymicropython-library op het board gevonden]\n',
        );
      } catch (err) {
        appendRepl(`\n[check mislukt: ${friendlyError(err)}]\n`);
      }
    }
    setIdle();
  }, [appendRepl, setBusy, setIdle]);

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
          {status === 'connected' && `Verbonden${portLabel ? ` — ${portLabel}` : ''}`}
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
        <button
          type="button"
          className={styles.btn}
          onClick={testDirect}
          disabled={!connected || status === 'busy'}
          title="Draait de code eenmalig, zonder main.py te veranderen"
        >
          Test direct
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
          className={styles.btn}
          onClick={saveAs}
          disabled={!connected || status === 'busy'}
          title="Sla de code onder een zelfgekozen naam op het board op"
        >
          Opslaan als...
        </button>
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
          className={clsx(styles.btn, styles.btnKlein)}
          onClick={() => setFontSize((v) => Math.max(12, v - 2))}
          disabled={fontSize <= 12}
          title="Kleinere letters"
        >
          A−
        </button>
        <button
          type="button"
          className={clsx(styles.btn, styles.btnKlein)}
          onClick={() => setFontSize((v) => Math.min(24, v + 2))}
          disabled={fontSize >= 24}
          title="Grotere letters (handig op de beamer)"
        >
          A+
        </button>

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
            <button
              type="button"
              className={styles.btn}
              onClick={checkLibrary}
              disabled={!connected || status === 'busy'}
              title={
                connected
                  ? 'Kijk welke library-versie er op het board staat'
                  : 'Verbind eerst met het board'
              }
            >
              Check library op board
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
              {fout.regel !== null && foutRegelInEditor && ` op regel ${fout.regel}`}
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

          <div className={styles.editorWrap} style={{ fontSize }}>
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
              <span className={styles.replLabel} title="ook wel REPL-output genoemd">
                Shell
              </span>
              <button
                type="button"
                className={clsx(styles.btn, styles.btnKlein)}
                onClick={clearRepl}
              >
                Wis
              </button>
              <button
                type="button"
                className={clsx(styles.btn, styles.btnKlein, plotterAan && styles.btnActief)}
                onClick={() => setPlotterAan((v) => !v)}
                title="Tekent getallen uit de uitvoer als grafiek — handig bij het kalibreren van je sensoren"
              >
                Plotter
              </button>
            </div>
            {plotterAan && (
              <canvas ref={canvasRef} className={styles.plot} width={600} height={160} />
            )}
            <div className={styles.repl} ref={replRef} style={{ fontSize }}>
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
              style={{ fontSize }}
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

import { acceptCompletion, completionStatus } from '@codemirror/autocomplete';
import { indentMore } from '@codemirror/commands';
import { python } from '@codemirror/lang-python';
import { indentUnit } from '@codemirror/language';
import { Prec } from '@codemirror/state';
import { EditorView, keymap } from '@codemirror/view';
import { useColorMode } from '@docusaurus/theme-common';
import CodeMirror from '@uiw/react-codemirror';
import clsx from 'clsx';
import type React from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { BoardFS } from './filesystem';
import { type InstallProgress, installLeaphyLibrary } from './leaphyInstaller';
import { SerialClient } from './serial';
import styles from './styles.module.css';
import { TEMPLATES } from './templates';

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

  const isDirty = code !== loadedCode;

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
    } catch (err: any) {
      appendRepl(`[verbinden mislukt: ${err.message ?? err}]\n`);
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
    } catch (err: any) {
      appendRepl(`\n[fout: ${err.message ?? err}]\n`);
      setIdle();
    }
  }, [code, appendRepl, clearRepl, setBusy, setIdle]);

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
    } catch (err: any) {
      appendRepl(`\n[opslaan mislukt: ${err.message ?? err}]\n`);
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
      } catch (err: any) {
        appendRepl(`\n[openen mislukt: ${err.message ?? err}]\n`);
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
    } catch (err: any) {
      appendRepl(`\n[stop mislukt: ${err.message ?? err}]\n`);
    }
  }, [appendRepl]);

  const installLib = useCallback(async () => {
    const c = clientRef.current;
    if (!c) return;
    setBusy();
    setProgress({ done: 0, total: 0, current: 'lijst ophalen...' });
    try {
      const fs = new BoardFS(c);
      await installLeaphyLibrary(fs, (p) => setProgress(p));
      setProgress(null);
      appendRepl('\n[Leaphy-library geïnstalleerd]\n');
      setIdle();
    } catch (err: any) {
      setProgress(null);
      appendRepl(`\n[installer mislukt: ${err.message ?? err}]\n`);
      setIdle();
    }
  }, [appendRepl, setBusy, setIdle]);

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
          path: dir.endsWith('/') ? dir + it.name : dir + '/' + it.name,
        }));
        // Toon alleen .py-bestanden en de lib-map. In de root verbergen we andere
        // mappen; binnen lib blijven submappen zichtbaar zodat je kunt bladeren.
        const visible = withPaths.filter((it) =>
          it.isDir ? (dir === '/' ? it.name === 'lib' : true) : it.name.endsWith('.py'),
        );
        setFiles(visible);
        setCurrentDir(dir);
        setIdle();
      } catch (err: any) {
        appendRepl(`\n[bestandslijst mislukt: ${err.message ?? err}]\n`);
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
      } catch (err: any) {
        appendRepl(`\n[verwijderen mislukt: ${err.message ?? err}]\n`);
        setIdle();
      }
    },
    [appendRepl, refreshFiles, setBusy, currentFile],
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
          <span className={styles.statusDot}></span>
          {status === 'disconnected' && 'Niet verbonden'}
          {status === 'connected' && 'Verbonden'}
          {status === 'busy' && 'Bezig...'}
        </span>

        {!connected && (
          <button className={clsx(styles.btn, styles.btnPrimary)} onClick={connect}>
            Verbind met board
          </button>
        )}
        {connected && (
          <button className={styles.btn} onClick={disconnect} disabled={status === 'busy'}>
            Verbreek
          </button>
        )}

        <button
          className={clsx(styles.btn, styles.btnPrimary)}
          onClick={runOnBoard}
          disabled={!connected || status === 'busy'}
          title="Schrijft de code naar /main.py en herstart het board"
        >
          Run op board
        </button>
        {currentFile && currentFile !== '/main.py' && (
          <button
            className={styles.btn}
            onClick={saveCurrent}
            disabled={!connected || status === 'busy' || !isDirty}
            title={`Schrijft de code naar ${currentFile} (geen reboot)`}
          >
            Opslaan
          </button>
        )}
        <button
          className={styles.btn}
          onClick={newFile}
          title="Leeg de editor (begin een nieuw bestand)"
        >
          Nieuw
        </button>
        <button className={clsx(styles.btn, styles.btnDanger)} onClick={stop} disabled={!connected}>
          Stop
        </button>

        <button
          className={styles.btn}
          onClick={installLib}
          disabled={!connected || status === 'busy'}
        >
          Installeer Leaphy-library
        </button>
        <button
          className={styles.btn}
          onClick={downloadFirmware}
          title={`Download de MicroPython-firmware (${MICROPYTHON_VERSION}) om op het board te flashen`}
        >
          MicroPython-firmware ({MICROPYTHON_VERSION})
        </button>

        <span className={styles.spacer}></span>

        <button
          className={styles.btn}
          onClick={() => (files === null ? refreshFiles('/') : setFiles(null))}
          disabled={!connected || status === 'busy'}
        >
          {files === null ? 'Bestanden op board' : 'Verberg bestanden'}
        </button>

        <select
          className={styles.select}
          defaultValue=""
          onChange={(e) => {
            applyTemplate(e.target.value);
            e.target.value = '';
          }}
        >
          <option value="" disabled>
            Template laden...
          </option>
          {TEMPLATES.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      {progress && (
        <div className={styles.progress}>
          Bezig met installeren: {progress.current} ({progress.done}/{progress.total})
        </div>
      )}

      {showFlashHelp && (
        <div className={styles.flashHelp}>
          <div className={styles.flashHelpHead}>
            <strong>MicroPython flashen ({MICROPYTHON_VERSION})</strong>
            <button
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
              <div style={{ marginBottom: 6, fontWeight: 600 }}>
                {currentDir}
                {currentDir !== '/' && (
                  <button
                    className={styles.fileDelete}
                    style={{ marginLeft: 10 }}
                    onClick={() => {
                      const parent = currentDir.replace(/\/[^/]+\/?$/, '') || '/';
                      refreshFiles(parent);
                    }}
                  >
                    ↑ omhoog
                  </button>
                )}
              </div>
              {files.length === 0 && <div>(leeg)</div>}
              {files.map((f) => (
                <div className={styles.fileRow} key={f.name}>
                  <span className={styles.fileKind}>{f.isDir ? 'map' : 'bestand'}</span>
                  <span
                    className={styles.fileName}
                    style={{ cursor: 'pointer', textDecoration: 'underline' }}
                    onClick={() => (f.isDir ? refreshFiles(f.path) : openFile(f.path))}
                    title={f.isDir ? 'Open map' : 'Open in editor'}
                  >
                    {f.name}
                  </span>
                  <button className={styles.fileDelete} onClick={() => deleteFile(f.path)}>
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
              extensions={pythonTabExtensions}
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
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span className={styles.replLabel}>REPL-output</span>
              <button
                className={styles.btn}
                onClick={clearRepl}
                style={{ padding: '2px 8px', fontSize: 12 }}
              >
                Wis
              </button>
            </div>
            <div className={styles.repl} ref={replRef}>
              {replText || '(geen output)'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import clsx from 'clsx';
import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { languageForPath } from '../../lib/languages';
import MonacoPane from '../../monaco/MonacoPane';
import { RUNNER_META } from '../../runners/registry';
import Console from '../shared/Console';
import RunControls from '../shared/RunControls';
import { useRunSession } from '../shared/useRunSession';
import type { InlineEditorProps } from './index';
import styles from './styles.module.css';

const DEFAULT_ENTRY: Record<string, string> = {
  python: 'main.py',
  web: 'index.html',
  micropython: 'main.py',
};

const AUTO_RUN_DEBOUNCE_MS = 600;

// Monaco-modellen zijn globaal per pad. Meerdere editors op één pagina
// gebruiken allemaal 'main.py', dus elk exemplaar krijgt een eigen prefix om
// model-deling (en dus gedeelde inhoud) te voorkomen.
let instanceCounter = 0;

function storageKey(persistKey: string): string {
  return `coderius-editor:inline:${persistKey}`;
}

export default function InlineEditorImpl({
  runner: runnerId,
  code,
  children,
  files,
  entry,
  height = 260,
  readOnly = false,
  hiddenSetup,
  persistKey,
  autoRun,
  showPreview = true,
  title,
}: InlineEditorProps): ReactNode {
  const entryPath =
    entry ?? (files ? Object.keys(files)[0] : (DEFAULT_ENTRY[runnerId] ?? 'main.py'));

  // biome-ignore lint/correctness/useExhaustiveDependencies: de startcode van een lespagina verandert niet tijdens de sessie.
  const initialFiles = useMemo<Record<string, string>>(() => {
    if (files) return files;
    const single = code ?? children ?? '';
    return { [entryPath]: single };
  }, []);

  const [currentFiles, setCurrentFiles] = useState<Record<string, string>>(() => {
    if (persistKey) {
      try {
        const saved = window.localStorage.getItem(storageKey(persistKey));
        if (saved) {
          const parsed = JSON.parse(saved);
          // Alleen herstellen als de bestandsnamen nog overeenkomen met de
          // (mogelijk inmiddels aangepaste) lespagina.
          if (
            parsed &&
            typeof parsed === 'object' &&
            Object.keys(parsed).join('\n') === Object.keys(initialFiles).join('\n')
          ) {
            return parsed;
          }
        }
      } catch {
        // kapotte opslag: negeren, start met de originele code
      }
    }
    return initialFiles;
  });
  const [activePath, setActivePath] = useState(entryPath);
  const [instanceId] = useState(() => ++instanceCounter);
  const session = useRunSession(runnerId);

  const filesRef = useRef(currentFiles);
  filesRef.current = currentFiles;

  const handleRun = useCallback(() => {
    session.clear();
    void session.run(filesRef.current, entryPath, { setup: hiddenSetup });
  }, [session.run, session.clear, entryPath, hiddenSetup]);

  const runRef = useRef(handleRun);
  runRef.current = handleRun;

  const handleChange = useCallback(
    (value: string) => {
      setCurrentFiles((prev) => ({ ...prev, [activePath]: value }));
    },
    [activePath],
  );

  const handleReset = useCallback(() => {
    setCurrentFiles(initialFiles);
    session.clear();
    if (persistKey) {
      try {
        window.localStorage.removeItem(storageKey(persistKey));
      } catch {
        // opslag niet beschikbaar
      }
    }
  }, [initialFiles, session.clear, persistKey]);

  // Opt-in: bewerkingen bewaren zodat een leerling na een refresh verder kan.
  useEffect(() => {
    if (!persistKey || currentFiles === initialFiles) return;
    const timer = window.setTimeout(() => {
      try {
        window.localStorage.setItem(storageKey(persistKey), JSON.stringify(currentFiles));
      } catch {
        // opslag vol of niet beschikbaar
      }
    }, 300);
    return () => window.clearTimeout(timer);
  }, [currentFiles, persistKey, initialFiles]);

  // Live preview: opnieuw uitvoeren tijdens het typen (web-runner).
  const wantAutoRun = (session.runner?.capabilities.autoRun ?? false) && autoRun !== false;
  // biome-ignore lint/correctness/useExhaustiveDependencies: currentFiles is bewust de trigger; de inhoud komt uit filesRef.
  useEffect(() => {
    if (!wantAutoRun) return;
    const timer = window.setTimeout(() => {
      void session.run(filesRef.current, entryPath);
    }, AUTO_RUN_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [wantAutoRun, currentFiles, session.run, entryPath]);

  const paths = Object.keys(currentFiles);
  const showTabs = paths.length > 1;
  const runner = session.runner;
  const Preview = runner?.capabilities.preview && showPreview ? runner.PreviewComponent : undefined;
  const Input = runner?.InputComponent;

  return (
    <div className={styles.container}>
      <div className={styles.toolbar}>
        <span className={styles.title}>{title ?? RUNNER_META[runnerId]?.label ?? runnerId}</span>
        <RunControls
          session={session}
          onRun={handleRun}
          onReset={readOnly ? undefined : handleReset}
        />
      </div>
      {showTabs && (
        <div className={styles.tabs} role="tablist">
          {paths.map((path) => (
            <button
              key={path}
              type="button"
              role="tab"
              aria-selected={path === activePath}
              className={clsx(styles.tab, path === activePath && styles.tabActive)}
              onClick={() => setActivePath(path)}
            >
              {path}
            </button>
          ))}
        </div>
      )}
      <div className={styles.editor}>
        <MonacoPane
          value={currentFiles[activePath] ?? ''}
          onChange={readOnly ? undefined : handleChange}
          language={languageForPath(activePath)}
          path={`inline-${instanceId}/${activePath}`}
          height={height}
          readOnly={readOnly}
          onMount={(editor, monaco) => {
            editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
              runRef.current();
            });
          }}
        />
      </div>
      <div className={clsx(styles.output, Preview && styles.outputSplit)}>
        {Preview && (
          <div className={styles.preview}>
            <Preview session={session} />
          </div>
        )}
        <Console events={session.events} />
      </div>
      {Input && <Input session={session} />}
    </div>
  );
}

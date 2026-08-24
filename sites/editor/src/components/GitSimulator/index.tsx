import BrowserOnly from '@docusaurus/BrowserOnly';
import { type KeyboardEvent, type ReactNode, useEffect, useRef, useState } from 'react';
import { vulAan } from './autocomplete';
import {
  type RepoState,
  addToIgnore,
  deleteFile,
  emptyState,
  runCommand,
  setFile,
} from './gitEngine';
import { scenario } from './scenarios';
import styles from './styles.module.css';

type Props = {
  /** Verwijst naar een scenario in scenarios.ts; daar staat het doel en de
      beginsituatie. Zo kan scenarios.test.ts elk doel echt naspelen. */
  scenarioId: string;
  allowFileEditing?: boolean;
  intro?: ReactNode;
};

type HistoryLine = {
  kind: 'input' | 'output' | 'error';
  text: string;
  /** Uit de voorbereiding: staat er wel, maar heb jij niet getypt. */
  eerder?: boolean;
};

type EditorTarget = { mode: 'new' } | { mode: 'edit'; name: string };

export default function GitSimulator(props: Props): ReactNode {
  return (
    <BrowserOnly fallback={<div className={styles.simulator}>Simulator laadt…</div>}>
      {() => <SimulatorInner {...props} />}
    </BrowserOnly>
  );
}

/**
 * De toestand waarin de leerling binnenkomt: het eindpunt van de vorige stap.
 * De voorbereidende commando's komen ook in de terminal te staan, gemarkeerd
 * als "al gedaan" — anders lijkt het alsof de repository uit het niets bestaat.
 */
function beginsituatie(id: string): { state: RepoState; history: HistoryLine[] } {
  const { initialFiles, voorbereiding } = scenario(id);
  let state = emptyState(initialFiles);
  const history: HistoryLine[] = [];

  for (const cmd of voorbereiding) {
    const r = runCommand(state, cmd);
    state = r.newState;
    history.push({ kind: 'input', text: cmd, eerder: true });
    if (r.output) history.push({ kind: 'output', text: r.output, eerder: true });
  }
  return { state, history };
}

function SimulatorInner({ scenarioId, allowFileEditing = true, intro }: Props): ReactNode {
  const { objective } = scenario(scenarioId);
  // Eén aanroep voor allebei: de voorbereiding maakt commit-id's met
  // Math.random(), dus twee aanroepen zouden een andere hash in de terminal
  // zetten dan in de repository-kolom.
  const [begin] = useState(() => beginsituatie(scenarioId));
  const [state, setState] = useState<RepoState>(begin.state);
  const [history, setHistory] = useState<HistoryLine[]>(begin.history);
  const [input, setInput] = useState('');
  const [cmdHistory, setCmdHistory] = useState<string[]>([]);
  const [cmdIndex, setCmdIndex] = useState<number>(-1);
  const [editor, setEditor] = useState<EditorTarget | null>(null);
  const [editorName, setEditorName] = useState('');
  const [editorContent, setEditorContent] = useState('');
  const outputRef = useRef<HTMLDivElement>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: history triggert bewust een her-scroll bij nieuwe terminalregels; de body zelf leest alleen de ref.
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [history]);

  const reset = () => {
    const begin = beginsituatie(scenarioId);
    setState(begin.state);
    setHistory(begin.history);
    setInput('');
    setCmdHistory([]);
    setCmdIndex(-1);
  };

  const submit = () => {
    const cmd = input;
    if (!cmd.trim()) return;
    const { newState, output, ok } = runCommand(state, cmd);
    setState(newState);
    setHistory((h) => {
      const next: HistoryLine[] = [...h, { kind: 'input', text: cmd }];
      if (output) next.push({ kind: ok ? 'output' : 'error', text: output });
      return next;
    });
    setCmdHistory((h) => [...h, cmd]);
    setCmdIndex(-1);
    setInput('');
  };

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Tab') {
      // Aanvullen zoals een echte shell: één kandidaat vult aan, meer
      // kandidaten tonen de lijst. Zonder preventDefault springt de focus uit
      // het invoerveld en is de oefening voorbij.
      e.preventDefault();
      const { aangevuld, kandidaten } = vulAan(input, state);
      if (aangevuld !== null) setInput(aangevuld);
      if (kandidaten.length > 1) {
        setHistory((h) => [
          ...h,
          { kind: 'input', text: input },
          { kind: 'output', text: kandidaten.join('   ') },
        ]);
      }
      return;
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      submit();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (cmdHistory.length === 0) return;
      const nextIdx = cmdIndex === -1 ? cmdHistory.length - 1 : Math.max(0, cmdIndex - 1);
      setCmdIndex(nextIdx);
      setInput(cmdHistory[nextIdx]);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (cmdIndex === -1) return;
      const nextIdx = cmdIndex + 1;
      if (nextIdx >= cmdHistory.length) {
        setCmdIndex(-1);
        setInput('');
      } else {
        setCmdIndex(nextIdx);
        setInput(cmdHistory[nextIdx]);
      }
    }
  };

  const openNewFile = () => {
    setEditorName('');
    setEditorContent('');
    setEditor({ mode: 'new' });
  };

  const openEditFile = (name: string) => {
    setEditorName(name);
    setEditorContent(state.workingDir[name] ?? '');
    setEditor({ mode: 'edit', name });
  };

  const saveEditor = () => {
    if (!editor) return;
    const name = editor.mode === 'edit' ? editor.name : editorName.trim();
    if (!name) return;
    let next = setFile(state, name, editorContent);
    if (name === '.gitignore') {
      const lines = editorContent
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l && !l.startsWith('#'));
      next = { ...next, ignored: lines };
      for (const ign of lines) {
        next = addToIgnore(next, ign);
      }
    } else if (state.ignored.length) {
      next = { ...next, ignored: state.ignored };
    }
    setState(next);
    setEditor(null);
  };

  const deleteFromWd = (name: string) => {
    setState(deleteFile(state, name));
  };

  const wdFiles = Object.keys(state.workingDir).sort();
  const stagedFiles = Object.keys(state.staged ?? {}).sort();
  const repoCommits = [...state.commits].reverse();

  const objectiveDone = objective ? objective.check(state) : false;

  return (
    <div className={styles.simulator}>
      {intro}
      {objective && (
        <div className={`${styles.objective} ${objectiveDone ? styles.objectiveDone : ''}`}>
          <span className={styles.objectiveLabel}>{objectiveDone ? 'Gelukt:' : 'Doel:'}</span>
          {objectiveDone ? 'klaar voor de volgende oefening.' : objective.description}
        </div>
      )}

      <div className={styles.body}>
        <div className={styles.left}>
          <div className={styles.zones}>
            <div className={styles.zone}>
              <div className={styles.zoneTitle}>Werkmap</div>
              {wdFiles.length === 0 && <div className={styles.empty}>leeg</div>}
              {wdFiles.map((f) => (
                <div
                  key={f}
                  className={`${styles.fileItem} ${
                    state.ignored.includes(f) ? styles.fileItemIgnored : ''
                  }`}
                  title={state.workingDir[f]}
                >
                  {f}
                </div>
              ))}
            </div>
            <div className={styles.zone}>
              <div className={styles.zoneTitle}>Staging</div>
              {stagedFiles.length === 0 && <div className={styles.empty}>leeg</div>}
              {stagedFiles.map((f) => (
                <div key={f} className={styles.fileItem}>
                  {f}
                </div>
              ))}
            </div>
            <div className={styles.zone}>
              <div className={styles.zoneTitle}>Repository</div>
              {repoCommits.length === 0 && <div className={styles.empty}>geen commits</div>}
              {repoCommits.map((c) => (
                <div key={c.id} className={styles.commitItem}>
                  <span className={styles.commitId}>{c.id.slice(0, 7)}</span>
                  <span className={styles.commitMessage}>{c.message}</span>
                </div>
              ))}
            </div>
          </div>

          {allowFileEditing && (
            <div className={styles.fileTools}>
              <button type="button" className={styles.fileButton} onClick={openNewFile}>
                + nieuw bestand
              </button>
              {wdFiles.map((f) => (
                <span key={f} style={{ display: 'inline-flex', gap: '0.2rem' }}>
                  <button
                    type="button"
                    className={styles.fileButton}
                    onClick={() => openEditFile(f)}
                  >
                    bewerk {f}
                  </button>
                  <button
                    type="button"
                    className={styles.fileButton}
                    onClick={() => deleteFromWd(f)}
                    title={`verwijder ${f}`}
                  >
                    x
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div className={styles.terminal}>
          <div className={styles.terminalOutput} ref={outputRef}>
            {history.length === 0 && (
              <div className={styles.terminalLine} style={{ color: '#888' }}>
                Typ een commando, bijvoorbeeld <span style={{ color: '#dcdcaa' }}>git init</span>.
                Met <span style={{ color: '#dcdcaa' }}>Tab</span> vul je aan.
              </div>
            )}
            {history.map((line, i) => {
              const key = `${i}-${line.text}`;
              // Gedimd wat uit de voorbereiding komt: je ziet waar je
              // binnenkomt, en tegelijk dat jij het niet hoeft te typen.
              const klasse = `${styles.terminalLine} ${line.eerder ? styles.terminalEerder : ''}`;
              if (line.kind === 'input') {
                return (
                  <div key={key} className={klasse}>
                    <span className={styles.terminalPrompt}>$ </span>
                    {line.text}
                  </div>
                );
              }
              return (
                <div
                  key={key}
                  className={`${klasse} ${line.kind === 'error' ? styles.terminalError : ''}`}
                >
                  {line.text}
                </div>
              );
            })}
          </div>
          <div className={styles.terminalInput}>
            <span className={styles.terminalInputPrompt}>$</span>
            <input
              className={styles.terminalInputField}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKey}
              spellCheck={false}
              autoCapitalize="off"
              autoCorrect="off"
              aria-label={`Git terminal voor ${scenarioId}`}
            />
          </div>
        </div>
      </div>

      <div className={styles.resetBar}>
        <button type="button" className={styles.resetButton} onClick={reset}>
          herstart oefening
        </button>
      </div>

      {editor && (
        // biome-ignore lint/a11y/useKeyWithClickEvents: decoratieve overlay, geen tab-stop; de "annuleren"-knop hieronder doet hetzelfde en is met toetsenbord bereikbaar.
        <div className={styles.editor} onClick={() => setEditor(null)}>
          {/* biome-ignore lint/a11y/useKeyWithClickEvents: stopt alleen event-bubbling naar de backdrop, geen eigen actie. */}
          <div className={styles.editorBox} onClick={(e) => e.stopPropagation()}>
            <div className={styles.editorTitle}>
              {editor.mode === 'new' ? 'Nieuw bestand' : `Bewerk ${editor.name}`}
            </div>
            {editor.mode === 'new' && (
              <input
                className={styles.editorInput}
                placeholder="bestandsnaam, bv. hello.txt"
                value={editorName}
                onChange={(e) => setEditorName(e.target.value)}
                spellCheck={false}
                autoCapitalize="off"
                autoCorrect="off"
              />
            )}
            <textarea
              className={styles.editorArea}
              value={editorContent}
              onChange={(e) => setEditorContent(e.target.value)}
              placeholder="inhoud van het bestand"
              spellCheck={false}
            />
            <div className={styles.editorActions}>
              <button type="button" className={styles.btnSecondary} onClick={() => setEditor(null)}>
                annuleren
              </button>
              <button type="button" className={styles.btnPrimary} onClick={saveEditor}>
                opslaan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

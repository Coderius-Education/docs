import { pasHoogte } from '@coderius/shared/components/LesTabs/pasHoogte';
import BrowserOnly from '@docusaurus/BrowserOnly';
import {
  type KeyboardEvent,
  type ReactNode,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { vulAan } from './autocomplete';
import {
  type RepoState,
  bestandsnaamFout,
  deleteFile,
  emptyState,
  genegeerd,
  runCommand,
  schrijfBestand,
} from './gitEngine';
import { doeStap, scenario } from './scenarios';
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

// De uitvoer van de terminal heeft op een breed scherm een vaste hoogte en
// schuift daarbinnen: wat er op het scherm over is, tot zestien regels. Een
// hoogte die meegroeit met de uitvoer, maakte een stap die bij het openen
// paste na drie commando's twintig pixels te lang.
//
// Vanaf 1280 pixels staat de terminal naast de zones (styles.module.css), en
// heeft de uitvoer minstens tien regels: `git status` schrijft er tien. Met
// de zones erboven bleven er op 1280×720 vier over, en stond `Untracked
// files:` buiten beeld in de stap die daarover gaat. Tussen 997 en 1280
// pixels staan de zones erboven en zijn het er minstens zeven; de stap is daar
// dan iets langer dan het scherm. Smaller scrolt de pagina toch: daar groeit
// de uitvoer mee, zoals eerst.
const HOOGSTE_UITVOER = 320;
const LAAGSTE_NAAST = 200;
const LAAGSTE_ONDER = 154;
/** Een tik op een telefoon zet de cursor niet in de invoer: dan springt het toetsenbord open. */
const MUIS = '(pointer: fine)';
const VAST = '(min-width: 997px)';
const NAAST = '(min-width: 1280px)';

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

  for (const stap of voorbereiding) {
    const r = doeStap(state, stap);
    state = r.state;
    if (typeof stap === 'string') {
      history.push({ kind: 'input', text: stap, eerder: true });
      if (r.output) history.push({ kind: 'output', text: r.output, eerder: true });
    } else {
      // Niet getypt maar geklikt: zeg wat er met het bestand gebeurd is.
      const wat = stap.soort === 'verwijder' ? 'weggehaald' : 'aangepast';
      history.push({ kind: 'output', text: `(${stap.naam} ${wat})`, eerder: true });
    }
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
  const [editorFout, setEditorFout] = useState<string | null>(null);
  const outputRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Een stap is één scherm: de uitleg, de simulator en wat eronder staat. De
  // uitvoer van de terminal krijgt daarom de hoogte die op het scherm
  // overblijft na wat erboven en eronder staat, in het tabblad of, op een
  // pagina zonder tabbladen, in de les. Staat er een tip of oplossing open,
  // dan is de pagina hoe dan ook langer, en blijft de maat zoals hij was.
  const [maxUitvoer, setMaxUitvoer] = useState<number | null>(null);
  useLayoutEffect(() => {
    const uitvoer = outputRef.current;
    const les =
      uitvoer?.closest<HTMLElement>('[data-les-tab]') ??
      uitvoer?.closest<HTMLElement>('.theme-doc-markdown');
    if (!uitvoer || !les) return;
    const meet = () => {
      // Op een smal scherm scrolt de pagina toch: daar groeit de uitvoer mee.
      if (!window.matchMedia?.(VAST).matches) {
        setMaxUitvoer(null);
        return;
      }
      const u = uitvoer.getBoundingClientRect();
      if (u.width === 0 || les.querySelector('details[open]')) return;
      setMaxUitvoer(
        pasHoogte(
          {
            scherm: window.innerHeight,
            boven: u.top + window.scrollY,
            onder: les.getBoundingClientRect().bottom - u.bottom,
            max: HOOGSTE_UITVOER,
          },
          window.matchMedia(NAAST).matches ? LAAGSTE_NAAST : LAAGSTE_ONDER,
        ),
      );
    };
    meet();
    // De zones groeien met elk bestand, en het tabblad kan nog dicht zijn.
    const kijker = new ResizeObserver(meet);
    kijker.observe(les);
    window.addEventListener('resize', meet);
    return () => {
      kijker.disconnect();
      window.removeEventListener('resize', meet);
    };
  }, []);

  // Ook als de hoogte verandert: die komt na de eerste regels, en de
  // voorbereiding stond dan bovenaan in beeld in plaats van de laatste regel.
  // biome-ignore lint/correctness/useExhaustiveDependencies: history en maxUitvoer triggeren bewust een her-scroll; de body zelf leest alleen de ref.
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [history, maxUitvoer]);

  // Een klik in het zwarte vlak zet de cursor in de invoer, zoals in een
  // terminal. De aanwijzing "Typ een commando" staat in de uitvoer; wie
  // daarop klikte en begon te typen, typte nergens. Niet als er tekst is
  // geselecteerd: dan wil iemand kopiëren.
  const naarInvoer = () => {
    if (!window.matchMedia?.(MUIS).matches) return;
    if (!window.getSelection()?.toString()) inputRef.current?.focus({ preventScroll: true });
  };

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

  const sluitEditor = () => {
    setEditor(null);
    setEditorFout(null);
  };
  // Escape sluit het venster, zoals elk venster.
  const editorToets = (e: KeyboardEvent<HTMLElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      sluitEditor();
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
    // Opslaan zonder naam deed niets en zei niets.
    const fout = bestandsnaamFout(name, editor.mode === 'new' ? state.workingDir : {});
    if (fout) {
      setEditorFout(fout);
      return;
    }
    setEditorFout(null);
    const next = schrijfBestand(state, name, editorContent);
    setState(next);
    sluitEditor();
  };

  const deleteFromWd = (name: string) => {
    setState(deleteFile(state, name));
  };

  const wdFiles = Object.keys(state.workingDir).sort();
  const stagedFiles = Object.keys(state.staged ?? {}).sort();
  const repoCommits = [...state.commits].reverse();

  const objectiveDone = objective ? objective.check(state) : false;
  // Waarom het doel zo niet meer te halen is (scenarios.ts, `vast`).
  const vast = !objectiveDone ? (objective?.vast?.(state) ?? null) : null;

  return (
    <div className={styles.simulator}>
      {intro}
      {objective && (
        <div className={`${styles.objective} ${objectiveDone ? styles.objectiveDone : ''}`}>
          <span className={styles.objectiveLabel}>
            {objectiveDone ? 'Gelukt:' : vast ? 'Zo lukt het niet:' : 'Doel:'}
          </span>
          {objectiveDone ? 'klaar voor de volgende oefening.' : (vast ?? objective.description)}
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
                    // Doorgestreept is wat git echt negeert: niet een bestand
                    // dat in .gitignore staat maar al gevolgd wordt.
                    genegeerd(state, f) ? styles.fileItemIgnored : ''
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

        {/* biome-ignore lint/a11y/useKeyWithClickEvents: de klik zet alleen de cursor in het invoerveld; met het toetsenbord kom je daar met Tab. */}
        <div className={styles.terminal} onClick={naarInvoer}>
          <div
            className={styles.terminalOutput}
            ref={outputRef}
            // De uitvoer schuift in zijn vak: met het toetsenbord kan dat
            // alleen als het vak de focus kan krijgen.
            role="log"
            aria-label="Uitvoer van de terminal"
            // biome-ignore lint/a11y/noNoninteractiveTabindex: een vak dat schuift, moet met het toetsenbord te bereiken zijn.
            tabIndex={0}
            // `flex: none`: met de `flex: 1` uit de opmaak telt de hoogte niet.
            style={maxUitvoer ? { height: `${maxUitvoer}px`, flex: 'none' } : undefined}
          >
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
              ref={inputRef}
              className={styles.terminalInputField}
              placeholder="typ hier een commando"
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
        <div className={styles.editor} onClick={sluitEditor}>
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
                onKeyDown={editorToets}
                aria-invalid={editorFout ? true : undefined}
                spellCheck={false}
                autoCapitalize="off"
                autoCorrect="off"
              />
            )}
            <textarea
              className={styles.editorArea}
              value={editorContent}
              onChange={(e) => setEditorContent(e.target.value)}
              onKeyDown={editorToets}
              placeholder="inhoud van het bestand"
              spellCheck={false}
            />
            {editorFout && (
              <p className={styles.editorFout} role="alert">
                {editorFout}
              </p>
            )}
            <div className={styles.editorActions}>
              <button type="button" className={styles.btnSecondary} onClick={sluitEditor}>
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

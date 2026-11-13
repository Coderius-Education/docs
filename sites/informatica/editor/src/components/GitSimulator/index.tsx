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
  const vensterRef = useRef<HTMLDialogElement>(null);
  /** De knop die het venster opende: daar gaat de focus terug als het sluit. */
  const openerRef = useRef<HTMLElement | null>(null);
  /** Waarmee de leerling het laatst in de uitvoer drukte: muis, pen of vinger. */
  const aanwijzerRef = useRef('mouse');

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

  // Na elk commando staat zijn uitvoer in beeld. Past die niet in het vak,
  // dan staat het commando bovenaan en schuift de rest eronder, zoals in
  // `less`: onderaan stond na `git log` de oudste commit in beeld, en de
  // nieuwste, waar het om gaat, erboven buiten het vak. Ook als de hoogte
  // verandert: die komt na de eerste regels.
  // biome-ignore lint/correctness/useExhaustiveDependencies: history en maxUitvoer triggeren bewust een her-scroll; de body zelf leest alleen de ref.
  useEffect(() => {
    const vak = outputRef.current;
    if (!vak) return;
    const onderaan = vak.scrollHeight - vak.clientHeight;
    const invoer = vak.querySelectorAll<HTMLElement>('[data-invoer]');
    const laatste = invoer[invoer.length - 1];
    if (!laatste) {
      vak.scrollTop = onderaan;
      return;
    }
    const rand = Number.parseFloat(getComputedStyle(vak).paddingTop) || 0;
    const boven =
      laatste.getBoundingClientRect().top - vak.getBoundingClientRect().top + vak.scrollTop;
    vak.scrollTop = Math.min(onderaan, boven - rand);
  }, [history, maxUitvoer]);

  // Een klik in het zwarte vlak zet de cursor in de invoer, zoals in een
  // terminal. De aanwijzing "Typ een commando" staat in de uitvoer; wie
  // daarop klikte en begon te typen, typte nergens. Niet als er tekst is
  // geselecteerd: dan wil iemand kopiëren. En niet na een tik met een vinger:
  // dan springt het toetsenbord open bij een tik om te lezen. Dat kijkt naar
  // waarmee er geklikt is (`pointerType`), niet naar het apparaat: met
  // `(pointer: fine)` deed een klik met het trackpad van een iPad niets (de
  // iPad zelf is een aanraakscherm), en `(any-pointer: fine)` zou een tik
  // met de vinger op een laptop met aanraakscherm wel laten tellen. Of er een
  // los toetsenbord aan een iPad hangt, ziet een pagina niet: daar blijft
  // een tik een tik, en tik je op de invoerregel zelf.
  const naarInvoer = () => {
    if (aanwijzerRef.current === 'touch') return;
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
    if (vensterRef.current?.open) vensterRef.current.close?.();
    setEditor(null);
    setEditorFout(null);
    // Terug naar de knop die het venster opende, anders staat de focus
    // nergens en begint wie met Tab werkt weer bovenaan de pagina.
    const opener = openerRef.current;
    openerRef.current = null;
    if (opener?.isConnected) opener.focus({ preventScroll: true });
  };

  // Het venster is een echte <dialog> met showModal: de pagina erachter doet
  // niet mee zolang hij open is, en hij staat boven alles, ook boven de
  // navbar (een `position: fixed` in een tabblad viel daar soms onder). De
  // focus gaat naar zijn eerste veld.
  const editorOpen = editor !== null;
  useEffect(() => {
    const venster = vensterRef.current;
    if (!editorOpen || !venster) return;
    if (!venster.open) venster.showModal?.();
    venster.querySelector<HTMLElement>('input, textarea')?.focus();
  }, [editorOpen]);

  // Escape sluit het venster, ook als de focus op een knop staat: de toets
  // hangt aan het venster, niet aan de velden. Tab blijft in het venster.
  const vensterToets = (e: KeyboardEvent<HTMLElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      sluitEditor();
      return;
    }
    if (e.key !== 'Tab' || !vensterRef.current) return;
    const focusbaar = Array.from(
      vensterRef.current.querySelectorAll<HTMLElement>('input, textarea, button'),
    );
    const eerste = focusbaar[0];
    const laatste = focusbaar[focusbaar.length - 1];
    if (e.shiftKey && document.activeElement === eerste) {
      e.preventDefault();
      laatste?.focus();
    } else if (!e.shiftKey && document.activeElement === laatste) {
      e.preventDefault();
      eerste?.focus();
    }
  };

  const openVenster = (doel: EditorTarget) => {
    openerRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setEditor(doel);
  };

  const openNewFile = () => {
    setEditorName('');
    setEditorContent('');
    openVenster({ mode: 'new' });
  };

  const openEditFile = (name: string) => {
    setEditorName(name);
    setEditorContent(state.workingDir[name] ?? '');
    openVenster({ mode: 'edit', name });
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
  // Waarom het doel niet meer te halen is (scenarios.ts, `vast`), of wat er
  // nog in de weg staat (`tip`).
  const vast = !objectiveDone ? (objective?.vast?.(state) ?? null) : null;
  const tip = !objectiveDone && !vast ? (objective?.tip?.(state) ?? null) : null;

  return (
    <div className={styles.simulator}>
      {intro}
      {objective && (
        <div className={`${styles.objective} ${objectiveDone ? styles.objectiveDone : ''}`}>
          <span className={styles.objectiveLabel}>
            {objectiveDone ? 'Gelukt:' : vast ? 'Zo lukt het niet:' : tip ? 'Nog niet:' : 'Doel:'}
          </span>
          {objectiveDone
            ? 'klaar voor de volgende oefening.'
            : (vast ?? tip ?? objective.description)}
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
                  {/* Een verwijdering die klaarstaat: de volgende commit haalt het bestand weg. */}
                  {state.staged?.[f] === null && (
                    <span className={styles.fileLabel}>verwijderd</span>
                  )}
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
        <div
          className={styles.terminal}
          onPointerDown={(e) => {
            aanwijzerRef.current = e.pointerType;
          }}
          onClick={naarInvoer}
        >
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
                  <div key={key} className={klasse} data-invoer="">
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
        <dialog
          ref={vensterRef}
          className={styles.editor}
          aria-labelledby={`${scenarioId}-venster`}
          // Escape in de browser: die sluit een dialog zelf, en dan moet de
          // simulator het ook weten.
          onCancel={(e) => {
            e.preventDefault();
            sluitEditor();
          }}
          // Een klik naast het venster (op de achtergrond) sluit het; het
          // venster zelf is het vak erin.
          onClick={(e) => {
            if (e.target === e.currentTarget) sluitEditor();
          }}
          onKeyDown={vensterToets}
        >
          <div className={styles.editorBox}>
            <div className={styles.editorTitle} id={`${scenarioId}-venster`}>
              {editor.mode === 'new' ? 'Nieuw bestand' : `Bewerk ${editor.name}`}
            </div>
            {editor.mode === 'new' && (
              <input
                className={styles.editorInput}
                placeholder="bestandsnaam, bv. hello.txt"
                aria-label="Naam van het bestand"
                value={editorName}
                onChange={(e) => setEditorName(e.target.value)}
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
              aria-label="Inhoud van het bestand"
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
        </dialog>
      )}
    </div>
  );
}

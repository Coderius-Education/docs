import { HighlightedEditor } from '@coderius/python-runner/HighlightedEditor';
import type {
  Opname,
  PyodideInterface as StapPyodide,
} from '@coderius/python-runner/PyodideProvider';
import { tracePython } from '@coderius/python-runner/PyodideProvider';
import Stapper from '@coderius/python-runner/Stapper';
import { useInLesTab } from '@coderius/shared/components/LesTabs/paneel';
import { meetRuimte, pasHoogte } from '@coderius/shared/components/LesTabs/pasHoogte';
import useBaseUrl from '@docusaurus/useBaseUrl';
import clsx from 'clsx';
import type React from 'react';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import ParseTree from '../ParseTree';
import { type Getiteld, leesBomen } from '../ParseTree/boom';
import { codeBreedte, codeSchaal } from './breedte';
import { draaiInVerseMain } from './draai';
import { heeftMatplotlibNodig } from './matplotlib';
import styles from './styles.module.css';
import {
  type PyodideInterface,
  hasPyodideStarted,
  loadPyodideOnce,
  warmupPyodide,
} from './usePyodide';
import { verborgenCode as haalVerborgen } from './verborgen';

// Approximate textarea-rows → pixel-height mapping. Matches the editor's
// line-height (1.5) × font-size (0.9rem ≈ 14.4px) plus vertical padding
// (0.85rem × 2 ≈ 27px). Used so callers can keep passing `rows` props.
const LINE_HEIGHT_PX = 22;
const EDITOR_PADDING_PX = 28;
/** Lager wordt het veld in een tabblad niet: de werkbalk en een regel of vijf. */
const MIN_VELD = 180;
/** De hoogte van de werkbalk, tot hij gemeten is. */
const BALK = 40;
/** De rand van het veld, boven en onder: die telt mee in zijn hoogte. */
const RAND = 2;
/**
 * Het vak voor de uitvoer onder de code: altijd even hoog, voor en na Voer uit,
 * zodat het scherm niet langer wordt als er uitvoer komt.
 */
const UITVOER_ONDER = 100;

export type PyRunnerProps = {
  initialCode?: string;
  children?: string;
  editable?: boolean;
  packages?: string[];
  rows?: number;
  /**
   * Naam van code die vóór de zichtbare code draait maar niet in de editor
   * staat (zie ./verborgen/index.ts): een parser-motor, negen kant-en-klare
   * functies. Onder de editor uitklapbaar en alleen-lezen. Zet de prop vóór
   * initialCode, want zo leest scripts/draai-python-blokken.py hem.
   */
  verborgen?: string;
};

const MATPLOTLIB_SETUP = `
import matplotlib
matplotlib.use('AGG')
import matplotlib.pyplot as _coderius_plt
import io as _coderius_io, base64 as _coderius_b64

# plt.show() kan niets tonen met de AGG-backend en geeft dan een
# UserWarning op stderr die leerlingen als foutmelding zien. De plots
# worden na afloop via _coderius_collect_plots opgehaald, dus show()
# mag een no-op zijn.
_coderius_plt.show = lambda *args, **kwargs: None

def _coderius_collect_plots():
    images = []
    for num in _coderius_plt.get_fignums():
        fig = _coderius_plt.figure(num)
        buf = _coderius_io.BytesIO()
        fig.savefig(buf, format='png', bbox_inches='tight')
        images.append(_coderius_b64.b64encode(buf.getvalue()).decode('ascii'))
    _coderius_plt.close('all')
    return images
`;

function dedent(code: string): string {
  const lines = code.replace(/^\n/, '').replace(/\s+$/, '').split('\n');
  const indents = lines
    .filter((l) => l.trim().length > 0)
    .map((l) => l.match(/^[ \t]*/)?.[0].length ?? 0);
  const min = indents.length ? Math.min(...indents) : 0;
  return lines.map((l) => l.slice(min)).join('\n');
}

// Squeeze a Python traceback down to the line number and final error line.
// Example output: "Fout op regel 3\nNameError: name 'x' is not defined"
function filterTraceback(raw: string): string {
  const lines = raw.split('\n');

  let lineNumber: string | null = null;
  for (const line of lines) {
    const match = line.match(/File "<exec>", line (\d+)/);
    if (match) lineNumber = match[1];
  }

  let errorLine = '';
  for (let i = lines.length - 1; i >= 0; i--) {
    const trimmed = lines[i].trim();
    if (trimmed && /^[A-Z]\w*(Error|Exception|Warning)/.test(trimmed)) {
      errorLine = trimmed;
      break;
    }
  }
  if (!errorLine) {
    for (let i = lines.length - 1; i >= 0; i--) {
      if (lines[i].trim()) {
        errorLine = lines[i].trim();
        break;
      }
    }
  }
  if (!errorLine) return raw;

  return (lineNumber ? `Fout op regel ${lineNumber}\n` : '') + errorLine;
}

export default function PyRunnerImpl({
  initialCode,
  children,
  editable = true,
  packages,
  rows = 10,
  verborgen,
}: PyRunnerProps): React.ReactElement {
  const source = useMemo(() => dedent(initialCode ?? children ?? ''), [initialCode, children]);
  const verborgenCode = useMemo(
    () => (verborgen ? haalVerborgen(verborgen).trim() : null),
    [verborgen],
  );
  const [code, setCode] = useState(source);
  const [status, setStatus] = useState<'idle' | 'loading' | 'running' | 'done' | 'error'>('idle');
  const [statusMsg, setStatusMsg] = useState<string>('');
  const [stdout, setStdout] = useState<string>('');
  const [stderr, setStderr] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [plots, setPlots] = useState<string[]>([]);
  const [bomen, setBomen] = useState<Getiteld[]>([]);
  const [toonBomen, setToonBomen] = useState(false);
  const [opname, setOpname] = useState<Opname | null>(null);
  // De code van het moment van opnemen: de leerling mag intussen doortypen,
  // en dan zouden de regelnummers uit de opname naar de verkeerde regels wijzen.
  const [opnameCode, setOpnameCode] = useState('');
  const pyodideRef = useRef<PyodideInterface | null>(null);
  const matplotlibLoadedRef = useRef(false);
  const pyodideIndexURL = useBaseUrl('/pyodide/');

  // In een les-tabblad moet het paneel op het scherm passen, zoals de
  // CodeExercise van de python-cursus: op een breed scherm staat de uitvoer
  // naast de code, en het veld is niet hoger dan wat er na de rest van het
  // paneel overblijft (pasHoogte.ts). Langere code schuift in de editor, een
  // lange uitvoer in zijn eigen vak.
  const inTab = useInLesTab();
  const veldRef = useRef<HTMLDivElement>(null);
  const balkRef = useRef<HTMLDivElement>(null);
  // Het uitklapblok met de code die al klaarstaat, onder de editor: dicht is
  // het een regel, en die hoort bij de hoogte van het veld (in cfg was elk
  // scherm met zo'n blok 75 pixels te lang).
  const verborgenRef = useRef<HTMLDetailsElement>(null);
  const codeVakRef = useRef<HTMLDivElement>(null);
  const [veldHoogte, setVeldHoogte] = useState<number | null>(null);
  const [veldBreedte, setVeldBreedte] = useState<number | null>(null);
  const stapt = opname !== null;
  useLayoutEffect(() => {
    const veld = veldRef.current;
    const paneel = veld?.closest<HTMLElement>('[data-les-tab]');
    if (!inTab || !veld || !paneel || typeof ResizeObserver === 'undefined') return;
    const breed = window.matchMedia('(min-width: 997px)');
    const meet = () => {
      // Op een smal scherm scrolt de leerling, en staat de uitvoer onder de
      // code: dan zegt de ruimte in het paneel niets over het veld.
      if (!breed.matches) {
        setVeldBreedte(null);
        return setVeldHoogte(null);
      }
      // Een veld in een dicht tabblad heeft geen maten.
      if (veld.clientWidth === 0) return;
      setVeldBreedte(veld.clientWidth);
      if (stapt) return;
      const ruimte = meetRuimte(veld, paneel, Number.POSITIVE_INFINITY);
      if (ruimte) setVeldHoogte(pasHoogte(ruimte, MIN_VELD));
    };
    meet();
    const kijker = new ResizeObserver(meet);
    kijker.observe(paneel);
    // Ook het veld zelf: zijn breedte kan veranderen zonder dat het paneel
    // hoger of lager wordt (de schuifbalk van de pagina, de lessenlijst die
    // laadt). Met een te brede meting bleven de letters gewoon, en brak een
    // regel van 95 tekens af. Kleinere letters veranderen de breedte niet.
    kijker.observe(veld);
    window.addEventListener('resize', meet);
    breed.addEventListener('change', meet);
    return () => {
      kijker.disconnect();
      window.removeEventListener('resize', meet);
      breed.removeEventListener('change', meet);
    };
  }, [inTab, stapt]);

  const needsMatplotlib = useMemo(
    () => heeftMatplotlibNodig(code, verborgenCode),
    [code, verborgenCode],
  );

  // Start de Pyodide-download op de achtergrond zodra de pagina idle is, zodat
  // de eerste "Voer uit" (bijna) direct start. Wheels voor matplotlib worden
  // alleen meegewarmd als de startercode ze nodig heeft (dat is ~39 MB extra,
  // gerechtvaardigd op matplotlib-lespagina's, verspilling elders).
  useEffect(() => {
    // Dezelfde test als bij het draaien, met de verborgen code erbij: de
    // plaatjes van k-buren en het perceptron tekenen alleen in verborgen code.
    const wantsMatplotlib = heeftMatplotlibNodig(source, verborgenCode);
    const warmPackages = [...(packages ?? []), ...(wantsMatplotlib ? ['matplotlib'] : [])];
    warmupPyodide(pyodideIndexURL, warmPackages.length > 0 ? warmPackages : undefined);
  }, [source, verborgenCode, packages, pyodideIndexURL]);

  // De gedeelde voorbereiding van uitvoeren én opnemen: Pyodide laden,
  // pakketten binnenhalen, matplotlib op de AGG-backend zetten. Eén plek,
  // zodat de run- en opnameroute nooit een verschillende omgeving krijgen.
  const maakKlaar = useCallback(async () => {
    if (!pyodideRef.current) {
      setStatus('loading');
      setStatusMsg(
        hasPyodideStarted() ? 'Python wordt geladen…' : 'Python wordt geladen (eenmalig, ~14 MB)…',
      );
      pyodideRef.current = await loadPyodideOnce(pyodideIndexURL);
    }
    const py = pyodideRef.current;

    // Let op: geen [...set]-spread hier. Docusaurus compileert spreads in
    // loose mode naar [].concat(set), waardoor de Set als één element
    // doorgegeven wordt en pyodide's loadPackage crasht ("t.replace is
    // not a function"). Array.from werkt wel op een Set.
    const extraPackages = new Set<string>(packages ?? []);
    if (needsMatplotlib) extraPackages.add('matplotlib');
    if (extraPackages.size > 0) {
      const packageList = Array.from(extraPackages);
      setStatus('loading');
      setStatusMsg(`Pakketten laden: ${packageList.join(', ')}…`);
      await py.loadPackage(packageList);
    }
    if (needsMatplotlib && !matplotlibLoadedRef.current) {
      await py.runPythonAsync(MATPLOTLIB_SETUP);
      matplotlibLoadedRef.current = true;
    }
    return py;
  }, [needsMatplotlib, packages, pyodideIndexURL]);

  const handleRun = useCallback(async () => {
    setStdout('');
    setStderr('');
    setErrorMsg('');
    setPlots([]);
    setBomen([]);
    setOpname(null);
    try {
      const py = await maakKlaar();

      let out = '';
      let err = '';
      py.setStdout({
        batched: (s) => {
          out += `${s}\n`;
        },
      });
      py.setStderr({
        batched: (s) => {
          // Eenmalige, onschuldige melding bij de eerste matplotlib-import;
          // voor leerlingen alleen maar ruis.
          if (s.includes('building the font cache')) return;
          err += `${s}\n`;
        },
      });

      setStatus('running');
      setStatusMsg('Bezig met uitvoeren…');
      const bomenJson = await draaiInVerseMain(py, code, verborgenCode);

      if (needsMatplotlib && matplotlibLoadedRef.current) {
        const result = await py.runPythonAsync('_coderius_collect_plots()');
        const arr =
          // @ts-expect-error PyProxy has toJs
          typeof result?.toJs === 'function' ? result.toJs() : (result as string[]);
        if (Array.isArray(arr) && arr.length > 0) setPlots(arr as string[]);
      }
      const gevonden = leesBomen(JSON.parse(bomenJson));
      setBomen(gevonden);

      setStdout(out);
      setStderr(err);
      setStatus('done');
      setStatusMsg(err ? 'Klaar — met meldingen' : 'Klaar');
    } catch (e: unknown) {
      const raw = e instanceof Error ? e.message : String(e);
      setErrorMsg(filterTraceback(raw));
      setStatus('error');
      setStatusMsg('Er ging iets mis');
    }
  }, [code, maakKlaar, needsMatplotlib, verborgenCode]);

  // Zelfde voorbereiding als handleRun (maakKlaar), maar dan opnemen met
  // tracePython in plaats van draaien: de leerling bladert daarna per regel
  // door de variabelen en de uitvoer, net als in de python-cursus. De opnemer
  // draait de code onder een eigen bestandsnaam, dus de regelnummers kloppen
  // exact met de editor.
  const handleStap = useCallback(async () => {
    setStdout('');
    setStderr('');
    setErrorMsg('');
    setPlots([]);
    setBomen([]);
    setOpname(null);
    try {
      const py = await maakKlaar();

      setStatus('running');
      setStatusMsg('Bezig met opnemen…');
      setOpnameCode(code);
      try {
        // Het echte pyodide-object heeft ook setStdin; het smalle type niet.
        setOpname(
          await tracePython(py as unknown as StapPyodide, code, verborgenCode ?? undefined),
        );
      } finally {
        // De opname toont geen plots, maar de code heeft ze wel geregistreerd
        // — in de gedeelde Pyodide. Zonder opruimen zou de eerstvolgende
        // "Voer uit" (ook van een andere runner op de pagina) ze als
        // achtergebleven figuren erbij tonen.
        if (needsMatplotlib && matplotlibLoadedRef.current) {
          await py.runPythonAsync("_coderius_plt.close('all')");
        }
      }
      setStatus('done');
      setStatusMsg('Klaar');
    } catch (e: unknown) {
      const raw = e instanceof Error ? e.message : String(e);
      setErrorMsg(filterTraceback(raw));
      setStatus('error');
      setStatusMsg('Er ging iets mis');
    }
  }, [code, maakKlaar, needsMatplotlib, verborgenCode]);

  // Tab en Shift+Tab regelt HighlightedEditor zelf; hier alleen Ctrl+Enter.
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleRun();
      }
    },
    [handleRun],
  );

  const handleReset = useCallback(() => {
    setCode(source);
    setStdout('');
    setStderr('');
    setErrorMsg('');
    setPlots([]);
    setBomen([]);
    setToonBomen(false);
    setOpname(null);
    setStatus('idle');
    setStatusMsg('');
  }, [source]);

  const busy = status === 'loading' || status === 'running';
  const hasOutput =
    stdout.length > 0 ||
    stderr.length > 0 ||
    errorMsg.length > 0 ||
    plots.length > 0 ||
    bomen.length > 0;

  const minEditor = rows * LINE_HEIGHT_PX + EDITOR_PADDING_PX;
  // Wat er in het codevak naast de editor staat: het uitklapblok met de code
  // die al klaarstaat (dicht: één regel) en de ruimte eromheen. Gemeten, want
  // eerst telde alleen het blok, en dan was elk scherm met zo'n runner nog 14
  // tot 22 pixels te lang. Een blok dat de leerling openklapt, telt niet: dan
  // groeit het paneel, zoals bij een tip die open staat.
  const rondDeEditor = () => {
    const vak = codeVakRef.current;
    const editor = vak?.firstElementChild as HTMLElement | null | undefined;
    if (!vak || !editor) return 0;
    const blok = verborgenRef.current;
    const open = blok?.open
      ? blok.offsetHeight - (blok.querySelector('summary')?.offsetHeight ?? 0)
      : 0;
    return Math.max(0, vak.offsetHeight - editor.offsetHeight - open);
  };
  // Naast elkaar alleen als de langste regel van de code (ook wat de leerling
  // typt) in de codekolom past; anders de uitvoer eronder.
  const naast = veldBreedte === null ? null : codeBreedte(code, veldBreedte);
  const onder = inTab && veldBreedte !== null && naast === null;
  // Past de langste regel ook zo niet, dan worden de letters kleiner (tot 80%),
  // zoals bij een codeblok in de les: een regel code breekt niet af.
  const schaal = veldBreedte === null ? 1 : codeSchaal(code, naast ?? veldBreedte);
  const editorMax =
    veldHoogte === null
      ? undefined
      : veldHoogte -
        (balkRef.current?.offsetHeight ?? BALK) -
        rondDeEditor() -
        // De rand van het veld (boven en onder), en onder de code de lijn
        // boven de uitvoer: zonder die pixels was cfg 12 › Bouw en test 6
        // pixels te lang.
        2 * RAND -
        (onder ? UITVOER_ONDER + 1 : 0);
  // Stap voor stap neemt in een tabblad de plek van de editor en de uitvoer
  // in, op de hoogte die die samen hadden.
  const stapper =
    stapt && veldHoogte !== null
      ? veldHoogte - (balkRef.current?.offsetHeight ?? BALK) - 2 * RAND
      : undefined;
  const uitvoer = (
    <>
      {statusMsg && (
        <div
          className={clsx(styles.status, {
            [styles.statusError]: status === 'error',
            [styles.statusBusy]: busy,
          })}
        >
          {statusMsg}
        </div>
      )}
      {hasOutput && (
        <div className={styles.output}>
          {bomen.length > 0 && (
            <div className={styles.bomen}>
              <div className={styles.bomenBalk}>
                <button
                  type="button"
                  onClick={() => setToonBomen((v) => !v)}
                  className={clsx('button', toonBomen ? 'button--secondary' : 'button--primary')}
                >
                  {toonBomen
                    ? 'Verberg de tekening'
                    : `Teken ${bomen.length === 1 ? 'de boom' : `de ${bomen.length} bomen`}`}
                </button>
                <span className={styles.bomenUitleg}>
                  {bomen.length === 1 ? 'Eén boom gevonden.' : `${bomen.length} bomen gevonden.`}
                </span>
              </div>
              {toonBomen && (
                <div className={styles.bomenRij}>
                  {bomen.map(({ titel, boom }, i) => (
                    <ParseTree
                      // biome-ignore lint/suspicious/noArrayIndexKey: de bomen van één run zijn alleen op volgorde uit elkaar te houden
                      key={i}
                      boom={boom}
                      titel={titel ?? (bomen.length > 1 ? `boom ${i + 1}` : undefined)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
          {stdout && <pre className={styles.stdout}>{stdout}</pre>}
          {stderr && <pre className={clsx(styles.stdout, styles.stderr)}>{stderr}</pre>}
          {errorMsg && <pre className={clsx(styles.stdout, styles.error)}>{errorMsg}</pre>}
          {plots.map((b64, i) => (
            <img
              key={b64}
              src={`data:image/png;base64,${b64}`}
              alt={`Plot ${i + 1}`}
              className={styles.plot}
            />
          ))}
        </div>
      )}
    </>
  );

  return (
    <div
      ref={veldRef}
      className={clsx(
        styles.runner,
        inTab && styles.inTab,
        onder && styles.onder,
        stapper !== undefined && styles.staptInTab,
      )}
      style={
        {
          ...(naast === null ? {} : { '--code-breedte': `${naast}px` }),
          ...(schaal === 1 ? {} : { '--code-schaal': schaal }),
        } as React.CSSProperties
      }
    >
      <div className={styles.codeKolom}>
        <div className={styles.toolbar} ref={balkRef}>
          <span className={styles.label}>Python</span>
          <div className={styles.actions}>
            {editable && (
              <button
                type="button"
                onClick={handleReset}
                disabled={busy}
                className={clsx('button button--sm button--secondary')}
              >
                ↺ Reset
              </button>
            )}
            <button
              type="button"
              onClick={handleStap}
              disabled={busy}
              title="Loop regel voor regel door je code en zie wat elke variabele doet"
              className={clsx('button button--sm button--secondary')}
            >
              Stap voor stap
            </button>
            <button
              type="button"
              onClick={handleRun}
              disabled={busy}
              className={clsx('button button--sm button--primary')}
            >
              {busy ? '… bezig' : '▶ Voer uit'}
            </button>
          </div>
        </div>
        <div className={styles.codeVak} ref={codeVakRef}>
          <HighlightedEditor
            code={code}
            onChange={setCode}
            onKeyDown={handleKeyDown}
            readOnly={!editable}
            disabled={busy}
            minHeight={editorMax === undefined ? minEditor : Math.min(minEditor, editorMax)}
            maxHeight={editorMax}
          />
          {verborgenCode && (
            <details className={styles.verborgen} ref={verborgenRef}>
              <summary>
                Toon de code die al klaarstaat ({verborgenCode.split('\n').length} regels)
              </summary>
              <HighlightedEditor
                code={verborgenCode}
                onChange={() => undefined}
                readOnly
                disabled={false}
                minHeight={0}
                ariaLabel="Code die al klaarstaat, alleen-lezen"
              />
            </details>
          )}
        </div>
      </div>
      {opname && (
        <Stapper
          code={opnameCode}
          opname={opname}
          onSluiten={() => setOpname(null)}
          hoogte={stapper}
        />
      )}
      {inTab ? (
        <div
          className={styles.resultaat}
          style={
            onder
              ? { height: UITVOER_ONDER }
              : veldHoogte === null
                ? undefined
                : { maxHeight: veldHoogte }
          }
        >
          {uitvoer}
          {!statusMsg && !hasOutput && (
            // Het vak naast de code is er al voordat er iets gedraaid is: zo
            // verspringt het veld niet, en ziet de leerling waar hij moet kijken.
            <p className={styles.wacht}>
              Klik op Voer uit. De uitvoer verschijnt hier.
              {/* Wat nodig is om het veld te gebruiken, zegt het veld zelf. */}
              <span className={styles.bewaart}>
                Dit veld bewaart je code niet: kopieer wat je wilt houden.
              </span>
            </p>
          )}
        </div>
      ) : (
        uitvoer
      )}
    </div>
  );
}

// Singleton Pyodide loader — shared across all components on the page.
//
// De base-URL is instelbaar zodat een site Pyodide lokaal kan serveren
// (offline, vanuit static/pyodide/) of vanaf de CDN. Standaard: CDN.
// Roep setPyodideBaseUrl() aan in een clientModule om dit te overschrijven.
//
// Eén bron van waarheid voor de Pyodide-versie. Houd PYODIDE_VERSION gelijk aan
// de `pyodide`-versie in de catalog (pnpm-workspace.yaml): de copy-pyodide-
// scripts kopiëren díe versie naar static/pyodide/ van self-hostende sites.
// De CDN-default hieronder geldt voor sites die NIET self-hosten (bijv.
// fullstack), zodat die dezelfde Pyodide draaien als de rest.
// play heeft een eigen constante in sites/play/src/components/CodeRunner/engine.js,
// omdat die site zijn Pyodide in een iframe laadt en niet via deze provider.
// Hij hoort dezelfde versie te noemen; pyodide-kopie.test.ts controleert dat.
import { vraag } from '@coderius/shared/dialoog';

export const PYODIDE_VERSION = '0.29.4';
const DEFAULT_PYODIDE_BASE_URL = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`;
let pyodideBaseUrl = DEFAULT_PYODIDE_BASE_URL;

export function setPyodideBaseUrl(url: string): void {
  // Normaliseer naar een trailing slash zodat `${base}pyodide.js` klopt.
  pyodideBaseUrl = url.endsWith('/') ? url : `${url}/`;
}

// Minimale vorm van de geladen Pyodide-instantie — er is geen officieel
// @types/pyodide-pakket hier; dit dekt precies wat runPython/runPythonStream
// en de componenten die pyodide doorgeven daadwerkelijk aanroepen.
export interface PyodideInterface {
  runPython(code: string, options?: { filename?: string }): unknown;
  runPythonAsync(code: string, options?: { globals?: unknown }): Promise<unknown>;
  loadPackage(packages: string[]): Promise<void>;
  setStdout(options?: { batched: (text: string) => void }): void;
  setStderr(options?: { batched: (text: string) => void }): void;
  setStdin(options?: { stdin: () => string }): void;
  // Optioneel: de nagemaakte Pyodides in de tests hebben het niet.
  registerJsModule?(name: string, module: object): void;
}

interface WindowWithPyodide extends Window {
  loadPyodide?: (options: { indexURL: string }) => Promise<PyodideInterface>;
}

let pyodidePromise: Promise<PyodideInterface> | null = null;

export type PyodideLoader = () => Promise<PyodideInterface>;
let pyodideLoader: PyodideLoader | null = null;

/**
 * Alleen voor tests: vervang het laden via een <script>-tag door een eigen
 * loader (bijv. het pyodide-npm-pakket in node). In de browser blijft dit
 * ongebruikt; getPyodide() laadt dan zoals altijd vanaf pyodideBaseUrl.
 */
export function setPyodideLoader(loader: PyodideLoader | null): void {
  pyodideLoader = loader;
  pyodidePromise = null;
}

export function getPyodide(): Promise<PyodideInterface> {
  if (pyodidePromise) return pyodidePromise;

  pyodidePromise = (async () => {
    try {
      if (pyodideLoader) return await pyodideLoader();
      // Only add script tag once
      if (!(window as WindowWithPyodide).loadPyodide) {
        const script = document.createElement('script');
        script.src = `${pyodideBaseUrl}pyodide.js`;
        script.async = true;
        await new Promise<void>((res, rej) => {
          script.onload = () => res();
          script.onerror = () => rej(new Error('Failed to load Pyodide script'));
          document.head.appendChild(script);
        });
      }
      const loadPyodide = (window as WindowWithPyodide).loadPyodide;
      if (!loadPyodide) throw new Error('Pyodide script loaded but window.loadPyodide is missing');
      return await loadPyodide({ indexURL: pyodideBaseUrl });
    } catch (err) {
      pyodidePromise = null; // allow retry
      throw err;
    }
  })();

  return pyodidePromise;
}

/**
 * Format a Python traceback into a student-friendly error message.
 * Example output: "Fout op regel 3\nNameError: naam 'x' is niet gedefinieerd"
 */
export function filterTraceback(raw: string): string {
  const lines = raw.split('\n');

  // Extract the last line number from a <exec> frame
  let lineNumber: string | null = null;
  for (const line of lines) {
    const match = line.match(/File "<exec>", line (\d+)/);
    if (match) {
      lineNumber = match[1];
    }
  }

  // Extract the error line (e.g. "NameError: name 'x' is not defined")
  // It's the last non-empty line that looks like "ErrorType: message"
  let errorLine = '';
  for (let i = lines.length - 1; i >= 0; i--) {
    const trimmed = lines[i].trim();
    if (trimmed && /^[A-Z]\w*(Error|Exception|Warning)/.test(trimmed)) {
      errorLine = trimmed;
      break;
    }
  }

  if (!errorLine) {
    // Fallback: use the last non-empty line
    for (let i = lines.length - 1; i >= 0; i--) {
      if (lines[i].trim()) {
        errorLine = lines[i].trim();
        break;
      }
    }
  }

  if (!errorLine) return raw;

  const parts: string[] = [];
  if (lineNumber) {
    parts.push(`Fout op regel ${lineNumber}`);
  }
  parts.push(errorLine);

  return parts.join('\n');
}

// `input()` in de browser. Pyodide draait op de hoofdthread en input() is
// synchroon: Python wacht op het antwoord. Een eigen venster (dialoog.ts) is
// asynchroon, en daar kan Python alleen op wachten met JSPI (stack switching,
// run_sync). Chrome en Edge hebben dat sinds versie 137. Waar het ontbreekt
// (Safari, oudere browsers), vraagt input() via stdin en window.prompt; iets
// anders kan de browser dan niet.
function promptStdin(): string {
  const answer = window.prompt('Invoer (input):');
  return answer === null ? '' : answer;
}

// Vervangt builtins.input door een versie die het eigen venster gebruikt als
// run_sync kan. Onder een eigen bestandsnaam, zodat de Stapper deze functie
// niet als leerlingcode opneemt. Het antwoord komt, zoals in een terminal,
// achter de vraag in de uitvoer te staan.
export const INVOER_PY = `
import builtins
from pyodide.ffi import can_run_sync, run_sync
from coderius_invoer import vraag as _coderius_vraag

_coderius_oude_input = builtins.input

def _coderius_input(prompt=""):
    if not can_run_sync():
        return _coderius_oude_input(prompt)
    tekst = str(prompt)
    antwoord = run_sync(_coderius_vraag(tekst))
    print(tekst + antwoord)
    return antwoord

builtins.input = _coderius_input
`;

function vraagInvoer(tekst: string): Promise<string> {
  return vraag(tekst || 'Je programma wacht op invoer.', {
    titel: 'Invoer voor je programma',
    bevestigLabel: 'Invoeren',
    annuleerLabel: 'Leeg laten',
    ruw: true,
  }).then((antwoord) => antwoord ?? '');
}

const metEigenInvoer = new WeakSet<PyodideInterface>();

// Zet input() klaar voor een run: het eigen venster waar dat kan, stdin als
// terugval. Het vervangen van builtins.input gebeurt één keer per Pyodide.
function zetInvoer(pyodide: PyodideInterface): void {
  pyodide.setStdin({ stdin: promptStdin });
  if (metEigenInvoer.has(pyodide) || !pyodide.registerJsModule) return;
  pyodide.registerJsModule('coderius_invoer', { vraag: vraagInvoer });
  pyodide.runPython(INVOER_PY, { filename: '<coderius-invoer>' });
  metEigenInvoer.add(pyodide);
}

export interface RunPythonStreamOptions {
  onStdout: (text: string) => void;
  onStderr: (text: string) => void;
  // Optionele namespace (PyProxy van een dict) zodat een aanroeper elke run
  // met schone globals kan starten.
  globals?: unknown;
}

export interface RunPythonStreamResult {
  ok: boolean;
  // Leerlingvriendelijke foutmelding (zie filterTraceback), alleen bij ok=false.
  error?: string;
}

/**
 * Voert Python uit met live gestreamde output: onStdout/onStderr worden per
 * regel aangeroepen terwijl het programma draait (in plaats van één gebufferde
 * string achteraf, zoals runPython). Voor `input()`, zie zetInvoer.
 */
export async function runPythonStream(
  pyodide: PyodideInterface,
  code: string,
  { onStdout, onStderr, globals }: RunPythonStreamOptions,
): Promise<RunPythonStreamResult> {
  // `batched` krijgt complete regels aangeleverd, zonder newline.
  pyodide.setStdout({ batched: (text: string) => onStdout(`${text}\n`) });
  pyodide.setStderr({ batched: (text: string) => onStderr(`${text}\n`) });
  zetInvoer(pyodide);

  try {
    await pyodide.runPythonAsync(code, globals ? { globals } : undefined);
    return { ok: true };
  } catch (err) {
    const raw = err instanceof Error ? err.message : String(err);
    return { ok: false, error: filterTraceback(raw) };
  } finally {
    pyodide.setStdout();
    pyodide.setStderr();
    pyodide.setStdin();
  }
}

export interface StapVariabele {
  naam: string;
  soort: string;
  waarde: string;
}

/** Eén scope binnen een stap: de globale ruimte of een functie die openstaat. */
export interface StapFrame {
  naam: string;
  variabelen: StapVariabele[];
}

export interface Stap {
  regel: number;
  gebeurtenis: string;
  frames: StapFrame[];
  /** Hoeveel tekens er op dit moment geprint waren; snijpunt in `uitvoer`. */
  uitvoerTot: number;
}

export interface Opname {
  stappen: Stap[];
  uitvoer: string;
  /** True als de opname op de stappenlimiet is gestopt (meestal een oneindige lus). */
  afgekapt: boolean;
  fout: { soort: string; bericht: string; regel: number | null } | null;
}

/**
 * Neemt de uitvoering op in plaats van hem alleen te draaien: per stap het
 * regelnummer, de openstaande scopes met hun variabelen, en hoever de uitvoer
 * op dat moment was. De UI bladert daarna door die opname.
 *
 * De leerlingcode gaat als Python-stringliteral mee. JSON.stringify levert een
 * literal die Python net zo leest als JavaScript, dus er valt niets te escapen.
 */
/**
 * Neemt de uitvoering van `code` op. `voorwerk` is code die de les al
 * klaarzet (de verborgen code van een runner): die draait vooraf, onder een
 * eigen bestandsnaam zodat de opnemer hem niet volgt, en zijn namen blijven
 * uit de variabelenlijst van de leerling.
 */
export async function tracePython(
  pyodide: PyodideInterface,
  code: string,
  voorwerk?: string,
): Promise<Opname> {
  const { RECORDER } = await import('./trace/recorder');

  zetInvoer(pyodide);

  try {
    const ruw = (await pyodide.runPythonAsync(
      `${RECORDER}\n_stapper_neem_op(${JSON.stringify(code)}, ${voorwerk ? JSON.stringify(voorwerk) : 'None'})`,
    )) as string;
    return JSON.parse(ruw) as Opname;
  } catch (err) {
    // Hier komen we alleen als de opnemer zelf omvalt; een fout ín de
    // leerlingcode vangt hij op en levert hij als `fout` terug.
    const raw = err instanceof Error ? err.message : String(err);
    return {
      stappen: [],
      uitvoer: '',
      afgekapt: false,
      fout: { soort: 'Fout', bericht: filterTraceback(raw), regel: null },
    };
  } finally {
    pyodide.setStdin();
  }
}

export async function runPython(pyodide: PyodideInterface, code: string): Promise<string> {
  pyodide.runPython(`
import sys
from io import StringIO
sys.stdout = StringIO()
sys.stderr = StringIO()
`);
  // Zelfde input()-gedrag als runPythonStream; anders leest input() hier van
  // de standaard-stdin van Pyodide en krijgt de leerling geen vraag te zien.
  zetInvoer(pyodide);

  let didError = false;
  let jsError = '';
  try {
    await pyodide.runPythonAsync(code);
  } catch (err) {
    didError = true;
    jsError = err instanceof Error ? err.message : String(err);
  }

  // sys.stdout.getvalue()/sys.stderr.getvalue() zijn Python str's; Pyodide
  // converteert die automatisch naar JS strings.
  const stdout = pyodide.runPython('sys.stdout.getvalue()') as string;
  const stderr = pyodide.runPython('sys.stderr.getvalue()') as string;

  pyodide.runPython(`
sys.stdout = sys.__stdout__
sys.stderr = sys.__stderr__
`);
  pyodide.setStdin();

  // Een Python-fout zet Pyodide als traceback in het omgeleide stderr. Valt
  // Pyodide zélf om, dan blijft stderr leeg en zit de melding alleen in de
  // JS-fout; zonder die terugval zag de leerling een lege uitvoer.
  const foutTekst = stderr || jsError;
  if (didError && foutTekst) {
    const filtered = filterTraceback(foutTekst);
    return (stdout ? `${stdout}\n` : '') + filtered;
  }

  return stdout + (stderr ? `\n${stderr}` : '');
}

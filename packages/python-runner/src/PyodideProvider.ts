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
// Let op: play gebruikt bewust een oudere Pyodide (Python 3.12) vanwege zijn
// cp312-wheels — zie sites/play/src/components/CodeRunner/engine.js.
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
  runPython(code: string): unknown;
  runPythonAsync(code: string, options?: { globals?: unknown }): Promise<unknown>;
  loadPackage(packages: string[]): Promise<void>;
  setStdout(options?: { batched: (text: string) => void }): void;
  setStderr(options?: { batched: (text: string) => void }): void;
  setStdin(options?: { stdin: () => string }): void;
}

interface WindowWithPyodide extends Window {
  loadPyodide?: (options: { indexURL: string }) => Promise<PyodideInterface>;
}

let pyodidePromise: Promise<PyodideInterface> | null = null;

export function getPyodide(): Promise<PyodideInterface> {
  if (pyodidePromise) return pyodidePromise;

  pyodidePromise = (async () => {
    try {
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
function filterTraceback(raw: string): string {
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
 * string achteraf, zoals runPython). `input()` werkt via window.prompt.
 */
export async function runPythonStream(
  pyodide: PyodideInterface,
  code: string,
  { onStdout, onStderr, globals }: RunPythonStreamOptions,
): Promise<RunPythonStreamResult> {
  // `batched` krijgt complete regels aangeleverd, zonder newline.
  pyodide.setStdout({ batched: (text: string) => onStdout(`${text}\n`) });
  pyodide.setStderr({ batched: (text: string) => onStderr(`${text}\n`) });
  pyodide.setStdin({
    stdin: () => {
      const answer = window.prompt('Invoer (input):');
      return answer === null ? '' : answer;
    },
  });

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
export async function tracePython(pyodide: PyodideInterface, code: string): Promise<Opname> {
  const { RECORDER } = await import('./trace/recorder');

  pyodide.setStdin({
    stdin: () => {
      const answer = window.prompt('Invoer (input):');
      return answer === null ? '' : answer;
    },
  });

  try {
    const ruw = (await pyodide.runPythonAsync(
      `${RECORDER}\n_stapper_neem_op(${JSON.stringify(code)})`,
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

  let didError = false;
  try {
    await pyodide.runPythonAsync(code);
  } catch {
    didError = true;
  }

  // sys.stdout.getvalue()/sys.stderr.getvalue() zijn Python str's; Pyodide
  // converteert die automatisch naar JS strings.
  const stdout = pyodide.runPython('sys.stdout.getvalue()') as string;
  const stderr = pyodide.runPython('sys.stderr.getvalue()') as string;

  pyodide.runPython(`
sys.stdout = sys.__stdout__
sys.stderr = sys.__stderr__
`);

  if (didError && stderr) {
    // The traceback lands in stderr — filter out Pyodide internals
    const filtered = filterTraceback(stderr);
    return (stdout ? `${stdout}\n` : '') + filtered;
  }

  return stdout + (stderr ? `\n${stderr}` : '');
}

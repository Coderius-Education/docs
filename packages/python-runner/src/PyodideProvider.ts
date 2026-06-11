// Singleton Pyodide loader — shared across all components on the page.
//
// De base-URL is instelbaar zodat een site Pyodide lokaal kan serveren
// (offline, vanuit static/pyodide/) of vanaf de CDN. Standaard: CDN.
// Roep setPyodideBaseUrl() aan in een clientModule om dit te overschrijven.
const DEFAULT_PYODIDE_BASE_URL = 'https://cdn.jsdelivr.net/pyodide/v0.27.4/full/';
let pyodideBaseUrl = DEFAULT_PYODIDE_BASE_URL;

export function setPyodideBaseUrl(url: string): void {
  // Normaliseer naar een trailing slash zodat `${base}pyodide.js` klopt.
  pyodideBaseUrl = url.endsWith('/') ? url : `${url}/`;
}

let pyodidePromise: Promise<any> | null = null;

export function getPyodide(): Promise<any> {
  if (pyodidePromise) return pyodidePromise;

  pyodidePromise = new Promise(async (resolve, reject) => {
    try {
      // Only add script tag once
      if (!(window as any).loadPyodide) {
        const script = document.createElement('script');
        script.src = `${pyodideBaseUrl}pyodide.js`;
        script.async = true;
        await new Promise<void>((res, rej) => {
          script.onload = () => res();
          script.onerror = () => rej(new Error('Failed to load Pyodide script'));
          document.head.appendChild(script);
        });
      }
      const pyodide = await (window as any).loadPyodide({ indexURL: pyodideBaseUrl });
      resolve(pyodide);
    } catch (err) {
      pyodidePromise = null; // allow retry
      reject(err);
    }
  });

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
  globals?: any;
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
  pyodide: any,
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

export async function runPython(pyodide: any, code: string): Promise<string> {
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

  const stdout = pyodide.runPython('sys.stdout.getvalue()');
  const stderr = pyodide.runPython('sys.stderr.getvalue()');

  pyodide.runPython(`
sys.stdout = sys.__stdout__
sys.stderr = sys.__stderr__
`);

  if (didError && stderr) {
    // The traceback lands in stderr — filter out Pyodide internals
    const filtered = filterTraceback(stderr);
    return (stdout ? stdout + '\n' : '') + filtered;
  }

  return stdout + (stderr ? `\n${stderr}` : '');
}

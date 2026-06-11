// Self-hosted under static/pyodide/ so it works on school networks that
// block public CDNs. Must match the version of the files actually shipped
// in static/pyodide/ (pyodide.js + matplotlib wheel set).
const DEFAULT_INDEX = '/pyodide/';

declare global {
  interface Window {
    loadPyodide?: (opts: {indexURL: string}) => Promise<PyodideInterface>;
    __pyodidePromise?: Promise<PyodideInterface>;
  }
}

export type PyodideInterface = {
  runPythonAsync: (code: string) => Promise<unknown>;
  setStdout: (opts: {batched: (s: string) => void}) => void;
  setStderr: (opts: {batched: (s: string) => void}) => void;
  loadPackage: (names: string | string[]) => Promise<void>;
  globals: {get: (key: string) => unknown};
  FS: unknown;
};

function injectScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () =>
        reject(new Error(`Kan ${src} niet laden`)),
      );
      if ((existing as HTMLScriptElement).dataset.loaded === 'true') resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onload = () => {
      script.dataset.loaded = 'true';
      resolve();
    };
    script.onerror = () => reject(new Error(`Kan ${src} niet laden`));
    document.head.appendChild(script);
  });
}

export async function loadPyodideOnce(
  indexURL: string = DEFAULT_INDEX,
): Promise<PyodideInterface> {
  if (typeof window === 'undefined') {
    throw new Error('Pyodide kan alleen in de browser draaien');
  }
  if (window.__pyodidePromise) return window.__pyodidePromise;

  const base = indexURL.endsWith('/') ? indexURL : indexURL + '/';
  const promise = (async () => {
    try {
      await injectScript(base + 'pyodide.js');
      if (!window.loadPyodide) {
        throw new Error('Pyodide-script geladen maar loadPyodide ontbreekt');
      }
      return await window.loadPyodide({indexURL: base});
    } catch (err) {
      // Drop the failed promise so the next call retries from scratch.
      window.__pyodidePromise = undefined;
      throw err;
    }
  })();
  window.__pyodidePromise = promise;
  return promise;
}

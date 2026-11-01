import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import type { PyodideInterface } from './PyodideProvider';

// De echte Pyodide in node, via het npm-pakket: voor de tests, die hem met
// setPyodideLoader in plaats van de CDN-versie van de browser zetten. Dezelfde
// versie als in de browser; pyodide-kopie.test.ts houdt die gelijk.

export const PYODIDE_DIR = dirname(createRequire(import.meta.url).resolve('pyodide/package.json'));

interface PyodideModule {
  loadPyodide(options: { indexURL: string }): Promise<PyodideInterface>;
}

export async function laadLokalePyodide(): Promise<PyodideInterface> {
  const url = pathToFileURL(join(PYODIDE_DIR, 'pyodide.mjs')).href;
  const mod = (await import(/* @vite-ignore */ url)) as PyodideModule;
  return mod.loadPyodide({ indexURL: PYODIDE_DIR });
}

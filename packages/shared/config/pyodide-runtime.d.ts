/** De bestanden van de Pyodide-runtime die een site serveert. */
export const RUNTIME_BESTANDEN: readonly string[];
/** Declareert de site in deze map `pyodide` als (dev)dependency? */
export function gebruiktPyodide(siteDir: string): boolean;
/** Zet de runtime klaar; de static-map voor createConfig, of null. */
export function pyodideStaticDir(siteDir: string): string | null;

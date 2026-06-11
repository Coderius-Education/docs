import type { Runner, RunnerId } from './types';

// Metadata die de UI nodig heeft vóórdat de runner-code geladen is (de
// runners zelf laden lazy, zodat een pagina met alleen een Python-editor geen
// web- of serial-code in z'n bundle krijgt).
export const RUNNER_META: Record<string, { label: string; description: string }> = {
  python: { label: 'Python', description: 'Python draait in je browser via Pyodide' },
  web: { label: 'Website', description: 'HTML, CSS en JavaScript met live voorbeeld' },
  micropython: { label: 'MicroPython', description: 'Upload naar een microcontroller via USB' },
};

const factories: Record<string, () => Promise<Runner>> = {
  python: () => import('./python/PythonRunner').then((m) => m.createPythonRunner()),
  web: () => import('./web/WebRunner').then((m) => m.createWebRunner()),
  micropython: () =>
    import('./micropython/MicroPythonRunner').then((m) => m.createMicroPythonRunner()),
};

export async function createRunner(id: RunnerId): Promise<Runner> {
  const factory = factories[id];
  if (!factory) {
    throw new Error(`Onbekende runner: ${id}`);
  }
  return factory();
}

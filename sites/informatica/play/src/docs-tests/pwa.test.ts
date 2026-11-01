import { describe, expect, it } from 'vitest';
import config from '../../docusaurus.config';

// De runtime van Pyodide hoort niet in de precache van de PWA: de speeltuin
// vraagt hem met ?v=<versie> en src/sw.js cachet hem per versie. In de
// precache haalde een geïnstalleerde app 1,2 MB op voor niets, en antwoordde
// de PWA (die de query weglaat) dubbel op elk verzoek, met een
// InvalidStateError. Na de build controleren: build/sw.js noemt geen
// "pyodide/" in zijn manifest.

type PluginEntry = [string, Record<string, unknown>] | string;

describe('de PWA van play', () => {
  it('laat pyodide/ buiten de precache', () => {
    const pwa = (config.plugins as PluginEntry[]).find(
      (p) => Array.isArray(p) && p[0] === '@docusaurus/plugin-pwa',
    ) as [string, { injectManifestConfig?: { globIgnores?: string[] } }] | undefined;
    expect(pwa, 'plugin-pwa staat in de config').toBeDefined();
    expect(pwa?.[1].injectManifestConfig?.globIgnores).toContain('pyodide/**');
  });
});

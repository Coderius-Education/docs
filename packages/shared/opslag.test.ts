import { readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { storageKey } from '@coderius/shared/opslag';
import { describe, expect, it } from 'vitest';

// Alle cursussen van een vak delen één origin (informatica.coderius.nl/<pad>/)
// en dus één localStorage, sessionStorage en IndexedDB. Een kale sleutel van
// de ene cursus is leesbaar en overschrijfbaar voor elke andere; daarom gaat
// elke sleutel door storageKey(siteId, …).

const ROOT = fileURLToPath(new URL('../..', import.meta.url));
const OVERSLAAN = new Set(['node_modules', 'build', '.docusaurus', 'static', '__fixtures__']);

function bronbestanden(map: string): string[] {
  return readdirSync(map, { withFileTypes: true }).flatMap((e) => {
    if (OVERSLAAN.has(e.name) || e.name.startsWith('.')) return [];
    const pad = join(map, e.name);
    if (e.isDirectory()) return bronbestanden(pad);
    return /\.(tsx?|jsx?|mjs)$/.test(e.name) && !e.name.includes('.test.') ? [pad] : [];
  });
}

describe('storageKey', () => {
  it('zet het vak-brede voorvoegsel en de site ervoor', () => {
    expect(storageKey('robotica', 'webMicroEditor.code')).toBe(
      'coderius:robotica:webMicroEditor.code',
    );
  });

  it('weigert een lege of rare site-id', () => {
    expect(() => storageKey('', 'x')).toThrow();
    expect(() => storageKey('Python Docs', 'x')).toThrow();
    expect(() => storageKey('python', '')).toThrow();
  });
});

describe('geen kale opslagsleutel in een cursus', () => {
  it('localStorage, sessionStorage en IndexedDB krijgen geen letterlijke sleutel', () => {
    const KAAL =
      /(?:localStorage|sessionStorage)\.(?:getItem|setItem|removeItem)\(\s*['"`]|createStore\(\s*['"`]|new BroadcastChannel\(\s*['"`]|indexedDB\.open\(\s*['"`]/;
    const fout: string[] = [];
    for (const map of [join(ROOT, 'packages'), join(ROOT, 'sites', 'informatica')]) {
      for (const pad of bronbestanden(map)) {
        readFileSync(pad, 'utf8')
          .split('\n')
          .forEach((regel, i) => {
            if (KAAL.test(regel)) fout.push(`${relative(ROOT, pad)}:${i + 1}`);
          });
      }
    }
    expect(fout).toEqual([]);
  });
});

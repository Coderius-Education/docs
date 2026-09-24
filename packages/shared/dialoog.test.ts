import { readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// alert(), confirm() en prompt() zijn vervangen door de eigen vensters uit
// dialoog.ts: die passen bij de huisstijl, sluiten met Escape en blijven
// zichtbaar op volledig scherm, waar Chrome en Firefox het ingebouwde venster
// soms laten wegvallen samen met het volledige scherm. Deze guard houdt ze
// buiten de broncode van alle sites en packages.

const ROOT = fileURLToPath(new URL('../..', import.meta.url));

const OVERSLAAN = new Set([
  'node_modules',
  'build',
  '.docusaurus',
  'static',
  '__fixtures__',
  'extracted',
  'docs',
]);

// Plekken waar een ingebouwd venster terecht blijft, elk met een reden.
const UITZONDERINGEN: Record<string, string> = {
  // Terugval voor input() zonder JSPI (Safari): Python wacht synchroon op
  // het antwoord, en dat kan alleen window.prompt.
  'packages/python-runner/src/PyodideProvider.ts': 'input() zonder JSPI',
  // Code van de leerling of van een nagebouwde kwetsbare site, die in een
  // eigen iframe draait: daar hoort alert() bij de les.
  'sites/dvwa/src/components/DvwaLab/modules/authorization_bypass.js': 'lab-inhoud',
  'sites/dvwa/src/components/DvwaLab/modules/csp_bypass.js': 'lab-inhoud',
  'sites/web/src/checker/curriculum.ts': 'labels van JS-concepten',
  'packages/editor/src/runners/web/WebRunner.tsx': 'commentaar over de sandbox',
};

// `alert(`, `window.confirm(`, maar niet `iets.confirm(` van een ander object.
const DIALOOG_RE = /(?<![\w.])(?:window\.)?(?:alert|confirm|prompt)\s*\(/;

function bronbestanden(map: string, uit: string[] = []): string[] {
  for (const e of readdirSync(map, { withFileTypes: true })) {
    if (OVERSLAAN.has(e.name) || e.name.startsWith('.')) continue;
    const pad = join(map, e.name);
    if (e.isDirectory()) bronbestanden(pad, uit);
    else if (/\.(tsx?|jsx?|mjs)$/.test(e.name) && !/\.test\.tsx?$/.test(e.name)) uit.push(pad);
  }
  return uit;
}

describe('geen ingebouwde dialoogvensters', () => {
  const bestanden = [
    ...bronbestanden(join(ROOT, 'packages')),
    ...bronbestanden(join(ROOT, 'sites')),
  ];

  it('vindt de broncode', () => {
    expect(bestanden.length).toBeGreaterThan(100);
  });

  it('gebruikt overal dialoog.ts in plaats van alert, confirm of prompt', () => {
    const vondsten = bestanden
      .map((pad) => relative(ROOT, pad).split('\\').join('/'))
      .filter((rel) => !(rel in UITZONDERINGEN))
      .flatMap((rel) =>
        readFileSync(join(ROOT, rel), 'utf8')
          .split('\n')
          .map((regel, i) => ({ rel, regel, nr: i + 1 }))
          .filter(({ regel }) => DIALOOG_RE.test(regel) && !regel.trim().startsWith('//')),
      )
      .map(({ rel, nr, regel }) => `${rel}:${nr}: ${regel.trim()}`);

    expect(vondsten).toEqual([]);
  });

  it('elke uitzondering bestaat nog en heeft er nog een nodig', () => {
    for (const rel of Object.keys(UITZONDERINGEN)) {
      const tekst = readFileSync(join(ROOT, rel), 'utf8');
      expect(DIALOOG_RE.test(tekst), rel).toBe(true);
    }
  });
});

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// Wat een les over de speeltuin belooft, moet de speeltuin waarmaken. Python
// draait er in dezelfde browser-tab als de pagina (Pyodide op de hoofdthread,
// zie packages/python-runner/src/PyodideProvider.ts) en de Reset-knop staat
// uit zolang er iets draait (PyRunnerImpl.tsx, `disabled={busy}`). Bij een
// oneindige lus bevriest de tab dus, en wie het advies "druk op Reset" volgt
// raakt zijn code kwijt. Drie fouten-pagina's beloofden precies dat.

const DOCS = fileURLToPath(new URL('../../docs/', import.meta.url));

function lessen(map: string): string[] {
  return readdirSync(map).flatMap((naam) => {
    const pad = join(map, naam);
    if (statSync(pad).isDirectory()) return lessen(pad);
    return /\.mdx?$/.test(naam) ? [pad] : [];
  });
}

describe('beloften over de speeltuin', () => {
  it('geen les zegt dat Reset een draaiend programma stopt', () => {
    const fout = lessen(DOCS).filter((pad) =>
      /druk (gewoon |dan )?op \*{0,2}reset/i.test(readFileSync(pad, 'utf8')),
    );
    expect(fout).toEqual([]);
  });

  it('geen les zegt dat de uitvoer van de speeltuin groen wordt', () => {
    // De cfg-lessen zeiden vijf keer dat een zin "groen" wordt of blijft;
    // de runner print "OK (1x)" en "FOUT (0x)" in gewone tekst, niets kleurt
    // (PyRunnerImpl.tsx kent geen kleur per regel). Een kleur in een
    // visualisatie ("de startnode is groen") is iets anders en mag.
    const fout = lessen(DOCS).filter((pad) =>
      /\b(op|niet) groen\b|\bgroen (blijven|blijft|worden|wordt)\b/i.test(
        readFileSync(pad, 'utf8'),
      ),
    );
    expect(fout).toEqual([]);
  });

  it('elke les die een oneindige lus noemt, zegt dat de tab bevriest', () => {
    const fout = lessen(DOCS).filter((pad) => {
      const tekst = readFileSync(pad, 'utf8');
      return /loopt (gewoon )?\*\*oneindig\*\* door/.test(tekst) && !/tab bevriest/.test(tekst);
    });
    expect(fout).toEqual([]);
  });
});

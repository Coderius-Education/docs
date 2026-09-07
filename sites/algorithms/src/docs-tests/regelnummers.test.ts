import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// Op een lespagina staat dezelfde code op drie plekken: het statische
// codeblok, het bewerkbare veld van PyRunner, en de stapper. De swizzle in
// src/theme/CodeBlock geeft elk python-blok regelnummers en de stapper had ze
// al, maar het veld ertussen niet — precies waar "kijk naar regel 3" het
// meest nodig is.
//
// De oorzaak was een tweede kopie van de editor in deze site, naast die in
// @coderius/python-runner. De regelnummers waren maar in één van de twee
// bijgewerkt. Deze test houdt vast dat er nog één is.

const SRC = fileURLToPath(new URL('../..', import.meta.url));
const EDITOR = fileURLToPath(
  new URL('../../../../packages/python-runner/src/HighlightedEditor/index.tsx', import.meta.url),
);

function tsxBestanden(map: string): string[] {
  return readdirSync(map, { withFileTypes: true }).flatMap((entry) => {
    if (entry.name === 'node_modules') return [];
    const pad = join(map, entry.name);
    if (entry.isDirectory()) return tsxBestanden(pad);
    return /\.tsx?$/.test(entry.name) ? [pad] : [];
  });
}

describe('elk bewerkbaar codeveld toont regelnummers', () => {
  it('de gedeelde editor rendert een gutter met regelnummers', () => {
    const bron = readFileSync(EDITOR, 'utf8');

    expect(bron).toMatch(/styles\.gutter/);
    expect(bron).toMatch(/lineCount/);
  });

  it('deze site heeft geen eigen kopie van de editor', () => {
    // Een tweede implementatie is hoe het verschil ontstond. Wie er hier weer
    // een neerzet, mist de volgende verbetering aan de gedeelde.
    const eigen = tsxBestanden(SRC).filter((pad) => {
      if (pad.endsWith('regelnummers.test.ts')) return false;
      const bron = readFileSync(pad, 'utf8');
      return /export function HighlightedEditor|export default HighlightedEditor/.test(bron);
    });

    expect(eigen.map((p) => p.slice(SRC.length))).toEqual([]);
  });

  it('elke import van de editor wijst naar het gedeelde package', () => {
    const fout: string[] = [];

    for (const pad of tsxBestanden(SRC)) {
      const bron = readFileSync(pad, 'utf8');
      for (const m of bron.matchAll(
        /import\s*\{[^}]*HighlightedEditor[^}]*\}\s*from\s*'([^']+)'/g,
      )) {
        if (m[1] !== '@coderius/python-runner/HighlightedEditor') {
          fout.push(`${pad.slice(SRC.length)} — ${m[1]}`);
        }
      }
    }

    expect(fout).toEqual([]);
  });
});

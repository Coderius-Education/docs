import { spawnSync } from 'node:child_process';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { VERBORGEN } from '../components/PyRunner/verborgen';

// <PyRunner verborgen="naam"> draait code die niet in de editor staat. Drie
// lezers moeten hetzelfde stuk zien: de browser (via de registry), het
// blokken-script (leest het bestand tussen de backticks) en de docs-tests
// (importeren de registry). Dit pint vast dat die drie niet uit elkaar
// kunnen lopen, en dat elke naam in een les bestaat.

const DOCS = fileURLToPath(new URL('../../docs/', import.meta.url));
const MAP = fileURLToPath(new URL('../components/PyRunner/verborgen/', import.meta.url));

function lessen(map: string): string[] {
  return readdirSync(map)
    .sort()
    .flatMap((naam) => {
      const pad = join(map, naam);
      if (statSync(pad).isDirectory()) return lessen(pad);
      return /\.mdx?$/.test(naam) ? [pad] : [];
    });
}

/** Zoals scripts/draai-python-blokken.py het leest: tussen de eerste en de laatste backtick. */
function zoalsHetScript(naam: string): string {
  const tekst = readFileSync(join(MAP, `${naam}.ts`), 'utf8');
  const begin = tekst.indexOf('String.raw`') + 'String.raw`'.length;
  return tekst.slice(begin, tekst.lastIndexOf('`')).replace(/^\n+|\n+$/g, '');
}

describe('verborgen code van de PyRunner', () => {
  for (const [naam, code] of Object.entries(VERBORGEN)) {
    describe(naam, () => {
      it('compileert als Python', () => {
        const r = spawnSync(
          'python3',
          ['-c', 'import sys; compile(sys.stdin.read(), "verborgen", "exec")'],
          {
            input: code,
            encoding: 'utf8',
          },
        );
        expect(r.status, r.stderr).toBe(0);
      });

      it('bevat niets dat String.raw zou verwerken', () => {
        expect(code).not.toContain('${');
      });

      it('is voor het blokken-script hetzelfde stuk als voor de browser', () => {
        expect(zoalsHetScript(naam)).toBe(code.replace(/^\n+|\n+$/g, ''));
      });
    });
  }

  it('elke verborgen="…" in een les bestaat, en staat vóór initialCode', () => {
    const fout: string[] = [];
    let gebruikt = 0;
    for (const pad of lessen(DOCS)) {
      const tekst = readFileSync(pad, 'utf8');
      for (const tag of tekst.matchAll(/<PyRunner\b[\s\S]*?\/>/g)) {
        const m = tag[0].match(/\bverborgen="([\w-]+)"/);
        if (!m) continue;
        gebruikt += 1;
        if (!(m[1] in VERBORGEN)) fout.push(`${relative(DOCS, pad)}: onbekend "${m[1]}"`);
        const naInitialCode = tag[0].indexOf('initialCode=') < tag[0].indexOf('verborgen=');
        if (naInitialCode)
          fout.push(`${relative(DOCS, pad)}: verborgen="${m[1]}" hoort vóór initialCode`);
      }
    }
    expect(fout).toEqual([]);
    expect(gebruikt).toBeGreaterThan(10);
  });

  it('de cfg-runners zijn kort: de motor staat niet meer in de editor', () => {
    for (const pad of lessen(join(DOCS, 'cfg'))) {
      const tekst = readFileSync(pad, 'utf8');
      for (const m of tekst.matchAll(/<PyRunner\b[^`]*?initialCode=\{`([\s\S]*?)`\}/g)) {
        expect(m[1], relative(DOCS, pad)).not.toContain('def parse(');
        expect(m[1].split('\n').length, relative(DOCS, pad)).toBeLessThan(30);
      }
    }
  });
});

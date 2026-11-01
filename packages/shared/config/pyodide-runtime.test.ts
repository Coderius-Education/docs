import { createHash } from 'node:crypto';
import { mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, describe, expect, it } from 'vitest';
import { RUNTIME_BESTANDEN, gebruiktPyodide, pyodideStaticDir } from './pyodide-runtime';

// createConfig zet de Pyodide-runtime uit node_modules klaar voor elke site die
// `pyodide` declareert. Hier: welke bestanden, en dat ze byte voor byte die
// van het geïnstalleerde pakket zijn.

const ROOT = fileURLToPath(new URL('../../..', import.meta.url));
const PYTHON = join(ROOT, 'sites/informatica/python');
const som = (pad: string) => createHash('sha256').update(readFileSync(pad)).digest('hex');
const tijdelijk = mkdtempSync(join(tmpdir(), 'pyodide-runtime-'));
afterAll(() => rmSync(tijdelijk, { recursive: true, force: true }));

describe('pyodideStaticDir', () => {
  it('geeft null voor een site zonder pyodide', () => {
    writeFileSync(join(tijdelijk, 'package.json'), '{"name":"zonder"}');
    expect(gebruiktPyodide(tijdelijk)).toBe(false);
    expect(pyodideStaticDir(tijdelijk)).toBeNull();
  });

  it('zet voor een site met pyodide precies de runtime klaar, gelijk aan het pakket', () => {
    const root = pyodideStaticDir(PYTHON);
    expect(root).not.toBeNull();
    const map = join(root as string, 'pyodide');
    expect(readdirSync(map).sort()).toEqual([...RUNTIME_BESTANDEN].sort());

    const pakket = dirname(
      createRequire(join(PYTHON, 'package.json')).resolve('pyodide/package.json'),
    );
    for (const naam of RUNTIME_BESTANDEN) {
      expect(som(join(map, naam)), naam).toBe(som(join(pakket, naam)));
    }
    // De versie zit in het pad: een upgrade krijgt een eigen map.
    const versie = JSON.parse(readFileSync(join(pakket, 'package.json'), 'utf8')).version;
    expect(root).toContain(join('coderius-pyodide', versie));
  });

  it('kopieert niets opnieuw als alles er al staat', () => {
    const root = pyodideStaticDir(PYTHON) as string;
    const wasm = join(root, 'pyodide', 'pyodide.asm.wasm');
    const eerst = statSync(wasm).mtimeMs;
    pyodideStaticDir(PYTHON);
    expect(statSync(wasm).mtimeMs).toBe(eerst);
  });
});

import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import {
  type PyodideInterface,
  getPyodide,
  runPython,
  runPythonStream,
  setPyodideLoader,
} from './PyodideProvider';

// runPython (de gebufferde variant voor CodeExercise) liep uit de pas met
// runPythonStream: hij zette geen stdin, dus input() vroeg de leerling niets,
// en zijn catch gooide het JS-foutobject weg — viel Pyodide zelf om (leeg
// stderr), dan kreeg de leerling een lege uitvoer zonder melding. Deze tests
// draaien de echte Pyodide in node via het npm-pakket (setPyodideLoader), plus
// één nagemaakte Pyodide voor precies die lege-stderr-tak, die met een echte
// Python-fout niet na te spelen is: Pyodide schrijft die altijd naar stderr.

const PYODIDE_DIR = dirname(createRequire(import.meta.url).resolve('pyodide/package.json'));

interface PyodideModule {
  loadPyodide(options: { indexURL: string }): Promise<PyodideInterface>;
}

async function laadLokalePyodide(): Promise<PyodideInterface> {
  const url = pathToFileURL(join(PYODIDE_DIR, 'pyodide.mjs')).href;
  const mod = (await import(/* @vite-ignore */ url)) as PyodideModule;
  return mod.loadPyodide({ indexURL: PYODIDE_DIR });
}

// Zonder eigen stdin leest Pyodide in node van de échte stdin en blokkeert het
// proces voorgoed: een test die input() draait, hangt dan in plaats van te
// falen. Deze omhulling laat een run zonder eigen stdin hard falen, zodat een
// regressie van runPython's setStdin een rode test is en geen vastgelopen CI.
function metStdinBewaking(pyodide: PyodideInterface): PyodideInterface {
  let eigenStdin = false;
  return {
    runPython: (code) => pyodide.runPython(code),
    runPythonAsync: (code, options) => {
      if (!eigenStdin) {
        throw new Error('geen eigen stdin ingesteld: input() zou node laten blokkeren');
      }
      return pyodide.runPythonAsync(code, options);
    },
    loadPackage: (packages) => pyodide.loadPackage(packages),
    setStdout: (options) => pyodide.setStdout(options),
    setStderr: (options) => pyodide.setStderr(options),
    setStdin: (options) => {
      eigenStdin = typeof options?.stdin === 'function';
      pyodide.setStdin(options);
    },
  };
}

describe('runPython en runPythonStream met echte Pyodide in node', () => {
  let pyodide: PyodideInterface;

  beforeAll(async () => {
    setPyodideLoader(laadLokalePyodide);
    // input() gaat via window.prompt; in node bestaat window niet.
    vi.stubGlobal('window', { prompt: () => 'Sam' });
    pyodide = await getPyodide();
  }, 90_000);

  afterAll(() => {
    vi.unstubAllGlobals();
    setPyodideLoader(null);
  });

  it('laadt Pyodide één keer (getPyodide geeft dezelfde instantie terug)', async () => {
    expect(await getPyodide()).toBe(pyodide);
  });

  it('runPython geeft de uitvoer van print terug', async () => {
    expect(await runPython(pyodide, 'print("hoi")')).toBe('hoi\n');
  });

  it('runPythonStream streamt de uitvoer van print per regel', async () => {
    const stdout: string[] = [];
    const result = await runPythonStream(pyodide, 'print("hoi")', {
      onStdout: (t) => stdout.push(t),
      onStderr: () => {},
    });
    expect(result).toEqual({ ok: true });
    expect(stdout).toEqual(['hoi\n']);
  });

  it('runPythonStream meldt een Python-fout met regelnummer', async () => {
    const result = await runPythonStream(pyodide, 'x = 1/0', {
      onStdout: () => {},
      onStderr: () => {},
    });
    expect(result.ok).toBe(false);
    expect(result.error?.startsWith('Fout op regel 1')).toBe(true);
    expect(result.error).toContain('ZeroDivisionError');
  });

  it('runPython meldt een Python-fout met regelnummer, na de uitvoer tot dan toe', async () => {
    const result = await runPython(pyodide, 'print("eerst")\nx = 1/0');
    expect(result.startsWith('eerst\n\nFout op regel 2')).toBe(true);
    expect(result).toContain('ZeroDivisionError: division by zero');
  });

  it('runPython laat input() het antwoord van window.prompt gebruiken', async () => {
    const result = await runPython(
      metStdinBewaking(pyodide),
      'naam = input("Naam: ")\nprint("Hoi " + naam)',
    );
    expect(result).toBe('Naam: Hoi Sam\n');
  });

  it('runPythonStream laat input() hetzelfde antwoord gebruiken', async () => {
    const stdout: string[] = [];
    await runPythonStream(metStdinBewaking(pyodide), 'naam = input()\nprint("Hoi " + naam)', {
      onStdout: (t) => stdout.push(t),
      onStderr: () => {},
    });
    expect(stdout.join('')).toBe('Hoi Sam\n');
  });

  it('een run na een mislukte run werkt gewoon weer', async () => {
    await runPython(pyodide, 'x = 1/0');
    expect(await runPython(pyodide, 'print(2)')).toBe('2\n');

    const stdout: string[] = [];
    const result = await runPythonStream(pyodide, 'print(3)', {
      onStdout: (t) => stdout.push(t),
      onStderr: () => {},
    });
    expect(result).toEqual({ ok: true });
    expect(stdout).toEqual(['3\n']);
  });
});

// Nagemaakte Pyodide: runPythonAsync faalt aan de JS-kant zonder iets naar
// Python's stderr te schrijven, zoals bij een omgevallen Pyodide-runtime.
function nepPyodide(fout: unknown) {
  const stdinCalls: (Parameters<PyodideInterface['setStdin']>[0] | undefined)[] = [];
  const pyodide: PyodideInterface = {
    runPython: (code) => (code.includes('getvalue') ? '' : undefined),
    runPythonAsync: () => Promise.reject(fout),
    loadPackage: () => Promise.resolve(),
    setStdout: () => {},
    setStderr: () => {},
    setStdin: (options) => {
      stdinCalls.push(options);
    },
  };
  return { pyodide, stdinCalls };
}

describe('runPython als Pyodide zelf omvalt (nagemaakte Pyodide)', () => {
  it('gebruikt de JS-foutmelding als stderr leeg is', async () => {
    const { pyodide } = nepPyodide(new Error('Pyodide is kapot'));
    expect(await runPython(pyodide, 'print(1)')).toBe('Pyodide is kapot');
  });

  it('haalt ook uit een JS-traceback het regelnummer', async () => {
    const { pyodide } = nepPyodide(
      new Error('Traceback (most recent call last):\n  File "<exec>", line 3\nRuntimeError: kapot'),
    );
    expect(await runPython(pyodide, 'x')).toBe('Fout op regel 3\nRuntimeError: kapot');
  });

  it('zet een niet-Error-waarde om met String()', async () => {
    const { pyodide } = nepPyodide('gewoon een string');
    expect(await runPython(pyodide, 'x')).toBe('gewoon een string');
  });

  it('zet stdin op window.prompt en ruimt die na afloop weer op', async () => {
    vi.stubGlobal('window', { prompt: () => 'antwoord' });
    try {
      const { pyodide, stdinCalls } = nepPyodide(new Error('x'));
      await runPython(pyodide, 'x');
      expect(stdinCalls).toHaveLength(2);
      expect(stdinCalls[0]?.stdin()).toBe('antwoord');
      expect(stdinCalls[1]).toBeUndefined();
    } finally {
      vi.unstubAllGlobals();
    }
  });
});

import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import {
  INVOER_PY,
  type PyodideInterface,
  getPyodide,
  haalTekening,
  runPython,
  runPythonStream,
  setPyodideLoader,
  tracePython,
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

  it('vervangt input() door de versie met het eigen venster', async () => {
    // Zonder JSPI (node zonder vlag, Safari) valt die terug op stdin; de twee
    // tests hierboven draaien al door die terugval.
    await runPython(pyodide, 'pass');
    expect(pyodide.runPython('import builtins\nbuiltins.input.__name__')).toBe('_coderius_input');
  });

  it('import turtle werkt, en de tekening komt na afloop mee', async () => {
    const uit = await runPython(
      pyodide,
      'import turtle\nfor _ in range(4):\n    turtle.forward(100)\n    turtle.left(90)\nprint(turtle.pos())\nturtle.done()',
    );
    // Ook de echte turtle komt na vier keer 90 graden op -0.00 uit.
    expect(uit).toBe('(-0.00,0.00)\n');
    const tekening = haalTekening(pyodide);
    expect(tekening?.gebeurtenissen.filter((g) => g.t === 'ga')).toHaveLength(4);
  });

  it('een run zonder turtle heeft geen tekening, ook niet die van de run ervoor', async () => {
    await runPython(pyodide, 'import turtle\nturtle.forward(10)');
    expect(haalTekening(pyodide)).not.toBeNull();
    await runPython(pyodide, 'print(1)');
    expect(haalTekening(pyodide)).toBeNull();
  });

  it('elke run begint met een leeg doek', async () => {
    await runPython(pyodide, 'import turtle\nturtle.forward(10)');
    await runPython(pyodide, 'import turtle\nturtle.forward(20)');
    const ga = haalTekening(pyodide)?.gebeurtenissen.filter((g) => g.t === 'ga');
    expect(ga).toEqual([expect.objectContaining({ x: 20 })]);
  });

  it('een turtle-fout wijst naar de regel van de leerling', async () => {
    const uit = await runPython(pyodide, 'import turtle\nturtle.forward(10)\nturtle.color((1, 2))');
    expect(uit).toContain('Fout op regel 3');
    expect(uit).toContain('TurtleGraphicsError: bad color arguments: (1, 2)');
    // Wat er vóór de fout getekend was, blijft zichtbaar.
    expect(haalTekening(pyodide)?.gebeurtenissen.filter((g) => g.t === 'ga')).toHaveLength(1);
  });

  it('een tikfout in een turtle-commando geeft de melding die de les citeert', async () => {
    // De les (straat-vol-huizen, stap 1) citeert deze melding; het blokkenscript
    // controleert hem in CPython, dit in de Pyodide van de speeltuin zelf.
    const uit = await runPython(pyodide, 'import turtle\nturtle.Forward(100)');
    expect(uit).toBe(
      "Fout op regel 2\nAttributeError: module 'turtle' has no attribute 'Forward'. Did you mean: 'forward'?",
    );
  });

  it('stap voor stap: per stap hoeveel er getekend was, en de hele tekening', async () => {
    const opname = await tracePython(
      pyodide,
      'import turtle\nturtle.forward(10)\nturtle.left(90)\nturtle.forward(10)',
    );
    const tot = opname.stappen.map((s) => s.tekenTot);
    expect(tot).toEqual([...tot].sort((a, b) => (a ?? 0) - (b ?? 0)));
    expect(tot[0]).toBe(0);
    expect(tot.at(-1)).toBe(opname.tekening?.gebeurtenissen.length);
    expect(opname.fout).toBeNull();
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

// De weg mét JSPI: input() wacht met run_sync op een asynchroon venster.
// Vitest draait node zonder --experimental-wasm-jspi, dus deze test start een
// los node-proces met die vlag, laadt Pyodide, en zet INVOER_PY neer met een
// nagemaakt venster dat na een tik antwoordt. Zo is het de echte Python-kant,
// en niet alleen de terugval.
describe('input() met JSPI wacht op het eigen venster', () => {
  it('geeft het antwoord terug en zet vraag en antwoord in de uitvoer', () => {
    const script = `
      const { loadPyodide } = await import(${JSON.stringify(pathToFileURL(join(PYODIDE_DIR, 'pyodide.mjs')).href)});
      const py = await loadPyodide({ indexURL: ${JSON.stringify(PYODIDE_DIR)} });
      const uit = [];
      py.setStdout({ batched: (t) => uit.push(t) });
      const vragen = [];
      py.registerJsModule('coderius_invoer', {
        vraag: (tekst) => { vragen.push(tekst); return new Promise((r) => setTimeout(() => r('Sam'), 10)); },
      });
      py.runPython(process.env.INVOER_PY, { filename: '<coderius-invoer>' });
      await py.runPythonAsync('naam = input("Naam: ")\\nprint("Hoi " + naam)');
      console.log(JSON.stringify({ uit, vragen }));
    `;
    const ruw = execFileSync(
      process.execPath,
      ['--experimental-wasm-jspi', '--input-type=module', '-e', script],
      { env: { ...process.env, INVOER_PY }, encoding: 'utf8', timeout: 90_000 },
    );
    const { uit, vragen } = JSON.parse(ruw.trim().split('\n').pop() ?? '{}');

    expect(vragen).toEqual(['Naam: ']);
    expect(uit).toEqual(['Naam: Sam', 'Hoi Sam']);
  }, 90_000);
});

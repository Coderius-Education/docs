import { readFileSync } from 'node:fs';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { type PyodideInterface, getPyodide, runPython, setPyodideLoader } from './PyodideProvider';
import { laadLokalePyodide } from './pyodide-in-node';

// De codeblokken van de python-cursus worden in CI met CPython gedraaid
// (scripts/draai-python-blokken.py). Maar een leerling drukt op Uitvoeren in de
// speeltuin, en daar draait Pyodide: een module die er niet is, een input() die
// anders loopt of een turtle die iets anders tekent, ziet CPython niet. Deze
// test haalt dezelfde blokken door runPython, de functie achter CodeExercise,
// met dezelfde invoer en hetzelfde zaad, en legt het resultaat naast dat van
// CPython:
//
// - belooft de les een uitvoer, dan moet de speeltuin precies die geven;
// - draaide het blok in CPython schoon, dan mag het in de speeltuin niet
//   omvallen;
// - viel het in CPython om (een les over een fout), dan op dezelfde melding.
//   Alleen op dezelfde Python-versie wordt de tekst vergeleken, anders de
//   soort.
//
// De blokken komen uit `draai-python-blokken.py --json <pad>`; de job
// `blokken` zet het pad in CODERIUS_BLOKKEN_JSON. Zonder die variabele slaat
// `pnpm test` deze test over. Lokaal:
//
//   python3.13 scripts/draai-python-blokken.py --json /tmp/blokken.json
//   CODERIUS_BLOKKEN_JSON=/tmp/blokken.json pnpm exec vitest run lessen-in-pyodide

interface Blok {
  bron: string;
  regel: number;
  code: string;
  invoer: string[] | null;
  zaad: number | null;
  belooft_uitvoer: boolean;
  stdout: string;
  returncode: number;
  fout: string;
}

const PAD = process.env.CODERIUS_BLOKKEN_JSON;
const PYTHON_VAN_PYODIDE = '3.13';

/** De melding waarop runPython eindigt als de code omviel, of null. */
function foutVan(uitvoer: string): string | null {
  const regels = uitvoer.trimEnd().split('\n');
  const laatste = regels.at(-1)?.trim() ?? '';
  const ervoor = regels.at(-2) ?? '';
  // filterTraceback zet "Fout op regel N" boven de melding; zonder regelnummer
  // (een fout in de turtle zelf) staat alleen de melding er.
  if (/^Fout op regel \d+$/.test(ervoor) || /^[A-Z]\w*(Error|Exception)\b/.test(laatste)) {
    return laatste;
  }
  return null;
}

/**
 * Een melding zonder het nummer van de systeemfout: Linux, macOS en Windows
 * zeggen `[Errno 2]` bij een bestand dat er niet is, de browser (Emscripten)
 * `[Errno 44]`. De rest van de melding is gelijk, en dat nummer kan een les
 * niet voor beide goed hebben; de leerling let er ook niet op.
 */
function zonderErrno(melding: string): string {
  return melding.replace(/\[Errno \d+\]/, '[Errno …]');
}

describe('zonderErrno', () => {
  it('laat het nummer van een systeemfout weg, en verder niets', () => {
    expect(zonderErrno("FileNotFoundError: [Errno 44] No such file or directory: 'a.txt'")).toBe(
      zonderErrno("FileNotFoundError: [Errno 2] No such file or directory: 'a.txt'"),
    );
    expect(zonderErrno("NameError: name 'x' is not defined")).toBe(
      "NameError: name 'x' is not defined",
    );
  });
});

describe('foutVan', () => {
  it('herkent de melding achter "Fout op regel"', () => {
    expect(foutVan('hoi\nFout op regel 2\nZeroDivisionError: division by zero')).toBe(
      'ZeroDivisionError: division by zero',
    );
  });
  it('geeft null bij gewone uitvoer', () => {
    expect(foutVan('3\n4\n')).toBeNull();
  });
});

describe.skipIf(!PAD)('de lescode doet in de speeltuin wat CPython doet', () => {
  let pyodide: PyodideInterface;
  let antwoorden: string[] = [];

  beforeAll(async () => {
    setPyodideLoader(laadLokalePyodide);
    // input() vraagt via window.prompt; de invoer-marker van het blok geeft
    // de antwoorden, net als bij CPython.
    vi.stubGlobal('window', { prompt: () => antwoorden.shift() ?? null });
    pyodide = await getPyodide();
  }, 120_000);

  afterAll(() => {
    vi.unstubAllGlobals();
    setPyodideLoader(null);
  });

  it(
    'elk blok geeft in Pyodide dezelfde uitkomst',
    async () => {
      const { python, blokken } = JSON.parse(readFileSync(PAD ?? '', 'utf8')) as {
        python: string;
        blokken: Blok[];
      };
      // Met --alleen kan de lijst leeg zijn: dan veranderde er alleen tekst.
      const zelfdeVersie = python === PYTHON_VAN_PYODIDE;
      const afwijkingen: string[] = [];

      for (const blok of blokken) {
        const waar = `${blok.bron}:${blok.regel}`;
        antwoorden = [...(blok.invoer ?? [])];
        // Elk blok in een eigen lege map, zoals bij CPython: de les over JSON
        // schrijft bestanden, en die horen niet bij het volgende blok.
        pyodide.runPython('import os as _o, tempfile as _t\n_o.chdir(_t.mkdtemp())');
        if (blok.zaad !== null) pyodide.runPython(`import random\nrandom.seed(${blok.zaad})`);

        const uit = await runPython(pyodide, blok.code, { turtle: true });
        const fout = foutVan(uit);

        if (blok.returncode === 0) {
          if (fout) afwijkingen.push(`${waar}: valt in de speeltuin om op ${fout}`);
          else if (blok.belooft_uitvoer && uit.trimEnd() !== blok.stdout.trimEnd()) {
            afwijkingen.push(
              `${waar}: de speeltuin geeft ${JSON.stringify(uit)}, CPython ${JSON.stringify(blok.stdout)}`,
            );
          }
        } else if (!fout) {
          afwijkingen.push(`${waar}: valt in CPython om op ${blok.fout}, in de speeltuin niet`);
        } else {
          const verwacht = zelfdeVersie ? zonderErrno(blok.fout) : blok.fout.split(':')[0];
          const echt = zelfdeVersie ? zonderErrno(fout) : fout.split(':')[0];
          if (echt !== verwacht)
            afwijkingen.push(`${waar}: speeltuin ${fout}, CPython ${blok.fout}`);
        }
      }

      expect(afwijkingen).toEqual([]);
    },
    15 * 60_000,
  );
});

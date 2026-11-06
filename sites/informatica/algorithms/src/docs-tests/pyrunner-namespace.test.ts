import type { PyodideInterface } from '@coderius/python-runner/PyodideProvider';
import { laadLokalePyodide } from '@coderius/python-runner/pyodide-in-node';
import { beforeAll, describe, expect, it } from 'vitest';
import { draaiInVerseMain } from '../components/PyRunner/draai';

// Alle runners op een pagina delen één Pyodide. Draaide een runner zonder
// eigen globals, dan bleef alles van een eerdere run staan, ook van een andere
// runner op de pagina. Bij de leerling-doorloop van de route machine learning
// gaf een vergeten `score = 0` daardoor geen NameError maar de score van het
// onderzoek, werkte `random` zonder import, en vond de Bouw zelf van de buren
// een functie `doodlopend()` die alleen in de opdracht erboven stond. Deze
// test draait de echte Pyodide in node, zoals de python-runner dat doet.

let py: PyodideInterface;
let uitvoer = '';

beforeAll(async () => {
  py = await laadLokalePyodide();
  py.setStdout({
    batched: (s: string) => {
      uitvoer += `${s}\n`;
    },
  });
}, 120_000);

async function draai(code: string, verborgen?: string): Promise<string> {
  uitvoer = '';
  await draaiInVerseMain(py, code, verborgen);
  return uitvoer;
}

async function fout(code: string, verborgen?: string): Promise<string> {
  try {
    await draai(code, verborgen);
  } catch (e) {
    return e instanceof Error ? e.message : String(e);
  }
  return '';
}

describe('elke run van PyRunner begint leeg', () => {
  it('een variabele van een vorige run bestaat niet meer', async () => {
    expect(await draai('score = 3\nprint(score)')).toBe('3\n');
    expect(await fout('print(score)')).toContain("NameError: name 'score' is not defined");
  });

  it('een import van een vorige run geldt niet meer', async () => {
    await draai('import random\nrandom.seed(1)');
    expect(await fout('print(random.random())')).toContain("name 'random' is not defined");
  });

  it('de verborgen code en de editor delen wel hun namen', async () => {
    const verborgen = 'def buren(v):\n    return [v]';
    expect(await draai('print(buren(1))', verborgen)).toBe('[1]\n');
    expect(await fout('print(buren(1))')).toContain("name 'buren' is not defined");
  });

  it('de code draait als __main__ en geeft de bomen terug', async () => {
    expect(await draai('if __name__ == "__main__":\n    print("hoofd")')).toBe('hoofd\n');
    uitvoer = '';
    const bomen = await draaiInVerseMain(py, "_coderius_bomen = [['S', ['zn', 'kat']]]");
    expect(JSON.parse(bomen)).toEqual([['S', ['zn', 'kat']]]);
    expect(JSON.parse(await draaiInVerseMain(py, 'x = 1'))).toEqual([]);
  });

  it('na een fout staat de echte __main__ terug', async () => {
    expect(await fout('1 / 0')).toContain('ZeroDivisionError');
    expect(py.runPython('import sys; sys.modules["__main__"] is _coderius_echte_main')).toBe(true);
  });
});

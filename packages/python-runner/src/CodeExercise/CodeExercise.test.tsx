// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Opname, PyodideInterface } from '../PyodideProvider';
import { setPyodideLoader } from '../PyodideProvider';
import CodeExercise from './index';

// De speeltuin van de python-cursus: 654 keer gebruikt, en tot nu toe zonder
// één test van de component zelf. Wat Python doet, testen de node-tests met de
// echte Pyodide (PyodideProvider.node.test.ts); hier gaat het om wat de
// leerling ziet en kan aanklikken: welke knoppen aan staan, wat er in de
// uitvoer komt, wat Reset en Stap voor stap doen, en wat er gebeurt als Python
// niet laadt. Daarvoor is een nagemaakte Pyodide genoeg, en sneller.

vi.mock('@docusaurus/BrowserOnly', () => ({
  default: ({ children }: { children: () => React.ReactNode }) => <>{children()}</>,
}));

interface Nep {
  pyodide: PyodideInterface;
  /** Elke code die de leerling liet draaien, in volgorde. */
  runs: string[];
  /** Zet wat de volgende run print, op stderr zet, en of hij wacht. */
  volgende: { stdout?: string; stderr?: string; wacht?: Promise<void>; opname?: Opname };
}

function nepPyodide(): Nep {
  const nep: Nep = { pyodide: undefined as unknown as PyodideInterface, runs: [], volgende: {} };
  let stdout = '';
  let stderr = '';
  nep.pyodide = {
    runPython: (code) => {
      if (code.includes('sys.stdout.getvalue()')) return stdout;
      if (code.includes('sys.stderr.getvalue()')) return stderr;
      return undefined;
    },
    runPythonAsync: async (code) => {
      if (code.includes('_stapper_neem_op')) {
        return JSON.stringify(nep.volgende.opname);
      }
      nep.runs.push(code);
      const { wacht, stdout: uit = '', stderr: fout = '' } = nep.volgende;
      if (wacht) await wacht;
      stdout = uit;
      stderr = fout;
      if (fout) throw new Error(fout);
      return undefined;
    },
    loadPackage: async () => {},
    setStdout: () => {},
    setStderr: () => {},
    setStdin: () => {},
  };
  return nep;
}

const knop = (naam: string | RegExp) =>
  screen.getByRole('button', { name: naam }) as HTMLButtonElement;
const editor = () => screen.getByRole('textbox') as HTMLTextAreaElement;

let nep: Nep;

beforeEach(() => {
  nep = nepPyodide();
  setPyodideLoader(async () => nep.pyodide);
});

afterEach(() => {
  cleanup();
  setPyodideLoader(null);
});

async function wachtTotGeladen() {
  await waitFor(() => expect(knop(/Uitvoeren/).disabled).toBe(false));
}

describe('CodeExercise', () => {
  it('toont de begincode, en Uitvoeren staat uit tot Python geladen is', async () => {
    render(<CodeExercise>{'print("hoi")'}</CodeExercise>);
    expect(editor().value).toBe('print("hoi")');
    expect(knop('Laden...').disabled).toBe(true);
    expect(knop('Stap voor stap').disabled).toBe(true);
    screen.getByText('Python wordt geladen...');
    await wachtTotGeladen();
    expect(knop('Stap voor stap').disabled).toBe(false);
    expect(screen.queryByText('Python wordt geladen...')).toBeNull();
  });

  it('draait de code van de leerling en toont de uitvoer', async () => {
    render(<CodeExercise>{'print("hoi")'}</CodeExercise>);
    await wachtTotGeladen();
    fireEvent.change(editor(), { target: { value: 'print("dag")' } });
    nep.volgende = { stdout: 'dag\n' };
    fireEvent.click(knop(/Uitvoeren/));
    await screen.findByText('dag');
    expect(nep.runs).toEqual(['print("dag")']);
  });

  it('zet de knoppen uit zolang een run bezig is, en een tweede klik doet niets', async () => {
    render(<CodeExercise>{'x = 1'}</CodeExercise>);
    await wachtTotGeladen();
    let klaar = () => {};
    nep.volgende = {
      wacht: new Promise<void>((r) => {
        klaar = r;
      }),
    };
    fireEvent.click(knop(/Uitvoeren/));
    expect(
      ((await screen.findByRole('button', { name: 'Bezig...' })) as HTMLButtonElement).disabled,
    ).toBe(true);
    expect(knop('Stap voor stap').disabled).toBe(true);
    fireEvent.click(knop('Bezig...'));
    fireEvent.keyDown(editor(), { key: 'Enter', ctrlKey: true });
    await act(async () => klaar());
    await wachtTotGeladen();
    expect(nep.runs).toHaveLength(1);
  });

  it('toont een Python-fout met het regelnummer van de leerling', async () => {
    render(<CodeExercise>{'print(x)'}</CodeExercise>);
    await wachtTotGeladen();
    nep.volgende = {
      stderr:
        'Traceback (most recent call last):\n  File "<exec>", line 1, in <module>\nNameError: name \'x\' is not defined',
    };
    fireEvent.click(knop(/Uitvoeren/));
    await screen.findByText(/Fout op regel 1/);
    screen.getByText(/NameError: name 'x' is not defined/);
  });

  it('Ctrl+Enter draait de code, net als de knop', async () => {
    render(<CodeExercise>{'print(1)'}</CodeExercise>);
    await wachtTotGeladen();
    nep.volgende = { stdout: '1\n' };
    fireEvent.keyDown(editor(), { key: 'Enter', ctrlKey: true });
    await waitFor(() => expect(nep.runs).toEqual(['print(1)']));
  });

  it('Reset zet de begincode terug', async () => {
    render(<CodeExercise>{'print("begin")'}</CodeExercise>);
    await wachtTotGeladen();
    fireEvent.change(editor(), { target: { value: 'iets anders' } });
    fireEvent.click(knop('Reset'));
    expect(editor().value).toBe('print("begin")');
  });

  it('Stap voor stap toont de opname, en Sluiten haalt hem weg', async () => {
    render(<CodeExercise>{'x = 1\nprint(x)'}</CodeExercise>);
    await wachtTotGeladen();
    nep.volgende = {
      opname: {
        stappen: [
          {
            regel: 1,
            gebeurtenis: 'line',
            frames: [{ naam: '<module>', variabelen: [] }],
            uitvoerTot: 0,
            tekenTot: null,
          },
          {
            regel: 2,
            gebeurtenis: 'line',
            frames: [{ naam: '<module>', variabelen: [{ naam: 'x', soort: 'int', waarde: '1' }] }],
            uitvoerTot: 0,
            tekenTot: null,
          },
        ],
        uitvoer: '1\n',
        afgekapt: false,
        fout: null,
      } as unknown as Opname,
    };
    fireEvent.click(knop('Stap voor stap'));
    await screen.findByText(/Stap 1 van 2/);
    fireEvent.click(knop('Sluiten'));
    expect(screen.queryByText(/Stap 1 van 2/)).toBeNull();
    expect(nep.runs).toEqual([]);
  });

  it('laadt Python niet, dan zegt de uitvoer dat, en Uitvoeren probeert het opnieuw', async () => {
    // Eerst stond de knop na een mislukte lading aan en deed hij niets.
    let pogingen = 0;
    setPyodideLoader(async () => {
      pogingen += 1;
      if (pogingen === 1) throw new Error('geen netwerk');
      return nep.pyodide;
    });
    render(<CodeExercise>{'print(1)'}</CodeExercise>);
    await screen.findByText(/Fout bij het laden van Python: Error: geen netwerk/);
    nep.volgende = { stdout: '1\n' };
    fireEvent.click(knop(/Uitvoeren/));
    await waitFor(() => expect(nep.runs).toEqual(['print(1)']));
    expect(pogingen).toBe(2);
    expect(screen.queryByText(/Fout bij het laden/)).toBeNull();
  });
});

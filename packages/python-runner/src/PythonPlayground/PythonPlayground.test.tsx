// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { setPyodideLoader } from '../PyodideProvider';
import { type Nep, nepPyodide } from '../nep-pyodide';
import PythonPlayground from './index';

// De losse speeltuinpagina (/playground van de python-cursus): dezelfde knoppen
// als CodeExercise, met een eigen begincode. Zie CodeExercise.test.tsx voor de
// aanpak met een nagemaakte Pyodide.

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

describe('PythonPlayground', () => {
  it('begint met een voorbeeld, draait het en toont de uitvoer', async () => {
    render(<PythonPlayground />);
    expect(editor().value).toContain('print("Hallo, wereld!")');
    await waitFor(() => expect(knop(/Uitvoeren/).disabled).toBe(false));
    nep.volgende = { stdout: 'Hallo, wereld!\n' };
    fireEvent.click(knop(/Uitvoeren/));
    await screen.findByText(/Hallo, wereld!/, { selector: 'pre' });
    expect(nep.runs).toHaveLength(1);
  });

  it('laadt Python niet, dan probeert Uitvoeren het opnieuw', async () => {
    let pogingen = 0;
    setPyodideLoader(async () => {
      pogingen += 1;
      if (pogingen === 1) throw new Error('geen netwerk');
      return nep.pyodide;
    });
    render(<PythonPlayground />);
    await screen.findByText(/Fout bij het laden van Python/);
    fireEvent.click(knop(/Uitvoeren/));
    await waitFor(() => expect(nep.runs).toHaveLength(1));
    expect(pogingen).toBe(2);
  });
});

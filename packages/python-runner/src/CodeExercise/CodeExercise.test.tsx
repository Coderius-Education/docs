import { readFileSync } from 'node:fs';
import { DoelContext, PaneelContext } from '@coderius/shared/components/LesTabs/paneel';
// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Opname } from '../PyodideProvider';
import { setPyodideLoader } from '../PyodideProvider';
import { type Nep, nepPyodide } from '../nep-pyodide';
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

  it('in een les-tabblad staat er al een vak voor de uitvoer voordat er iets gedraaid is', async () => {
    // In een tabblad moet het paneel op het scherm passen. De uitvoer staat
    // daar naast de code; kwam hij er pas na Uitvoeren onder, dan schoof de
    // knop Volgende van het scherm op het moment dat de leerling klikte.
    const { container } = render(
      <PaneelContext.Provider value={() => {}}>
        <CodeExercise>{'print(1)'}</CodeExercise>
      </PaneelContext.Provider>,
    );
    await wachtTotGeladen();
    screen.getByText(/De uitvoer verschijnt hier/);
    nep.volgende = { stdout: '1\n' };
    fireEvent.click(knop(/Uitvoeren/));
    // De melding maakt plaats voor de uitvoer, in hetzelfde vak.
    await waitFor(() => expect(screen.queryByText(/De uitvoer verschijnt hier/)).toBeNull());
    const uitvoer = Array.from(container.querySelectorAll('pre')).filter(
      (pre) => pre.textContent === '1\n',
    );
    expect(uitvoer).toHaveLength(1);
  });

  it('het doel van de opdracht staat in het vak van de uitvoer, en blijft staan na Uitvoeren', async () => {
    // De verwachte uitvoer stond boven het veld en duwde het van het scherm.
    // In het vak staat hij onder wat de leerling zelf krijgt: zo vergelijkt
    // hij de twee zonder te scrollen (LesVeld zet het doel om het veld).
    const { container } = render(
      <PaneelContext.Provider value={() => {}}>
        <DoelContext.Provider value={<p>Verwachte uitvoer: 12</p>}>
          <CodeExercise>{'print(1)'}</CodeExercise>
        </DoelContext.Provider>
      </PaneelContext.Provider>,
    );
    await wachtTotGeladen();
    // Het doel staat er twee keer: boven de code voor een smal scherm (daar
    // stond het anders onder een startcode van dertig regels), en in het vak
    // van de uitvoer voor een breed scherm. De opmaak toont er één.
    const [boven, doel] = screen.getAllByText('Verwachte uitvoer: 12');
    expect(boven.compareDocumentPosition(editor()) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(boven.parentElement?.className).not.toBe(doel.parentElement?.className);
    // In het vak: eerst de melding, dan het doel.
    const melding = screen.getByText(/De uitvoer verschijnt hier/);
    expect(melding.compareDocumentPosition(doel) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    nep.volgende = { stdout: '1\n' };
    fireEvent.click(knop(/Uitvoeren/));
    await waitFor(() => expect(screen.queryByText(/De uitvoer verschijnt hier/)).toBeNull());
    const uitvoer = Array.from(container.querySelectorAll('pre')).find(
      (pre) => pre.textContent === '1\n',
    ) as HTMLElement;
    expect(
      uitvoer.compareDocumentPosition(screen.getAllByText('Verwachte uitvoer: 12')[1]) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it('buiten een tabblad staat er geen leeg vak onder de code', async () => {
    render(<CodeExercise>{'print(1)'}</CodeExercise>);
    await wachtTotGeladen();
    expect(screen.queryByText(/De uitvoer verschijnt hier/)).toBeNull();
  });

  it('Ctrl+Enter draait de code, net als de knop', async () => {
    render(<CodeExercise>{'print(1)'}</CodeExercise>);
    await wachtTotGeladen();
    nep.volgende = { stdout: '1\n' };
    fireEvent.keyDown(editor(), { key: 'Enter', ctrlKey: true });
    await waitFor(() => expect(nep.runs).toEqual(['print(1)']));
  });

  it('een turtle-tekening komt onder de code in beeld', async () => {
    const { container } = render(<CodeExercise>{'import turtle'}</CodeExercise>);
    await wachtTotGeladen();
    nep.volgende = {
      tekening: {
        direct: true,
        gebeurtenissen: [
          { t: 'nieuw', id: 0, vorm: 'classic', zichtbaar: true },
          { t: 'ga', id: 0, x: 100, y: 0, pen: true, kleur: 'black', dikte: 1 },
        ],
      },
    };
    fireEvent.click(knop(/Uitvoeren/));
    await waitFor(() =>
      expect(container.querySelector('svg line, svg path, svg polyline')).not.toBeNull(),
    );
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

  it('het lege vak zegt dat het veld je code niet bewaart', async () => {
    // Dat stond alleen in de docentenhandleiding. Wat een leerling nodig
    // heeft om het veld te gebruiken, zegt het veld zelf.
    render(
      <PaneelContext.Provider value={() => {}}>
        <CodeExercise>{'print(1)'}</CodeExercise>
      </PaneelContext.Provider>,
    );
    await wachtTotGeladen();
    screen.getByText(/bewaart je code niet/);
  });

  describe('in een tabblad op een breed scherm', () => {
    // jsdom heeft geen layout: de maten die het veld opvraagt, staan hier vast.
    const echteMaat = HTMLElement.prototype.getBoundingClientRect;
    beforeEach(() => {
      HTMLElement.prototype.getBoundingClientRect = function () {
        const paneel = this.hasAttribute('data-les-tab');
        return {
          width: 900,
          height: paneel ? 500 : 300,
          top: paneel ? 150 : 250,
          bottom: paneel ? 650 : 550,
          left: 0,
          right: 900,
          x: 0,
          y: 0,
          toJSON: () => ({}),
        } as DOMRect;
      };
      vi.stubGlobal(
        'ResizeObserver',
        class {
          observe() {}
          disconnect() {}
        },
      );
      vi.stubGlobal('matchMedia', () => ({
        matches: true,
        addEventListener() {},
        removeEventListener() {},
      }));
    });
    afterEach(() => {
      HTMLElement.prototype.getBoundingClientRect = echteMaat;
      vi.unstubAllGlobals();
    });

    const inTab = (kind: React.ReactNode) => (
      <section data-les-tab="opdracht">
        <PaneelContext.Provider value={() => {}}>{kind}</PaneelContext.Provider>
      </section>
    );

    it('Stap voor stap neemt de plek van de editor en de uitvoer in', async () => {
      // Onder het veld was het scherm tot 1634 pixels te lang, met de code
      // er twee keer. De stapper krijgt de hoogte die de editor had.
      const { container } = render(inTab(<CodeExercise>{'x = 1\nprint(x)'}</CodeExercise>));
      await wachtTotGeladen();
      const veld = container.querySelector('[class*="exercise"]') as HTMLElement;
      expect(veld.className).not.toMatch(/staptInTab/);
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
          ],
          uitvoer: '',
          afgekapt: false,
          fout: null,
        } as unknown as Opname,
      };
      fireEvent.click(knop('Stap voor stap'));
      await screen.findByText(/Stap 1 van 1/);
      expect(veld.className).toMatch(/staptInTab/);
      const stapper = container.querySelector('[class*="stapper"]') as HTMLElement;
      const hoogte = Number.parseInt(stapper.style.getPropertyValue('--stap-hoogte'), 10);
      expect(hoogte).toBeGreaterThan(0);
      // Niet hoger dan het veld was.
      expect(hoogte).toBeLessThan(
        Number.parseInt(
          veld.querySelector<HTMLElement>('[class*="resultaat"]')?.style.maxHeight ?? '0',
          10,
        ),
      );
      fireEvent.click(knop('Sluiten'));
      expect(veld.className).not.toMatch(/staptInTab/);
    });

    it('met een doelplaatje zijn de eigen tekening en het doel samen niet hoger dan het veld', async () => {
      // Na Uitvoeren schoof het doelplaatje onder de eigen tekening uit
      // beeld: vergelijken kon alleen door te scrollen in het vak.
      const { container } = render(
        inTab(
          <DoelContext.Provider value={<img src="doel.svg" alt="Het doel" />}>
            <CodeExercise>{'import turtle'}</CodeExercise>
          </DoelContext.Provider>,
        ),
      );
      await wachtTotGeladen();
      const vak = container.querySelector('[class*="resultaat"]') as HTMLElement;
      expect(vak.className).not.toMatch(/vergelijk/);
      nep.volgende = {
        tekening: {
          direct: true,
          gebeurtenissen: [
            { t: 'nieuw', id: 0, vorm: 'classic', zichtbaar: true },
            { t: 'ga', id: 0, x: 100, y: 0, pen: true, kleur: 'black', dikte: 1 },
          ],
        },
      };
      fireEvent.click(knop(/Uitvoeren/));
      await waitFor(() => expect(container.querySelector('svg')).not.toBeNull());
      expect(vak.className).toMatch(/vergelijk/);
      // De opmaak rekent met de hoogte van het veld.
      expect(vak.style.getPropertyValue('--veld-hoogte')).toMatch(/^\d+px$/);
    });
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

describe('de verwachte uitvoer in de uitvoerkolom', () => {
  it('breekt af als een regel niet past, net als de uitvoer van de leerling', () => {
    // In een smalle kolom (op Windows nog smaller door de schuifbalk van de
    // pagina) viel het eind van een regel weg: "geslaagd!" in les 5b.3.
    // Alleen in een browser te zien; in jsdom is import.meta.url geen
    // bestandsadres, dus het pad vanuit de root.
    const css = readFileSync('packages/python-runner/src/CodeExercise/styles.module.css', 'utf8');
    expect(css).toMatch(/\.doel pre code\s*\{[^}]*white-space:\s*pre-wrap/);
    expect(css).toMatch(/\.output\s*\{[^}]*white-space:\s*pre-wrap/);
  });
});

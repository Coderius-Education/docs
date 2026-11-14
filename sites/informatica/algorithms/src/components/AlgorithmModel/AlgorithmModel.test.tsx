// @vitest-environment jsdom
import { PaneelContext } from '@coderius/shared/components/LesTabs/paneel';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Model, { type AlgorithmModelProps, MIN_OEFENING } from './Model';

// Het interactieve model van de zes zoek- en sorteerhoofdstukken, op de
// bekijk- en de compleet-pagina's. Sinds de cursus les-tabbladen heeft, staat
// het in een tabblad, en daar moet het op het scherm passen en even hoog
// blijven: bij een wissel tussen Visualisatie en Code-oefening en voor en na
// Draai de tests (root-CLAUDE.md, Les-tabbladen). Wat het in de browser echt meet,
// meet scripts/meet-les-tabs.mjs; hier staat de rekensom vast.

const AlgorithmModel = (props: AlgorithmModelProps) => (
  <Model {...props} pyodideIndexURL="/pyodide/" />
);

const runPythonAsync = vi.fn();
vi.mock('../PyRunner/usePyodide', () => ({
  warmupPyodide: () => {},
  loadPyodideOnce: async () => ({
    runPythonAsync,
    setStdout: () => {},
    setStderr: () => {},
  }),
}));

afterEach(() => {
  cleanup();
  runPythonAsync.mockReset();
});

const knop = (naam: string | RegExp) =>
  screen.getByRole('button', { name: naam }) as HTMLButtonElement;

describe('AlgorithmModel', () => {
  it('heeft koppen voor een schermlezer, zonder de opmaak van de les', () => {
    // Een <h2> in het model kreeg in een tabblad de opmaak van de les. Een
    // <p> zonder rol liet een schermlezer zonder kop; nu is het een kop met
    // role="heading", onder het tabblad (niveau 3) en de stap (niveau 4).
    const { container } = render(<AlgorithmModel algorithm="linear-search" />);
    expect(container.querySelectorAll('h1, h2, h3, h4, h5, h6')).toHaveLength(0);
    screen.getByRole('heading', { name: 'Lineair zoeken', level: 3 });
    expect(screen.getAllByRole('heading', { level: 4 }).length).toBeGreaterThan(0);
  });

  it('toont buiten een tabblad wat het is, en in een tabblad niet nog eens', () => {
    render(<AlgorithmModel algorithm="linear-search" alleenVisualisatie />);
    screen.getByText('Interactief model');
    cleanup();
    render(
      <PaneelContext.Provider value={() => {}}>
        <AlgorithmModel algorithm="linear-search" alleenVisualisatie />
      </PaneelContext.Provider>,
    );
    expect(screen.queryByText('Interactief model')).toBeNull();
  });
});

describe('AlgorithmModel in een les-tabblad', () => {
  // jsdom heeft geen opmaak: het paneel, het model en de visualisatie krijgen
  // hier vaste maten. Het model begint 200 pixels onder de bovenkant van de
  // pagina, en onder het model staat nog 100 pixels tekst in het paneel.
  const echteMaat = HTMLElement.prototype.getBoundingClientRect;
  let visueel = 420;
  let scherm = 768;

  beforeEach(() => {
    visueel = 420;
    scherm = 768;
    HTMLElement.prototype.getBoundingClientRect = function (this: HTMLElement) {
      const rect = (top: number, bottom: number) =>
        ({ top, bottom, width: 800, height: bottom - top, left: 0, right: 800 }) as DOMRect;
      if (this.hasAttribute('data-les-tab')) return rect(100, 700);
      return rect(200, 600);
    };
    Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
      configurable: true,
      get(this: HTMLElement) {
        return this.className.includes('visualGrid') ? visueel : 38;
      },
    });
    Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
      configurable: true,
      get: () => 800,
    });
    vi.stubGlobal('innerHeight', scherm);
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
    // biome-ignore lint/performance/noDelete: de maten van jsdom terug
    delete (HTMLElement.prototype as { offsetHeight?: number }).offsetHeight;
    // biome-ignore lint/performance/noDelete: de maten van jsdom terug
    delete (HTMLElement.prototype as { clientWidth?: number }).clientWidth;
    vi.unstubAllGlobals();
  });

  const inTab = (kind: React.ReactNode) => (
    <section data-les-tab="run">
      <PaneelContext.Provider value={() => {}}>{kind}</PaneelContext.Provider>
    </section>
  );
  const lijf = (container: HTMLElement) =>
    container.querySelector('section[aria-label] > div:last-child') as HTMLElement;

  it('is bij Visualisatie en Code-oefening even hoog', () => {
    // Eerst sprong het model van 420 naar 560 pixels bij de klik op
    // Code-oefening: de editor was 300 pixels hoog en de tests stonden eronder.
    const { container } = render(inTab(<AlgorithmModel algorithm="linear-search" />));
    expect(lijf(container).style.minHeight).toBe('420px');
    fireEvent.click(knop('Code-oefening'));
    expect(lijf(container).style.height).toBe('420px');
    fireEvent.click(knop('Visualisatie'));
    expect(lijf(container).style.minHeight).toBe('420px');
  });

  it('wordt niet hoger dan wat er op het scherm over is', () => {
    // 768 - 200 boven - 100 eronder - 12 marge: 456 pixels vrij.
    visueel = 600;
    const { container } = render(inTab(<AlgorithmModel algorithm="linear-search" />));
    fireEvent.click(knop('Code-oefening'));
    expect(lijf(container).style.height).toBe('456px');
  });

  it('wordt nooit lager dan een bruikbare code-oefening', () => {
    vi.stubGlobal('innerHeight', 500);
    const { container } = render(inTab(<AlgorithmModel algorithm="linear-search" />));
    fireEvent.click(knop('Code-oefening'));
    expect(lijf(container).style.height).toBe(`${MIN_OEFENING}px`);
  });

  it('de uitkomst van de tests staat in de testkolom, en het model blijft even hoog', async () => {
    // Hoe hoog het model in de browser is, meet scripts/meet-les-tabs.mjs; hier
    // staat vast dat de uitkomst in de kolom komt die in zijn vak schuift
    // (.testsPanel) en dat de hoogte niet van de uitkomst afhangt.
    runPythonAsync.mockResolvedValue([
      { label: 'gevonden', passed: true, expected: 4, actual: 4, error: null },
      { label: 'niet gevonden', passed: false, expected: -1, actual: 0, error: null },
    ]);
    const { container } = render(inTab(<AlgorithmModel algorithm="linear-search" />));
    fireEvent.click(knop('Code-oefening'));
    const voor = lijf(container).style.height;
    // De editor past in het model: zijn hoogte min de rand en de kop erboven.
    const editor = container.querySelector('textarea')?.parentElement as HTMLElement;
    expect(Number.parseInt(editor.style.maxHeight, 10)).toBe(420 - 34 - 38);
    fireEvent.click(knop('Draai de tests'));
    const uitkomst = await screen.findByText('1/2 tests goed');
    expect(uitkomst.closest('[class*="testsPanel"]')).not.toBeNull();
    expect(lijf(container).style.height).toBe(voor);
    // Engels stond er ook: PASS, FAIL en "kreeg undefined".
    screen.getByText('goed');
    screen.getByText('fout');
  });

  it('in een tabblad staan de knoppen vóór de testgevallen, ook voor de Tab-toets', () => {
    // Met CSS `order` stonden ze er alleen voor het oog boven; de Tab-toets
    // liep eerst langs de lijst.
    const { container } = render(inTab(<AlgorithmModel algorithm="linear-search" />));
    fireEvent.click(knop('Code-oefening'));
    const lijst = screen.getByText('Testgevallen');
    expect(knop('Draai de tests').compareDocumentPosition(lijst)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
    expect(container).toBeTruthy();
    cleanup();
    render(<AlgorithmModel algorithm="linear-search" />);
    fireEvent.click(knop('Code-oefening'));
    expect(knop('Draai de tests').compareDocumentPosition(screen.getByText('Testgevallen'))).toBe(
      Node.DOCUMENT_POSITION_PRECEDING,
    );
  });

  it('zet de melding over jouw code naast de knoppen, niet eronder', async () => {
    // Na Visualiseer mijn code kwam er een regel bij, en schoof de stepper
    // onder de rand van het scherm.
    runPythonAsync.mockResolvedValue({ trace: [], result: -1, error: null });
    render(inTab(<AlgorithmModel algorithm="linear-search" />));
    fireEvent.click(knop('Code-oefening'));
    fireEvent.click(knop('Visualiseer mijn code'));
    const melding = await screen.findByText('Je kijkt nu naar de stappen van jouw Python-code.');
    expect(melding.parentElement?.contains(knop('Mijn code'))).toBe(true);
  });

  it('meet niet op een smal scherm: daar scrolt de leerling', () => {
    vi.stubGlobal('matchMedia', () => ({
      matches: false,
      addEventListener() {},
      removeEventListener() {},
    }));
    const { container } = render(inTab(<AlgorithmModel algorithm="linear-search" />));
    fireEvent.click(knop('Code-oefening'));
    expect(lijf(container).style.height).toBe('');
  });

  it('meet niet met alleen de visualisatie: daar wisselt niets', () => {
    const { container } = render(
      inTab(<AlgorithmModel algorithm="linear-search" alleenVisualisatie />),
    );
    expect(lijf(container).style.minHeight).toBe('');
    expect(container.querySelector('[data-les-veld]')).toBeNull();
  });
});

describe('de opmaak van het model', () => {
  it('heeft geen eigen laag of animatie op het model zelf', async () => {
    // Een transform, z-index of animatie op het model maakt een eigen laag
    // (zie Les-tabbladen, Wat vastligt). In jsdom is import.meta.url geen
    // bestandsadres, dus het pad vanuit de root.
    const { readFileSync } = await import('node:fs');
    const css = readFileSync(
      'sites/informatica/algorithms/src/components/AlgorithmModel/styles.module.css',
      'utf8',
    );
    const regels = [...css.matchAll(/(^|\n)\.(model|inTab)\s*\{([^}]*)\}/g)].map((m) => m[3]);
    expect(regels.length).toBeGreaterThan(0);
    for (const regel of regels) {
      expect(regel).not.toMatch(/transform|z-index|animation|contain:|filter/);
    }
  });
});

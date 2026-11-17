import { readFileSync } from 'node:fs';
import { join } from 'node:path';
// @vitest-environment jsdom
import {
  HulpContext,
  OpenContext,
  PaneelContext,
} from '@coderius/shared/components/LesTabs/paneel';
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// De speeltuin in een les-tabblad. Buiten een tabblad komt het spel op de
// plek van de code: het veld wisselt dan van hoogte, en de code is weg zolang
// het spel draait. In een tabblad staan ze naast elkaar, en stopt het spel
// als zijn scherm dichtgaat: het spelvenster zweeft los boven de pagina
// (SharedRunner) en bleef anders over het volgende scherm heen staan.

type Luisteraars = { onError: (melding: string, fataal: boolean) => void };
const gestart: { ownerId: number; code: string; listeners: Luisteraars }[] = [];
const gestopt: number[] = [];

vi.mock('../SharedRunner', () => ({
  schedule: () => {},
  requestRun: (run: { ownerId: number; code: string; listeners: Luisteraars }) => {
    gestart.push({ ownerId: run.ownerId, code: run.code, listeners: run.listeners });
    return gestart.length;
  },
  stop: (ownerId: number) => {
    gestopt.push(ownerId);
  },
}));
vi.mock('../CodeRunner/CodeEditor', () => ({
  default: ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
    <textarea aria-label="code" value={value} onChange={(e) => onChange(e.target.value)} />
  ),
}));
vi.mock('@docusaurus/BrowserOnly', () => ({
  default: ({ children }: { children: () => unknown }) => children(),
}));

const { default: PygbagRunner } = await import('./index');

const CODE = 'import play\n\nplay.new_circle()';

beforeEach(() => {
  gestart.length = 0;
  gestopt.length = 0;
});
afterEach(cleanup);

function InTab({ open = true }: { open?: boolean }) {
  return (
    <PaneelContext.Provider value={() => {}}>
      <OpenContext.Provider value={open}>
        <PygbagRunner code={CODE} height={300} />
      </OpenContext.Provider>
    </PaneelContext.Provider>
  );
}

const knop = (container: HTMLElement, tekst: RegExp) =>
  Array.from(container.querySelectorAll('button')).find((k) => tekst.test(k.textContent ?? '')) as
    | HTMLButtonElement
    | undefined;

describe('buiten een tabblad', () => {
  it('komt het spel op de plek van de code', () => {
    const { container } = render(<PygbagRunner code={CODE} height={300} />);
    expect(container.querySelector('textarea')).not.toBeNull();
    expect(container.querySelector('[data-play-veld]')).toBeNull();

    fireEvent.click(knop(container, /Speel in browser/) as HTMLButtonElement);
    expect(gestart).toHaveLength(1);
    expect(container.querySelector('textarea')).toBeNull();
  });
});

describe('in een tabblad', () => {
  it('staan de code en het vak van het spel er allebei, ook voor de eerste klik', () => {
    const { container } = render(<InTab />);
    expect(container.querySelector('[data-play-veld]')).not.toBeNull();
    expect(container.querySelector('textarea')).not.toBeNull();
    expect(container.querySelector('[data-play-spel]')?.textContent).toMatch(
      /Het spel verschijnt hier/,
    );
  });

  it('blijft de code staan terwijl het spel draait, met wat de leerling typte', () => {
    const { container } = render(<InTab />);
    const code = container.querySelector('textarea') as HTMLTextAreaElement;
    fireEvent.change(code, { target: { value: `${CODE}\nplay.new_box()` } });
    fireEvent.click(knop(container, /Speel in browser/) as HTMLButtonElement);

    expect(gestart).toHaveLength(1);
    expect(gestart[0].code).toContain('play.new_box()');
    // Dezelfde editor, niet een nieuwe: anders was de cursor en de
    // geschiedenis van Ctrl+Z weg.
    expect(container.querySelector('textarea')).toBe(code);
    expect(container.querySelector('[data-play-spel]')?.textContent).toBe('');
    expect(knop(container, /Stop/)).toBeDefined();
  });

  it('een tweede klik op de knop begint het spel opnieuw', () => {
    const { container } = render(<InTab />);
    fireEvent.click(knop(container, /Speel in browser/) as HTMLButtonElement);
    fireEvent.click(knop(container, /Opnieuw spelen/) as HTMLButtonElement);

    expect(gestart).toHaveLength(2);
  });

  it('het spel stopt als het tabblad of de stap dichtgaat', () => {
    const { container, rerender } = render(<InTab />);
    fireEvent.click(knop(container, /Speel in browser/) as HTMLButtonElement);
    expect(knop(container, /Stop/)).toBeDefined();
    gestopt.length = 0;

    rerender(<InTab open={false} />);
    expect(gestopt).toEqual([gestart[0].ownerId]);
    expect(knop(container, /Stop/)).toBeUndefined();
    expect(knop(container, /Speel in browser/)).toBeDefined();
  });

  it('het spel stopt als de oplossing waar het in staat dichtklapt', () => {
    const { container } = render(
      <details open>
        <summary>Klik hier voor de oplossing.</summary>
        <InTab />
      </details>,
    );
    fireEvent.click(knop(container, /Speel in browser/) as HTMLButtonElement);
    gestopt.length = 0;

    const blok = container.querySelector('details') as HTMLDetailsElement;
    act(() => {
      blok.open = false;
      blok.dispatchEvent(new Event('toggle'));
    });
    expect(gestopt).toEqual([gestart[0].ownerId]);
    expect(knop(container, /Stop/)).toBeUndefined();
  });
});

describe('als er niets meer draait', () => {
  it('laat het veld na een fatale fout het spelvenster los', () => {
    // Start Pyodide niet, dan draait er niets. De knop Stop ging weg, maar
    // het spelvenster bleef over het vak hangen (het vak staat in een
    // tabblad altijd in de pagina), zonder knop om het weg te krijgen.
    const { container } = render(<InTab />);
    fireEvent.click(knop(container, /Speel in browser/) as HTMLButtonElement);
    expect(gestopt).toEqual([]);

    act(() => gestart[0].listeners.onError('Pyodide start niet', true));
    expect(gestopt).toEqual([gestart[0].ownerId]);
    expect(knop(container, /Stop/)).toBeUndefined();
    expect(container.textContent).toContain('Pyodide start niet');
  });

  it('blijft het spel staan na een gewone fout in de code', () => {
    const { container } = render(<InTab />);
    fireEvent.click(knop(container, /Speel in browser/) as HTMLButtonElement);
    act(() => gestart[0].listeners.onError('NameError', false));
    expect(gestopt).toEqual([]);
    expect(knop(container, /Stop/)).toBeDefined();
  });
});

describe('op een smal scherm', () => {
  it('blijft de code staan terwijl het spel draait', () => {
    // De build haalt het codeblok boven een speeltuin weg: de speeltuin toont
    // de code zelf. Onder 997 pixels verborg het veld zijn code zodra het
    // spel liep, en dan stond de code waar de volgende alinea over praat
    // nergens meer. Alleen een browser ziet de opmaak; hier staat vast dat
    // de regel die de code verborg, niet terugkomt. Nagekeken in Chromium op
    // 390 pixels breed: de code staat boven het spel.
    const css = readFileSync(
      join(process.cwd(), 'sites/informatica/play/src/components/PygbagRunner/styles.module.css'),
      'utf8',
    );
    const buitenMedia = css.slice(0, css.indexOf('@media (min-width: 997px)'));
    expect(buitenMedia).not.toMatch(/\.loopt \.codeKolom\s*\{[^}]*display:\s*none/);
    expect(css).not.toMatch(/\.codeKolom\s*\{[^}]*display:\s*none/);
  });
});

describe('een opdracht met een tip en een oplossing', () => {
  // Als uitklapblok onder het veld stond de oplossing met een tweede
  // speeltuin erin: twee velden op één scherm, en dat paste nergens. Nu staan
  // ze in het veld, op de plek van het spel.
  const OPLOSSING = "import play\n\nplay.new_circle(color='red')";
  const hulp = {
    tip: <p>Gebruik color.</p>,
    antwoord: <pre>{OPLOSSING}</pre>,
    naam: 'oplossing',
    code: OPLOSSING,
    tekens: 28,
  };
  const metHulp = () =>
    render(
      <PaneelContext.Provider value={() => {}}>
        <HulpContext.Provider value={hulp}>
          <PygbagRunner code={CODE} height={300} />
        </HulpContext.Provider>
      </PaneelContext.Provider>,
    );
  const vak = (container: HTMLElement, soort: string) =>
    container.querySelector(`[data-les-hulp="${soort}"]`) as HTMLElement;

  it('heeft de knoppen Spel, Tip en Oplossing, met de hulp dicht', () => {
    const { container } = metHulp();
    const knoppen = Array.from(container.querySelectorAll('[data-les-hulp-keuze] button'));
    expect(knoppen.map((k) => k.textContent)).toEqual(['Spel', 'Tip', 'Oplossing']);
    expect(vak(container, 'tip').hidden).toBe(true);
    expect(vak(container, 'antwoord').hidden).toBe(true);
  });

  it('de tip staat op de plek van het spel, en de code van de leerling blijft', () => {
    const { container } = metHulp();
    const code = container.querySelector('textarea') as HTMLTextAreaElement;
    fireEvent.click(knop(container, /^Tip$/) as HTMLButtonElement);

    expect(vak(container, 'tip').hidden).toBe(false);
    expect(vak(container, 'tip').textContent).toBe('Gebruik color.');
    expect(container.querySelector('textarea')).toBe(code);
  });

  it('Speel de oplossing speelt de oplossing, niet de code van de leerling', () => {
    const { container } = metHulp();
    const code = container.querySelector('textarea') as HTMLTextAreaElement;
    fireEvent.change(code, { target: { value: `${CODE}\nplay.new_box()` } });
    fireEvent.click(knop(container, /^Oplossing$/) as HTMLButtonElement);
    fireEvent.click(knop(container, /Speel de oplossing/) as HTMLButtonElement);

    expect(gestart).toHaveLength(1);
    expect(gestart[0].code).toContain("color='red'");
    expect(gestart[0].code).not.toContain('new_box');
    // Het spel staat weer voor, de console zegt wat er draait, en de code
    // van de leerling is niet aangeraakt.
    expect(vak(container, 'antwoord').hidden).toBe(true);
    expect(container.textContent).toContain('Dit is de oplossing van de les, niet jouw code.');
    expect((container.querySelector('textarea') as HTMLTextAreaElement).value).toContain(
      'play.new_box()',
    );
  });

  it('de knop heet Speel het antwoord waar de les het een antwoord noemt', () => {
    // Er stond "Speel de antwoord": de naam uit de les ging zo de zin in. Het
    // meetscript zoekt de knop op zijn naam en klikte hem daardoor nooit aan.
    const { container } = render(
      <PaneelContext.Provider value={() => {}}>
        <HulpContext.Provider value={{ ...hulp, naam: 'antwoord' }}>
          <PygbagRunner code={CODE} height={300} />
        </HulpContext.Provider>
      </PaneelContext.Provider>,
    );
    fireEvent.click(knop(container, /^Antwoord$/) as HTMLButtonElement);
    expect(knop(container, /Speel het antwoord$/)).toBeDefined();
    expect(knop(container, /Speel de antwoord/)).toBeUndefined();
  });

  it('Speel in browser speelt daarna weer de code van de leerling', () => {
    const { container } = metHulp();
    fireEvent.click(knop(container, /^Oplossing$/) as HTMLButtonElement);
    fireEvent.click(knop(container, /Speel de oplossing/) as HTMLButtonElement);
    fireEvent.click(knop(container, /Opnieuw spelen/) as HTMLButtonElement);

    expect(gestart).toHaveLength(2);
    expect(gestart[1].code).not.toContain("color='red'");
    expect(container.textContent).not.toContain('Dit is de oplossing van de les');
  });
});

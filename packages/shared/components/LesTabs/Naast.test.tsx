// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { useEffect } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BREED, LesNaast, LesNaastPlek, naastVan } from './Naast';
import LesTabs, { LesStap, LesStappen, LesTab } from './index';

// react-dom/server en /client hebben hier geen types (zie Voorspel/logica.test.ts).
const { renderToString } = (await import('react-dom/server' as string)) as {
  renderToString: (el: React.ReactElement) => string;
};
const { hydrateRoot } = (await import('react-dom/client' as string)) as {
  hydrateRoot: (houder: Element, el: React.ReactElement) => { unmount: () => void };
};

// Een oefenveld naast de les (de oefenterminal van Linux). Wat niet stil mag
// veranderen: het veld van de hele les staat bij elk tabblad, het verhuist
// zonder opnieuw te mounten (dan was het werk van de leerling weg), en het
// veld van één tabblad is in de kolom alleen te zien zolang dat tabblad open
// is.
// Of de kolom naast de tekst staat en op het scherm past, ziet alleen een
// browser: scripts/meet-les-tabs.mjs telt de kolom mee. De opmaak zelf
// bewaakt les-tabs.test.ts.

let locatie = { pathname: '/les', hash: '', search: '' };
vi.mock('@docusaurus/router', () => ({ useLocation: () => locatie }));

let breed = true;
const luisteraars = new Set<() => void>();
beforeEach(() => {
  locatie = { pathname: '/les', hash: '', search: '' };
  breed = true;
  luisteraars.clear();
  Element.prototype.scrollIntoView = vi.fn();
  vi.stubGlobal('CSS', { escape: (s: string) => s });
  vi.stubGlobal('matchMedia', (vraag: string) => ({
    get matches() {
      return vraag === BREED ? breed : false;
    },
    addEventListener: (_: string, f: () => void) => luisteraars.add(f),
    removeEventListener: (_: string, f: () => void) => luisteraars.delete(f),
  }));
  window.history.replaceState(null, '', '/les');
});
afterEach(cleanup);

const maakSmal = (smal: boolean) =>
  act(() => {
    breed = !smal;
    for (const f of luisteraars) f();
  });

const mounts: Record<string, number> = {};
function Veld({ naam }: { naam: string }) {
  useEffect(() => {
    mounts[naam] = (mounts[naam] ?? 0) + 1;
  }, [naam]);
  return <textarea aria-label={naam} />;
}

function Les() {
  return (
    <LesTabs>
      <LesTab id="uitleg" titel="Uitleg" label="Uitleg">
        <LesStappen>
          <LesStap id="uitleg-basis" titel="De basis" label="De basis">
            <p>Typ mee.</p>
            <LesNaast heleLes>
              <Veld naam="les" />
            </LesNaast>
          </LesStap>
          <LesStap id="verder" titel="Verder" label="Verder">
            <h3 id="verder">Verder</h3>
          </LesStap>
        </LesStappen>
      </LesTab>
      <LesTab id="opdracht" titel="Opdracht 1.1.a" label="Opdracht 1.1.a">
        <h2 id="opdracht">Opdracht 1.1.a</h2>
        <LesNaast>
          <Veld naam="opdracht" />
        </LesNaast>
        <p>Tip.</p>
      </LesTab>
      <LesTab id="mis" titel="Er gaat iets mis" label="Er gaat iets mis">
        <h2 id="mis">Er gaat iets mis</h2>
      </LesTab>
    </LesTabs>
  );
}

function LesMetVeldInStap() {
  return (
    <LesTabs>
      <LesTab id="uitleg" titel="Uitleg" label="Uitleg">
        <LesNaast heleLes>
          <Veld naam="les" />
        </LesNaast>
      </LesTab>
      <LesTab id="opdrachten" titel="Opdrachten" label="Opdrachten">
        <LesStappen>
          <LesStap id="lezen" titel="Lezen" label="Lezen">
            <p>Lees eerst.</p>
          </LesStap>
          <LesStap id="doen" titel="Doen" label="Doen">
            <LesNaast>
              <Veld naam="opdracht" />
            </LesNaast>
          </LesStap>
        </LesStappen>
      </LesTab>
    </LesTabs>
  );
}

const kolom = () => document.querySelector('[data-les-naast]') as HTMLElement;
const inKolom = (naam: string) => kolom().contains(screen.getByLabelText(naam));
const paneel = (id: string) => document.getElementById(`paneel-${id}`) as HTMLElement;

describe('LesNaast', () => {
  beforeEach(() => {
    for (const k of Object.keys(mounts)) delete mounts[k];
  });

  it('de kolom is het laatste kind van de wortel, en leeg zonder veld', () => {
    render(
      <LesTabs>
        <LesTab id="a" titel="A" label="A">
          <p>a</p>
        </LesTab>
        <LesTab id="b" titel="B" label="B">
          <p>b</p>
        </LesTab>
      </LesTabs>,
    );
    const wortel = document.querySelector('[data-les-tabs]') as HTMLElement;
    expect(naastVan(wortel.querySelector('p'))).toBe(kolom());
    expect(kolom().parentElement).toBe(wortel);
    expect(kolom().childElementCount).toBe(0);
  });

  it('het veld van de hele les staat in de kolom, bij elk tabblad en elke stap', () => {
    render(<Les />);
    expect(inKolom('les')).toBe(true);
    fireEvent.click(screen.getByRole('tab', { name: /Verder/ }));
    expect(inKolom('les')).toBe(true);
    fireEvent.click(screen.getByRole('tab', { name: 'Er gaat iets mis' }));
    expect(inKolom('les')).toBe(true);
    // Het staat dus niet in een paneel dat dicht is.
    expect(paneel('uitleg').contains(screen.getByLabelText('les'))).toBe(false);
  });

  it('het veld van een tabblad is in de kolom alleen te zien zolang dat tabblad open is', () => {
    render(<Les />);
    const gast = screen.getByLabelText('opdracht').parentElement as HTMLElement;
    expect(inKolom('opdracht')).toBe(true);
    expect(gast.hidden).toBe(true);
    fireEvent.click(screen.getByRole('tab', { name: 'Opdracht 1.1.a' }));
    expect(gast.hidden).toBe(false);
    fireEvent.click(screen.getByRole('tab', { name: 'Er gaat iets mis' }));
    expect(gast.hidden).toBe(true);
  });

  it('een wissel van tabblad haalt het veld niet uit het document', () => {
    // Een element dat uit het document gaat en er weer in komt, is zijn
    // schuifpositie kwijt: de terminal van een opdracht stond na elke wissel
    // bovenaan, en terugschuiven kon pas weer na een nieuw commando. Het veld
    // blijft dus in de kolom staan en is `hidden`; dan bewaart de browser de
    // positie. Dat laatste is browsergedrag: nagemeten in Chromium (30 regels
    // getypt, wisselen en terug, scrollTop gelijk).
    render(<Les />);
    const gast = screen.getByLabelText('opdracht').parentElement as HTMLElement;
    const erin = vi.spyOn(kolom(), 'appendChild');
    const eruit = vi.spyOn(gast, 'remove');
    for (const naam of ['Opdracht 1.1.a', 'Er gaat iets mis', 'Uitleg', 'Opdracht 1.1.a'])
      fireEvent.click(screen.getByRole('tab', { name: naam }));
    expect(erin).not.toHaveBeenCalled();
    expect(eruit).not.toHaveBeenCalled();
    expect(gast.parentElement).toBe(kolom());
  });

  it('een veld mount één keer, hoe vaak het ook verhuist', () => {
    render(<Les />);
    for (const naam of ['Opdracht 1.1.a', 'Er gaat iets mis', 'Uitleg', 'Opdracht 1.1.a'])
      fireEvent.click(screen.getByRole('tab', { name: naam }));
    maakSmal(true);
    maakSmal(false);
    expect(mounts).toEqual({ les: 1, opdracht: 1 });
  });

  it('wat de leerling typte, verhuist mee', () => {
    render(<Les />);
    fireEvent.click(screen.getByRole('tab', { name: 'Opdracht 1.1.a' }));
    fireEvent.change(screen.getByLabelText('opdracht'), { target: { value: 'cd /var' } });
    fireEvent.click(screen.getByRole('tab', { name: 'Uitleg' }));
    fireEvent.click(screen.getByRole('tab', { name: 'Opdracht 1.1.a' }));
    expect((screen.getByLabelText('opdracht') as HTMLTextAreaElement).value).toBe('cd /var');
  });

  it('op een smal scherm staat het veld van een tabblad op zijn plek in de tekst', () => {
    render(<Les />);
    fireEvent.click(screen.getByRole('tab', { name: 'Opdracht 1.1.a' }));
    maakSmal(true);
    expect(inKolom('opdracht')).toBe(false);
    // Tussen de kop en de tip, waar de bron het heeft.
    const anker = paneel('opdracht').querySelector('[data-les-naast-anker="veld"]');
    expect(anker?.contains(screen.getByLabelText('opdracht'))).toBe(true);
    expect(anker?.previousElementSibling?.tagName).toBe('H2');
    // Het veld van de hele les blijft in de kolom: die staat daar onder de tekst.
    expect(inKolom('les')).toBe(true);
  });

  it('het anker van een eigen veld zegt of zijn scherm open is: daaraan ziet de opmaak het', () => {
    // De opmaak verbergt het veld van de hele les zolang er een eigen veld
    // open staat. Eerst keek ze naar een anker in het open tabblad, ook als
    // dat anker in een stap stond die dicht was: de kolom was dan leeg.
    render(<LesMetVeldInStap />);
    const anker = () => document.querySelector('[data-les-naast-anker="veld"]') as HTMLElement;
    expect(anker().hasAttribute('data-les-naast-open')).toBe(false);
    fireEvent.click(screen.getByRole('tab', { name: 'Opdrachten' }));
    // Het tabblad is open, de stap met het veld nog niet.
    expect(anker().closest('[data-les-tab]')?.hasAttribute('hidden')).toBe(false);
    expect(anker().hasAttribute('data-les-naast-open')).toBe(false);
    fireEvent.click(screen.getByRole('tab', { name: /Doen/ }));
    expect(anker().hasAttribute('data-les-naast-open')).toBe(true);
    expect(kolom().querySelector('[data-les-naast-gast="les"]')).not.toBeNull();
    expect(kolom().querySelector('[data-les-naast-gast="veld"]')).not.toBeNull();
  });

  it('wie in het veld typt, typt door als het veld verhuist', () => {
    render(<Les />);
    fireEvent.click(screen.getByRole('tab', { name: 'Opdracht 1.1.a' }));
    const veld = screen.getByLabelText('opdracht');
    veld.focus();
    maakSmal(true);
    expect(document.activeElement).toBe(veld);
    maakSmal(false);
    expect(document.activeElement).toBe(veld);
  });

  it('een veld dat in de HTML van de build staat, hydrateert zonder fout', () => {
    // De kolom wordt met een portal gevuld, en een portal staat niet in de
    // HTML van de build. Een veld buiten <BrowserOnly> gaf daardoor een
    // hydratatiefout. Het staat nu eerst op zijn plek, en verhuist daarna.
    const fouten = vi.spyOn(console, 'error').mockImplementation(() => {});
    const houder = document.createElement('div');
    document.body.appendChild(houder);
    try {
      houder.innerHTML = renderToString(<Les />);
      expect(houder.querySelector('[data-les-naast-anker]')).toBeNull();
      expect(houder.querySelector('[aria-label="les"]')).not.toBeNull();
      let wortel: ReturnType<typeof hydrateRoot> | undefined;
      act(() => {
        wortel = hydrateRoot(houder, <Les />);
      });
      expect(fouten).not.toHaveBeenCalled();
      const naast = houder.querySelector('[data-les-naast]') as HTMLElement;
      expect(naast.contains(houder.querySelector('[aria-label="les"]'))).toBe(true);
      act(() => wortel?.unmount());
    } finally {
      houder.remove();
      fouten.mockRestore();
    }
  });

  it('de plek van een veld dat nog moet komen, staat al in de HTML van de build', () => {
    // De terminal van Linux bestaat pas in de browser. Zonder dit anker stond
    // de tekst eerst over de volle breedte en versprong hij als de terminal
    // er kwam (in Chromium: een layout shift van 0,099 op les 1.1).
    const html = renderToString(
      <LesTabs>
        <LesTab id="a" titel="A" label="A">
          <LesNaastPlek heleLes />
        </LesTab>
        <LesTab id="b" titel="B" label="B">
          <p>b</p>
        </LesTab>
      </LesTabs>,
    );
    expect(html).toMatch(/data-les-naast-anker="les"/);
    // Buiten een tabblad is er geen kolom om vrij te houden.
    expect(renderToString(<LesNaastPlek heleLes />)).toBe('');
  });

  it('buiten een tabblad staat het veld gewoon op zijn plek', () => {
    const { container } = render(
      <div>
        <LesNaast heleLes>
          <Veld naam="los" />
        </LesNaast>
      </div>,
    );
    expect(container.querySelector('[data-les-naast-anker]')).toBeNull();
    expect(container.firstElementChild?.firstElementChild).toBe(screen.getByLabelText('los'));
  });

  it('ruimt zijn element op als het veld verdwijnt', () => {
    const { unmount } = render(<Les />);
    const k = kolom();
    expect(k.childElementCount).toBe(2);
    unmount();
    expect(k.childElementCount).toBe(0);
  });
});

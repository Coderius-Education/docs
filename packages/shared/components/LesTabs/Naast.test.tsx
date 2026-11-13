// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { useEffect } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BREED, LesNaast, naastVan } from './Naast';
import LesTabs, { LesStap, LesStappen, LesTab } from './index';

// Een oefenveld naast de les (de oefenterminal van Linux). Wat niet stil mag
// veranderen: het veld van de hele les staat bij elk tabblad, het verhuist
// zonder opnieuw te mounten (dan was het werk van de leerling weg), en het
// veld van één tabblad staat alleen in de kolom zolang dat tabblad open is.
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

  it('het veld van een tabblad staat alleen in de kolom zolang dat tabblad open is', () => {
    render(<Les />);
    expect(inKolom('opdracht')).toBe(false);
    expect(paneel('opdracht').contains(screen.getByLabelText('opdracht'))).toBe(true);
    fireEvent.click(screen.getByRole('tab', { name: 'Opdracht 1.1.a' }));
    expect(inKolom('opdracht')).toBe(true);
    fireEvent.click(screen.getByRole('tab', { name: 'Er gaat iets mis' }));
    expect(inKolom('opdracht')).toBe(false);
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

  it('het anker van een eigen veld blijft in zijn paneel: daaraan ziet de opmaak het', () => {
    render(<Les />);
    fireEvent.click(screen.getByRole('tab', { name: 'Opdracht 1.1.a' }));
    expect(paneel('opdracht').querySelector('[data-les-naast-anker="veld"]')).not.toBeNull();
    expect(kolom().querySelector('[data-les-naast-gast="les"]')).not.toBeNull();
    expect(kolom().querySelector('[data-les-naast-gast="veld"]')).not.toBeNull();
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
    expect(k.childElementCount).toBe(1);
    unmount();
    expect(k.childElementCount).toBe(0);
  });
});

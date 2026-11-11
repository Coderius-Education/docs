// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { useEffect } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import LesTabs, { LesTab } from './index';

// react-dom/server heeft hier geen types (zie Voorspel/logica.test.ts).
const { renderToStaticMarkup } = (await import('react-dom/server' as string)) as {
  renderToStaticMarkup: (el: React.ReactElement) => string;
};

// De les-tabbladen op de pagina. Twee dingen mogen nooit stil veranderen:
// elk paneel blijft gemount en staat in de HTML van de build (een oefenveld
// dat opnieuw mount raakt zijn werk kwijt, en een link naar een kop zoekt
// zijn doel in de HTML), en een link naar een kop in een ander tabblad opent
// dat tabblad (Docusaurus scrolt niet naar een verborgen kop).

let locatie = { pathname: '/les', hash: '', search: '' };
vi.mock('@docusaurus/router', () => ({ useLocation: () => locatie }));

const scrol = vi.fn();
beforeEach(() => {
  locatie = { pathname: '/les', hash: '', search: '' };
  scrol.mockClear();
  Element.prototype.scrollIntoView = scrol;
  // jsdom kent CSS.escape niet; de id's hier hebben geen bijzondere tekens.
  vi.stubGlobal('CSS', { escape: (s: string) => s });
  window.history.replaceState(null, '', '/les');
});
afterEach(cleanup);

let mounts = 0;
function Veld() {
  useEffect(() => {
    mounts++;
  }, []);
  return <textarea aria-label="oefenveld" />;
}

function Les() {
  return (
    <LesTabs>
      <LesTab id="theorie" titel="Theorie" label="Theorie">
        <h2 id="theorie">Theorie</h2>
        <p>Uitleg.</p>
      </LesTab>
      <LesTab id="opdracht-1-tel" titel="Opdracht 1: Tel" label="Opdracht 1">
        <h2 id="opdracht-1-tel">Opdracht 1: Tel</h2>
        <Veld />
      </LesTab>
      <LesTab id="er-gaat-iets-mis" titel="Er gaat iets mis" label="Er gaat iets mis">
        <h2 id="er-gaat-iets-mis">Er gaat iets mis</h2>
        <h3 id="een-fout">Een fout</h3>
      </LesTab>
    </LesTabs>
  );
}

const actief = () => screen.getByRole('tab', { selected: true }).textContent;
const paneel = (id: string) => document.getElementById(`paneel-${id}`) as HTMLElement;

describe('LesTabs', () => {
  it('zet elk paneel in de HTML van de build, en toont alleen het eerste', () => {
    const html = renderToStaticMarkup(<Les />);
    for (const id of ['theorie', 'opdracht-1-tel', 'er-gaat-iets-mis', 'een-fout'])
      expect(html).toContain(`id="${id}"`);
    expect(html.match(/role="tabpanel"/g)).toHaveLength(3);
    expect(html.match(/role="tabpanel"[^>]*hidden=""/g)).toHaveLength(2);
    expect(html).toContain('data-les-tabs');
  });

  it('toont het label op het tabblad en de hele kop als titel', () => {
    render(<Les />);
    expect(screen.getAllByRole('tab').map((t) => t.textContent)).toEqual([
      'Theorie',
      'Opdracht 1',
      'Er gaat iets mis',
    ]);
    expect(screen.getByRole('tab', { name: 'Opdracht 1' }).getAttribute('title')).toBe(
      'Opdracht 1: Tel',
    );
  });

  it('wisselt van paneel zonder een veld opnieuw te mounten', () => {
    mounts = 0;
    render(<Les />);
    expect(paneel('opdracht-1-tel').hidden).toBe(true);
    fireEvent.click(screen.getByRole('tab', { name: 'Opdracht 1' }));
    expect(paneel('opdracht-1-tel').hidden).toBe(false);
    expect(paneel('theorie').hidden).toBe(true);
    fireEvent.click(screen.getByRole('tab', { name: 'Theorie' }));
    fireEvent.click(screen.getByRole('tab', { name: 'Opdracht 1' }));
    // Eén keer, bij het laden van de pagina: ook toen het paneel verborgen was.
    expect(mounts).toBe(1);
  });

  it('zet het adres van het tabblad in de adresbalk', () => {
    render(<Les />);
    fireEvent.click(screen.getByRole('tab', { name: 'Opdracht 1' }));
    expect(window.location.hash).toBe('#opdracht-1-tel');
  });

  it('opent bij het laden het paneel waarin het doel van de link staat, en scrolt ernaartoe', () => {
    locatie = { pathname: '/les', hash: '#een-fout', search: '' };
    render(<Les />);
    expect(actief()).toBe('Er gaat iets mis');
    expect(paneel('er-gaat-iets-mis').hidden).toBe(false);
    expect(scrol.mock.instances.at(-1)).toBe(document.getElementById('een-fout'));
  });

  it('scrolt niet naar de kop van het tabblad zelf', () => {
    locatie = { pathname: '/les', hash: '#opdracht-1-tel', search: '' };
    render(<Les />);
    expect(actief()).toBe('Opdracht 1');
    expect(scrol).not.toHaveBeenCalled();
  });

  it('volgt een link op de pagina, ook een tweede keer naar hetzelfde doel', () => {
    const { rerender } = render(<Les />);
    locatie = { pathname: '/les', hash: '#een-fout', search: '' };
    rerender(<Les />);
    expect(actief()).toBe('Er gaat iets mis');
    fireEvent.click(screen.getByRole('tab', { name: 'Theorie' }));
    expect(actief()).toBe('Theorie');
    // Dezelfde hash, een nieuwe navigatie: de router geeft een nieuw object.
    locatie = { pathname: '/les', hash: '#een-fout', search: '' };
    rerender(<Les />);
    expect(actief()).toBe('Er gaat iets mis');
  });

  it('laat een hash die niet in de les staat met rust', () => {
    locatie = { pathname: '/les', hash: '#bestaat-niet', search: '' };
    render(<Les />);
    expect(actief()).toBe('Theorie');
  });

  it('loopt met de pijltjes, Home en End langs de tabbladen', () => {
    render(<Les />);
    const lijst = screen.getByRole('tablist');
    fireEvent.keyDown(lijst, { key: 'ArrowRight' });
    expect(actief()).toBe('Opdracht 1');
    expect(document.activeElement).toBe(screen.getByRole('tab', { name: 'Opdracht 1' }));
    fireEvent.keyDown(lijst, { key: 'End' });
    expect(actief()).toBe('Er gaat iets mis');
    fireEvent.keyDown(lijst, { key: 'ArrowRight' });
    expect(actief()).toBe('Theorie');
    fireEvent.keyDown(lijst, { key: 'ArrowLeft' });
    expect(actief()).toBe('Er gaat iets mis');
    fireEvent.keyDown(lijst, { key: 'Home' });
    expect(actief()).toBe('Theorie');
  });

  it('heeft onderaan elk paneel een knop naar het volgende, behalve het laatste', () => {
    render(<Les />);
    fireEvent.click(screen.getByRole('button', { name: 'Volgende: Opdracht 1' }));
    expect(actief()).toBe('Opdracht 1');
    expect(paneel('er-gaat-iets-mis').querySelector('button')).toBeNull();
  });
});

describe('LesTab zonder LesTabs', () => {
  it('staat gewoon open', () => {
    render(
      <LesTab id="los" titel="Los" label="Los">
        <p>inhoud</p>
      </LesTab>,
    );
    expect(paneel('los').hidden).toBe(false);
  });
});

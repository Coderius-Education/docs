// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { BOUWSTENEN, bouwsteenMetId } from './bouwstenen';

// Het voorbeeld van een bouwsteen, naast de code van de leerling. jsdom heeft
// geen opmaak: of het voorbeeld naast de code past en hoe de gemarkeerde
// regels eruitzien, is in Chromium nagekeken.

vi.mock('@docusaurus/useBaseUrl', () => ({
  useBaseUrlUtils: () => ({ withBaseUrl: (pad: string) => `/robotica${pad}` }),
}));
const { default: Voorbeeld, bronVan } = await import('./Voorbeeld');

afterEach(cleanup);

const steen = (id: string) => {
  const b = bouwsteenMetId(id);
  if (!b) throw new Error(`geen bouwsteen ${id}`);
  return b;
};

const toon = (id: string, onSluit = () => {}) =>
  render(<Voorbeeld bouwsteen={steen(id)} donker={false} onSluit={onSluit} />);

describe('Voorbeeld', () => {
  it('toont het hele programma, met de kernregels gemarkeerd', () => {
    const { container } = toon('herhaal-keer');
    const regels = Array.from(container.querySelectorAll('.cm-line'));
    expect(regels.map((r) => r.textContent)).toEqual([
      'teller = 0',
      'while teller < 3:',
      '    print("Hallo")',
      '    teller = teller + 1',
    ]);
    expect(regels.map((r) => r.classList.contains('cm-kern'))).toEqual([true, true, false, true]);
  });

  it('de code is te lezen en te selecteren, niet te bewerken', () => {
    const { container } = toon('lampje');
    expect(container.querySelector('.cm-content')?.getAttribute('contenteditable')).toBe('false');
  });

  it('heeft geen knop die de code in het programma zet', () => {
    // De opdrachtgever: "ik wil niet dat de code wordt ingevuld".
    toon('afstand-tof');
    expect(screen.getAllByRole('button').map((k) => k.getAttribute('aria-label'))).toEqual([
      'Sluit het voorbeeld',
    ]);
  });

  it('zet code in de uitleg tussen code-tekens', () => {
    const { container } = toon('herhaal-altijd');
    const uitleg = container.querySelector('p');
    expect(uitleg?.textContent).toBe(steen('herhaal-altijd').uitleg.replace(/`/g, ''));
    expect(Array.from(uitleg?.querySelectorAll('code') ?? []).map((c) => c.textContent)).toEqual([
      'while True:',
    ]);
  });

  it('linkt naar de lessen in een nieuw tabblad, met het adres uit de registry', () => {
    toon('herhaal-altijd');
    const links = screen.getAllByRole('link');
    expect(links.map((a) => a.textContent)).toEqual([
      'Deel 2: Knipperen met een loop',
      'De while-loop',
    ]);
    // Binnen robotica met de baseUrl ervoor.
    expect(links[0].getAttribute('href')).toBe('/robotica/lego_auto/eerste-programma/knipperen');
    // Naar de python-cursus: het adres komt uit de registry, niet uit de bron.
    expect(links[1].getAttribute('href')).toMatch(/\/python\/docs\/herhalen\/while-loop\/?$/);
    // Een nieuw tabblad: in hetzelfde tabblad is de editor met de code weg.
    for (const a of links) expect(a.getAttribute('target')).toBe('_blank');
  });

  it('zegt bij elke link waar hij heen gaat', () => {
    expect(bronVan({ label: '', naar: '/lego_auto/afstand/uitlezen' })).toBe('Lego-auto');
    expect(bronVan({ label: '', naar: '/docs/onderdelen/tof' })).toBe('Onderdelen');
    expect(bronVan({ label: '', site: 'python', naar: '/docs/herhalen/while-loop' })).toBe(
      'Python-cursus',
    );
    for (const b of BOUWSTENEN)
      for (const link of b.links)
        expect(bronVan(link), `${b.id}: ${link.naar}`).not.toBe('Robotica');
  });

  it('sluit met de knop', () => {
    const onSluit = vi.fn();
    toon('servo', onSluit);
    fireEvent.click(screen.getByRole('button', { name: 'Sluit het voorbeeld' }));
    expect(onSluit).toHaveBeenCalledTimes(1);
  });

  it('elke bouwsteen tekent zonder fout', () => {
    for (const b of BOUWSTENEN) {
      const { container, unmount } = render(<Voorbeeld bouwsteen={b} donker onSluit={() => {}} />);
      expect(container.querySelectorAll('.cm-kern').length, b.id).toBeGreaterThan(0);
      unmount();
    }
  });
});

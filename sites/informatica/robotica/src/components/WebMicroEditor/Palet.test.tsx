// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { GROEPEN, SLEEP_TYPE } from './bouwstenen';

// Het palet links in de editor. Waar een bouwsteen in de code terechtkomt,
// staat in invoegen.test.ts; hier gaat het om het paneel: de groepen, de klik
// en wat een gesleepte bouwsteen meedraagt. Dat de code na een klik of na het
// loslaten in de editor staat, ziet alleen een browser; dat is in Chromium
// nagespeeld (klikken, typen, Ctrl+Z, slepen naar een regel).

vi.mock('@docusaurus/useBaseUrl', () => ({
  useBaseUrlUtils: () => ({ withBaseUrl: (pad: string) => `/robotica${pad}` }),
}));
const { default: Palet } = await import('./Palet');

afterEach(cleanup);

const kop = (naam: string) => screen.getByRole('button', { name: naam });

describe('Palet', () => {
  it('toont de drie groepen, met de eerste open', () => {
    render(<Palet onKies={() => {}} />);
    expect(kop('Sensoren').getAttribute('aria-expanded')).toBe('true');
    expect(kop('Actuatoren').getAttribute('aria-expanded')).toBe('false');
    expect(kop('Python').getAttribute('aria-expanded')).toBe('false');
    expect(screen.getByRole('button', { name: 'Afstand (TOF)' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Herhaal voor altijd' })).toBeNull();
  });

  it('heeft één groep tegelijk open, zodat de lijst in het paneel past', () => {
    render(<Palet onKies={() => {}} />);
    fireEvent.click(kop('Python'));
    expect(kop('Python').getAttribute('aria-expanded')).toBe('true');
    expect(kop('Sensoren').getAttribute('aria-expanded')).toBe('false');
    expect(screen.getByRole('button', { name: 'Herhaal als' })).toBeTruthy();
    fireEvent.click(kop('Python'));
    expect(kop('Python').getAttribute('aria-expanded')).toBe('false');
  });

  it('elke bouwsteen staat in de HTML, ook in een groep die dicht is', () => {
    const { container } = render(<Palet onKies={() => {}} />);
    const aantal = GROEPEN.reduce((som, g) => som + g.bouwstenen.length, 0);
    expect(container.querySelectorAll('[data-bouwsteen]')).toHaveLength(aantal);
  });

  it('een klik geeft de bouwsteen door', () => {
    const onKies = vi.fn();
    render(<Palet onKies={onKies} />);
    fireEvent.click(screen.getByRole('button', { name: 'Afstand (TOF)' }));
    expect(onKies).toHaveBeenCalledTimes(1);
    expect(onKies.mock.calls[0][0].id).toBe('afstand-tof');
  });

  it('een gesleepte bouwsteen draagt zijn id mee, niet zijn code', () => {
    render(<Palet onKies={() => {}} />);
    const gezet: Record<string, string> = {};
    const dataTransfer = {
      setData: (soort: string, waarde: string) => {
        gezet[soort] = waarde;
      },
      effectAllowed: '',
    };
    const knop = screen.getByRole('button', { name: 'Drukknop' });
    expect(knop.getAttribute('draggable')).toBe('true');
    fireEvent.dragStart(knop, { dataTransfer });
    // Zonder text/plain: losgelaten in de shell of een ander tekstveld
    // gebeurt er niets, in plaats van een regel code zonder import.
    expect(gezet).toEqual({ [SLEEP_TYPE]: 'drukknop' });
    expect(dataTransfer.effectAllowed).toBe('copy');
  });

  it('laat in de tooltip de code zien, met puntjes voor het gat', () => {
    render(<Palet onKies={() => {}} />);
    fireEvent.click(kop('Python'));
    expect(screen.getByRole('button', { name: 'Herhaal voor altijd' }).getAttribute('title')).toBe(
      'Zet in je code:\nwhile True:\n    ...',
    );
  });

  it('een onderdeel linkt naar zijn les, in een nieuw tabblad en met de baseUrl', () => {
    render(<Palet onKies={() => {}} />);
    const link = screen.getByRole('link', { name: /Uitleg bij Afstand \(TOF\)/ });
    expect(link.getAttribute('href')).toBe('/robotica/docs/onderdelen/tof');
    // Een nieuw tabblad: in hetzelfde tabblad sluit een herlaad de seriële poort.
    expect(link.getAttribute('target')).toBe('_blank');
  });
});

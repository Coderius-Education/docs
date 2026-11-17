// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { GROEPEN, SLEEP_TYPE } from './bouwstenen';

// Het palet links in de editor. Waar een bouwsteen in de code terechtkomt,
// staat in invoegen.test.ts; hier gaat het om het paneel: de groepen, de klik,
// het toetsenbord en wat een gesleepte bouwsteen meedraagt. Dat de code na
// een klik of na het loslaten in de editor staat, ziet alleen een browser;
// dat is in Chromium nagespeeld.

vi.mock('@docusaurus/useBaseUrl', () => ({
  useBaseUrlUtils: () => ({ withBaseUrl: (pad: string) => `/robotica${pad}` }),
}));
const { default: Palet } = await import('./Palet');

afterEach(() => {
  cleanup();
  localStorage.clear();
});

const kop = (naam: string) => screen.getByRole('button', { name: naam });

describe('Palet', () => {
  it('toont de drie groepen, met de eerste open', () => {
    render(<Palet onKies={() => {}} />);
    expect(kop('Sensoren').getAttribute('aria-expanded')).toBe('true');
    expect(kop('Actuatoren').getAttribute('aria-expanded')).toBe('false');
    expect(kop('Python').getAttribute('aria-expanded')).toBe('false');
    expect(screen.getByRole('button', { name: 'Afstand in mm (TOF)' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Herhaal voor altijd' })).toBeNull();
  });

  it('heeft één groep tegelijk open, zodat de lijst in het paneel past', () => {
    render(<Palet onKies={() => {}} />);
    fireEvent.click(kop('Python'));
    expect(kop('Python').getAttribute('aria-expanded')).toBe('true');
    expect(kop('Sensoren').getAttribute('aria-expanded')).toBe('false');
    expect(screen.getByRole('button', { name: 'Herhaal zolang' })).toBeTruthy();
    fireEvent.click(kop('Python'));
    expect(kop('Python').getAttribute('aria-expanded')).toBe('false');
  });

  it('onthoudt welke groep open stond, ook als ze allemaal dicht waren', () => {
    // Na herladen, en na Bestanden op board, stond Sensoren steeds weer open.
    const eerste = render(<Palet onKies={() => {}} />);
    fireEvent.click(kop('Python'));
    eerste.unmount();
    const tweede = render(<Palet onKies={() => {}} />);
    expect(kop('Python').getAttribute('aria-expanded')).toBe('true');
    fireEvent.click(kop('Python'));
    tweede.unmount();
    render(<Palet onKies={() => {}} />);
    for (const g of GROEPEN) expect(kop(g.label).getAttribute('aria-expanded')).toBe('false');
  });

  it('elke bouwsteen staat in de HTML, ook in een groep die dicht is', () => {
    const { container } = render(<Palet onKies={() => {}} />);
    const aantal = GROEPEN.reduce((som, g) => som + g.bouwstenen.length, 0);
    expect(container.querySelectorAll('[data-bouwsteen]')).toHaveLength(aantal);
  });

  it('een klik geeft de bouwsteen door', () => {
    const onKies = vi.fn();
    render(<Palet onKies={onKies} />);
    fireEvent.click(screen.getByRole('button', { name: 'Afstand in mm (TOF)' }));
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

  it('laat in de tooltip de code zien, en wat er bovenaan bijkomt', () => {
    render(<Palet onKies={() => {}} />);
    // De import en de aanmaakregel komen in een lang programma buiten beeld.
    expect(screen.getByRole('button', { name: 'Drukknop' }).getAttribute('title')).toBe(
      [
        'Zet in je code:',
        'ingedrukt = knop.value() == 0',
        '',
        'Bovenaan, één keer:',
        'from machine import Pin',
        'knop = Pin("D7", Pin.IN, Pin.PULL_UP)',
      ].join('\n'),
    );
    fireEvent.click(kop('Python'));
    expect(screen.getByRole('button', { name: 'Herhaal voor altijd' }).getAttribute('title')).toBe(
      'Zet in je code:\nwhile True:\n    ...',
    );
  });

  it('een onderdeel linkt naar zijn les, in een nieuw tabblad en met de baseUrl', () => {
    render(<Palet onKies={() => {}} />);
    const link = screen.getByRole('link', { name: /Uitleg bij Afstand in mm \(TOF\)/ });
    expect(link.getAttribute('href')).toBe('/robotica/docs/onderdelen/tof');
    // Een nieuw tabblad: in hetzelfde tabblad sluit een herlaad de seriële poort.
    expect(link.getAttribute('target')).toBe('_blank');
  });

  describe('met het toetsenbord', () => {
    const stops = (container: HTMLElement) =>
      Array.from(container.querySelectorAll<HTMLElement>('[data-palet-item]')).filter(
        (el) => el.tabIndex === 0,
      );

    it('is het palet één stop in de Tab-volgorde', () => {
      const { container } = render(<Palet onKies={() => {}} />);
      expect(stops(container)).toEqual([kop('Sensoren')]);
    });

    it('lopen de pijltjes door wat er te zien is, rond en met Home en End', () => {
      const { container } = render(<Palet onKies={() => {}} />);
      const palet = container.querySelector('[data-bouwstenen]') as HTMLElement;
      act(() => kop('Sensoren').focus());
      fireEvent.keyDown(palet, { key: 'ArrowDown' });
      expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Lijnsensor links' }));
      fireEvent.keyDown(palet, { key: 'ArrowDown' });
      expect(document.activeElement?.getAttribute('aria-label')).toMatch(
        /Uitleg bij Lijnsensor links/,
      );
      fireEvent.keyDown(palet, { key: 'End' });
      // De bouwstenen van een dichte groep doen niet mee.
      expect(document.activeElement).toBe(kop('Python'));
      fireEvent.keyDown(palet, { key: 'ArrowDown' });
      expect(document.activeElement).toBe(kop('Sensoren'));
      fireEvent.keyDown(palet, { key: 'ArrowUp' });
      expect(document.activeElement).toBe(kop('Python'));
      fireEvent.keyDown(palet, { key: 'Home' });
      expect(document.activeElement).toBe(kop('Sensoren'));
    });

    it('blijft de bouwsteen van net de stop, zodat Shift+Tab daar terugkomt', () => {
      // Eerst kwam je vanuit de code op het laatste element van het palet uit.
      const { container } = render(<Palet onKies={() => {}} />);
      const knop = screen.getByRole('button', { name: 'Drukknop' });
      act(() => knop.focus());
      fireEvent.click(knop);
      expect(stops(container)).toEqual([knop]);
    });

    it('wordt de kop de stop als zijn groep dichtgaat', () => {
      const { container } = render(<Palet onKies={() => {}} />);
      act(() => screen.getByRole('button', { name: 'Drukknop' }).focus());
      fireEvent.click(kop('Python'));
      expect(stops(container)).toEqual([kop('Python')]);
    });
  });
});

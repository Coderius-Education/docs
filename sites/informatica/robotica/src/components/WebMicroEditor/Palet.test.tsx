// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import Palet from './Palet';
import { GROEPEN } from './bouwstenen';

// Het palet links in de editor: de groepen, de klik en het toetsenbord. Een
// klik toont een voorbeeld (Voorbeeld.test.tsx); er komt niets in de code.

afterEach(() => {
  cleanup();
  localStorage.clear();
});

const kop = (naam: string) => screen.getByRole('button', { name: naam });
const palet = (gekozen: string | null = null, onKies = () => {}) =>
  render(<Palet onKies={onKies} gekozen={gekozen} />);

describe('Palet', () => {
  it('toont de drie groepen, met de eerste open', () => {
    palet();
    expect(kop('Sensoren').getAttribute('aria-expanded')).toBe('true');
    expect(kop('Actuatoren').getAttribute('aria-expanded')).toBe('false');
    expect(kop('Python').getAttribute('aria-expanded')).toBe('false');
    expect(screen.getByRole('button', { name: 'Afstand in mm (TOF)' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Herhaal voor altijd' })).toBeNull();
  });

  it('heeft één groep tegelijk open, zodat de lijst in het paneel past', () => {
    palet();
    fireEvent.click(kop('Python'));
    expect(kop('Python').getAttribute('aria-expanded')).toBe('true');
    expect(kop('Sensoren').getAttribute('aria-expanded')).toBe('false');
    expect(screen.getByRole('button', { name: 'Herhaal zolang' })).toBeTruthy();
    fireEvent.click(kop('Python'));
    expect(kop('Python').getAttribute('aria-expanded')).toBe('false');
  });

  it('onthoudt welke groep open stond, ook als ze allemaal dicht waren', () => {
    // Na herladen, en na Bestanden op board, stond Sensoren steeds weer open.
    const eerste = palet();
    fireEvent.click(kop('Python'));
    eerste.unmount();
    const tweede = palet();
    expect(kop('Python').getAttribute('aria-expanded')).toBe('true');
    fireEvent.click(kop('Python'));
    tweede.unmount();
    palet();
    for (const g of GROEPEN) expect(kop(g.label).getAttribute('aria-expanded')).toBe('false');
  });

  it('elke bouwsteen staat in de HTML, ook in een groep die dicht is', () => {
    const { container } = palet();
    const aantal = GROEPEN.reduce((som, g) => som + g.bouwstenen.length, 0);
    expect(container.querySelectorAll('[data-bouwsteen]')).toHaveLength(aantal);
  });

  it('een klik geeft de bouwsteen door', () => {
    const onKies = vi.fn();
    palet(null, onKies);
    fireEvent.click(screen.getByRole('button', { name: 'Afstand in mm (TOF)' }));
    expect(onKies).toHaveBeenCalledTimes(1);
    expect(onKies.mock.calls[0][0].id).toBe('afstand-tof');
  });

  it('de bouwsteen waarvan het voorbeeld open staat, is ingedrukt', () => {
    palet('drukknop');
    const ingedrukt = (naam: string) =>
      screen.getByRole('button', { name: naam }).getAttribute('aria-pressed');
    expect(ingedrukt('Drukknop')).toBe('true');
    expect(ingedrukt('Joystick')).toBe('false');
  });

  it('een bouwsteen is niet te slepen en heeft geen link: alles staat in het voorbeeld', () => {
    // De opdrachtgever: "ik wil niet dat de code wordt ingevuld".
    const { container } = palet();
    expect(container.querySelectorAll('[draggable]')).toHaveLength(0);
    expect(container.querySelectorAll('a')).toHaveLength(0);
  });

  describe('met het toetsenbord', () => {
    const stops = (container: HTMLElement) =>
      Array.from(container.querySelectorAll<HTMLElement>('[data-palet-item]')).filter(
        (el) => el.tabIndex === 0,
      );

    it('is het palet één stop in de Tab-volgorde', () => {
      const { container } = palet();
      expect(stops(container)).toEqual([kop('Sensoren')]);
    });

    it('lopen de pijltjes door wat er te zien is, rond en met Home en End', () => {
      const { container } = palet();
      const vak = container.querySelector('[data-bouwstenen]') as HTMLElement;
      act(() => kop('Sensoren').focus());
      fireEvent.keyDown(vak, { key: 'ArrowDown' });
      expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Lijnsensor' }));
      fireEvent.keyDown(vak, { key: 'ArrowDown' });
      expect(document.activeElement).toBe(
        screen.getByRole('button', { name: 'Twee lijnsensoren' }),
      );
      fireEvent.keyDown(vak, { key: 'End' });
      // De bouwstenen van een dichte groep doen niet mee.
      expect(document.activeElement).toBe(kop('Python'));
      fireEvent.keyDown(vak, { key: 'ArrowDown' });
      expect(document.activeElement).toBe(kop('Sensoren'));
      fireEvent.keyDown(vak, { key: 'ArrowUp' });
      expect(document.activeElement).toBe(kop('Python'));
      fireEvent.keyDown(vak, { key: 'Home' });
      expect(document.activeElement).toBe(kop('Sensoren'));
    });

    it('blijft de bouwsteen van net de stop, zodat Shift+Tab daar terugkomt', () => {
      const { container } = palet();
      const knop = screen.getByRole('button', { name: 'Drukknop' });
      act(() => knop.focus());
      fireEvent.click(knop);
      expect(stops(container)).toEqual([knop]);
    });

    it('wordt de kop de stop als zijn groep dichtgaat', () => {
      const { container } = palet();
      act(() => screen.getByRole('button', { name: 'Drukknop' }).focus());
      fireEvent.click(kop('Python'));
      expect(stops(container)).toEqual([kop('Python')]);
    });
  });
});

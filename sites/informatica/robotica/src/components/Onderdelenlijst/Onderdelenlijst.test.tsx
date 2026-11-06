// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

// De materiaallijst van een onderdeel: een kaart per ding met een foto, de
// rest in één regel, en een klik op de foto toont hem groot. Hoe groot de
// kaarten op een telefoon zijn, meet jsdom niet; dat is in Chromium nagelopen.

vi.mock('../onderdeelFoto', () => ({ fotoUrl: (pad?: string) => pad && `/img/${pad}` }));
const { default: Onderdelenlijst, Onderdeel } = await import('.');

afterEach(cleanup);

function lijst() {
  return render(
    <Onderdelenlijst>
      <Onderdeel naam="LED-lampje" foto="led/led.png" alt="Een LED met twee pootjes">
        Twee pootjes
      </Onderdeel>
      <Onderdeel naam="jumperdraden" aantal={2} />
      <Onderdeel naam="weerstand van 220 Ω" />
    </Onderdelenlijst>,
  );
}

describe('Onderdelenlijst', () => {
  it('tekent een kaart per onderdeel met een foto, met naam en uitleg', () => {
    lijst();
    expect(screen.getAllByRole('listitem')).toHaveLength(1);
    const kaart = screen.getByRole('listitem');
    expect(kaart.textContent).toContain('LED-lampje');
    expect(kaart.textContent).toContain('Twee pootjes');
    const foto = screen.getAllByAltText('Een LED met twee pootjes')[0];
    expect(foto.getAttribute('src')).toBe('/img/led/led.png');
  });

  it('zet de onderdelen zonder foto in één regel, met het aantal ervoor', () => {
    const { container } = lijst();
    const verder = container.querySelector('p');
    expect(verder?.textContent).toBe('Verder: 2× jumperdraden, weerstand van 220 Ω');
  });

  it('de fotoknop heet naar de alt-tekst van de foto, zodat een schermlezer die voorleest', () => {
    // Met een eigen aria-label ("LED-lampje: toon de foto groot") verdween de
    // alt-tekst: juist die noemt bij de joystick de vijf pinnen.
    lijst();
    const knop = screen.getByRole('button', { name: /^Een LED met twee pootjes/ });
    expect(knop.getAttribute('aria-label')).toBeNull();
    expect(knop.textContent).toContain('Toon de foto groot');
  });

  it('de grote foto laadt pas als je het venster opent', () => {
    const { container } = lijst();
    for (const img of container.querySelectorAll('img'))
      expect(img.getAttribute('loading')).toBe('lazy');
  });

  it('een klik op de foto opent hem groot, en Sluiten zit in het venster', () => {
    const showModal = vi.fn();
    HTMLDialogElement.prototype.showModal = showModal;
    lijst();
    fireEvent.click(
      screen.getByRole('button', { name: 'Een LED met twee pootjes Toon de foto groot' }),
    );
    expect(showModal).toHaveBeenCalledOnce();
    expect(screen.getByRole('button', { name: 'Sluiten', hidden: true })).toBeTruthy();
  });
});

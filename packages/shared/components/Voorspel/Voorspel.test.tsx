// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { PaneelContext } from '../LesTabs/paneel';
import Voorspel, { Keuze, Uitleg } from './index';

// Een voorspelvraag op een scherm van een les. De vraag past op 1280×720 tot
// je antwoordt: dan komen de terugkoppeling en de uitleg erbij. Bij twintig
// van de dertig vragen die een doorloop van fullstack als leerling
// beantwoordde, viel de uitleg of de knop Volgende daarna onder de rand. In
// een tabblad maakt de vraag daarom zelf ruimte: de regel "Kies wat jij
// denkt" gaat weg zodra er gekozen is, en na het goede antwoord staat alleen
// dat antwoord er nog. Of het scherm dan past, meet alleen een browser
// (scripts/meet-les-tabs.mjs --klik).

afterEach(cleanup);

const vraag = (
  <Voorspel vraag="Wat print dit?">
    <Keuze uitleg="Nee, de lus stopt eerder.">3</Keuze>
    <Keuze goed uitleg="Ja, range(2) geeft 0 en 1.">
      2
    </Keuze>
    <Keuze uitleg="Nee, de lus loopt wel.">0</Keuze>
    <Uitleg>range(2) telt tot twee.</Uitleg>
  </Voorspel>
);
const inTab = () =>
  render(<PaneelContext.Provider value={() => {}}>{vraag}</PaneelContext.Provider>);
const keuzes = () => screen.getAllByRole('button').filter((k) => k.hasAttribute('aria-pressed'));
const HINT = /Kies wat jij denkt/;

describe('Voorspel in een tabblad', () => {
  it('toont de regel over kiezen tot er gekozen is', () => {
    inTab();
    expect(screen.queryByText(HINT)).not.toBeNull();
    fireEvent.click(keuzes()[0]);
    expect(screen.queryByText(HINT)).toBeNull();
  });

  it('houdt na een fout antwoord alle antwoorden, en toont de uitleg nog niet', () => {
    inTab();
    fireEvent.click(keuzes()[0]);
    expect(keuzes()).toHaveLength(3);
    expect(screen.queryAllByText('Nee, de lus stopt eerder.').length).toBeGreaterThan(0);
    expect(screen.queryByText('range(2) telt tot twee.')).toBeNull();
    expect(screen.queryByRole('button', { name: /andere antwoorden/ })).toBeNull();
  });

  it('zet de reden van een fout antwoord in de rij van dat antwoord', () => {
    // Het kader eronder was 112 pixels: in 25 van de 180 schermen met een
    // vraag paste het scherm daarna niet meer.
    const { container } = inTab();
    fireEvent.click(keuzes()[0]);
    const waarom = container.querySelectorAll('[data-voorspel-waarom]');
    expect(waarom).toHaveLength(1);
    expect(waarom[0].textContent).toBe('Nee, de lus stopt eerder.');
    expect(keuzes()[0].contains(waarom[0])).toBe(true);
    // De schermlezer hoort het via de live-regio; in de knop is het dubbel.
    expect(waarom[0].getAttribute('aria-hidden')).toBe('true');
    expect(container.querySelector('[aria-live="polite"]')?.textContent).toContain(
      'Nee, de lus stopt eerder.',
    );
    // Een ander fout antwoord: de reden verhuist mee.
    fireEvent.click(keuzes()[2]);
    const nu = container.querySelectorAll('[data-voorspel-waarom]');
    expect(nu).toHaveLength(1);
    // Het eerste foute antwoord is nu weg: het goede en dit staan er nog.
    expect(keuzes().at(-1)?.contains(nu[0])).toBe(true);
    // Bij het goede antwoord staat de reden weer in het kader.
    fireEvent.click(keuzes()[0]);
    expect(container.querySelector('[data-voorspel-waarom]')).toBeNull();
  });

  it('laat na het goede antwoord alleen dat antwoord staan, met de uitleg', () => {
    inTab();
    fireEvent.click(keuzes()[0]);
    fireEvent.click(keuzes()[1]);
    expect(keuzes()).toHaveLength(1);
    expect(keuzes()[0].textContent).toContain('2');
    expect(screen.queryByText('range(2) telt tot twee.')).not.toBeNull();
  });

  it('toont de andere antwoorden weer met de knop, en verbergt ze opnieuw', () => {
    inTab();
    fireEvent.click(keuzes()[1]);
    const knop = screen.getByRole('button', { name: 'Toon de andere antwoorden' });
    expect(knop.getAttribute('aria-expanded')).toBe('false');
    fireEvent.click(knop);
    expect(keuzes()).toHaveLength(3);
    const terug = screen.getByRole('button', { name: 'Verberg de andere antwoorden' });
    expect(terug.getAttribute('aria-expanded')).toBe('true');
    fireEvent.click(terug);
    expect(keuzes()).toHaveLength(1);
  });

  it('na elk fout antwoord komt de uitleg, en vallen de eerdere foute antwoorden weg', () => {
    // De uitleg kwam erbij terwijl alle antwoorden er nog stonden: twintig
    // pixels te lang in zes lessen van fullstack. Het laatst gekozen
    // antwoord en het goede blijven staan.
    inTab();
    fireEvent.click(keuzes()[0]);
    fireEvent.click(keuzes()[2]);
    expect(screen.queryByText('range(2) telt tot twee.')).not.toBeNull();
    expect(keuzes().map((k) => k.textContent?.replace(/^[×✓A-J]/, '').trim()[0])).toEqual([
      '2',
      '0',
    ]);
    fireEvent.click(screen.getByRole('button', { name: 'Toon de andere antwoorden' }));
    expect(keuzes()).toHaveLength(3);
  });

  it('zet de terugkoppeling en de uitleg in één vak dat de les kan laten schuiven', () => {
    const { container } = inTab();
    fireEvent.click(keuzes()[1]);
    const na = container.querySelector('[data-voorspel-na]');
    expect(na?.textContent).toContain('Ja, range(2) geeft 0 en 1.');
    expect(na?.textContent).toContain('range(2) telt tot twee.');
    // De live-regio staat er ook vóór het antwoord: anders mist een
    // schermlezer de eerste terugkoppeling.
    cleanup();
    const leeg = inTab().container.querySelector('[data-voorspel-na] [aria-live="polite"]');
    expect(leeg).not.toBeNull();
  });

  it('zegt het meetscript of de vraag open, fout of goed staat', () => {
    const { container } = inTab();
    const staat = () => container.querySelector('section')?.getAttribute('data-voorspel');
    expect(staat()).toBe('open');
    fireEvent.click(keuzes()[0]);
    expect(staat()).toBe('fout');
    fireEvent.click(keuzes()[1]);
    expect(staat()).toBe('goed');
  });
});

describe('Voorspel buiten een tabblad', () => {
  it('verandert niet: de regel en alle antwoorden blijven staan', () => {
    render(vraag);
    fireEvent.click(keuzes()[0]);
    expect(document.querySelector('[data-voorspel-waarom]')).toBeNull();
    fireEvent.click(keuzes()[1]);
    expect(screen.queryByText(HINT)).not.toBeNull();
    expect(keuzes()).toHaveLength(3);
    expect(screen.queryByRole('button', { name: /andere antwoorden/ })).toBeNull();
  });
});

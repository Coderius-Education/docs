// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { HulpKeuze, HulpVak, LES_HULP, LES_HULP_KEUZE, hulpBreedte } from './Hulp';

// De knoppen en het vak voor de tip en het antwoord in een oefenveld (issue
// 212). Drie velden gebruiken ze: de CodeExercise, de PyRunner en de
// CodeEditor. Wat hier vastligt, is wat ze gemeen hebben: welke knoppen er
// staan, hoe ze heten, en dat een dicht vak in de pagina blijft staan.

afterEach(cleanup);

const namen = () => screen.getAllByRole('button').map((k) => k.textContent);
const ingedrukt = () =>
  screen
    .getAllByRole('button')
    .filter((k) => k.getAttribute('aria-pressed') === 'true')
    .map((k) => k.textContent);

describe('HulpKeuze', () => {
  it('toont alleen de knoppen van wat de opdracht heeft', () => {
    render(<HulpKeuze hulp={{ antwoord: 'x' }} weergave="uitvoer" kies={() => {}} />);
    expect(namen()).toEqual(['Uitvoer', 'Antwoord']);
    cleanup();
    render(<HulpKeuze hulp={{ tip: 'x', antwoord: 'x' }} weergave="tip" kies={() => {}} />);
    expect(namen()).toEqual(['Uitvoer', 'Tip', 'Antwoord']);
    expect(ingedrukt()).toEqual(['Tip']);
  });

  it('noemt het antwoord zoals de les het noemt, en de uitvoer zoals het veld', () => {
    render(
      <HulpKeuze
        hulp={{ antwoord: 'x', naam: 'oplossing' }}
        weergave="antwoord"
        kies={() => {}}
        eerste="Voorbeeld"
      />,
    );
    expect(namen()).toEqual(['Voorbeeld', 'Oplossing']);
    expect(ingedrukt()).toEqual(['Oplossing']);
  });

  it('een klik kiest de weergave', () => {
    const kies = vi.fn();
    const { container } = render(
      <HulpKeuze hulp={{ tip: 'x', antwoord: 'x' }} weergave="uitvoer" kies={kies} />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Antwoord' }));
    fireEvent.click(screen.getByRole('button', { name: 'Uitvoer' }));
    expect(kies.mock.calls).toEqual([['antwoord'], ['uitvoer']]);
    // Het meetscript vindt de rij aan dit attribuut.
    expect(container.querySelector(`[${LES_HULP_KEUZE}]`)).not.toBeNull();
  });
});

describe('HulpVak', () => {
  it('een dicht vak blijft in de pagina staan: een link erin staat in de build', () => {
    const { container } = render(
      <HulpVak soort="antwoord" open={false}>
        <a href="/les">de volgende les</a>
      </HulpVak>,
    );
    const vak = container.querySelector(`[${LES_HULP}="antwoord"]`) as HTMLElement;
    expect(vak.hidden).toBe(true);
    expect(vak.querySelector('a')?.getAttribute('href')).toBe('/les');
  });

  it('een open vak is te zien', () => {
    const { container } = render(
      <HulpVak soort="tip" open>
        Gebruik range.
      </HulpVak>,
    );
    expect((container.querySelector(`[${LES_HULP}="tip"]`) as HTMLElement).hidden).toBe(false);
  });
});

describe('hulpBreedte', () => {
  // Een veld op 1280 pixels is zo'n 930 pixels breed.
  const VELD = 930;

  it('een antwoord met korte regels krijgt het minste deel van het veld', () => {
    expect(hulpBreedte(42, VELD)).toBe(465);
    expect(hulpBreedte(undefined, VELD)).toBe(465);
    expect(hulpBreedte(30, VELD, { minDeel: 0.4 })).toBe(372);
  });

  it('een lange regel maakt de kolom breder: het eind is niet afgesneden', () => {
    // In algoritmes viel van een regel van 64 tekens het eind weg in een
    // kolom van 418 pixels.
    const breedte = hulpBreedte(64, VELD, { minDeel: 0.45, nummers: true });
    expect(breedte).toBe(64 * 7 + 56 + 36);
    expect(breedte).toBeGreaterThan(418);
  });

  it('de code van de leerling houdt minstens dertig procent', () => {
    expect(hulpBreedte(199, VELD)).toBe(651);
  });

  it('regelnummers kosten breedte', () => {
    expect(hulpBreedte(70, VELD, { nummers: true }) - hulpBreedte(70, VELD)).toBe(36);
  });
});

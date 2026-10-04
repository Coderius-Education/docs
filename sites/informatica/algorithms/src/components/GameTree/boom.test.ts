import { describe, expect, it } from 'vitest';
import { bouwBoom, parseBord, telKnopen } from './boom';

// De boom die de pen-en-papier-pagina tekent. Elke waarde in de component
// komt hiervandaan, dus als dit klopt kan de tekening niet anders zeggen dan
// de berekening.

describe('de game tree van de pen-en-papier-positie', () => {
  const wortel = bouwBoom(parseBord('XXO/OOX/...'));

  it('X is aan zet en de wortel is 0 waard: de blokkade', () => {
    expect(wortel.speler).toBe('X');
    expect(wortel.waarde).toBe(0);
  });

  it('de drie takken staan in leesvolgorde en zijn 0, -1 en -1 waard', () => {
    expect(wortel.kinderen.map((k) => k.zet)).toEqual([
      [2, 0],
      [2, 1],
      [2, 2],
    ]);
    expect(wortel.kinderen.map((k) => k.waarde)).toEqual([0, -1, -1]);
    expect(wortel.kinderen.map((k) => k.speler)).toEqual(['O', 'O', 'O']);
  });

  it('onder de middentak wint O meteen op (2,0) en is dat blad klaar', () => {
    const midden = wortel.kinderen[1];
    const [links, rechts] = midden.kinderen;
    expect(links.zet).toEqual([2, 0]);
    expect(links.speler).toBeNull();
    expect(links.waarde).toBe(-1);
    expect(links.kinderen).toEqual([]);
    // Het andere kind loopt nog één zet door tot een vol bord.
    expect(rechts.speler).toBe('X');
    expect(rechts.kinderen).toHaveLength(1);
    expect(rechts.kinderen[0].waarde).toBe(0);
  });

  it('telt veertien knopen: 1 + 3 + 6 + 4', () => {
    expect(telKnopen(wortel)).toBe(14);
  });
});

describe('parseBord', () => {
  it('leest de korte notatie', () => {
    expect(parseBord('X.O/.X./O..')).toEqual([
      ['X', null, 'O'],
      [null, 'X', null],
      ['O', null, null],
    ]);
  });

  it('weigert iets dat geen bord is, met de tekst in de melding', () => {
    expect(() => parseBord('XXO/OOX')).toThrow("'XXO/OOX'");
    expect(() => parseBord('XXO/OOX/..')).toThrow();
    expect(() => parseBord('XXO/OOX/..Y')).toThrow();
  });
});

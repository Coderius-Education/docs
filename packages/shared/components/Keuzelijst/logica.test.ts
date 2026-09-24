import { describe, expect, it } from 'vitest';
import { type KeuzeOptie, groepeer, volgendeIndex, zoekOpLetters } from './logica';

const talen: KeuzeOptie[] = [
  { waarde: 'a', label: 'Mijn site', groep: 'Website' },
  { waarde: 'b', label: 'Rekenmachine', groep: 'Python' },
  { waarde: 'c', label: 'Portfolio', groep: 'Website' },
  { waarde: 'd', label: 'Pong', groep: 'Python' },
];

describe('groepeer', () => {
  it('zet opties onder hun groep, in volgorde van eerste voorkomen', () => {
    const groepen = groepeer(talen);

    expect(groepen.map((g) => g.naam)).toEqual(['Website', 'Python']);
    expect(groepen[0].opties.map((o) => o.index)).toEqual([0, 2]);
  });

  it('opties zonder groep vormen één groep zonder naam', () => {
    expect(groepeer([{ waarde: 1, label: 'x' }]).map((g) => g.naam)).toEqual([null]);
  });
});

describe('volgendeIndex', () => {
  it('volgt de volgorde waarin de groepen getoond worden', () => {
    // Zichtbaar: Mijn site (0), Portfolio (2), Rekenmachine (1), Pong (3).
    expect(volgendeIndex(talen, 0, 'volgende')).toBe(2);
    expect(volgendeIndex(talen, 2, 'volgende')).toBe(1);
    expect(volgendeIndex(talen, 1, 'vorige')).toBe(2);
  });

  it('blijft staan aan de randen', () => {
    expect(volgendeIndex(talen, 3, 'volgende')).toBe(3);
    expect(volgendeIndex(talen, 0, 'vorige')).toBe(0);
  });

  it('slaat uitgeschakelde opties over', () => {
    const opties: KeuzeOptie[] = [
      { waarde: '', label: 'Voorbeeld laden...', uitgeschakeld: true },
      { waarde: 'a', label: 'Leeg bestand' },
      { waarde: 'b', label: 'Motoren' },
    ];

    expect(volgendeIndex(opties, -1, 'volgende')).toBe(1);
    expect(volgendeIndex(opties, 1, 'vorige')).toBe(1);
    expect(volgendeIndex(opties, -1, 'begin')).toBe(1);
  });

  it('geeft -1 als er niets te kiezen is', () => {
    expect(volgendeIndex([{ waarde: 'x', label: 'x', uitgeschakeld: true }], 0, 'volgende')).toBe(
      -1,
    );
  });
});

describe('zoekOpLetters', () => {
  it('vindt het eerste label dat met de letters begint, na de huidige', () => {
    expect(zoekOpLetters(talen, 0, 'p')).toBe(2);
    expect(zoekOpLetters(talen, 2, 'p')).toBe(3);
  });

  it('loopt rond en negeert hoofdletters en accenten', () => {
    const opties: KeuzeOptie<number>[] = [
      { waarde: 1, label: 'École' },
      { waarde: 2, label: 'Appel' },
    ];

    expect(zoekOpLetters(opties, 1, 'e')).toBe(0);
  });

  it('meer letters zoeken verder op dezelfde plek', () => {
    expect(zoekOpLetters(talen, 2, 'po')).toBe(2);
    expect(zoekOpLetters(talen, 2, 'pon')).toBe(3);
  });

  it('één letter herhaald loopt door de opties met die letter', () => {
    expect(zoekOpLetters(talen, 2, 'pp')).toBe(3);
  });

  it('geeft -1 als niets past', () => {
    expect(zoekOpLetters(talen, 0, 'z')).toBe(-1);
  });
});

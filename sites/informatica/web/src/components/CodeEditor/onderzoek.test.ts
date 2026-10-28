import { describe, expect, it } from 'vitest';
import { stukken } from './onderzoek';

describe('stukken', () => {
  it('maakt van tekst tussen backticks code', () => {
    expect(stukken('Verwijder `position: relative` van `.kaart`.')).toEqual([
      { code: false, tekst: 'Verwijder ' },
      { code: true, tekst: 'position: relative' },
      { code: false, tekst: ' van ' },
      { code: true, tekst: '.kaart' },
      { code: false, tekst: '.' },
    ]);
  });

  it('laat tekst zonder backticks heel', () => {
    expect(stukken('Wat zie je?')).toEqual([{ code: false, tekst: 'Wat zie je?' }]);
  });

  it('toont een backtick die niet sluit gewoon als tekst', () => {
    expect(stukken('een `open stuk')).toEqual([{ code: false, tekst: 'een `open stuk' }]);
  });
});

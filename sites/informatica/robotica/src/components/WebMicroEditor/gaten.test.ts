import { describe, expect, it } from 'vitest';
import { gatRegels, invulPlekken, sprong } from './gaten';

// Wat een bouwsteen openlaat. Bij de review van PR #220 brak Enter na het
// typen van een voorwaarde de regel vóór de dubbele punt, en bleef het gat
// onder `else:` onzichtbaar: een regel met alleen spaties.

const r = (tekst: string) => tekst.split('\n');

describe('gatRegels', () => {
  it('vindt de lege regel direct onder een blok zonder inhoud', () => {
    expect(gatRegels(r('while True:\n    '))).toEqual([1]);
    expect(gatRegels(r('if x:\n    \nelse:\n    \n'))).toEqual([1, 3]);
    // Ook als de spaties ontbreken.
    expect(gatRegels(r('if x:\n\nprint(1)'))).toEqual([1]);
  });

  it('een blok met inhoud heeft geen gat, ook niet met een witregel erboven', () => {
    expect(gatRegels(r('while True:\n    print(1)\n'))).toEqual([]);
    expect(gatRegels(r('while True:\n\n    print(1)\n'))).toEqual([]);
  });

  it('alleen de regel direct onder de opener telt, niet de regel na het blok', () => {
    expect(gatRegels(r('while True:\n    if x:\n        \n    '))).toEqual([2]);
  });

  it('een dubbele punt in tekst of commentaar opent geen blok', () => {
    expect(gatRegels(r('print("let op:")\n\nprint(2)'))).toEqual([]);
    expect(gatRegels(r('x = 1  # let op:\n\n'))).toEqual([]);
  });
});

describe('invulPlekken', () => {
  it('wijst het woord aan dat een bouwsteen selecteert en dat er nog staat', () => {
    expect(invulPlekken(r('if voorwaarde:\n    '))).toEqual([{ regel: 0, van: 3, tot: 13 }]);
    expect(invulPlekken(r('while True:\n    while voorwaarde:\n        '))).toEqual([
      { regel: 1, van: 10, tot: 20 },
    ]);
    expect(invulPlekken(r('naam = 0'))).toEqual([{ regel: 0, van: 0, tot: 4 }]);
  });

  it('een ingevulde regel is geen invulplek meer', () => {
    expect(invulPlekken(r('if afstand < 10:\nteller = 0\nwhile True:'))).toEqual([]);
    // Alleen de hele regel van de bouwsteen: een eigen naam met "voorwaarde" erin telt niet.
    expect(invulPlekken(r('if voorwaarde and klaar:\nnaam = "Sam"'))).toEqual([]);
  });
});

describe('sprong: Enter of Tab vlak voor het eind van de regel', () => {
  it('gaat naar het gat onder de regel', () => {
    const doc = r('if teller > 3:\n    ');
    expect(sprong(doc, 0, 'if teller > 3'.length)).toEqual({ soort: 'gat', regel: 1 });
  });

  it('gaat naar het eind van de regel als er geen gat onder staat', () => {
    const doc = r('if teller > 3:\n    print(1)');
    expect(sprong(doc, 0, 'if teller > 3'.length)).toEqual({ soort: 'eind' });
    // De naam van Onthoud iets: de cursor staat vóór ` = 0`.
    expect(sprong(r('lijnen = 0'), 0, 'lijnen'.length)).toEqual({ soort: 'eind' });
  });

  it('doet niets aan het eind van de regel, midden in de regel of aan het begin', () => {
    const doc = r('if teller > 3:\n    ');
    expect(sprong(doc, 0, doc[0].length)).toBeNull();
    expect(sprong(doc, 0, 4)).toBeNull();
    expect(sprong(doc, 1, 4)).toBeNull();
    // Een regel met alleen een dubbele punt of ` = 0` na de inspringing.
    expect(sprong(r('    :'), 0, 4)).toBeNull();
    expect(sprong(r('print(1)'), 0, 3)).toBeNull();
  });
});

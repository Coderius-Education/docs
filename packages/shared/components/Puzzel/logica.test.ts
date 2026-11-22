import { describe, expect, it } from 'vitest';
import { goedOp, hussel, oordeel, regelsVan, verplaats, zaadVan } from './logica';

const CODE = `<ul>
  <li>Appels</li>

  <li>Peren</li>
</ul>
`;

describe('regelsVan', () => {
  it('geeft elke regel met zijn inspringing, zonder lege regels', () => {
    expect(regelsVan(CODE).map((r) => r.tekst)).toEqual([
      '<ul>',
      '  <li>Appels</li>',
      '  <li>Peren</li>',
      '</ul>',
    ]);
    expect(regelsVan('a\r\nb\r\n').map((r) => r.tekst)).toEqual(['a', 'b']);
  });
});

describe('hussel', () => {
  it('geeft met hetzelfde zaad dezelfde volgorde, met elke regel één keer', () => {
    const regels = regelsVan(CODE);
    const een = hussel(regels, zaadVan(CODE));
    expect(hussel(regels, zaadVan(CODE))).toEqual(een);
    expect([...een].sort((a, b) => a.id - b.id)).toEqual(regels);
  });

  it('geeft nooit de oplossing zelf, wat het zaad ook is', () => {
    const regels = regelsVan(CODE);
    for (let zaad = 0; zaad < 500; zaad++) {
      const door = hussel(regels, zaad);
      expect(goedOp(door, regels).every(Boolean), `zaad ${zaad}`).toBe(false);
    }
    // Ook niet als twee regels hetzelfde zijn: die verwisselen is geen husselen.
    const dubbel = regelsVan('if (x) {\n}\n}');
    for (let zaad = 0; zaad < 100; zaad++) {
      expect(goedOp(hussel(dubbel, zaad), dubbel).every(Boolean), `zaad ${zaad}`).toBe(false);
    }
  });

  it('laat een puzzel van één regel staan', () => {
    const een = regelsVan('alleen');
    expect(hussel(een, 3)).toEqual(een);
  });
});

describe('verplaats en goedOp', () => {
  it('verplaatst één regel en laat de rest in volgorde', () => {
    const r = regelsVan('a\nb\nc\nd');
    expect(verplaats(r, 0, 2).map((x) => x.tekst)).toEqual(['b', 'c', 'a', 'd']);
    expect(verplaats(r, 3, 0).map((x) => x.tekst)).toEqual(['d', 'a', 'b', 'c']);
    expect(verplaats(r, 1, 1)).toBe(r);
    expect(verplaats(r, 1, 9)).toBe(r);
  });

  it('keurt twee gelijke regels op elkaars plek goed', () => {
    const r = regelsVan('{\n}\n}');
    const gewisseld = [r[0], r[2], r[1]];
    expect(goedOp(gewisseld, r)).toEqual([true, true, true]);
    expect(goedOp([r[1], r[0], r[2]], r)).toEqual([false, false, true]);
  });

  it('keurt regels die alleen in inspringing verschillen op elkaars plek goed', () => {
    // De `}` van de else en die van de functie: voor een leerling dezelfde regel.
    const r = regelsVan('function f() {\n  if (x) {\n    a();\n  }\n}');
    const gewisseld = [r[0], r[1], r[2], r[4], r[3]];
    expect(goedOp(gewisseld, r).every(Boolean)).toBe(true);
  });
});

describe('oordeel', () => {
  it('telt de regels die goed staan, en zegt het als alles klopt', () => {
    expect(oordeel([false, false])).toMatch(/^Nog geen regel staat op zijn plek\./);
    expect(oordeel([true, false, false])).toMatch(/^1 regel staat op zijn plek, van de 3\./);
    expect(oordeel([true, true, false])).toMatch(/^2 regels staan op hun plek, van de 3\./);
    expect(oordeel([true, true])).toBe('Goed: alle 2 regels staan op hun plek.');
  });
});

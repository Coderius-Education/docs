import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';

const require = createRequire(import.meta.url);
const { nieuwSinds, wegSinds, uitMeta, alsMeta, bouwtVoortOp } = require('./nieuw-sinds.js') as {
  nieuwSinds: (vorige: string[], nu: string[]) => number[];
  wegSinds: (vorige: string[], nu: string[]) => number;
  bouwtVoortOp: (vorige: string[], nu: string[]) => boolean;
  uitMeta: (meta: string) => number[];
  alsMeta: (nummers: number[]) => string;
};

describe('nieuwSinds: welke regels er sinds het blok ervoor bij kwamen', () => {
  it('een regel erbij, een regel veranderd, en regels die inspringen', () => {
    expect(nieuwSinds(['a', 'b'], ['a', 'b', 'c'])).toEqual([3]);
    expect(nieuwSinds(['a', 'b'], ['a', 'B'])).toEqual([2]);
    expect(
      nieuwSinds(['x = 5', '', 'print(x)'], ['x = 5', '', 'while x:', '    print(x)']),
    ).toEqual([3, 4]);
  });

  it('een lege regel erbij telt niet', () => {
    expect(nieuwSinds(['a'], ['a', '', 'b'])).toEqual([3]);
  });

  it('een nieuwe regel die gelijk is aan een regel eronder, is de bovenste', () => {
    // Per regel vergeleken koppelde de test de bovenste streep aan de oude en
    // wees hij de onderste aan.
    expect(
      nieuwSinds(
        ['print("Rondes")', 'print("---")'],
        ['print("---")', 'print("Rondes")', 'print("---")'],
      ),
    ).toEqual([1]);
  });

  it('code die onderaan bij komt en eindigt zoals het blok erboven, is één stuk', () => {
    // Een nieuw endpoint onder een oud, allebei met commit en return. De
    // bovenste van twee gelijke regels kiezen markeerde de staart van het
    // oude endpoint en liet die van het nieuwe ongemarkeerd.
    const oud = ['@app.post("/a")', 'def a():', '    db.commit()', '    return ok()'];
    const nieuw = [...oud, '', '@app.post("/b")', 'def b():', '    db.commit()', '    return ok()'];
    expect(nieuwSinds(oud, nieuw)).toEqual([6, 7, 8, 9]);
    expect(nieuwSinds(['A', 'B', 'C'], ['A', 'B', 'C', 'D', 'B', 'C'])).toEqual([4, 5, 6]);
  });

  it('een blok dat niet veranderde, heeft niets nieuws', () => {
    expect(nieuwSinds(['a', '', 'b'], ['a', '', 'b'])).toEqual([]);
  });
});

describe('de metastring van een markering', () => {
  it('leest {2-3,6} en slaat een andere metastring over', () => {
    expect(uitMeta('{2-3,6}')).toEqual([2, 3, 6]);
    expect(uitMeta(' {4}')).toEqual([4]);
    expect(uitMeta('showLineNumbers')).toEqual([]);
    expect(uitMeta('title="main.py"')).toEqual([]);
    expect(uitMeta('')).toEqual([]);
    // Met een spatie toont Docusaurus geen markering: dan is het er ook geen.
    expect(uitMeta('{2, 4}')).toEqual([]);
  });

  it('schrijft regelnummers als reeksen', () => {
    expect(alsMeta([2, 3, 6])).toBe('{2-3,6}');
    expect(alsMeta([4])).toBe('{4}');
    expect(alsMeta([1, 2, 3, 4])).toBe('{1-4}');
    expect(alsMeta([])).toBe('');
  });

  it('wat hij schrijft, leest hij terug', () => {
    for (const nummers of [[1], [1, 2, 5, 7, 8, 9], [3, 4]])
      expect(uitMeta(alsMeta(nummers))).toEqual(nummers);
  });
});

describe('bouwtVoortOp: wanneer een blok een markering hoort te hebben', () => {
  it('een blok dat alles in een loop zet, bouwt voort: inspringen telt niet', () => {
    // 07-while-loop: drie regels die in een while komen. Met een vergelijking
    // per hele regel deelde het blok niets met het blok ervoor.
    expect(
      bouwtVoortOp(
        ['bladzijde = 0', 'bladzijde = bladzijde + 35', 'print(bladzijde)'],
        [
          'bladzijde = 0',
          'while bladzijde < 120:',
          '    bladzijde = bladzijde + 35',
          '    print(bladzijde)',
        ],
      ),
    ).toBe(true);
  });

  it('een los ander voorbeeld bouwt niet voort, en een blok dat niet veranderde ook niet', () => {
    expect(bouwtVoortOp(['a = 1', 'print(a)'], ['for i in range(3):', '    print(i)'])).toBe(false);
    expect(bouwtVoortOp(['a = 1', 'print(a)'], ['a = 1', 'print(a)'])).toBe(false);
  });
});

describe('wegSinds: hoeveel regels er weg zijn', () => {
  it('een weggehaald endpoint telt, een veranderde regel niet', () => {
    const oud = [
      'app = FastAPI()',
      '',
      '@app.get("/sessies")',
      'def sessies():',
      '    return alle()',
      '',
      'print(1)',
    ];
    const nu = ['app = FastAPI(docs_url=None)', '', 'print(1)'];
    expect(wegSinds(oud, nu)).toBe(3);
    expect(wegSinds(['a', 'b'], ['a', 'B'])).toBe(0);
    expect(wegSinds(['a'], ['a', 'b'])).toBe(0);
  });
});

import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';

const require = createRequire(import.meta.url);
const { nieuwSinds, uitMeta, alsMeta } = require('./nieuw-sinds.js') as {
  nieuwSinds: (vorige: string[], nu: string[]) => number[];
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

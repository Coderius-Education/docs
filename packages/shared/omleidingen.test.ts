import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import omleidingenPlugin, { schrijfOmleidingen } from './plugins/omleidingen';

// Een les die verhuist, liet oude links (werkbladen, bladwijzers,
// zoekresultaten) op een 404 uitkomen. De plugin schrijft na de build op elk
// oud adres een pagina die doorstuurt.

describe('omleidingen', () => {
  it('schrijft op het oude adres een pagina die naar het nieuwe doorstuurt', () => {
    const uit = mkdtempSync(join(tmpdir(), 'omleiding-'));
    // Zoals createConfig het zet: de vak-host als url, het pad van de cursus
    // als baseUrl. De build zelf bevat dat pad niet.
    schrijfOmleidingen(
      uit,
      '/python/',
      [{ van: '/docs/oud/les', naar: '/docs/nieuw/les' }],
      'https://informatica.coderius.nl',
    );
    const html = readFileSync(join(uit, 'docs/oud/les/index.html'), 'utf8');
    expect(html).toContain('<meta http-equiv="refresh" content="0; url=/python/docs/nieuw/les">');
    expect(html).toContain('location.replace("/python/docs/nieuw/les" + location.hash)');
    expect(html).toContain(
      '<link rel="canonical" href="https://informatica.coderius.nl/python/docs/nieuw/les">',
    );
    expect(html).toContain('<meta name="robots" content="noindex">');
  });

  it('geeft het anker van het doel voorrang, zonder er een tweede achter te plakken', () => {
    // /click_golfer/hole-in-one#x werd /click_golfer/hout#hole-in-one#x, en
    // de browser begon dan bovenaan de pagina in plaats van bij Hole in one.
    const uit = mkdtempSync(join(tmpdir(), 'omleiding-'));
    schrijfOmleidingen(
      uit,
      '/robotica/',
      [{ van: '/click_golfer/hole-in-one', naar: '/click_golfer/hout#hole-in-one' }],
      'https://informatica.coderius.nl',
    );
    const html = readFileSync(join(uit, 'click_golfer/hole-in-one/index.html'), 'utf8');
    expect(html).toContain('location.replace("/robotica/click_golfer/hout#hole-in-one");');
    expect(html).not.toContain('location.hash');
    expect(html).toContain(
      '<link rel="canonical" href="https://informatica.coderius.nl/robotica/click_golfer/hout">',
    );
  });

  it('zet de baseUrl van de site voor het doel', () => {
    const uit = mkdtempSync(join(tmpdir(), 'omleiding-'));
    schrijfOmleidingen(uit, '/cursus/', [{ van: '/docs/a', naar: '/docs/b' }]);
    expect(readFileSync(join(uit, 'docs/a/index.html'), 'utf8')).toContain('url=/cursus/docs/b"');
  });

  it('overschrijft geen echte pagina: dan is de omleiding verouderd', () => {
    const uit = mkdtempSync(join(tmpdir(), 'omleiding-'));
    mkdirSync(join(uit, 'docs/a'), { recursive: true });
    writeFileSync(join(uit, 'docs/a/index.html'), 'echte les');
    expect(() => schrijfOmleidingen(uit, '/', [{ van: '/docs/a', naar: '/docs/b' }])).toThrow(
      /echte pagina/,
    );
  });

  it('weigert een dubbel, een kringetje of een pad dat niet bij de site hoort', () => {
    const plugin = omleidingenPlugin as unknown as (c: unknown, o: unknown) => unknown;
    expect(() => plugin({}, { omleidingen: [{ van: '/a', naar: '/a' }] })).toThrow(/zichzelf/);
    expect(() =>
      plugin(
        {},
        {
          omleidingen: [
            { van: '/a', naar: '/b' },
            { van: '/a', naar: '/c' },
          ],
        },
      ),
    ).toThrow(/twee keer/);
    expect(() => plugin({}, { omleidingen: [{ van: 'https://x.nl/a', naar: '/b' }] })).toThrow(
      /ongeldig/,
    );
  });
});

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { codeerDeelLink } from './deellink';
import {
  DEFAULT_CODE_PYGAME,
  SPEELTUIN_START,
  beginVanAdres,
  speeltuinOpslag,
  standaardCode,
} from './speeltuin-opslag';

// De losse speeltuin bewaarde niets in de browser: de code stond alleen in
// het adres, en wie de speeltuin opnieuw opende via het menu, was zijn werk
// kwijt (november 2026). Deze tests pinnen waar hij nu mee opent en dat de
// pagina de opslag van de oefenvelden gebruikt. Of het werk na herladen
// terugkomt, ziet alleen een browser (zie de CLAUDE.md van play).

const adres = (code: string, mode = 'play') => {
  const params = new URLSearchParams();
  params.set('code', codeerDeelLink(code));
  params.set('mode', mode);
  return params.toString();
};

describe('beginVanAdres', () => {
  it('zonder code in het adres: de startcode, en het bewaarde werk mag terugkomen', () => {
    expect(beginVanAdres('', null)).toEqual({ ...SPEELTUIN_START, gedeeld: false });
    expect(beginVanAdres('#', 'iets')).toEqual({ ...SPEELTUIN_START, gedeeld: false });
  });

  it('een link van iemand anders: die code, maar niet bewaren', () => {
    const hash = adres('import play\n# gedeeld\n');
    expect(beginVanAdres(`#${hash}`, null)).toEqual({
      code: 'import play\n# gedeeld\n',
      modus: 'play',
      gedeeld: true,
    });
    // Een andere tab schreef iets anders: ook dan is dit een gedeelde link.
    expect(beginVanAdres(`#${hash}`, adres('import play\n')).gedeeld).toBe(true);
  });

  it('het adres dat deze tab zelf schreef (herladen): gewoon bewaren', () => {
    const hash = adres('import play\n# mijn werk\n');
    expect(beginVanAdres(`#${hash}`, hash)).toEqual({
      code: 'import play\n# mijn werk\n',
      modus: 'play',
      gedeeld: false,
    });
  });

  it('neemt de bibliotheek mee, en negeert rommel', () => {
    const hash = adres(DEFAULT_CODE_PYGAME, 'pygame');
    expect(beginVanAdres(hash, hash).modus).toBe('pygame');
    expect(beginVanAdres('code=%%%&mode=pygame', null)).toEqual({
      ...SPEELTUIN_START,
      gedeeld: false,
    });
    expect(beginVanAdres(`${adres('x')}&mode=basic`, null).modus).toBe('play');
  });
});

describe('de opslag van de speeltuin', () => {
  it('bewaart code en bibliotheek samen, met een vaste sleutel', () => {
    const zaad = speeltuinOpslag.zaadVan(SPEELTUIN_START);
    expect(zaad).toBe(speeltuinOpslag.zaadVan({ code: standaardCode('play'), modus: 'play' }));
    expect(
      speeltuinOpslag.gelijk(SPEELTUIN_START, { code: SPEELTUIN_START.code, modus: 'pygame' }),
    ).toBe(false);
  });

  it('de pagina gebruikt hem, en bewaart een gedeelde link niet', () => {
    const pagina = readFileSync(
      fileURLToPath(new URL('../pages/speeltuin.tsx', import.meta.url)),
      'utf8',
    );
    expect(pagina).toMatch(
      /useOpslag<SpeeltuinWerk>\(\{\s*opslag: begin\.gedeeld \? null : speeltuinOpslag/,
    );
    expect(pagina).toContain('data-zaad={bewaard.zaad');
    expect(pagina).toContain('zetEigenAdres(');
  });
});

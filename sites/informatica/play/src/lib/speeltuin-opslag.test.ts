import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { maakOpslag, veldSleutel } from '@coderius/shared/oefenveld/opslag';
import { describe, expect, it } from 'vitest';
import { codeerDeelLink } from './deellink';
import {
  DEFAULT_CODE_PLAY,
  DEFAULT_CODE_PYGAME,
  SPEELTUIN_START,
  type SpeeltuinWerk,
  adresZonderLink,
  beginVanAdres,
  isEigenCode,
  kiesBegin,
  neemOver,
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

// Een opslag in het geheugen, zoals maakOpslag hem met een eigen kast en lade
// toelaat: de database en de noodkopie van een browser, zonder browser.
function opslagInGeheugen(
  kast: Map<string, unknown> = new Map(),
  lade = new Map<string, string>(),
) {
  return maakOpslag<SpeeltuinWerk>({
    site: 'play',
    naam: 'speeltuin',
    delen: ['code', 'modus'],
    kast: {
      get: async (k) => kast.get(k),
      set: async (k, w) => {
        kast.set(k, w);
      },
      del: async (k) => {
        kast.delete(k);
      },
    },
    lade: {
      getItem: (k) => lade.get(k) ?? null,
      setItem: (k, w) => {
        lade.set(k, w);
      },
      removeItem: (k) => {
        lade.delete(k);
      },
    },
  });
}

describe('kiesBegin', () => {
  const pad = '/play/speeltuin';
  const link = `#${adres('import play\n# van een ander\n')}`;
  const sleutel = (o: ReturnType<typeof opslagInGeheugen>) =>
    veldSleutel(pad, o.zaadVan(SPEELTUIN_START), 0);

  it('een link met eigen werk in de opslag: gedeeld, het eigen werk blijft staan', async () => {
    const o = opslagInGeheugen();
    await o.bewaar(
      sleutel(o),
      { code: 'import play\n# eigen\n', modus: 'play' },
      SPEELTUIN_START,
      o.zaadVan(SPEELTUIN_START),
    );
    expect((await kiesBegin(link, null, pad, o)).gedeeld).toBe(true);
  });

  it('een link zonder eigen werk: wordt het eigen werk (zo bleef de code van vóór de opslag bewaard)', async () => {
    const begin = await kiesBegin(link, null, pad, opslagInGeheugen());
    expect(begin).toEqual({
      code: 'import play\n# van een ander\n',
      modus: 'play',
      gedeeld: false,
    });
  });

  it('een noodkopie telt als eigen werk', async () => {
    const o = opslagInGeheugen();
    o.zetNood(
      sleutel(o),
      { code: 'import play\n# net getypt\n', modus: 'play' },
      o.zaadVan(SPEELTUIN_START),
    );
    expect((await kiesBegin(link, null, pad, o)).gedeeld).toBe(true);
  });

  it('een database die niet antwoordt of faalt: voorzichtig, gedeeld', async () => {
    const hangt = maakOpslag<SpeeltuinWerk>({
      site: 'play',
      naam: 'speeltuin',
      delen: ['code', 'modus'],
      kast: { get: () => new Promise(() => {}), set: async () => {}, del: async () => {} },
      lade: null,
    });
    expect((await kiesBegin(link, null, pad, hangt, 20)).gedeeld).toBe(true);
    const faalt = maakOpslag<SpeeltuinWerk>({
      site: 'play',
      naam: 'speeltuin',
      delen: ['code', 'modus'],
      kast: {
        get: async () => {
          throw new Error('geweigerd');
        },
        set: async () => {},
        del: async () => {},
      },
      lade: null,
    });
    expect((await kiesBegin(link, null, pad, faalt)).gedeeld).toBe(true);
  });

  it('je eigen adres in een nieuwe tab: de code is gelijk aan het bewaarde werk, dus eigen', async () => {
    // Eerst kreeg je dan de balk "komt uit een link" bij je eigen werk, en
    // bewaarde de speeltuin niets.
    const werk = { code: 'import play\n# van een ander\n', modus: 'play' };
    const o = opslagInGeheugen();
    await o.bewaar(sleutel(o), werk, SPEELTUIN_START, o.zaadVan(SPEELTUIN_START));
    expect((await kiesBegin(link, null, pad, o)).gedeeld).toBe(false);
    // Dezelfde code met een andere bibliotheek is ander werk.
    const pygame = `#${adres('import play\n# van een ander\n', 'pygame')}`;
    expect((await kiesBegin(pygame, null, pad, o)).gedeeld).toBe(true);
    // En een noodkopie met dezelfde code telt ook als eigen.
    const metNood = opslagInGeheugen();
    metNood.zetNood(sleutel(metNood), werk, metNood.zaadVan(SPEELTUIN_START));
    expect((await kiesBegin(link, null, pad, metNood)).gedeeld).toBe(false);
  });

  it('zonder link of met het eigen adres kijkt hij niet in de opslag', async () => {
    expect(await kiesBegin('', null, pad, opslagInGeheugen())).toEqual({
      ...SPEELTUIN_START,
      gedeeld: false,
    });
    const eigen = adres('import play\n# mijn werk\n');
    expect((await kiesBegin(`#${eigen}`, eigen, pad, opslagInGeheugen())).gedeeld).toBe(false);
  });
});

describe('neemOver', () => {
  const pad = '/play/speeltuin';
  const gedeeld = {
    code: 'import play\n# startcode van de docent\n# mijn uur werk\n',
    modus: 'play',
  };

  it('maakt de code uit de link het eigen werk, ook als er een oude noodkopie lag', async () => {
    const o = opslagInGeheugen();
    const zaad = o.zaadVan(SPEELTUIN_START);
    const sleutel = veldSleutel(pad, zaad, 0);
    await o.bewaar(
      sleutel,
      { code: 'import play\n# oud eigen werk\n', modus: 'play' },
      SPEELTUIN_START,
      zaad,
    );
    // De noodkopie gaat bij het laden vóór de database: bleef hij liggen,
    // dan stond het oude werk er na de knop weer.
    o.zetNood(sleutel, { code: 'import play\n# oude noodkopie\n', modus: 'play' }, zaad);

    await neemOver(o, pad, gedeeld);

    expect(await o.laad(sleutel, zaad)).toEqual(gedeeld);
    expect(o.leesNood(sleutel, zaad)).toBeUndefined();
    // En de link zelf is daarna geen gedeelde link meer.
    expect((await kiesBegin(`#${adres(gedeeld.code)}`, null, pad, o)).gedeeld).toBe(false);
  });

  it('laat het oude werk en de noodkopie staan als het bewaren mislukt', async () => {
    const lade = new Map<string, string>();
    const faalt = maakOpslag<SpeeltuinWerk>({
      site: 'play',
      naam: 'speeltuin',
      delen: ['code', 'modus'],
      kast: {
        get: async () => undefined,
        set: async () => {
          throw new Error('vol');
        },
        del: async () => {},
      },
      lade: {
        getItem: (k) => lade.get(k) ?? null,
        setItem: (k, w) => {
          lade.set(k, w);
        },
        removeItem: (k) => {
          lade.delete(k);
        },
      },
    });
    const zaad = faalt.zaadVan(SPEELTUIN_START);
    const sleutel = veldSleutel(pad, zaad, 0);
    const oud = { code: 'import play\n# oude noodkopie\n', modus: 'play' };
    faalt.zetNood(sleutel, oud, zaad);
    await expect(neemOver(faalt, pad, gedeeld)).rejects.toThrow('vol');
    expect(faalt.leesNood(sleutel, zaad)).toEqual(oud);
  });
});

describe('isEigenCode', () => {
  it('de startcode van beide bibliotheken en een voorbeeld zijn geen eigen code', () => {
    // Na alleen wisselen naar pygame-ce staat de startcode van play er nog:
    // daar vroeg Reset eerst bevestiging voor.
    expect(isEigenCode(DEFAULT_CODE_PLAY, [])).toBe(false);
    expect(isEigenCode(DEFAULT_CODE_PYGAME, [])).toBe(false);
    expect(isEigenCode('import play\n# voorbeeld\n', ['import play\n# voorbeeld\n'])).toBe(false);
    expect(isEigenCode(`${DEFAULT_CODE_PLAY}# eigen\n`, [])).toBe(true);
  });

  it('een lege editor is geen eigen code: Reset vraagt dan niets', () => {
    expect(isEigenCode('', [])).toBe(false);
    expect(isEigenCode('  \n\n', [])).toBe(false);
  });
});

describe('adresZonderLink', () => {
  it('laat de code uit de link weg, en houdt pad en zoekdeel', () => {
    expect(adresZonderLink({ pathname: '/play/speeltuin', search: '' })).toBe('/play/speeltuin');
    expect(adresZonderLink({ pathname: '/play/speeltuin', search: '?x=1' })).toBe(
      '/play/speeltuin?x=1',
    );
  });

  it('de knop op de pagina laadt dat adres helemaal opnieuw', () => {
    // Een klik op Speeltuin in het menu deed vanaf een gedeelde link niets:
    // hetzelfde pad, dus Docusaurus laadde de pagina niet opnieuw.
    const pagina = readFileSync(
      fileURLToPath(new URL('../pages/speeltuin.tsx', import.meta.url)),
      'utf8',
    );
    expect(pagina).toContain('window.location.assign(adresZonderLink(window.location))');
    expect(pagina).toContain('Naar mijn eigen code');
    expect(pagina).not.toContain('open de Speeltuin via het menu');
  });

  it('bij een gedeelde link zegt de pagina wat er echt gebeurt', () => {
    const pagina = readFileSync(
      fileURLToPath(new URL('../pages/speeltuin.tsx', import.meta.url)),
      'utf8',
    );
    // Je kunt de code uit de link houden, en weggaan vraagt het eerst als je
    // hem bewerkt hebt.
    expect(pagina).toContain('Bewaar deze code als de mijne');
    expect(pagina).toContain('await neemOver(speeltuinOpslag, window.location.pathname, werk)');
    expect(pagina).toMatch(/gedeeldBewerkt &&\s*!\(await bevestig\(/);
    // Reset en een voorbeeld beloven daar niet dat de bewaarde versie weggaat.
    expect(pagina.match(/Je eigen bewaarde code blijft staan\./g)).toHaveLength(2);
    // De melding staat er één keer, niet ook nog in het uitvoervak.
    expect(pagina.match(/Deze code komt uit een link/g)).toHaveLength(1);
    // Niet bewaard staat in een balk, ook terwijl een spel draait.
    expect(pagina).toMatch(/\{nietBewaard && \(\s*<div className=\{styles\.balk\} role="alert">/);
  });
});

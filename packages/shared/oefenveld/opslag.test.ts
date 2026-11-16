import { beforeEach, describe, expect, it } from 'vitest';
import { storageKey } from '../opslag';
import { type Kast, type Lade, VERSIE, maakOpslag, soortFout, veldSleutel } from './opslag';

// Zonder IndexedDB in node vervangt één Map de database, en één Map de
// localStorage van de noodkopie. `faal` laat een schrijfactie mislukken zoals
// een volle browser dat doet.
const data = new Map<string, unknown>();
const nood = new Map<string, string>();
let faal: Error | null = null;

const kast: Kast = {
  get: async (sleutel) => data.get(sleutel),
  set: async (sleutel, waarde) => {
    if (faal) throw faal;
    data.set(sleutel, waarde);
  },
  del: async (sleutel) => {
    data.delete(sleutel);
  },
};
const lade: Lade = {
  getItem: (sleutel) => nood.get(sleutel) ?? null,
  setItem: (sleutel, waarde) => {
    if (faal) throw faal;
    nood.set(sleutel, waarde);
  },
  removeItem: (sleutel) => {
    nood.delete(sleutel);
  },
};

interface Web extends Record<string, string> {
  html: string;
  css: string;
  js: string;
}
const opslag = maakOpslag<Web>({
  site: 'web',
  naam: 'oefenvelden',
  delen: ['html', 'css', 'js'],
  kast,
  lade,
});

const start: Web = { html: '<p>Hoi</p>', css: 'p { color: red; }', js: '' };
const zaad = opslag.zaadVan(start);
const sleutel = veldSleutel('/docs/html-css/css-klassen', zaad, 0);

beforeEach(() => {
  data.clear();
  nood.clear();
  faal = null;
});

describe('bewaren en terugladen', () => {
  it('geeft het bewaarde werk terug', async () => {
    const werk = { ...start, html: '<p>Hallo wereld</p>' };
    await opslag.bewaar(sleutel, werk, start, zaad);

    expect(await opslag.laad(sleutel, zaad)).toEqual(werk);
  });

  it('laat niets achter als de code gelijk is aan de start', async () => {
    await opslag.bewaar(sleutel, { ...start, css: '' }, start, zaad);
    await opslag.bewaar(sleutel, start, start, zaad);

    expect(data.size).toBe(0);
  });

  it('wist het veld bij Reset', async () => {
    await opslag.bewaar(sleutel, { ...start, js: 'x' }, start, zaad);
    await opslag.wis(sleutel);

    expect(await opslag.laad(sleutel, zaad)).toBeUndefined();
  });
});

describe('herkent alleen werk dat bij dit veld hoort', () => {
  it('niet als de startcode veranderd is', async () => {
    await opslag.bewaar(sleutel, { ...start, html: 'oud werk' }, start, zaad);

    const nieuw = opslag.zaadVan({ ...start, html: '<p>Nieuw</p>' });
    expect(await opslag.laad(sleutel, nieuw)).toBeUndefined();
  });

  it('niet bij een andere versie of een kapotte waarde', async () => {
    data.set(sleutel, { versie: VERSIE + 1, zaad, html: '', css: '', js: '' });
    expect(await opslag.laad(sleutel, zaad)).toBeUndefined();

    data.set(sleutel, 'geen object');
    expect(await opslag.laad(sleutel, zaad)).toBeUndefined();

    data.set(sleutel, { versie: VERSIE, zaad, html: '' });
    expect(await opslag.laad(sleutel, zaad)).toBeUndefined();
  });
});

describe('wat web eerder bewaarde, blijft leesbaar', () => {
  // De opslag stond bij de CodeEditor van web, met idb-keyval. Verandert het
  // zaad, de sleutel of de vorm van een regel, dan is het werk van elke
  // leerling in één keer onvindbaar. Deze waarden komen van de oude code.
  it('hetzelfde zaad voor dezelfde startcode', () => {
    expect(zaad).toBe('a966470c7821b');
  });

  it('dezelfde sleutel', () => {
    expect(sleutel).toBe('/docs/html-css/css-klassen|a966470c7821b|0');
  });

  it('leest een regel in de vorm van toen, en schrijft hem zo', async () => {
    const toen = { versie: 1, zaad, html: 'a', css: 'b', js: 'c', opgeslagenOp: 1700000000000 };
    data.set(sleutel, toen);
    expect(await opslag.laad(sleutel, zaad)).toEqual({ html: 'a', css: 'b', js: 'c' });

    await opslag.bewaar(sleutel, { html: 'a', css: 'b', js: 'c' }, start, zaad, 1700000000000);
    expect(data.get(sleutel)).toEqual(toen);
  });

  it('de database heet zoals createStore van idb-keyval hem noemde', async () => {
    const namen: string[] = [];
    const stores: string[] = [];
    // Alleen wat idbKast aanroept: open, en een transactie met één vraag.
    const db = {
      transaction: (store: string) => {
        stores.push(store);
        const tx: { oncomplete?: () => void; objectStore: () => unknown } = {
          objectStore: () => ({
            get: () => {
              queueMicrotask(() => tx.oncomplete?.());
              return { result: undefined };
            },
          }),
        };
        return tx;
      },
    };
    const eerder = globalThis.indexedDB;
    Object.defineProperty(globalThis, 'indexedDB', {
      configurable: true,
      value: {
        open: (naam: string) => {
          namen.push(naam);
          const vraag: { result: unknown; onsuccess?: () => void } = { result: db };
          queueMicrotask(() => vraag.onsuccess?.());
          return vraag;
        },
      },
    });
    try {
      const echt = maakOpslag<Web>({
        site: 'web',
        naam: 'oefenvelden',
        delen: ['html', 'css', 'js'],
      });
      await echt.laad(sleutel, zaad);
    } finally {
      Object.defineProperty(globalThis, 'indexedDB', { configurable: true, value: eerder });
    }
    expect(namen).toEqual([storageKey('web', 'oefenvelden')]);
    expect(namen).toEqual(['coderius:web:oefenvelden']);
    expect(stores).toEqual(['velden']);
  });
});

describe('zaadVan', () => {
  it('is stabiel en verandert bij één teken verschil', () => {
    expect(opslag.zaadVan(start)).toBe(opslag.zaadVan({ ...start }));
    expect(opslag.zaadVan({ ...start, html: '<p>Hoi.</p>' })).not.toBe(zaad);
    expect(opslag.zaadVan({ ...start, css: 'p { color: blue; }' })).not.toBe(zaad);
    expect(opslag.zaadVan({ ...start, js: ' ' })).not.toBe(zaad);
  });

  it('haalt de grenzen tussen html, css en js niet door elkaar', () => {
    expect(opslag.zaadVan({ html: 'ab', css: 'c', js: '' })).not.toBe(
      opslag.zaadVan({ html: 'a', css: 'bc', js: '' }),
    );
  });
});

describe('veldSleutel', () => {
  it('onderscheidt velden met dezelfde startcode op één pagina', () => {
    expect(veldSleutel('/docs/js-basics/loops', zaad, 0)).not.toBe(
      veldSleutel('/docs/js-basics/loops', zaad, 1),
    );
  });

  it('is gelijk met en zonder slash aan het eind', () => {
    expect(veldSleutel('/docs/js-basics/loops/', zaad, 0)).toBe(
      veldSleutel('/docs/js-basics/loops', zaad, 0),
    );
  });
});

describe('een volle of weigerende browser', () => {
  it('meldt de fout in plaats van hem in te slikken', async () => {
    faal = new DOMException('vol', 'QuotaExceededError');

    await expect(opslag.bewaar(sleutel, { ...start, js: 'x' }, start, zaad)).rejects.toThrow();
  });

  it('onderscheidt vol van geweigerd', () => {
    expect(soortFout(new DOMException('vol', 'QuotaExceededError'))).toBe('vol');
    expect(soortFout(new DOMException('nee', 'InvalidStateError'))).toBe('geweigerd');
    expect(soortFout(undefined)).toBe('geweigerd');
  });
});

describe('de noodkopie', () => {
  const werk = { ...start, html: '<p>Net getypt</p>' };

  it('is meteen terug te lezen, zonder op de database te wachten', () => {
    opslag.zetNood(sleutel, werk, zaad);

    expect(opslag.leesNood(sleutel, zaad)).toEqual(werk);
    expect([...nood.keys()]).toEqual([`coderius:web:oefenvelden-nood|${sleutel}`]);
  });

  it('hoort bij één veld en één startcode', () => {
    opslag.zetNood(sleutel, werk, zaad);

    expect(opslag.leesNood(veldSleutel('/docs/andere-les', zaad, 0), zaad)).toBeUndefined();
    expect(opslag.leesNood(sleutel, opslag.zaadVan({ ...start, js: 'x' }))).toBeUndefined();
  });

  it('laat een nieuwere kopie staan', () => {
    const eerste = opslag.zetNood(sleutel, werk, zaad);
    opslag.zetNood(sleutel, { ...werk, css: 'nieuwer' }, zaad);
    opslag.wisNood(sleutel, eerste);
    expect(opslag.leesNood(sleutel, zaad)).toEqual({ ...werk, css: 'nieuwer' });

    opslag.wisNood(sleutel);
    expect(opslag.leesNood(sleutel, zaad)).toBeUndefined();
  });

  it('een volle of kapotte localStorage is geen fout', () => {
    faal = new DOMException('vol', 'QuotaExceededError');
    expect(opslag.zetNood(sleutel, werk, zaad)).toBeNull();
    faal = null;

    nood.set(`coderius:web:oefenvelden-nood|${sleutel}`, '{geen json');
    expect(opslag.leesNood(sleutel, zaad)).toBeUndefined();
  });

  it('zonder localStorage doet hij niets', () => {
    const zonder = maakOpslag<Web>({
      site: 'web',
      naam: 'oefenvelden',
      delen: ['html', 'css', 'js'],
      kast,
      lade: null,
    });
    expect(zonder.zetNood(sleutel, werk, zaad)).not.toBeNull();
    expect(zonder.leesNood(sleutel, zaad)).toBeUndefined();
    zonder.wisNood(sleutel);
  });
});

describe('een veld met één stuk code (python)', () => {
  const py = maakOpslag<{ code: string }>({
    site: 'python',
    naam: 'oefenvelden',
    delen: ['code'],
    kast,
    lade,
  });

  it('bewaart en leest', async () => {
    const leeg = { code: '' };
    const z = py.zaadVan(leeg);
    const s = veldSleutel('/python/docs/basis/les', z, 2);
    await py.bewaar(s, { code: 'print("hoi")' }, leeg, z);

    expect(await py.laad(s, z)).toEqual({ code: 'print("hoi")' });
    expect(await py.laad(veldSleutel('/python/docs/basis/les', z, 1), z)).toBeUndefined();
  });
});

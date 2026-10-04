import { beforeEach, describe, expect, it, vi } from 'vitest';

// Zonder IndexedDB in node vervangt één Map de database, zoals in
// packages/editor/src/vfs/store.test.ts. `faal` laat een schrijfactie mislukken
// zoals een volle browser dat doet.
const idb = vi.hoisted(() => ({
  data: new Map<string, unknown>(),
  faal: null as Error | null,
}));

vi.mock('idb-keyval', () => ({
  createStore: () => ({}),
  get: async (key: string) => idb.data.get(key),
  set: async (key: string, value: unknown) => {
    if (idb.faal) throw idb.faal;
    idb.data.set(key, value);
  },
  del: async (key: string) => {
    idb.data.delete(key);
  },
}));

import { VERSIE, bewaarVeld, laadVeld, soortFout, veldSleutel, wisVeld, zaadVan } from './opslag';

const start = { html: '<p>Hoi</p>', css: 'p { color: red; }', js: '' };
const zaad = zaadVan(start);
const sleutel = veldSleutel('/docs/html-css/css-klassen', zaad, 0);

beforeEach(() => {
  idb.data.clear();
  idb.faal = null;
});

describe('bewaren en terugladen', () => {
  it('geeft het bewaarde werk terug', async () => {
    const werk = { ...start, html: '<p>Hallo wereld</p>' };
    await bewaarVeld(sleutel, werk, start, zaad);

    expect(await laadVeld(sleutel, zaad)).toEqual(werk);
  });

  it('laat niets achter als de code gelijk is aan de start', async () => {
    await bewaarVeld(sleutel, { ...start, css: '' }, start, zaad);
    await bewaarVeld(sleutel, start, start, zaad);

    expect(idb.data.size).toBe(0);
  });

  it('wist het veld bij Reset', async () => {
    await bewaarVeld(sleutel, { ...start, js: 'x' }, start, zaad);
    await wisVeld(sleutel);

    expect(await laadVeld(sleutel, zaad)).toBeUndefined();
  });
});

describe('herkent alleen werk dat bij dit veld hoort', () => {
  it('niet als de startcode veranderd is', async () => {
    await bewaarVeld(sleutel, { ...start, html: 'oud werk' }, start, zaad);

    expect(await laadVeld(sleutel, zaadVan({ ...start, html: '<p>Nieuw</p>' }))).toBeUndefined();
  });

  it('niet bij een andere versie of een kapotte waarde', async () => {
    idb.data.set(sleutel, { versie: VERSIE + 1, zaad, html: '', css: '', js: '' });
    expect(await laadVeld(sleutel, zaad)).toBeUndefined();

    idb.data.set(sleutel, 'geen object');
    expect(await laadVeld(sleutel, zaad)).toBeUndefined();

    idb.data.set(sleutel, { versie: VERSIE, zaad, html: '' });
    expect(await laadVeld(sleutel, zaad)).toBeUndefined();
  });
});

describe('zaadVan', () => {
  it('is stabiel en verandert bij één teken verschil', () => {
    expect(zaadVan(start)).toBe(zaadVan({ ...start }));
    expect(zaadVan({ ...start, html: '<p>Hoi.</p>' })).not.toBe(zaad);
    expect(zaadVan({ ...start, css: 'p { color: blue; }' })).not.toBe(zaad);
    expect(zaadVan({ ...start, js: ' ' })).not.toBe(zaad);
  });

  it('haalt de grenzen tussen html, css en js niet door elkaar', () => {
    expect(zaadVan({ html: 'ab', css: 'c', js: '' })).not.toBe(
      zaadVan({ html: 'a', css: 'bc', js: '' }),
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
    idb.faal = new DOMException('vol', 'QuotaExceededError');

    await expect(bewaarVeld(sleutel, { ...start, js: 'x' }, start, zaad)).rejects.toThrow();
  });

  it('onderscheidt vol van geweigerd', () => {
    expect(soortFout(new DOMException('vol', 'QuotaExceededError'))).toBe('vol');
    expect(soortFout(new DOMException('nee', 'InvalidStateError'))).toBe('geweigerd');
    expect(soortFout(undefined)).toBe('geweigerd');
  });
});

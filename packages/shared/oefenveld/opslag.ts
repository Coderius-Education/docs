import { storageKey } from '../opslag';

// Het werk in een oefenveld was weg zodra je de pagina ververste of de
// browser sloot. Elk veld bewaart zijn code daarom in de IndexedDB van deze
// browser, net als de projecten in de Online Editor (packages/editor). Niet
// in localStorage: dat is synchroon, gedeeld met alles op het domein en
// begrensd op ~5 MB; IndexedDB krijgt een deel van de vrije schijfruimte.
//
// Het blijft opslag op dit apparaat, in deze browser. Wissen van de
// sitegegevens, een privévenster of een Chromebook die bij afmelden leeg
// wordt gemaakt, en het werk is weg.
//
// Eerst stond dit bij de CodeEditor van web. Het veld van python bewaarde
// niets (issue 216); nu delen ze deze opslag, elk met zijn eigen database.

/** De code van een veld: bij web html, css en js, bij python alleen code. */
export type Code = Record<string, string>;

export const VERSIE = 1;

/**
 * Waar het werk staat: de IndexedDB van de browser, of in een test een Map.
 */
export interface Kast {
  get(sleutel: string): Promise<unknown>;
  set(sleutel: string, waarde: unknown): Promise<void>;
  del(sleutel: string): Promise<void>;
}

/**
 * De noodkopie staat in localStorage, of in een test in een Map.
 */
export interface Lade {
  getItem(sleutel: string): string | null;
  setItem(sleutel: string, waarde: string): void;
  removeItem(sleutel: string): void;
}

/**
 * Een database met één object store, zoals `createStore` van idb-keyval hem
 * maakte: wat web daar eerder mee bewaarde, staat in dezelfde database en
 * dezelfde store, en blijft dus leesbaar.
 */
export function idbKast(database: string, store: string): Kast {
  let open: Promise<IDBDatabase> | undefined;
  // Pas bij het eerste gebruik: de database openen hoort niet te gebeuren
  // bij het importeren (tests, server-render).
  const db = () => {
    open ??= new Promise<IDBDatabase>((ok, nee) => {
      const vraag = indexedDB.open(database);
      vraag.onupgradeneeded = () => vraag.result.createObjectStore(store);
      vraag.onsuccess = () => {
        // Sluit de browser de verbinding (opruimen, een andere versie), dan
        // opent de volgende vraag hem opnieuw.
        vraag.result.onclose = () => {
          open = undefined;
        };
        ok(vraag.result);
      };
      vraag.onerror = () => nee(vraag.error);
    }).catch((fout: unknown) => {
      // Een mislukte poging niet bewaren: de volgende probeert het opnieuw.
      open = undefined;
      throw fout;
    });
    return open;
  };
  const doe = async <T>(
    soort: IDBTransactionMode,
    werk: (s: IDBObjectStore) => IDBRequest<T>,
  ): Promise<T> => {
    const verbinding = await db();
    return new Promise<T>((ok, nee) => {
      const tx = verbinding.transaction(store, soort);
      const vraag = werk(tx.objectStore(store));
      tx.oncomplete = () => ok(vraag.result);
      tx.onabort = () => nee(tx.error ?? vraag.error);
      tx.onerror = () => nee(tx.error ?? vraag.error);
    });
  };
  return {
    get: (sleutel) => doe('readonly', (s) => s.get(sleutel)),
    set: async (sleutel, waarde) => {
      await doe('readwrite', (s) => s.put(waarde, sleutel));
    },
    del: async (sleutel) => {
      await doe('readwrite', (s) => s.delete(sleutel));
    },
  };
}

// cyrb53: kort, snel en goed genoeg verspreid om startcode te herkennen. Geen
// beveiliging, alleen een naam.
function cyrb53(tekst: string): string {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < tekst.length; i++) {
    const c = tekst.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 2654435761);
    h2 = Math.imul(h2 ^ c, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16);
}

// Een veld heeft geen eigen id in de MDX. Pad plus zaad onderscheidt de
// velden meestal, maar opdrachten hergebruiken vaak dezelfde startcode (loops
// van web heeft er drie van, een les van python drie lege velden). Daarom
// telt `n` welk veld met dit zaad het is, van boven naar beneden. Komt er een
// veld met dezelfde startcode tussen, dan schuift het werk één veld op.
export function veldSleutel(pad: string, zaad: string, n: number): string {
  const schoon = pad.replace(/\/+$/, '') || '/';
  return `${schoon}|${zaad}|${n}`;
}

// 'vol': de browser heeft geen ruimte meer voor deze site. 'geweigerd': er
// mag niets bewaard worden, bijvoorbeeld in een privévenster van een oudere
// Firefox of met geblokkeerde sitegegevens.
export type Fout = 'vol' | 'geweigerd';

export function soortFout(fout: unknown): Fout {
  const naam = (fout as { name?: unknown } | null)?.name;
  return naam === 'QuotaExceededError' ? 'vol' : 'geweigerd';
}

export interface Opslag<C extends Code> {
  /**
   * De vingerafdruk van de startcode. Past een docent de startcode aan, dan
   * hoort het veld opnieuw te beginnen: oud werk op nieuwe startcode zou de
   * opdracht niet meer passen. Het oude werk blijft dan wel in de database
   * staan, alleen vindt het veld het niet meer.
   */
  zaadVan(code: C): string;
  gelijk(a: C, b: C): boolean;
  laad(sleutel: string, zaad: string): Promise<C | undefined>;
  /**
   * Is de code weer gelijk aan de start (Reset, of alles teruggetypt), dan is
   * er niets te bewaren en ruimt het veld zijn regel op. Een veld dat je
   * alleen bekeek, laat zo niets achter.
   */
  bewaar(sleutel: string, code: C, start: C, zaad: string, nu?: number): Promise<void>;
  wis(sleutel: string): Promise<void>;
  /**
   * De noodkopie: wat er nog niet bewaard was op het moment dat de pagina
   * sluit. Een schrijfactie naar IndexedDB die bij `pagehide` begint, breekt
   * de browser af als de pagina weg is: wie typte en binnen een halve seconde
   * herlaadde, was dat laatste werk kwijt. localStorage schrijft meteen. Het
   * veld leest de kopie bij het volgende laden, zet hem in de database en
   * gooit hem weg. Geeft terug wat er geschreven is, voor `wisNood`.
   */
  zetNood(sleutel: string, code: C, zaad: string): string | null;
  leesNood(sleutel: string, zaad: string): C | undefined;
  /** Alleen als de kopie nog `ruw` is: een nieuwere blijft staan. */
  wisNood(sleutel: string, ruw?: string | null): void;
}

interface Opties<C extends Code> {
  /** Het registry-id van de site: alle cursussen van een vak delen één origin. */
  site: string;
  /** De naam van de database binnen de site, bv. 'oefenvelden'. */
  naam: string;
  /** De delen van de code, in vaste volgorde: daar hangt het zaad aan. */
  delen: readonly (keyof C & string)[];
  kast?: Kast;
  lade?: Lade | null;
}

function ladeVanBrowser(): Lade | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    // Met geblokkeerde sitegegevens gooit alleen al het opvragen.
    return null;
  }
}

export function maakOpslag<C extends Code>(opties: Opties<C>): Opslag<C> {
  const { site, naam, delen } = opties;
  let kast = opties.kast;
  const deKast = () => {
    kast ??= idbKast(storageKey(site, naam), 'velden');
    return kast;
  };
  const deLade = () => (opties.lade === undefined ? ladeVanBrowser() : opties.lade);
  const noodSleutel = (sleutel: string) => storageKey(site, `${naam}-nood|${sleutel}`);

  const heeftDelen = (waarde: object): boolean =>
    delen.every((deel) => typeof (waarde as Record<string, unknown>)[deel] === 'string');
  const alleenDelen = (waarde: object): C =>
    Object.fromEntries(delen.map((deel) => [deel, (waarde as C)[deel]])) as unknown as C;
  const isBewaard = (waarde: unknown, zaad: string): waarde is C => {
    if (typeof waarde !== 'object' || waarde === null) return false;
    const w = waarde as { versie?: unknown; zaad?: unknown };
    return w.versie === VERSIE && w.zaad === zaad && heeftDelen(waarde);
  };
  const gelijk = (a: C, b: C) => delen.every((deel) => a[deel] === b[deel]);

  return {
    // Een scheidingsteken dat in code niet voorkomt, anders geven ('ab', 'c')
    // en ('a', 'bc') dezelfde afdruk.
    zaadVan: (code) => cyrb53(delen.map((deel) => code[deel]).join('\u0000')),
    gelijk,
    async laad(sleutel, zaad) {
      const waarde = await deKast().get(sleutel);
      return isBewaard(waarde, zaad) ? alleenDelen(waarde) : undefined;
    },
    async bewaar(sleutel, code, start, zaad, nu = Date.now()) {
      if (gelijk(code, start)) {
        await deKast().del(sleutel);
        return;
      }
      // Voor als er ooit opgeruimd moet worden; een veld is een paar kB, dus
      // honderd velden blijven ruim onder een MB en dat is nu niet nodig.
      await deKast().set(sleutel, { versie: VERSIE, zaad, ...alleenDelen(code), opgeslagenOp: nu });
    },
    wis: (sleutel) => deKast().del(sleutel),
    zetNood(sleutel, code, zaad) {
      const ruw = JSON.stringify({ versie: VERSIE, zaad, ...alleenDelen(code) });
      try {
        deLade()?.setItem(noodSleutel(sleutel), ruw);
        return ruw;
      } catch {
        // Vol of geweigerd: dan is er geen noodkopie.
        return null;
      }
    },
    leesNood(sleutel, zaad) {
      try {
        const ruw = deLade()?.getItem(noodSleutel(sleutel));
        if (!ruw) return undefined;
        const waarde: unknown = JSON.parse(ruw);
        return isBewaard(waarde, zaad) ? alleenDelen(waarde) : undefined;
      } catch {
        return undefined;
      }
    },
    wisNood(sleutel, ruw) {
      try {
        const lade = deLade();
        if (!lade) return;
        if (ruw !== undefined && lade.getItem(noodSleutel(sleutel)) !== ruw) return;
        lade.removeItem(noodSleutel(sleutel));
      } catch {
        // Niets te wissen.
      }
    },
  };
}

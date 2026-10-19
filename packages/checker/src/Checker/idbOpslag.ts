import type { Bak, Beoordeling, Opslag, Project } from '../beoordelingen';

// De opslag van beoordelingen in IndexedDB: blijft staan na herladen en na
// het sluiten van de browser, en verlaat de computer van de docent niet.
// localStorage is te klein voor een project met foto's (5 MB per origin, en
// die origin delen alle cursussen van het vak).

const VERSIE = 1;
const BEOORDELINGEN = 'beoordelingen';
const PROJECTEN = 'projecten';

function verzoek<T>(r: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
}

function openDatabase(naam: string): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const r = indexedDB.open(naam, VERSIE);
    r.onupgradeneeded = () => {
      const db = r.result;
      if (!db.objectStoreNames.contains(BEOORDELINGEN)) db.createObjectStore(BEOORDELINGEN);
      if (!db.objectStoreNames.contains(PROJECTEN)) db.createObjectStore(PROJECTEN);
    };
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
    r.onblocked = () => reject(new Error('De database is in een ander tabblad nog open.'));
  });
}

function bak<T>(db: IDBDatabase, store: string): Bak<T> {
  const met = <R>(modus: IDBTransactionMode, doe: (s: IDBObjectStore) => IDBRequest<R>) =>
    verzoek(doe(db.transaction(store, modus).objectStore(store)));
  return {
    alle: () => met('readonly', (s) => s.getAll() as IDBRequest<T[]>),
    sleutels: async () => (await met('readonly', (s) => s.getAllKeys())).map((k) => String(k)),
    lees: (id) => met('readonly', (s) => s.get(id) as IDBRequest<T | undefined>),
    schrijf: async (id, waarde) => {
      await met('readwrite', (s) => s.put(waarde, id));
    },
    wis: async (id) => {
      await met('readwrite', (s) => s.delete(id));
    },
  };
}

/**
 * Opent de opslag, of gooit als de browser geen IndexedDB toestaat (een
 * privévenster in sommige browsers, of geblokkeerde sitegegevens). De
 * aanroeper valt dan terug op geheugenOpslag() en zegt dat erbij.
 */
export async function idbOpslag(naam: string): Promise<Opslag> {
  if (typeof indexedDB === 'undefined') throw new Error('Geen IndexedDB in deze browser.');
  const db = await openDatabase(naam);
  // Wil een nieuwere versie van de pagina de database bijwerken, dan geeft
  // dit tabblad hem vrij in plaats van hem te blokkeren; anders valt de
  // nieuwe pagina terug op geheugen en ziet de docent zijn lijst niet.
  db.onversionchange = () => db.close();
  return {
    beoordelingen: bak<Beoordeling>(db, BEOORDELINGEN),
    projecten: bak<Project>(db, PROJECTEN),
    sluit: () => db.close(),
  };
}

import type { Beoordeling, Opslag, Project } from '../beoordelingen';
import { wachtOpTransactie } from '../transactie';

// De opslag van beoordelingen in IndexedDB: blijft staan na herladen en na
// het sluiten van de browser, en verlaat de computer van de docent niet.
// localStorage is te klein voor een project met foto's (5 MB per origin, en
// die origin delen alle cursussen van het vak).
//
// Elke actie is pas klaar als de transactie is afgerond, niet als het
// verzoek slaagt: een volle opslag meldt zich vaak pas bij het afronden.

const VERSIE = 1;
const BEOORDELINGEN = 'beoordelingen';
const PROJECTEN = 'projecten';

function openDatabase(naam: string): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const r = indexedDB.open(naam, VERSIE);
    r.onupgradeneeded = () => {
      const db = r.result;
      if (!db.objectStoreNames.contains(BEOORDELINGEN)) db.createObjectStore(BEOORDELINGEN);
      if (!db.objectStoreNames.contains(PROJECTEN)) db.createObjectStore(PROJECTEN);
    };
    // Geblokkeerd door een ander tabblad: de pagina valt terug op geheugen.
    // Het verzoek loopt dan nog door; gaat de database later toch open, dan
    // sluiten we hem meteen, anders blokkeert deze verbinding zonder eigenaar
    // op zijn beurt de volgende upgrade.
    let opgegeven = false;
    r.onsuccess = () => {
      if (opgegeven) r.result.close();
      else resolve(r.result);
    };
    r.onerror = () => reject(r.error);
    r.onblocked = () => {
      opgegeven = true;
      reject(new Error('De database is in een ander tabblad nog open.'));
    };
  });
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

  const tx = (stores: string[], modus: IDBTransactionMode) => db.transaction(stores, modus);

  return {
    alleBeoordelingen: async () => {
      const t = tx([BEOORDELINGEN], 'readonly');
      const r = t.objectStore(BEOORDELINGEN).getAll() as IDBRequest<Beoordeling[]>;
      return (await wachtOpTransactie(t, r)) ?? [];
    },
    leesProject: async (id) => {
      const t = tx([PROJECTEN], 'readonly');
      const r = t.objectStore(PROJECTEN).get(id) as IDBRequest<Project | undefined>;
      return wachtOpTransactie(t, r);
    },
    bewaarNieuw: async (b, p) => {
      const t = tx([BEOORDELINGEN, PROJECTEN], 'readwrite');
      t.objectStore(PROJECTEN).put(p, b.id);
      t.objectStore(BEOORDELINGEN).put(b, b.id);
      await wachtOpTransactie(t);
    },
    bewaarBeoordeling: async (b) => {
      const t = tx([BEOORDELINGEN], 'readwrite');
      t.objectStore(BEOORDELINGEN).put(b, b.id);
      await wachtOpTransactie(t);
    },
    wis: async (id) => {
      const t = tx([BEOORDELINGEN, PROJECTEN], 'readwrite');
      t.objectStore(BEOORDELINGEN).delete(id);
      t.objectStore(PROJECTEN).delete(id);
      await wachtOpTransactie(t);
    },
    sluit: () => db.close(),
  };
}

import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import { type ChangeEvent, type ReactNode, useEffect, useState } from 'react';
import {
  BRON_NIEUW,
  type OudeOpslagRegels,
  type Schrijfplan,
  leesBericht,
  oudeOrigin,
  schrijfplan,
} from '../../oude-opslag';
import styles from './styles.module.css';

// Ontvangt het werk van het oude subdomein (oude-opslag/pagina/) en bewaart
// het onder de sleutels die de site nu gebruikt. Wat hier al staat, blijft:
// een leerling die op het nieuwe adres verder werkte, raakt niets kwijt.

type Stand =
  | { soort: 'wachten' }
  | { soort: 'bezig' }
  | { soort: 'klaar'; nieuw: number; bestond: number }
  | { soort: 'fout'; tekst: string };

/** Open een database en zorg dat de store bestaat, zonder bestaande stores te raken. */
function openMetStore(naam: string, store: string): Promise<IDBDatabase> {
  return new Promise((klaar, mis) => {
    const eerste = indexedDB.open(naam);
    eerste.onupgradeneeded = () => eerste.result.createObjectStore(store);
    eerste.onerror = () => mis(eerste.error);
    eerste.onsuccess = () => {
      const db = eerste.result;
      if (db.objectStoreNames.contains(store)) return klaar(db);
      const versie = db.version + 1;
      db.close();
      const tweede = indexedDB.open(naam, versie);
      tweede.onupgradeneeded = () => tweede.result.createObjectStore(store);
      tweede.onerror = () => mis(tweede.error);
      tweede.onsuccess = () => klaar(tweede.result);
    };
  });
}

/** Voegt items toe die er nog niet zijn; geeft [nieuw, bestond]. */
async function voegToe(
  database: string,
  store: string,
  items: [IDBValidKey, unknown][],
): Promise<[number, number]> {
  const db = await openMetStore(database, store);
  return new Promise((klaar, mis) => {
    let nieuw = 0;
    let bestond = 0;
    const tx = db.transaction(store, 'readwrite');
    const os = tx.objectStore(store);
    for (const [sleutel, waarde] of items) {
      const verzoek = os.add(waarde, sleutel);
      verzoek.onsuccess = () => {
        nieuw += 1;
      };
      verzoek.onerror = (event) => {
        // Bestaat al: dat van het nieuwe adres wint. De transactie loopt door.
        if (verzoek.error?.name === 'ConstraintError') {
          event.preventDefault();
          bestond += 1;
        }
      };
    }
    tx.oncomplete = () => {
      db.close();
      klaar([nieuw, bestond]);
    };
    tx.onerror = () => {
      db.close();
      mis(tx.error);
    };
  });
}

async function bewaar(plan: Schrijfplan): Promise<Stand> {
  let nieuw = 0;
  let bestond = 0;
  for (const [sleutel, waarde] of plan.localStorage) {
    if (window.localStorage.getItem(sleutel) === null) {
      window.localStorage.setItem(sleutel, waarde);
      nieuw += 1;
    } else {
      bestond += 1;
    }
  }
  for (const { database, store, items } of plan.indexedDB) {
    const [n, b] = await voegToe(database, store, items);
    nieuw += n;
    bestond += b;
  }
  return { soort: 'klaar', nieuw, bestond };
}

export default function Overzetten(): ReactNode {
  const { siteConfig } = useDocusaurusContext();
  const siteId = siteConfig.customFields?.siteId as string;
  const regels = siteConfig.customFields?.oudeOpslag as OudeOpslagRegels;
  const verwacht = oudeOrigin(siteId, window.location);
  const [stand, setStand] = useState<Stand>({ soort: 'wachten' });

  useEffect(() => {
    const opener = window.opener as Window | null;
    if (!opener) return;
    let afgehandeld = false;

    function onMessage(event: MessageEvent) {
      // Alleen de oude pagina die ons opende, op precies de oude origin.
      if (afgehandeld || event.origin !== verwacht || event.source !== opener) return;
      const gelezen = leesBericht(event.data, siteId, regels);
      if (!gelezen) return;
      afgehandeld = true;
      setStand({ soort: 'bezig' });
      bewaar(schrijfplan(gelezen, siteId, regels))
        .then((uitkomst) => {
          setStand(uitkomst);
          opener?.postMessage({ source: BRON_NIEUW, type: 'ontvangen', aantal: 1 }, verwacht);
        })
        .catch(() => setStand({ soort: 'fout', tekst: 'Opslaan in deze browser lukte niet.' }));
    }

    window.addEventListener('message', onMessage);
    // targetOrigin: alleen een opener op de oude origin krijgt dit te zien.
    opener.postMessage({ source: BRON_NIEUW, type: 'klaar' }, verwacht);
    return () => window.removeEventListener('message', onMessage);
  }, [regels, siteId, verwacht]);

  async function kiesBestand(event: ChangeEvent<HTMLInputElement>) {
    const bestand = event.target.files?.[0];
    if (!bestand) return;
    setStand({ soort: 'bezig' });
    try {
      const gelezen = leesBericht(JSON.parse(await bestand.text()), siteId, regels);
      if (!gelezen) {
        setStand({
          soort: 'fout',
          tekst: `Dit bestand komt niet van het oude adres van deze cursus. Kies ${siteId}-werk.json.`,
        });
        return;
      }
      setStand(await bewaar(schrijfplan(gelezen, siteId, regels)));
    } catch {
      setStand({ soort: 'fout', tekst: 'Dit bestand kon niet gelezen worden.' });
    }
  }

  const oudeHost = new URL(verwacht).host;
  const labels = [...(regels.localStorage ?? []), ...(regels.indexedDB ?? [])].map((r) => r.label);

  return (
    <main className={styles.wrap}>
      <h1>Werk van het oude adres</h1>
      <p>
        Deze cursus stond eerst op <code>{oudeHost}</code>. Wat je daar bewaarde (
        {Array.from(new Set(labels)).join(', ').toLowerCase()}) staat nog in je browser, maar deze
        pagina kan er niet bij. Zo neem je het mee:
      </p>
      <ol className={styles.stappen}>
        <li>
          Open <a href={`${verwacht}/oud/overzetten/`}>de overzetpagina op het oude adres</a>, in
          dezelfde browser waarin je werkte.
        </li>
        <li>
          Klik daar op <strong>Zet over naar het nieuwe adres</strong>. Dit tabblad gaat dan open en
          neemt je werk over.
        </li>
      </ol>

      {/* Altijd in de DOM: een live-regio die pas verschijnt, wordt niet altijd voorgelezen. */}
      <output className={styles.status} aria-live="polite" hidden={stand.soort === 'wachten'}>
        {stand.soort === 'bezig' && 'Werk overzetten…'}
        {stand.soort === 'fout' && stand.tekst}
        {stand.soort === 'klaar' && (
          <>
            {stand.nieuw === 0 && stand.bestond > 0
              ? 'Alles stond hier al.'
              : `Overgezet: ${stand.nieuw} ${stand.nieuw === 1 ? 'item' : 'items'}${
                  stand.bestond > 0
                    ? `, ${stand.bestond} stond${stand.bestond === 1 ? '' : 'en'} hier al`
                    : ''
                }.`}{' '}
            <Link to="/">Terug naar de cursus</Link>
          </>
        )}
      </output>

      <div className={styles.bestand}>
        <label htmlFor="werkbestand">
          Heb je je werk gedownload als <code>{siteId}-werk.json</code>? Kies dat bestand:
        </label>
        <br />
        <input
          id="werkbestand"
          type="file"
          accept=".json,application/json"
          onChange={kiesBestand}
        />
      </div>
    </main>
  );
}

import clsx from 'clsx';
import type { ReactElement, ReactNode } from 'react';
import styles from './styles.module.css';

// Een nagebouwd stukje van de ontwikkelaarstools, zodat de les kan laten
// zien wat de leerling ziet zonder schermafbeeldingen: die verouderen, en
// de labels verschillen per browser en per taal. Hier staat de Nederlandse
// naam van elk tabblad met de Engelse ernaast.

const TABBLADEN: Array<{ nl: string; en: string }> = [
  { nl: 'Elementen', en: 'Elements' },
  { nl: 'Console', en: 'Console' },
  { nl: 'Netwerk', en: 'Network' },
  { nl: 'App', en: 'Application' },
];

export type Tabblad = 'Elementen' | 'Console' | 'Netwerk' | 'App';

export function DevtoolsPaneel({
  tab,
  children,
}: {
  tab: Tabblad;
  children: ReactNode;
}): ReactElement {
  return (
    <figure className={styles.paneel}>
      <figcaption className={styles.srOnly}>Ontwikkelaarstools, tabblad {tab} geopend</figcaption>
      {/* Een plaatje van de tabbladrij, niet iets om op te klikken; daarom
          geen tab-rollen. Het geopende tabblad staat vet, en voor wie dat
          niet ziet staat er "geopend" bij. */}
      <div className={styles.tabbladen} aria-hidden="true">
        {TABBLADEN.map((t) => (
          <span key={t.nl} className={clsx(styles.tabblad, t.nl === tab && styles.actief)}>
            {t.nl}
            {t.en !== t.nl && <span className={styles.engels}> ({t.en})</span>}
          </span>
        ))}
      </div>
      <div className={styles.inhoud}>{children}</div>
    </figure>
  );
}

export type NetwerkRij = {
  naam: string;
  /** Een statuscode, of de tekst die Chrome toont als er geen antwoord kwam, zoals '(mislukt)'. */
  status: number | string;
  type: string;
  grootte: string;
  /** Rood, zoals Chrome een mislukt verzoek toont. Standaard: een status van 400 of hoger. */
  fout?: boolean;
};

/** De lijst van het tabblad Netwerk: één regel per verzoek. */
export function NetwerkTabel({ rijen }: { rijen: NetwerkRij[] }): ReactElement {
  return (
    <table className={styles.tabel}>
      <thead>
        <tr>
          <th>Naam</th>
          <th>Status</th>
          <th>Type</th>
          <th>Grootte</th>
        </tr>
      </thead>
      <tbody>
        {rijen.map((rij, i) => {
          const fout = rij.fout ?? (typeof rij.status === 'number' && rij.status >= 400);
          return (
            // Index als key: de lijst is statisch, en dezelfde naam kan twee
            // keer voorkomen (een 304 en daarna een 200).
            // biome-ignore lint/suspicious/noArrayIndexKey: zie hierboven
            <tr key={i} className={clsx(fout && styles.fout)}>
              <td>{rij.naam}</td>
              <td>{rij.status}</td>
              <td>{rij.type}</td>
              <td>{rij.grootte}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

export type ConsoleRegel = {
  tekst: string;
  /** Bestand en regelnummer rechts, zoals `app.js:5`. */
  bron?: string;
  fout?: boolean;
};

/** De uitvoer van het tabblad Console. */
export function ConsoleRegels({ regels }: { regels: ConsoleRegel[] }): ReactElement {
  return (
    <div className={styles.console}>
      {regels.map((regel, i) => (
        // Index als key: dezelfde regel komt vaak twee keer voor (typ, wis, typ).
        // biome-ignore lint/suspicious/noArrayIndexKey: zie hierboven
        <div key={i} className={clsx(styles.regel, regel.fout && styles.fout)}>
          <span>{regel.tekst}</span>
          {regel.bron && <span className={styles.bron}>{regel.bron}</span>}
        </div>
      ))}
    </div>
  );
}

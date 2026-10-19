import type { Beoordeling } from '../beoordelingen';
import styles from './Beoordelingen.module.css';

// De lijst van bewaarde beoordelingen in de docentweergave. Een docent neemt
// achter elkaar mondelingen af en opent er 's middags één om nog iets aan te
// passen voor hij de PDF maakt.

interface BeoordelingenProps {
  lijst: Beoordeling[];
  actiefId: string | null;
  onOpen: (id: string) => void;
  onVerwijder: (b: Beoordeling) => void;
  onVerwijderAlles: () => void;
  /** Gezet als de browser niet wil bewaren; dan staat alles alleen in deze pagina. */
  opslagFout: string | null;
}

const TIJD = new Intl.DateTimeFormat('nl-NL', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
});

export function Beoordelingen({
  lijst,
  actiefId,
  onOpen,
  onVerwijder,
  onVerwijderAlles,
  opslagFout,
}: BeoordelingenProps) {
  return (
    <section className={styles.section} aria-labelledby="mijn-beoordelingen">
      <h2 id="mijn-beoordelingen">Mijn beoordelingen</h2>
      {opslagFout ? (
        <p className={styles.waarschuwing} role="alert">
          {opslagFout}
        </p>
      ) : (
        <p className={styles.uitleg}>
          Elke upload wordt een beoordeling die blijft staan, ook als je de pagina sluit. Ze staan
          alleen in deze browser, op deze computer. Verwijder ze als je de PDF hebt.
        </p>
      )}
      {lijst.length === 0 ? (
        <p className={styles.leeg}>Nog geen beoordelingen.</p>
      ) : (
        <>
          <ul className={styles.lijst}>
            {lijst.map((b) => {
              const actief = b.id === actiefId;
              return (
                <li key={b.id} className={actief ? styles.actief : undefined}>
                  <button
                    type="button"
                    className={styles.open}
                    onClick={() => onOpen(b.id)}
                    aria-current={actief ? 'true' : undefined}
                  >
                    <span className={styles.naam}>{b.naam}</span>
                    <span className={styles.tijd}>
                      {actief ? 'nu open' : `bijgewerkt ${TIJD.format(b.bijgewerkt)}`}
                    </span>
                  </button>
                  <button
                    type="button"
                    className={styles.verwijder}
                    onClick={() => onVerwijder(b)}
                    aria-label={`Beoordeling van ${b.naam} verwijderen`}
                  >
                    Verwijderen
                  </button>
                </li>
              );
            })}
          </ul>
          {lijst.length > 1 && (
            <button type="button" className={styles.alles} onClick={onVerwijderAlles}>
              Alle beoordelingen verwijderen
            </button>
          )}
        </>
      )}
    </section>
  );
}

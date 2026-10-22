import type { Plek, Samenhangfout } from '../types';
import styles from './Samenhang.module.css';

// Wat tussen twee bestanden niet aansluit: een formulierveld dat de functie
// niet verwacht, een {{ naam }} die het dictionary niet meegeeft. Zulke
// fouten geven een lege plek, een 422 of een 404, vaak in een ander bestand
// dan waar de fout zit. Daarom staan beide regels erbij. De leerling ziet dit
// ook: het is terugkoppeling op zijn eigen code, geen beoordeling.

interface SamenhangProps {
  fouten: Samenhangfout[];
  /** Toont de regels in de code. Weglaten = alleen bestand en regel als tekst. */
  onToonPlekken?: (titel: string, plekken: Plek[]) => void;
}

export function Samenhang({ fouten, onToonPlekken }: SamenhangProps) {
  if (fouten.length === 0) return null;
  return (
    <section className={styles.section}>
      <h2>
        Sluiten je bestanden op elkaar aan? <span className={styles.aantal}>{fouten.length}</span>
      </h2>
      <p className={styles.uitleg}>
        Een naam die in het ene bestand anders heet dan in het andere geeft vaak geen foutmelding,
        maar een lege plek of een fout in de browser. Leg de twee regels naast elkaar.
      </p>
      <ul className={styles.lijst}>
        {fouten.map((f) => (
          <li className={styles.kaart} key={`${f.titel}|${f.plekken.map(plekTekst).join('|')}`}>
            <div className={styles.kop}>{f.titel}</div>
            <p className={styles.tekst}>{f.uitleg}</p>
            <div className={styles.plekken}>
              {f.plekken.map((p) =>
                onToonPlekken ? (
                  <button
                    type="button"
                    className={styles.knop}
                    key={plekTekst(p)}
                    onClick={() => onToonPlekken(f.titel, [p])}
                    title="Toon deze regel"
                  >
                    {plekTekst(p)}
                  </button>
                ) : (
                  <span className={styles.plek} key={plekTekst(p)}>
                    {plekTekst(p)}
                  </span>
                ),
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function plekTekst(p: Plek): string {
  return `${p.bestand}, regel ${p.regel}`;
}

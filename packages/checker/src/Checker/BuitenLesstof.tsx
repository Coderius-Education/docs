import type { Plek, Vondst } from '../types';
import styles from './BuitenLesstof.module.css';

// Wat het project gebruikt en de lessen niet behandelen, per groep. Bedoeld
// als voorbereiding op het mondeling: elke vondst is een vraag ("wat doet
// deze <canvas>?"), met het bestand erbij zodat je hem samen kunt openen.
// Telt niet mee in de niveausamenvatting; een vondst is geen fout.

interface BuitenLesstofProps {
  vondsten: Vondst[];
  /** Toont waar een vondst in de code staat. Weglaten = niet klikbaar. */
  onToonPlekken?: (titel: string, plekken: Plek[]) => void;
  /**
   * Binnen het blok van een onderwerp (HTML, CSS, …): een kleinere kop en een
   * korte uitleg, onder de rijen van dat onderwerp.
   */
  inOnderwerp?: boolean;
}

export function BuitenLesstof({ vondsten, onToonPlekken, inOnderwerp }: BuitenLesstofProps) {
  if (vondsten.length === 0) return null;
  const groepen = new Map<string, Vondst[]>();
  for (const v of vondsten) groepen.set(v.groep, [...(groepen.get(v.groep) ?? []), v]);
  const Kop = inOnderwerp ? 'h3' : 'h2';

  return (
    <section className={inOnderwerp ? styles.inOnderwerp : styles.section}>
      <Kop className={styles.titel}>
        Buiten de lesstof <span className={styles.aantal}>{vondsten.length}</span>
      </Kop>
      <p className={styles.uitleg}>
        {inOnderwerp
          ? 'Staat in het project, niet in de lessen. Vraag ernaar in het mondeling.'
          : 'Dit staat in het project, maar niet in de lessen. Een goed begin voor het mondeling: vraag wat het doet en hoe de leerling het heeft gevonden.'}
      </p>
      <div className={styles.grid}>
        {Array.from(groepen, ([groep, items]) => (
          <div className={styles.kaart} key={groep}>
            <div className={styles.kop}>{groep}</div>
            <ul className={styles.lijst}>
              {items.map((v) => (
                <li key={v.label}>
                  {onToonPlekken && (v.plekken?.length ?? 0) > 0 ? (
                    <button
                      type="button"
                      className={styles.knop}
                      onClick={() => onToonPlekken(v.label, v.plekken ?? [])}
                      title="Toon waar dit in de code staat"
                    >
                      <code>{v.label}</code>
                    </button>
                  ) : (
                    <code>{v.label}</code>
                  )}
                  {v.count > 1 && <span className={styles.keer}> {v.count}×</span>}
                  <span className={styles.bestanden}> in {v.files.join(', ')}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

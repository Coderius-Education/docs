import type { Vondst } from '../types';
import styles from './BuitenLesstof.module.css';

// Wat het project gebruikt en de lessen niet behandelen, per groep. Bedoeld
// als voorbereiding op het mondeling: elke vondst is een vraag ("wat doet
// deze <canvas>?"), met het bestand erbij zodat je hem samen kunt openen.
// Telt niet mee in de niveausamenvatting; een vondst is geen fout.

export function BuitenLesstof({ vondsten }: { vondsten: Vondst[] }) {
  if (vondsten.length === 0) return null;
  const groepen = new Map<string, Vondst[]>();
  for (const v of vondsten) groepen.set(v.groep, [...(groepen.get(v.groep) ?? []), v]);

  return (
    <section className={styles.section}>
      <h2>
        Buiten de lesstof <span className={styles.aantal}>{vondsten.length}</span>
      </h2>
      <p className={styles.uitleg}>
        Dit staat in het project, maar niet in de lessen. Een goed begin voor het mondeling: vraag
        wat het doet en hoe de leerling het heeft gevonden.
      </p>
      <div className={styles.grid}>
        {Array.from(groepen, ([groep, items]) => (
          <div className={styles.kaart} key={groep}>
            <div className={styles.kop}>{groep}</div>
            <ul className={styles.lijst}>
              {items.map((v) => (
                <li key={v.label}>
                  <code>{v.label}</code>
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

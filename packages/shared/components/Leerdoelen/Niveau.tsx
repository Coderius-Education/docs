import type { ReactNode } from 'react';
import { CONCEPT_MOEILIJKHEDEN, type Leerdoelen } from '../../leerdoelen';
import Lessen from './Lessen';
import Moeilijkheid from './Moeilijkheid';
import styles from './styles.module.css';

/**
 * Eén niveau van een cursus: per onderwerp de concepten, verdeeld over basis,
 * gevorderd en expert. Expert staat er alleen als het niveau het heeft.
 */
export default function Niveau({
  leerdoelen,
  niveau,
  kop = 'h3',
}: {
  leerdoelen: Leerdoelen;
  niveau: string;
  kop?: 'h2' | 'h3';
}): ReactNode {
  const Kop = kop;
  const kolommen = CONCEPT_MOEILIJKHEDEN.filter((m) =>
    leerdoelen.concepten.some((c) => c.niveau[niveau] === m),
  );
  return (
    <>
      {leerdoelen.onderwerpen.map((onderwerp) => {
        const rijen = leerdoelen.concepten.filter((c) => c.onderwerp === onderwerp.id);
        if (rijen.length === 0) return null;
        return (
          <section key={onderwerp.id}>
            <Kop>{onderwerp.label}</Kop>
            <div className={styles.schuif}>
              <table className={`${styles.tabel} ${styles.kolommen}`}>
                <thead>
                  <tr>
                    {kolommen.map((m) => (
                      <th key={m} scope="col">
                        <Moeilijkheid id={m} />
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    {kolommen.map((m) => (
                      <td key={m}>
                        <ul className={styles.concepten}>
                          {rijen
                            .filter((c) => c.niveau[niveau] === m)
                            .map((c) => (
                              <li key={c.id}>
                                {c.concept}
                                {c.toelichting && (
                                  <span className={styles.toelichting}>{c.toelichting}</span>
                                )}
                                <Lessen concept={c} />
                              </li>
                            ))}
                        </ul>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        );
      })}
    </>
  );
}

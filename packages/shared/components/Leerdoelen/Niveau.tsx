import type { ReactNode } from 'react';
import { type Leerdoelen, kolommenVoorOnderwerp, onderwerpenOpNiveau } from '../../leerdoelen';
import Lessen from './Lessen';
import Moeilijkheid from './Moeilijkheid';
import styles from './styles.module.css';

/**
 * Eén niveau van een cursus: per onderwerp de concepten, verdeeld over basis,
 * gevorderd en expert (zie kolommenVoorOnderwerp).
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
  return (
    <>
      {onderwerpenOpNiveau(leerdoelen, niveau).map(({ onderwerp, concepten: rijen }) => {
        const kolommen = kolommenVoorOnderwerp(leerdoelen, niveau, rijen);
        const groepen = leerdoelen.gevorderdInGroepen?.[niveau]?.[onderwerp.id];
        const metGevorderd = [
          ...new Set(
            rijen
              .filter((c) => c.niveau[niveau] === 'gevorderd' || c.niveau[niveau] === 'expert')
              .map((c) => c.groep)
              .filter((g): g is string => Boolean(g)),
          ),
        ];
        return (
          <section key={onderwerp.id}>
            <Kop>{onderwerp.label}</Kop>
            {groepen && (
              <p>
                Voor gevorderd heb je hier een concept op gevorderd of expert nodig in minstens{' '}
                {groepen} van deze groepen: {metGevorderd.join(', ')}.
              </p>
            )}
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

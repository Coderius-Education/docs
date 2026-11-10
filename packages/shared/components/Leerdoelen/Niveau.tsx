import type { ReactNode } from 'react';
import {
  type Leerdoelen,
  kolommenVoorOnderwerp,
  moeilijkheid,
  onderwerpenOpNiveau,
  overgang,
  projectNiveaus,
} from '../../leerdoelen';
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
  // Het niveau ervoor (zonder tentamen): een concept dat daar anders was,
  // krijgt een labeltje, zodat je op deze pagina ziet wat er verandert.
  const niveaus = projectNiveaus(leerdoelen);
  const vorige = niveaus[niveaus.findIndex((n) => n.id === niveau) - 1];
  const notitie = (c: (typeof leerdoelen.concepten)[number]) => {
    if (!vorige) return null;
    const soort = overgang(c, vorige.id, niveau);
    if (soort === 'nieuw') return 'nieuw';
    const was = c.niveau[vorige.id];
    return soort && was ? `was ${moeilijkheid(was).label.toLowerCase()} op ${vorige.label}` : null;
  };
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
                                {notitie(c) && <span className={styles.was}>{notitie(c)}</span>}
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

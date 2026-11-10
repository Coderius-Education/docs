import type { ReactNode } from 'react';
import {
  type Leerdoelen,
  kolommenVoorOnderwerp,
  moeilijkheid,
  onderwerpenOpNiveau,
  verschilTelling,
  verschillen,
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
  // Wat anders is dan het niveau ervoor (zonder tentamen) krijgt een
  // labeltje, zodat je op deze pagina ziet wat er verandert. Een concept dat
  // op een niveau nog eerder al stond, is "weer erbij", niet nieuw.
  // Een onderwerp dat hier begint (fullstack niveau 3: Linux, Veiligheid,
  // Online zetten) krijgt het label één keer, bij zijn kop; anders stond
  // "nieuw" bij elke rij.
  const verschil = verschillen(leerdoelen).find((v) => v.naar.id === niveau);
  const nieuwOnderwerp = new Set(
    verschilTelling(leerdoelen, niveau)?.nieuweOnderwerpen.map((o) => o.id),
  );
  const labels = new Map<string, string>();
  for (const { soort, concepten } of verschil?.groepen ?? []) {
    for (const { concept, was, eerder } of concepten) {
      const bij = (m: string, n: { label: string }) =>
        `${moeilijkheid(m).label.toLowerCase()} op ${n.label}`;
      if (soort === 'erbij') {
        if (!eerder && nieuwOnderwerp.has(concept.onderwerp)) continue;
        labels.set(
          concept.id,
          eerder ? `weer erbij, was ${bij(eerder.moeilijkheid, eerder.niveau)}` : 'nieuw',
        );
      } else if (soort !== 'valt-af' && was && verschil) {
        labels.set(concept.id, `was ${bij(was, verschil.van)}`);
      }
    }
  }
  const notitie = (c: { id: string }) => labels.get(c.id) ?? null;
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
            <Kop>
              {onderwerp.label}
              {nieuwOnderwerp.has(onderwerp.id) && (
                <span className={styles.was}>
                  nieuw op {leerdoelen.niveaus.find((n) => n.id === niveau)?.label}
                </span>
              )}
            </Kop>
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

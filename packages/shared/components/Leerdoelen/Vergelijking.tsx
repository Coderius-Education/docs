import Link from '@docusaurus/Link';
import type { ReactNode } from 'react';
import { type Leerdoelen, projectNiveaus } from '../../leerdoelen';
import Lessen from './Lessen';
import Moeilijkheid from './Moeilijkheid';
import styles from './styles.module.css';

/**
 * De niveaus naast elkaar: per concept één rij, per niveau een kolom. Een
 * moeilijkheid die anders is dan bij het niveau ervoor, valt op.
 */
export default function Vergelijking({ leerdoelen }: { leerdoelen: Leerdoelen }): ReactNode {
  const { onderwerpen, concepten } = leerdoelen;
  // Het tentamen-niveau heeft geen moeilijkheid per concept.
  const niveaus = projectNiveaus(leerdoelen);
  return (
    <div className={styles.schuif}>
      <table className={styles.tabel}>
        <thead>
          <tr>
            <th scope="col">Concept</th>
            {niveaus.map((n) => (
              <th key={n.id} scope="col">
                <Link to={`/leerdoelen/niveau-${n.id}`}>{n.label}</Link>
              </th>
            ))}
          </tr>
        </thead>
        {onderwerpen.map((o) => {
          const rijen = concepten.filter((c) => c.onderwerp === o.id);
          if (rijen.length === 0) return null;
          return (
            <tbody key={o.id}>
              <tr>
                <th scope="colgroup" colSpan={niveaus.length + 1}>
                  {o.label}
                </th>
              </tr>
              {rijen.map((c) => (
                <tr key={c.id}>
                  <td>
                    {c.concept}
                    {c.toelichting && <span className={styles.toelichting}>{c.toelichting}</span>}
                    <Lessen concept={c} />
                  </td>
                  {niveaus.map((n, i) => {
                    const anders = i > 0 && c.niveau[n.id] !== c.niveau[niveaus[i - 1].id];
                    return (
                      <td key={n.id}>
                        <Moeilijkheid id={c.niveau[n.id]} className={anders ? styles.anders : ''} />
                        {anders && (
                          <span className={styles.verborgen}>
                            {' '}
                            (anders dan {niveaus[i - 1].label})
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          );
        })}
      </table>
    </div>
  );
}

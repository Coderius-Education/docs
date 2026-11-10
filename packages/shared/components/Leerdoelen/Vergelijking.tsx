import Link from '@docusaurus/Link';
import { type ReactNode, useState } from 'react';
import { type Leerdoelen, moeilijkheid, overgang, projectNiveaus } from '../../leerdoelen';
import Moeilijkheid from './Moeilijkheid';
import styles from './styles.module.css';

/**
 * De niveaus naast elkaar: per concept één rij, per niveau een kolom. Een
 * cel die anders is dan het niveau ervoor, zegt wat hij was ("was basis",
 * "nieuw", "valt af"), en de rij heeft een streep links. Standaard staan
 * alleen de rijen die ergens verschillen erin; een knop toont ze allemaal.
 * Eerst stonden de verschillen tussen tientallen gelijke rijen, met alleen
 * een dun randje om één label, en was elke rij twee regels hoog door "Leer
 * het in"; dat staat op de pagina van het niveau.
 */
export default function Vergelijking({ leerdoelen }: { leerdoelen: Leerdoelen }): ReactNode {
  const { onderwerpen, concepten } = leerdoelen;
  // Het tentamen-niveau heeft geen moeilijkheid per concept.
  const niveaus = projectNiveaus(leerdoelen);
  const verschilt = (c: (typeof concepten)[number]) =>
    niveaus.slice(1).some((n, i) => overgang(c, niveaus[i].id, n.id) !== null);
  const aantalAnders = concepten.filter(verschilt).length;
  const [alles, setAlles] = useState(aantalAnders === 0);
  const zichtbaar = (c: (typeof concepten)[number]) => alles || verschilt(c);

  return (
    <>
      <fieldset className={styles.knoppen}>
        <legend className={styles.verborgen}>Welke concepten</legend>
        <button
          type="button"
          className={`button button--sm button--outline button--primary${alles ? '' : ' button--active'}`}
          aria-pressed={!alles}
          onClick={() => setAlles(false)}
        >
          Alleen wat verschilt ({aantalAnders})
        </button>
        <button
          type="button"
          className={`button button--sm button--outline button--primary${alles ? ' button--active' : ''}`}
          aria-pressed={alles}
          onClick={() => setAlles(true)}
        >
          Alle concepten ({concepten.length})
        </button>
      </fieldset>
      <div className={styles.schuif}>
        <table className={`${styles.tabel} ${styles.vergelijk}`}>
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
            const rijen = concepten.filter((c) => c.onderwerp === o.id && zichtbaar(c));
            if (rijen.length === 0) return null;
            return (
              <tbody key={o.id}>
                <tr>
                  <th scope="colgroup" colSpan={niveaus.length + 1} className={styles.onderwerp}>
                    {o.label}
                  </th>
                </tr>
                {rijen.map((c) => (
                  <tr key={c.id} className={verschilt(c) ? styles.rijAnders : undefined}>
                    <th scope="row">
                      {c.concept}
                      {c.toelichting && <span className={styles.toelichting}>{c.toelichting}</span>}
                    </th>
                    {niveaus.map((n, i) => {
                      const soort = i > 0 ? overgang(c, niveaus[i - 1].id, n.id) : null;
                      const vorige = i > 0 ? c.niveau[niveaus[i - 1].id] : null;
                      // Terug na een niveau zonder dit concept (robotica: continue op 1 en 4).
                      const eerder = niveaus
                        .slice(0, Math.max(0, i - 1))
                        .some((v) => c.niveau[v.id]);
                      const notitie =
                        soort === 'nieuw'
                          ? eerder
                            ? 'weer erbij'
                            : 'nieuw'
                          : soort === 'weg'
                            ? 'valt af'
                            : soort && vorige
                              ? `was ${moeilijkheid(vorige).label.toLowerCase()}`
                              : null;
                      return (
                        <td key={n.id} className={soort ? styles.celAnders : undefined}>
                          <Moeilijkheid
                            id={c.niveau[n.id]}
                            className={soort && soort !== 'weg' ? styles.anders : ''}
                          />
                          {notitie && <span className={styles.was}>{notitie}</span>}
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
    </>
  );
}

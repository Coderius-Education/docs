import Link from '@docusaurus/Link';
import type { ReactNode } from 'react';
import { type Leerdoelen, type VerschilSoort, moeilijkheid, verschillen } from '../../leerdoelen';
import Moeilijkheid from './Moeilijkheid';
import styles from './styles.module.css';

const KOP: Record<VerschilSoort, string> = {
  erbij: 'Erbij',
  basis: 'Nu basis',
  gevorderd: 'Nu gevorderd',
  expert: 'Nu expert',
  'valt-af': 'Hoort er niet meer bij',
};

/** De soorten die een moeilijkheid zijn: die krijgen het label als kop. */
const MOEILIJKHEID = new Set<VerschilSoort>(['basis', 'gevorderd', 'expert']);

/** Boven deze lengte staat een groep ingeklapt, met alleen het aantal. */
const LANG = 8;

const was = (m: string | null) => (m ? `was ${moeilijkheid(m).label.toLowerCase()}` : '');

/**
 * Bovenaan de vergelijking: per overgang van het ene niveau naar het
 * volgende wat er verandert. In de tabel eronder stonden de verschillen
 * tussen tientallen gelijke rijen, met alleen een dun randje om één label.
 */
export default function Verschillen({ leerdoelen }: { leerdoelen: Leerdoelen }): ReactNode {
  return (
    <div className={styles.overgangen}>
      {verschillen(leerdoelen).map(({ van, naar, aantal, groepen }) => (
        <section key={naar.id} className={styles.overgang}>
          <h2 className={styles.overgangKop}>
            Van <Link to={`/leerdoelen/niveau-${van.id}`}>{van.label}</Link> naar{' '}
            <Link to={`/leerdoelen/niveau-${naar.id}`}>{naar.label}</Link>
          </h2>
          {aantal === 0 ? (
            <p>Geen verschillen: elk concept heeft dezelfde moeilijkheid.</p>
          ) : (
            <dl className={styles.groepen}>
              {groepen.map(({ soort, concepten }) => {
                const kop = (
                  <>
                    {MOEILIJKHEID.has(soort) ? (
                      <>
                        Nu <Moeilijkheid id={soort} />
                      </>
                    ) : (
                      KOP[soort]
                    )}{' '}
                    <span className={styles.aantal}>({concepten.length})</span>
                  </>
                );
                const lijst = (
                  <ul className={styles.verschilLijst}>
                    {concepten.map(({ concept, was: m, eerder }) => (
                      <li key={concept.id}>
                        {concept.concept}
                        {soort !== 'erbij' && soort !== 'valt-af' && m && (
                          <span className={styles.was}>{was(m)}</span>
                        )}
                        {soort === 'erbij' && eerder && (
                          <span className={styles.was}>
                            weer erbij, {was(eerder.moeilijkheid)} op {eerder.niveau.label}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                );
                return (
                  <div key={soort} className={styles.groep}>
                    <dt>{kop}</dt>
                    <dd>
                      {concepten.length > LANG ? (
                        <details>
                          <summary>Toon de {concepten.length} concepten</summary>
                          {lijst}
                        </details>
                      ) : (
                        lijst
                      )}
                    </dd>
                  </div>
                );
              })}
            </dl>
          )}
        </section>
      ))}
    </div>
  );
}

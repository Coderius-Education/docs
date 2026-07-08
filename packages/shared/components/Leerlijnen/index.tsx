import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import type { ReactNode } from 'react';
import { SITES, SITES_BY_ID, normalizeUrl, siteByUrl } from '../../sites';
import styles from './styles.module.css';

type Site = (typeof SITES)[number];

/**
 * Overzicht van alle Coderius-cursussen en hoe ze op elkaar voortbouwen.
 * Data komt uit de gedeelde registry; de huidige cursus wordt gemarkeerd.
 */
export default function Leerlijnen(): ReactNode {
  const { siteConfig } = useDocusaurusContext();
  const current = siteByUrl(siteConfig.url);

  return (
    <div className="container margin-vert--lg">
      <h1>Alle cursussen</h1>
      <p>
        De cursussen van Coderius bouwen op elkaar voort. Hieronder zie je per cursus waar je mee
        aan de slag kunt en welke voorkennis handig is.
      </p>

      <div className="row">
        {SITES.map((site: Site) => {
          const isCurrent = !!current && site.id === current.id;
          const href = isCurrent ? '/' : normalizeUrl(site.url);
          return (
            <div className="col col--4 margin-bottom--lg" key={site.id}>
              <a
                className={styles.card}
                href={href}
                {...(isCurrent ? {} : { target: '_blank', rel: 'noopener noreferrer' })}
              >
                <h3 className={styles.title}>
                  {site.label}
                  {isCurrent && <span className={styles.here}>je bent hier</span>}
                </h3>
                <p className={styles.desc}>{site.description}</p>
                {site.requires.length > 0 && (
                  <p className={styles.requires}>
                    Voorkennis:{' '}
                    {site.requires
                      .map((id) => SITES_BY_ID[id]?.label)
                      .filter(Boolean)
                      .join(', ')}
                  </p>
                )}
              </a>
            </div>
          );
        })}
      </div>
    </div>
  );
}

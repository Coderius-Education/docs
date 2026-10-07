import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import type { ReactNode } from 'react';
import { HOME, SITES, SITES_BY_ID, siteByUrl, sitesOfSubject } from '../../sites';
import styles from './styles.module.css';

type Site = (typeof SITES)[number];

/**
 * Overzicht van de Coderius-cursussen van het vak van deze site en hoe ze op
 * elkaar voortbouwen. Data komt uit de gedeelde registry; de huidige cursus
 * wordt gemarkeerd. Cursussen van andere vakken staan op coderius.nl.
 */
export default function Leerlijnen(): ReactNode {
  const { siteConfig } = useDocusaurusContext();
  // De cursus staat onder een pad van de vak-host: url + baseUrl wijst hem aan.
  const current = siteByUrl(siteConfig.url + siteConfig.baseUrl);
  const cursussen = current ? sitesOfSubject(current.subject) : SITES;

  return (
    <div className="container margin-vert--lg">
      <h1>Alle cursussen</h1>
      <p>
        De cursussen van Coderius bouwen op elkaar voort. Hieronder zie je per cursus waar je mee
        aan de slag kunt en welke voorkennis handig is. Cursussen van andere vakken vind je op{' '}
        <a href={HOME.url}>{new URL(HOME.url).host}</a>.
      </p>

      <div className="row">
        {cursussen.map((site: Site) => {
          const isCurrent = !!current && site.id === current.id;
          const inhoud = (
            <>
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
            </>
          );
          return (
            <div className="col col--4 margin-bottom--lg" key={site.id}>
              {isCurrent ? (
                // Link zet de baseUrl (/python/) ervoor; een kale '/' zou op de
                // root van de vak-host landen.
                <Link className={styles.card} to="/">
                  {inhoud}
                </Link>
              ) : (
                <a
                  className={styles.card}
                  href={site.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {inhoud}
                </a>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

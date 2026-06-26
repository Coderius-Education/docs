import type {ReactNode} from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

export type HeroCta = {
  label: string;
  to: string;
};

/**
 * Gedeelde hero-banner voor de homepage van elke -docs site. Titel en tagline
 * komen standaard uit `docusaurus.config` (siteConfig); een site mag ze
 * overschrijven. Knoppen worden als data meegegeven via `ctas`, zodat het
 * aantal en de labels per site verschillen zonder de markup te dupliceren.
 */
export default function HomepageHero({
  title,
  tagline,
  ctas = [],
}: {
  title?: ReactNode;
  tagline?: ReactNode;
  ctas?: HeroCta[];
}): ReactNode {
  const {siteConfig} = useDocusaurusContext();
  return (
    <header className={clsx('hero hero--primary', styles.heroBanner)}>
      <div className="container">
        <Heading as="h1" className="hero__title">
          {title ?? siteConfig.title}
        </Heading>
        <p className="hero__subtitle">{tagline ?? siteConfig.tagline}</p>
        {ctas.length > 0 && (
          <div className={styles.buttons}>
            {ctas.map((cta) => (
              <Link key={cta.to} className="button button--secondary button--lg" to={cta.to}>
                {cta.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </header>
  );
}

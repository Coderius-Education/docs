import type {ReactNode} from 'react';
import {useState} from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

export type FeatureItem = {
  title: string;
  description: ReactNode;
  /** Emoji of teken bovenaan de kaart, bijv. '💡'. Optioneel. */
  icon?: string;
  /** Maakt de hele kaart klikbaar naar deze (interne) link. Optioneel. */
  link?: string;
  /** Extra uitleg achter een (i)-knop, als tooltip. Optioneel. */
  info?: string;
};

function Feature({title, description, icon, link, info}: FeatureItem) {
  const [showInfo, setShowInfo] = useState(false);

  const body = (
    <>
      {icon && <div className={styles.featureIcon}>{icon}</div>}
      <Heading as="h3">{title}</Heading>
      <p>{description}</p>
    </>
  );

  return (
    <div className={clsx('col col--4')}>
      <div className={styles.featureCard}>
        {link ? (
          <Link to={link} className={styles.featureLink}>
            {body}
          </Link>
        ) : (
          <div className={styles.featureLink}>{body}</div>
        )}

        {info && (
          <div className={styles.infoButtonWrapper}>
            <button
              type="button"
              className={styles.infoButton}
              onClick={() => setShowInfo(!showInfo)}
              aria-label="Meer informatie">
              ℹ️
            </button>
            {showInfo && (
              <div className={styles.infoTooltip}>
                <div className={styles.infoTooltipArrow} />
                {info}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Gedeelde "features"-sectie voor de homepage van elke -docs site. Elke site
 * levert alleen zijn eigen `features`-data aan; de opmaak en CSS staan hier één
 * keer. Kaarten krijgen automatisch de merkkleur van de site (via
 * --ifm-color-primary). Een optionele `heading`/`subheading` zet een kop boven
 * de kaarten.
 */
export default function HomepageFeatures({
  features = [],
  heading,
  subheading,
}: {
  features?: FeatureItem[];
  heading?: string;
  subheading?: string;
}): ReactNode {
  if (features.length === 0) return null;
  return (
    <section className={styles.features}>
      <div className="container">
        {(heading || subheading) && (
          <div className={styles.featuresHeader}>
            {heading && <Heading as="h2">{heading}</Heading>}
            {subheading && <p>{subheading}</p>}
          </div>
        )}
        <div className="row">
          {features.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}

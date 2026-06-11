import Link from '@docusaurus/Link';
import clsx from 'clsx';
import type React from 'react';
import { useState } from 'react';
import styles from './styles.module.css';

type FeatureItem = {
  title: string;
  icon: string;
  description: React.JSX.Element;
  link: string;
  info: string;
};

const FeatureList: FeatureItem[] = [
  {
    title: 'Lego-auto',
    icon: '🚗',
    description: <>Als je de lego auto wilt bouwen</>,
    link: '/lego_auto/intro',
    info: 'Start hier als je met de Lego auto-opdrachten wilt beginnen. Je hebt een Lego set en een microcontroller nodig.',
  },
  {
    title: 'Bibliotheek',
    icon: '📚',
    description: <>Specifieke componenten</>,
    link: '/docs/category/redden-basis',
    info: 'Gebruik de bibliotheek als naslagwerk voor specifieke componenten, sensoren of als je hulp nodig hebt bij debuggen.',
  },
];

function Feature({ title, icon, description, link, info }: FeatureItem) {
  const [showInfo, setShowInfo] = useState(false);

  return (
    <div className={clsx('col col--6')}>
      <div className={styles.featureCard}>
        <Link to={link} className={styles.featureLink}>
          <div className={styles.featureIcon}>{icon}</div>
          <h3>{title}</h3>
          <p>{description}</p>
        </Link>
        <div className={styles.infoButtonWrapper}>
          <button
            className={styles.infoButton}
            onClick={() => setShowInfo(!showInfo)}
            aria-label="Meer informatie"
          >
            ℹ️
          </button>
          {showInfo && (
            <div className={styles.infoTooltip}>
              <div className={styles.infoTooltipArrow}></div>
              {info}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function HomepageFeatures(): React.JSX.Element {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className={styles.featuresHeader}>
          <h2>Waar wil je mee aan de slag?</h2>
          <p>Kies een van de opties hieronder om te beginnen</p>
        </div>
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}

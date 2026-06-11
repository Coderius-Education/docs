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
    title: 'Begin hier',
    icon: '💡',
    description: <>Je eerste knipperende LED in de Arduino IDE</>,
    link: '/docs/introductie/wat-is-embedded',
    info: 'Start hier als je nog nooit een microcontroller hebt geprogrammeerd. Je hebt geen hardware nodig: alles werkt in de simulator.',
  },
  {
    title: 'Naar de STM32',
    icon: '🔧',
    description: <>Van Arduino IDE via PlatformIO naar een echte STM32</>,
    link: '/docs/platformio/waarom-platformio',
    info: 'Klaar met de basis? Stap over op PlatformIO en leer IO en interfaces configureren op een STM32 Blue Pill.',
  },
  {
    title: 'Cheatsheet',
    icon: '📋',
    description: <>Snel iets opzoeken: functies, pinnen en commando’s</>,
    link: '/cheatsheet',
    info: 'Gebruik de cheatsheet als naslagwerk voor syntax, pin-namen en veelgebruikte commando’s.',
  },
];

function Feature({ title, icon, description, link, info }: FeatureItem) {
  const [showInfo, setShowInfo] = useState(false);

  return (
    <div className={clsx('col col--4')}>
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
          <p>Kies hieronder een startpunt</p>
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

import type {ReactNode} from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';

import styles from './index.module.css';

const features = [
  {
    title: 'Stap voor stap',
    description: 'Van je eerste print() tot functies en lijsten. Elke les bouwt voort op de vorige.',
  },
  {
    title: 'Direct uitvoeren',
    description: 'Schrijf en run Python code in je browser. Geen installatie nodig.',
  },
  {
    title: 'Leren door doen',
    description: 'Elke les heeft oefeningen met tips en oplossingen om zelf mee te oefenen.',
  },
];

function HomepageHeader() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <header className={clsx('hero hero--primary', styles.heroBanner)}>
      <div className="container">
        <Heading as="h1" className="hero__title">
          {siteConfig.title}
        </Heading>
        <p className="hero__subtitle">{siteConfig.tagline}</p>
        <div className={styles.buttons}>
          <Link
            className="button button--secondary button--lg"
            to="/docs/basis/introductie">
            Begin met leren
          </Link>
          <Link
            className="button button--secondary button--lg"
            to="/playground">
            Playground
          </Link>
        </div>
      </div>
    </header>
  );
}

export default function Home(): ReactNode {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
      title="Leer Python programmeren"
      description="Leer stap voor stap programmeren in Python met interactieve oefeningen.">
      <HomepageHeader />
      <main>
        <section className={styles.features}>
          <div className="container">
            <div className="row">
              {features.map((feature, idx) => (
                <div key={idx} className={clsx('col col--4')}>
                  <div className="text--center padding-horiz--md padding-vert--lg">
                    <Heading as="h3">{feature.title}</Heading>
                    <p>{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
}

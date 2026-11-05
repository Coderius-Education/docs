import Link from '@docusaurus/Link';
import { algoritmes } from '@site/src/data/algorithms';
import Heading from '@theme/Heading';
import type { ReactNode } from 'react';
import styles from './styles.module.css';

// Naast de algoritmes één kaart voor de route machine learning (niveau 1).
// Hij staat niet in algorithms.ts: dat zijn de algoritmehoofdstukken, waar
// de conceptenkaart en voorkennis.test.ts op leunen.
const ROUTE = {
  slug: 'machine-learning',
  titel: 'Machine learning',
  niveau: 'Niveau 1',
  samenvatting: 'Kleine projecten, van een chatbot tot een project van CS50 AI.',
  startPad: '/docs/machine-learning',
};

export default function AlgorithmGrid(): ReactNode {
  return (
    <section className={styles.grid}>
      <div className="container">
        <div className={styles.cards}>
          {[...algoritmes, ROUTE].map((a) => (
            <Link key={a.slug} to={a.startPad} className={styles.card}>
              <div className={styles.cardBody}>
                <Heading as="h3" className={styles.cardTitle}>
                  {a.titel}
                </Heading>
                <span className={styles.cardLevel}>{a.niveau}</span>
                <p className={styles.cardSummary}>{a.samenvatting}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

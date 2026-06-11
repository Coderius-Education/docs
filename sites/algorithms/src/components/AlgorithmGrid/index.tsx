import type {ReactNode} from 'react';
import Link from '@docusaurus/Link';
import Heading from '@theme/Heading';
import {algoritmes} from '@site/src/data/algorithms';
import styles from './styles.module.css';

export default function AlgorithmGrid(): ReactNode {
  return (
    <section className={styles.grid}>
      <div className="container">
        <div className={styles.cards}>
          {algoritmes.map((a) => (
            <Link key={a.slug} to={a.startPad} className={styles.card}>
              <div className={styles.cardEmoji} aria-hidden="true">
                {a.emoji}
              </div>
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

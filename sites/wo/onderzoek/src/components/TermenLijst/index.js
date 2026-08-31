import React from 'react';
import Link from '@docusaurus/Link';
import begrippen from '@site/src/data/begrippen';
import styles from './styles.module.css';

/**
 * Alfabetische begrippenlijst, gegenereerd uit de centrale data.
 */
export default function TermenLijst() {
  const lijst = Object.entries(begrippen).sort(([, a], [, b]) =>
    a.term.localeCompare(b.term, 'nl'),
  );
  return (
    <dl className={styles.lijst}>
      {lijst.map(([id, b]) => (
        <React.Fragment key={id}>
          <dt id={id} className={styles.term}>
            {b.term}
          </dt>
          <dd className={styles.definitie}>
            {b.lang || b.kort}{' '}
            <Link to={b.url} className={styles.meer}>
              Lees meer →
            </Link>
          </dd>
        </React.Fragment>
      ))}
    </dl>
  );
}

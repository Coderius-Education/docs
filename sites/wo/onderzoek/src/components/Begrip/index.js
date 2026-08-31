import React from 'react';
import Link from '@docusaurus/Link';
import begrippen from '@site/src/data/begrippen';
import styles from './styles.module.css';

/**
 * Term met hover/focus-tooltip (mini-definitie) en link naar de conceptpagina.
 * Gebruik in MDX: <B t="valide"/> of <B t="valide" tekst="validiteit"/>.
 */
export default function Begrip({t, tekst}) {
  const begrip = begrippen[t];
  if (!begrip) {
    return <strong>{tekst || t}</strong>;
  }
  return (
    <span className={styles.wrapper}>
      <Link to={begrip.url} className={styles.term}>
        {tekst || begrip.term}
      </Link>
      <span role="tooltip" className={styles.tooltip}>
        <strong>{begrip.term}</strong> — {begrip.kort}{' '}
        <span className={styles.meer}>Klik voor meer →</span>
      </span>
    </span>
  );
}

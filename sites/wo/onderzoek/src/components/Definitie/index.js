import React from 'react';
import styles from './styles.module.css';

/**
 * Definitiekader bovenaan een conceptpagina.
 * Gebruik: <Definitie gewoneTaal="…">De formele definitie.</Definitie>
 */
export default function Definitie({children, gewoneTaal}) {
  return (
    <div className={styles.kader}>
      <span className={styles.label}>Definitie</span>
      <div className={styles.tekst}>{children}</div>
      {gewoneTaal && (
        <div className={styles.gewoneTaal}>
          <strong>In gewone taal:</strong> {gewoneTaal}
        </div>
      )}
    </div>
  );
}

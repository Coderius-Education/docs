import React from 'react';
import styles from './styles.module.css';

/**
 * Knop die het printvenster opent. Krijgt de klasse `geen-print`, zodat de
 * knop zelf niet op de afdruk terechtkomt.
 *
 * Gebruik in MDX: <PrintKnop /> of <PrintKnop tekst="Print deze werkvorm" />
 */
export default function PrintKnop({tekst = 'Print deze pagina'}) {
  return (
    <button
      type="button"
      className={`${styles.knop} geen-print`}
      onClick={() => window.print()}>
      <span aria-hidden="true" className={styles.icoon}>
        ⎙
      </span>
      {tekst}
    </button>
  );
}

import React from 'react';
import styles from './styles.module.css';

/**
 * Wel/niet-blok: één voorbeeld dat wél onder het begrip valt en één
 * grensgeval dat er níét onder valt (met waarom).
 * Gebruik: <WelNiet wel="…" niet="…"/>
 */
export default function WelNiet({wel, niet}) {
  return (
    <div className={styles.blok}>
      <div className={`${styles.kolom} ${styles.wel}`}>
        <span className={styles.kop}>✓ Dit is het wél</span>
        <p>{wel}</p>
      </div>
      <div className={`${styles.kolom} ${styles.niet}`}>
        <span className={styles.kop}>✗ Dit is het níét</span>
        <p>{niet}</p>
      </div>
    </div>
  );
}

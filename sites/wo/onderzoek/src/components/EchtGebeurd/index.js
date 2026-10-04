import React from 'react';
import styles from './styles.module.css';

/**
 * Kader met een beroemd onderzoek uit de echte wereld waarbij het begrip
 * mis (of juist spectaculair goed) ging.
 * Gebruik: <EchtGebeurd titel="…" jaar="…" linkUrl="…" linkTekst="…" boek="…">verhaal</EchtGebeurd>
 */
export default function EchtGebeurd({titel, jaar, children, linkUrl, linkTekst, boek}) {
  return (
    <div className={styles.kader}>
      <div className={styles.kop}>
        <span className={styles.label}>Echt gebeurd</span>
        <span className={styles.titel}>
          {titel}
          {jaar && <span className={styles.jaar}> · {jaar}</span>}
        </span>
      </div>
      <div className={styles.verhaal}>{children}</div>
      {(linkUrl || boek) && (
        <div className={styles.voet}>
          {boek && <span className={styles.boek}>Bron: {boek}</span>}
          {linkUrl && (
            <a href={linkUrl} target="_blank" rel="noopener noreferrer">
              {linkTekst || 'Verder lezen'} ↗
            </a>
          )}
        </div>
      )}
    </div>
  );
}

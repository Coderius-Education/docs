import React from 'react';
import styles from './styles.module.css';

/**
 * Kader met een denker die bij het begrip op deze pagina hoort.
 * Gebruik: <Denker naam="…" jaartal="…" stroming="…" linkUrl="…" linkTekst="…">uitleg</Denker>
 */
export default function Denker({naam, jaartal, stroming, children, linkUrl, linkTekst}) {
  return (
    <div className={styles.kader}>
      <div className={styles.kop}>
        <span className={styles.label}>Denker</span>
        <span className={styles.naam}>
          {naam}
          {jaartal && <span className={styles.jaartal}> · {jaartal}</span>}
        </span>
        {stroming && <span className={styles.stroming}>{stroming}</span>}
      </div>
      <div className={styles.uitleg}>{children}</div>
      {linkUrl && (
        <div className={styles.voet}>
          <a href={linkUrl} target="_blank" rel="noopener noreferrer">
            {linkTekst || 'Verder kijken'} ↗
          </a>
        </div>
      )}
    </div>
  );
}

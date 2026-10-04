import React from 'react';
import Link from '@docusaurus/Link';
import styles from './styles.module.css';

/**
 * Kader met een denker die bij het begrip op deze pagina hoort. Kort houden:
 * het volledige verhaal staat op de pagina van de denker zelf.
 * Gebruik: <Denker naam="…" jaartal="…" stroming="…" linkUrl="…" linkTekst="…">uitleg</Denker>
 */
export default function Denker({naam, jaartal, stroming, children, linkUrl, linkTekst}) {
  const extern = /^https?:/.test(linkUrl || '');
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
          <Link
            to={linkUrl}
            {...(extern ? {target: '_blank', rel: 'noopener noreferrer'} : {})}>
            {linkTekst || (extern ? 'Verder kijken' : 'Lees verder')} {extern ? '↗' : '→'}
          </Link>
        </div>
      )}
    </div>
  );
}

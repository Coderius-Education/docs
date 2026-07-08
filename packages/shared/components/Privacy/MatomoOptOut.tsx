import { type ReactNode, useEffect, useState } from 'react';
import { matomoForgetOptOut, matomoIsOptedOut, matomoOptOut } from '../../matomo';
import type { MatomoOptOutStatus } from '../../matomo';
import styles from './styles.module.css';

// Interactielogica is volledig gedelegeerd aan matomo.js — dit component doet
// zelf geen window._paq-aanroepen, alleen de weergave.
export default function MatomoOptOut(): ReactNode {
  const [status, setStatus] = useState<MatomoOptOutStatus | 'loading'>('loading');

  useEffect(() => {
    matomoIsOptedOut(setStatus);
  }, []);

  if (status === 'loading') return null;

  if (status === 'unavailable') {
    return (
      <p className={styles.optOutNote}>
        Statistieken zijn op dit moment niet actief in je browser, dus er is niets om bezwaar tegen
        te maken.
      </p>
    );
  }

  const isOptedOut = status === 'opted-out';

  return (
    <div className={styles.optOut}>
      <button
        type="button"
        className="button button--secondary"
        onClick={() => {
          if (isOptedOut) {
            matomoForgetOptOut();
            setStatus('active');
          } else {
            matomoOptOut();
            setStatus('opted-out');
          }
        }}
      >
        {isOptedOut ? 'Statistieken weer toestaan' : 'Bezwaar maken tegen statistieken'}
      </button>
      <p className={styles.optOutNote}>
        {isOptedOut
          ? 'Je bezwaar is opgeslagen in je browser. We tellen jouw bezoek niet meer mee.'
          : 'Je bezoek wordt op dit moment cookieloos meegeteld in de statistieken.'}
      </p>
    </div>
  );
}

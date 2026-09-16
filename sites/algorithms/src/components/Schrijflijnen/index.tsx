import type React from 'react';
import styles from './styles.module.css';

// Schrijfruimte op een hand-out: n lijntjes om regels op te schrijven.
// Echte elementen met een onderrand, geen achtergrond-gradient: Chromium
// print gradients onbetrouwbaar (op de grammatica-hand-out kwam één op de
// vier lijntjes door), randen altijd.
export default function Schrijflijnen({ n }: { n: number }): React.ReactElement {
  return (
    <div className={styles.lijnen} aria-hidden="true">
      {Array.from({ length: n }, (_, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: lege, identieke lijntjes
        <div key={i} className={styles.lijn} />
      ))}
    </div>
  );
}

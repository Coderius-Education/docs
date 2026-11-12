import { useInLesTab } from '@coderius/shared/components/LesTabs/paneel';
import { useDoc } from '@docusaurus/plugin-content-docs/client';
import type { ReactElement, ReactNode } from 'react';
import { useEffect, useId, useState } from 'react';
import { isGelukt, zetGelukt } from './opslag';
import styles from './styles.module.css';

// Het succesmoment van een stap: wat je ziet als het werkt, en een vinkje
// "Het werkt" dat de browser onthoudt. De Routekaart op de startpagina zet
// een vinkje achter elke stap die gelukt is. Lukt het niet, dan wijst het
// blok naar Er gaat iets mis op dezelfde pagina.

export default function Gelukt({ children }: { children: ReactNode }): ReactElement {
  const { metadata } = useDoc();
  const pad = metadata.permalink;
  const id = useId();
  // Eerst altijd uit, zodat de HTML van de build en de eerste render gelijk
  // zijn; daarna leest de browser wat hij onthield.
  const [aan, zetAan] = useState(false);
  useEffect(() => zetAan(isGelukt(pad)), [pad]);
  // In een les-tabblad past een scherm op 1280×720. Het blok staat daar wat
  // dichter op elkaar, met het vinkje en de verwijzing op één regel: zo was
  // een stap met een test en dit blok niet langer dan het scherm.
  const inTab = useInLesTab();

  return (
    <aside
      className={`${styles.blok}${inTab ? ` ${styles.inTab}` : ''}`}
      aria-labelledby={`${id}-kop`}
    >
      <p className={styles.kop} id={`${id}-kop`}>
        Gelukt als je dit ziet
      </p>
      <div className={styles.inhoud}>{children}</div>
      <div className={styles.onder}>
        <label className={styles.vinkje}>
          <input
            type="checkbox"
            checked={aan}
            onChange={(e) => {
              zetAan(e.target.checked);
              zetGelukt(pad, e.target.checked);
            }}
          />{' '}
          Het werkt
        </label>
        <p className={styles.niet}>
          Lukt het niet? Kijk bij <a href="#er-gaat-iets-mis">Er gaat iets mis</a>.
        </p>
      </div>
    </aside>
  );
}

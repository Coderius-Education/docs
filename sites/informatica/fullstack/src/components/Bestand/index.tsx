import type { ReactElement } from 'react';
import { bestandInfo } from './logica';
import styles from './styles.module.css';

// Een label boven een codeblok: welk bestand het is en waar het draait (zie
// logica.ts). Staat direct boven het blok, en boven een eventuele marker als
// {/* niet-compileren: … */}, want die hoort direct op de fence te volgen.
export default function Bestand({
  pad,
  antwoord = false,
}: {
  /** Het pad in het project, zoals `main.py` of `templates/berichten.html`. */
  pad?: string;
  /** Geen bestand, maar wat de browser van de server terugkrijgt. */
  antwoord?: boolean;
}): ReactElement {
  const info = bestandInfo(antwoord ? undefined : pad);
  return (
    <div className={`${styles.bestand} ${styles[info.taal]}`}>
      <span className={styles.pad}>{antwoord ? 'Antwoord van de server' : pad}</span>
      <span className={styles.plek}>{info.uitleg}</span>
    </div>
  );
}

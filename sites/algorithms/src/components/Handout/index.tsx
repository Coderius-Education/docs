import type React from 'react';
import { useEffect } from 'react';
import styles from './styles.module.css';

type HandoutProps = {
  children: React.ReactNode;
  /** Tekst op de printknop. */
  buttonLabel?: string;
};

/**
 * Wrapper voor printbare hand-outs (unplugged activiteiten).
 *
 * Zet de class "handout-page" op <body> zolang de pagina open staat;
 * de @media print-regels in src/css/custom.css verbergen dan de
 * site-chrome (navbar, sidebar, footer) zodat alleen de inhoud
 * geprint wordt.
 */
export default function Handout({
  children,
  buttonLabel = 'Print deze hand-out',
}: HandoutProps): React.ReactElement {
  useEffect(() => {
    document.body.classList.add('handout-page');
    return () => {
      document.body.classList.remove('handout-page');
    };
  }, []);

  return (
    <>
      <div className={styles.noPrint}>
        <button type="button" className={styles.printButton} onClick={() => window.print()}>
          {buttonLabel}
        </button>
      </div>
      {children}
    </>
  );
}

import type React from 'react';
import { useEffect } from 'react';
import styles from './styles.module.css';

type HandoutProps = {
  children: React.ReactNode;
  /** Tekst op de printknop. */
  buttonLabel?: string;
  /** Compacte print: kleinere letter en krappere marges, voor een
   *  hand-out die op één dubbelzijdig vel moet passen. */
  compact?: boolean;
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
  compact = false,
}: HandoutProps): React.ReactElement {
  useEffect(() => {
    document.body.classList.add('handout-page');
    if (compact) document.body.classList.add('handout-compact');
    // Een antwoordblad (<details className="handout-antwoorden">) staat op
    // het scherm dicht, zodat een leerling die de hand-out opent de
    // oplossing niet ziet, maar print open als losse laatste pagina.
    // CSS kan een dichte <details> niet openen; dat moet hier.
    const antwoorden = () =>
      Array.from(document.querySelectorAll<HTMLDetailsElement>('details.handout-antwoorden'));
    const openen = () => {
      for (const d of antwoorden()) {
        d.dataset.stondOpen = d.open ? '1' : '';
        d.open = true;
      }
    };
    const sluiten = () => {
      for (const d of antwoorden()) {
        if (!d.dataset.stondOpen) d.open = false;
      }
    };
    window.addEventListener('beforeprint', openen);
    window.addEventListener('afterprint', sluiten);
    return () => {
      document.body.classList.remove('handout-page');
      document.body.classList.remove('handout-compact');
      window.removeEventListener('beforeprint', openen);
      window.removeEventListener('afterprint', sluiten);
    };
  }, [compact]);

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

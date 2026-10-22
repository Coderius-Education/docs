import type React from 'react';
import { useEffect } from 'react';
import styles from './styles.module.css';
import './handout.css';

// Vaste, gelijke printmarges (browsers verschillen in hun standaard); samen
// met de kolommen bepaalt dit dat een compacte hand-out op één dubbelzijdig
// vel past. Een @page-regel kun je niet tot één pagina beperken met een
// selector, en in handout.css gold hij voor elke pagina van de site, ook voor
// een les die iemand print. Daarom zet de hand-out hem zelf neer, zolang hij
// open staat.
export const PAGINA = '@page { size: A4; margin: 10mm 12mm; }';

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
 * de @media print-regels in handout.css verbergen dan de site-chrome
 * (navbar, sidebar, footer) zodat alleen de inhoud geprint wordt.
 */
export default function Handout({
  children,
  buttonLabel = 'Print deze hand-out',
  compact = false,
}: HandoutProps): React.ReactElement {
  useEffect(() => {
    document.body.classList.add('handout-page');
    const pagina = document.createElement('style');
    pagina.dataset.handoutPagina = '';
    pagina.textContent = PAGINA;
    document.head.appendChild(pagina);
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
      pagina.remove();
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

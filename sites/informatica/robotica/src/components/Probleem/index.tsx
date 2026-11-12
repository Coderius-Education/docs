import { useInLesTab } from '@coderius/shared/components/LesTabs/paneel';
import type React from 'react';
import { useId, useState } from 'react';
import styles from './styles.module.css';

interface ProbleemProps {
  // Wat de leerling ziet, in zijn woorden: "De servo doet helemaal niets."
  titel: string;
  // De **Oorzaak:**, **Oplossing:** en eventueel **Zelf vinden:** als
  // gewone alinea's.
  children: React.ReactNode;
}

// Eén probleem onder "Er gaat iets mis", als kaart. Losse vette regels onder
// elkaar lazen als één lange lap; met een kaart per probleem ziet de leerling
// waar het ene ophoudt en het volgende begint.
//
// In een les-tabblad is een kaart dicht tot je hem aanklikt. Vijf kaarten open
// onder elkaar waren bij de servo 775 pixels langer dan het scherm; dicht
// staan de titels onder elkaar, en dat is ook hoe je zoekt: wat zie ik? Op
// papier staan alle kaarten open.
export default function Probleem({ titel, children }: ProbleemProps): React.JSX.Element {
  const inTab = useInLesTab();
  const [open, setOpen] = useState(false);
  const id = useId();
  if (!inTab) {
    return (
      <section className={styles.kaart}>
        <p className={styles.titel}>{titel}</p>
        <div className={styles.inhoud}>{children}</div>
      </section>
    );
  }
  return (
    <section className={`${styles.kaart} ${styles.inTab}`}>
      <p className={styles.titel}>
        <button
          type="button"
          className={styles.knop}
          aria-expanded={open}
          aria-controls={id}
          onClick={() => setOpen((was) => !was)}
        >
          {titel}
        </button>
      </p>
      <div id={id} className={styles.inhoud} hidden={!open}>
        {children}
      </div>
    </section>
  );
}

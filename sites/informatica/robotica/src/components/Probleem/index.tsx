import type React from 'react';
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
export default function Probleem({ titel, children }: ProbleemProps): React.JSX.Element {
  return (
    <section className={styles.kaart}>
      <p className={styles.titel}>{titel}</p>
      <div className={styles.inhoud}>{children}</div>
    </section>
  );
}

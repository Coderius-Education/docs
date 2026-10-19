import Link from '@docusaurus/Link';
import type React from 'react';
import styles from './styles.module.css';

interface Keuze {
  // Kort en groot: "De arm namaken".
  titel: string;
  // Eén of twee zinnen over wat je bij deze keuze doet.
  tekst: string;
  // Waar de keuze op de pagina begint, als anker: "#namaken".
  naar: string;
  // De tekst van de link onderaan de kaart.
  knop: string;
}

// Twee (of meer) gelijkwaardige manieren, als kaarten naast elkaar. Een
// opsomming met "Arm A" en "Arm B" viel tussen de rest van de pagina weg; een
// leerling las eroverheen en dacht dat hij alle stappen moest volgen.
export default function Keuzekaarten({ keuzes }: { keuzes: Keuze[] }): React.JSX.Element {
  return (
    <div className={styles.rij}>
      {keuzes.map((k, i) => (
        <Link key={k.naar} to={k.naar} className={styles.kaart}>
          <span className={styles.label}>Keuze {i + 1}</span>
          <span className={styles.titel}>{k.titel}</span>
          <span className={styles.tekst}>{k.tekst}</span>
          <span className={styles.knop}>{k.knop} →</span>
        </Link>
      ))}
    </div>
  );
}

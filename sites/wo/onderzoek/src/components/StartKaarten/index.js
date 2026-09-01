import React from 'react';
import Link from '@docusaurus/Link';
import styles from './styles.module.css';

const kaarten = [
  {
    titel: 'Typen onderzoek',
    tekst: 'Wil je iets wéten of iets máken? De eerste keuze van elk onderzoek.',
    to: '/typen/theorie-vs-ontwerp',
  },
  {
    titel: 'De spelregels',
    tekst: 'Betrouwbaar, valide, transparant en aanvaardbaar — waar elk onderzoek aan moet voldoen.',
    to: '/spelregels/de-vier-spelregels',
  },
  {
    titel: 'Onderzoek opzetten',
    tekst: 'Kies per deelvraag een functie, soort en methode met de keuzedriehoek.',
    to: '/opzet/keuzedriehoek',
  },
  {
    titel: 'Soorten gegevens',
    tekst: 'Cijfers of woorden? Kwantitatief telt, kwalitatief vertelt.',
    to: '/gegevens/kwal-vs-kwant',
  },
  {
    titel: 'Termen',
    tekst: 'Alle begrippen op een rij — en een trainer om jezelf te overhoren.',
    to: '/termen',
  },
];

export default function StartKaarten() {
  return (
    <div className={styles.grid}>
      {kaarten.map((k) => (
        <Link key={k.to} to={k.to} className={styles.kaart}>
          <span className={styles.titel}>{k.titel}</span>
          <span className={styles.tekst}>{k.tekst}</span>
        </Link>
      ))}
    </div>
  );
}

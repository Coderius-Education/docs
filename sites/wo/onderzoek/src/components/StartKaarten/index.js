import Link from '@docusaurus/Link';
import React from 'react';
import styles from './styles.module.css';

const kaarten = [
  {
    titel: 'Typen onderzoek',
    tekst: 'Wil je iets wéten of iets máken? De eerste keuze van elk onderzoek.',
    to: '/typen/theorie-vs-ontwerp',
  },
  {
    titel: 'Onderzoeksvragen',
    tekst: 'Van onderwerp naar een scherpe hoofdvraag, en deelvragen die samen het antwoord geven.',
    to: '/vragen/hoofd-en-deelvragen',
  },
  {
    titel: 'De spelregels',
    tekst:
      'Betrouwbaar, valide, transparant en aanvaardbaar — waar elk onderzoek aan moet voldoen.',
    to: '/spelregels/de-vier-spelregels',
  },
  {
    titel: 'Kennisleer',
    tekst:
      'Hoe weet je eigenlijk iets? Scepticisme, rationalisme en empirisme — en wat dat met onderzoek te maken heeft.',
    to: '/kennisleer/hoe-weet-je-iets',
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
    titel: 'Literatuurstudie',
    tekst:
      'Zoeken met Google Scholar, beoordelen op citaties en peer review, en lezen op het juiste niveau.',
    to: '/literatuurstudie/van-zoeken-tot-lezen',
  },
  {
    titel: 'De academische wereld',
    tekst:
      'Van promovendus tot hoogleraar, hoe promoveren werkt, en wat je als student met AI mag.',
    to: '/academie/academische-wereld',
  },
  {
    titel: 'Werkvormen',
    tekst:
      'Klasopdrachten met een printbaar werkblad: vragenkaartjes, je vraag scherpstellen, van vijftig bronnen naar drie, en methoden langs de kennisleer-bril.',
    to: '/werkvormen/overzicht',
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

import { BRONNEN, auteursEnJaar } from '@site/src/data/bronnen';
import React from 'react';
import styles from './styles.module.css';

/**
 * Bronvermelding direct onder de titel van een pagina die een begrip of
 * indeling uit een bron overneemt. `over` zegt wat er is overgenomen, zodat
 * de lezer weet waar de eigen uitwerking begint; `hoofdstuk` noemt het
 * hoofdstuk als dat bekend is.
 * Gebruik: <Bron id="ikdenk" hoofdstuk="4, Kennisleer" over="De behandeling van het empirisme" />
 */
export default function Bron({ id, over, hoofdstuk }) {
  const bron = BRONNEN[id];
  if (!bron) throw new Error(`<Bron id="${id}">: onbekende bron, zie src/data/bronnen.js`);
  return (
    <p className={styles.bron}>
      {over} is gebaseerd op {auteursEnJaar(bron)}. <cite>{bron.titel}</cite>
      {hoofdstuk && `, hoofdstuk ${hoofdstuk}`}. {bron.uitgever}. De tekst, voorbeelden en
      oefeningen op deze pagina zijn een eigen uitwerking.
      {bron.url && (
        <>
          {' '}
          <a href={bron.url} target="_blank" rel="noopener noreferrer">
            Meer over het boek ↗
          </a>
        </>
      )}
    </p>
  );
}

import React from 'react';
import styles from './styles.module.css';

/**
 * Ethische kader-waarschuwing voor de DVWA-cursus.
 *
 * Globaal geregistreerd in src/theme/MDXComponents.tsx, dus bruikbaar
 * zonder import als <Ethiek /> bovenaan elke instap- en low-pagina.
 * Herinnert de leerling eraan dat aanvallen alleen in de eigen
 * oefenomgeving mogen — nooit op systemen van een ander.
 */
export default function Ethiek() {
  return (
    <aside className={styles.ethiek} role="note" aria-label="Alleen in je eigen lab">
      <p className={styles.kop}>
        <span aria-hidden="true">⚠</span> Alleen in je eigen lab
      </p>
      <p className={styles.tekst}>
        Alles wat je hier leert, oefen je uitsluitend in het ingebouwde lab of je eigen
        DVWA-installatie. Dezelfde technieken loslaten op een website, server of account van iemand
        anders is strafbaar, ook als je alleen &ldquo;wilt kijken of het kan&rdquo;. Toestemming
        vooraf is de grens: geen toestemming, niet doen.
      </p>
    </aside>
  );
}

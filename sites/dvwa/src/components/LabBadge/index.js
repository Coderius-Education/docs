import React from 'react';
import styles from './styles.module.css';

/**
 * Kleine badge die per challenge aangeeft of je hem volledig in de browser
 * kunt doen of dat er een lokale installatie bij komt kijken.
 *
 * Globaal geregistreerd in src/theme/MDXComponents.tsx, dus bruikbaar zonder
 * import als <LabBadge status="browser|deels|lokaal" />. Gebruikt op de
 * indexpagina (overzichtstabel) en bovenaan elke low-pagina.
 */
const VARIANTEN = {
  browser: {
    klasse: 'browser',
    symbool: '✓',
    kort: 'Browser',
    lang: 'Volledig in het ingebouwde lab te doen',
  },
  deels: {
    klasse: 'deels',
    symbool: '⚠',
    kort: 'Deels lokaal',
    lang: 'Een paar levels vereisen een lokale installatie',
  },
  lokaal: {
    klasse: 'lokaal',
    symbool: '⚠',
    kort: 'Lokaal nodig',
    lang: 'Vereist een lokale Kali/DVWA-installatie',
  },
};

export default function LabBadge({ status = 'browser' }) {
  const v = VARIANTEN[status] ?? VARIANTEN.browser;
  return (
    <span className={`${styles.badge} ${styles[v.klasse]}`} title={v.lang}>
      <span aria-hidden="true">{v.symbool}</span> {v.kort}
    </span>
  );
}

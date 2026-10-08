import { legacyHost } from '@coderius/shared/sites';
import BrowserOnly from '@docusaurus/BrowserOnly';
import Link from '@docusaurus/Link';
import type { ReactNode } from 'react';
import styles from './Overzetten.module.css';

// Op het oude adres (ide.coderius.nl/ide/, dat een tijd live blijft) opent de
// IDE de oude projecten zelf (projectOpslag); daar valt niets over te zetten.
function OpHetOudeAdres(): ReactNode {
  return (
    <main className={styles.wrap}>
      <h1>Oude projecten</h1>
      <p>
        Je zit op het oude adres van de IDE. Je projecten van vóór de verhuizing staan hier gewoon
        in de editor. <Link to="/">Open de editor</Link>
      </p>
    </main>
  );
}

export default function Overzetten(): ReactNode {
  return (
    <BrowserOnly fallback={<div style={{ padding: '2rem' }}>Laden...</div>}>
      {() => {
        if (window.location.hostname === legacyHost('ide')) return <OpHetOudeAdres />;
        const Impl = require('./OverzettenImpl').default;
        return <Impl />;
      }}
    </BrowserOnly>
  );
}

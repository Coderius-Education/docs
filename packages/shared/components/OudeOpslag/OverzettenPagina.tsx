import BrowserOnly from '@docusaurus/BrowserOnly';
import Layout from '@theme/Layout';
import type { ReactNode } from 'react';

// Route /overzetten (plugins/oude-opslag.js) op een site met oudeOpslag.
export default function OverzettenPagina(): ReactNode {
  return (
    <Layout
      title="Werk van het oude adres"
      description="Neem je werk van het oude adres van deze cursus mee"
    >
      <BrowserOnly fallback={<div style={{ padding: '2rem' }}>Laden...</div>}>
        {() => {
          const Overzetten = require('./Overzetten').default;
          return <Overzetten />;
        }}
      </BrowserOnly>
    </Layout>
  );
}

import BrowserOnly from '@docusaurus/BrowserOnly';
import type { ReactNode } from 'react';

export default function Overzetten(): ReactNode {
  return (
    <BrowserOnly fallback={<div style={{ padding: '2rem' }}>Laden...</div>}>
      {() => {
        const Impl = require('./OverzettenImpl').default;
        return <Impl />;
      }}
    </BrowserOnly>
  );
}

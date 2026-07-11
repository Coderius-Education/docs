import BrowserOnly from '@docusaurus/BrowserOnly';
import type { ReactNode } from 'react';

export default function ImportProject(): ReactNode {
  return (
    <BrowserOnly fallback={<div style={{ padding: '2rem' }}>Laden...</div>}>
      {() => {
        const Impl = require('./ImportProjectImpl').default;
        return <Impl />;
      }}
    </BrowserOnly>
  );
}

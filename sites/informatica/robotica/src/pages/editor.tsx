import BrowserOnly from '@docusaurus/BrowserOnly';
import Layout from '@theme/Layout';
import type React from 'react';

export default function EditorPage(): React.JSX.Element {
  return (
    <Layout
      title="Online editor"
      description="Browser-based MicroPython-editor voor de Arduino Nano RP2040 Connect"
    >
      <BrowserOnly fallback={<div style={{ padding: 20 }}>Editor laden...</div>}>
        {() => {
          const WebMicroEditor = require('@site/src/components/WebMicroEditor').default;
          return <WebMicroEditor />;
        }}
      </BrowserOnly>
    </Layout>
  );
}

import type {ReactNode} from 'react';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';
import BrowserOnly from '@docusaurus/BrowserOnly';

function PlaygroundFallback(): ReactNode {
  return <p>Python playground wordt geladen...</p>;
}

export default function PlaygroundPage(): ReactNode {
  return (
    <Layout title="Python Playground" description="Schrijf en voer Python code uit in je browser">
      <main className="container margin-vert--lg">
        <Heading as="h1">Python Playground</Heading>
        <p>Schrijf Python code en voer het direct uit in je browser. Er hoeft niets geinstalleerd te worden!</p>
        <BrowserOnly fallback={<PlaygroundFallback />}>
          {() => {
            const PythonPlayground = require('@site/src/components/PythonPlayground').default;
            return <PythonPlayground />;
          }}
        </BrowserOnly>
      </main>
    </Layout>
  );
}

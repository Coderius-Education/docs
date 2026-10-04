import Layout from '@theme/Layout';
import type { ReactNode } from 'react';
import ImportProject from '../components/ImportProject';

export default function Import(): ReactNode {
  return (
    <Layout title="Project importeren" description="Bezig met het laden van je project" noFooter>
      <ImportProject />
    </Layout>
  );
}

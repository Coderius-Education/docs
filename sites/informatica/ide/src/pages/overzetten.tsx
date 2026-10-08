import Layout from '@theme/Layout';
import type { ReactNode } from 'react';
import Overzetten from '../components/Overzetten';

export default function OverzettenPagina(): ReactNode {
  return (
    <Layout
      title="Oude projecten overzetten"
      description="Neem je projecten van ide.coderius.nl mee naar de nieuwe IDE"
    >
      <Overzetten />
    </Layout>
  );
}

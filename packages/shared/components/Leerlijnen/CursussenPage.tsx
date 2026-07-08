import Layout from '@theme/Layout';
import type { ReactNode } from 'react';
import Leerlijnen from './index';

// Volledige paginawrapper voor de /cursussen-route (toegevoegd door de
// gedeelde cursussen-route plugin). Houdt navbar + footer eromheen.
export default function CursussenPage(): ReactNode {
  return (
    <Layout
      title="Alle cursussen"
      description="Overzicht van alle Coderius-cursussen en hoe ze op elkaar voortbouwen."
    >
      <main>
        <Leerlijnen />
      </main>
    </Layout>
  );
}

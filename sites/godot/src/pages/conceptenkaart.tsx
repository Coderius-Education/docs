import ConceptenKaart from '@site/src/components/ConceptenKaart';
import Heading from '@theme/Heading';
import Layout from '@theme/Layout';
import type { ReactNode } from 'react';

export default function ConceptenKaartPagina(): ReactNode {
  return (
    <Layout
      title="Conceptenkaart"
      description="Zie welke editor-, node- en GDScript-concepten je in elke les gebruikt."
    >
      <main className="container margin-vert--lg">
        <Heading as="h1">Conceptenkaart</Heading>
        <p>
          Deze cursus verweeft drie leerlijnen: werken met de editor, bouwen met nodes, en
          programmeren in GDScript. Links staan de concepten, gekleurd per leerlijn; rechts de
          lessen. Beweeg over een blok of klik erop om te zien wat waar aan bod komt. Onder de kaart
          verschijnen links naar de uitleg of de les.
        </p>
        <ConceptenKaart />
      </main>
    </Layout>
  );
}

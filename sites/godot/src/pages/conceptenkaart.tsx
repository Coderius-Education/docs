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
          programmeren in GDScript. De kaart toont één hoofdstuk tegelijk: rechts de lessen van dat
          hoofdstuk, links de concepten die daarin voorkomen, gekleurd per leerlijn. Beweeg over een
          blok of klik erop om te zien wat waar aan bod komt; onder de kaart verschijnen dan links
          naar de uitleg of de les. Klik je een concept aan, dan zie je álle lessen waarin het
          terugkomt, ook buiten dit hoofdstuk.
        </p>
        <ConceptenKaart />
      </main>
    </Layout>
  );
}

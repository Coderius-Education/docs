import ConceptenKaart from '@site/src/components/ConceptenKaart';
import Heading from '@theme/Heading';
import Layout from '@theme/Layout';
import type { ReactNode } from 'react';

export default function ConceptenKaartPagina(): ReactNode {
  return (
    <Layout
      title="Conceptenkaart"
      description="Zie op welke Python-concepten elk algoritme draait."
    >
      <main className="container margin-vert--lg">
        <Heading as="h1">Conceptenkaart</Heading>
        <p>
          Links staan de lessen uit de Python-cursus, rechts de algoritmes op deze site. Een lijn
          betekent: dit algoritme draait op dit concept. Beweeg over een blok of klik erop om te
          zien welke concepten bij welk algoritme horen. Onder de kaart verschijnen links naar de
          les of het algoritme. Alle voorkennis van een les, ook wat er zijdelings in voorkomt,
          staat bovenaan die les.
        </p>
        <p>
          De kaart werkt twee kanten op: elke Python-les hiernaast sluit af met een blok "Waar kom
          je dit later weer tegen?" dat terugwijst naar de algoritmes die erop bouwen.
        </p>
        <ConceptenKaart />
      </main>
    </Layout>
  );
}

import ConceptenKaart from '@site/src/components/ConceptenKaart';
import Heading from '@theme/Heading';
import Layout from '@theme/Layout';
import type { ReactNode } from 'react';

export default function ConceptenKaartPagina(): ReactNode {
  return (
    <Layout
      title="Conceptenkaart"
      description="Zie welke Python-voorkennis je bij elk algoritme gebruikt."
    >
      <main className="container margin-vert--lg">
        <Heading as="h1">Conceptenkaart</Heading>
        <p>
          Links staan de lessen uit de Python-cursus, rechts de algoritmes op deze site. Beweeg over
          een blok of klik erop om te zien welke voorkennis bij welk algoritme hoort. Onder de kaart
          verschijnen links naar de les of het algoritme.
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

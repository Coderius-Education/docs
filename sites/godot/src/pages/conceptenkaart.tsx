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
          programmeren in GDScript. Elke leerlijn heeft hier zijn eigen kaart. Links staan de
          concepten, rechts de lessen waarin ze voorkomen, en de dikke lijn wijst naar de les waar
          je het concept leert.
        </p>
        <p>
          Zoek je waar iets wordt uitgelegd, klik dan op het concept: onder de kaart staat in welke
          les je het leert en waar je het daarna nog gebruikt. Andersom kan ook — klik op een les en
          je ziet wat daar nieuw is en wat je uit eerdere lessen meeneemt.
        </p>
        <ConceptenKaart />
      </main>
    </Layout>
  );
}

import { Checker } from '@coderius/checker/Checker';
import { fullstackConfig } from '@site/src/checker/config';
import Layout from '@theme/Layout';
import type { ReactNode } from 'react';

// Verborgen docentpagina: bewust niet in de navbar. De volledige rapportage +
// opmerkingen + PDF-export zit achter een zacht wachtwoord (zie config.ts).
export default function NakijkenDocent(): ReactNode {
  return (
    <Layout
      title="Project checken — docent"
      description="Docentweergave van de fullstack-nakijker met volledige rapportage en PDF-export"
    >
      <main className="container margin-vert--lg">
        <h1>Project checken — docent</h1>
        <Checker config={fullstackConfig} variant="docent" />
      </main>
    </Layout>
  );
}

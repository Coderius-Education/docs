import { Checker } from '@coderius/checker/Checker';
import { webConfig } from '@site/src/checker/config';
import Layout from '@theme/Layout';
import type { ReactNode } from 'react';

// Verborgen docentpagina: bewust niet in de navbar. De volledige rapportage +
// opmerkingen + PDF-export zit achter een zacht wachtwoord (de Checker regelt
// de gate zelf via de docent-variant; wachtwoord in src/checker/config.ts).
export default function WebsiteCheckenDocent(): ReactNode {
  return (
    <Layout
      title="Website checken — docent"
      description="Docentweergave van de website-checker met volledige rapportage en PDF-export"
    >
      <main className="container margin-vert--lg">
        <h1>Website checken — docent</h1>
        <Checker config={webConfig} variant="docent" />
      </main>
    </Layout>
  );
}

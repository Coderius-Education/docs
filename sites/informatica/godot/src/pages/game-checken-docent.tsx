import { Checker } from '@coderius/checker/Checker';
import { godotConfig } from '@site/src/checker/config';
import Layout from '@theme/Layout';
import type { ReactNode } from 'react';

// Verborgen docentpagina: bewust niet in de navbar. Volledige rapportage +
// opmerkingen + PDF-export achter een zacht wachtwoord (zie config.ts).
export default function NakijkenDocent(): ReactNode {
  return (
    <Layout
      title="Game checken — docent"
      description="Docentweergave van de godot-nakijker met volledige rapportage en PDF-export"
    >
      <main className="container margin-vert--lg">
        <h1>Game checken — docent</h1>
        <Checker config={godotConfig} variant="docent" />
      </main>
    </Layout>
  );
}

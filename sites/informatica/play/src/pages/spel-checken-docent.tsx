import { Checker } from '@coderius/checker/Checker';
import { playConfig } from '@site/src/checker/config';
import Layout from '@theme/Layout';
import type { ReactNode } from 'react';

// Verborgen docentpagina: bewust niet in de navbar. Volledige rapportage plus
// opmerkingen en PDF-export achter een zacht wachtwoord (zie config.ts).
export default function SpelCheckenDocent(): ReactNode {
  return (
    <Layout
      title="Spel checken — docent"
      description="Docentweergave van de play-nakijker met volledige rapportage en PDF-export"
    >
      <main className="container margin-vert--lg">
        <h1>Spel checken — docent</h1>
        <Checker config={playConfig} variant="docent" />
      </main>
    </Layout>
  );
}

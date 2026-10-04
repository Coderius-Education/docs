import { Checker } from '@coderius/checker/Checker';
import { roboticaConfig } from '@site/src/checker/config';
import Layout from '@theme/Layout';
import type { ReactNode } from 'react';

// Verborgen docentpagina: bewust niet in de navbar. De volledige rapportage +
// foto's + opmerkingen + PDF-export zit achter een zacht wachtwoord (zie
// config.ts). Hier zit ook de leerroute-schakelaar en het aanvinken van wat
// alleen op de foto's te zien is.
export default function RobotCheckenDocent(): ReactNode {
  return (
    <Layout
      title="Robot checken — docent"
      description="Docentweergave van de robotica-nakijker met code, foto's en PDF-export"
    >
      <main className="container margin-vert--lg">
        <h1>Robot checken — docent</h1>
        <Checker config={roboticaConfig} variant="docent" />
      </main>
    </Layout>
  );
}

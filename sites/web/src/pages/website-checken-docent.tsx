import { WebsiteChecker } from '@site/src/components/WebsiteChecker';
import { TeacherGate } from '@site/src/components/WebsiteChecker/TeacherGate';
import Layout from '@theme/Layout';
import type { ReactNode } from 'react';

// Verborgen docentpagina: bewust niet in de navbar (zie docusaurus.config.ts).
// De volledige rapportage + opmerkingen + PDF-export zit achter een zacht
// wachtwoord (TeacherGate). Zie teacherAccess.ts om het wachtwoord te wijzigen.
export default function WebsiteCheckenDocent(): ReactNode {
  return (
    <Layout
      title="Website checken — docent"
      description="Docentweergave van de website-checker met volledige rapportage en PDF-export"
    >
      <main className="container margin-vert--lg">
        <h1>Website checken — docent</h1>
        <TeacherGate>
          <WebsiteChecker variant="docent" />
        </TeacherGate>
      </main>
    </Layout>
  );
}

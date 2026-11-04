import Link from '@docusaurus/Link';
import Layout from '@theme/Layout';
import type { ReactNode } from 'react';
import type { Leerdoelen } from '../../leerdoelen';
import { useCursus } from './LeerdoelenPagina';
import Vergelijking from './Vergelijking';

// De route /leerdoelen/vergelijken (plugins/leerdoelen.js), alleen bij een
// cursus met meer dan één niveau: per concept de moeilijkheid op elk niveau.
export default function VergelijkPagina({ leerdoelen }: { leerdoelen: Leerdoelen }): ReactNode {
  const cursus = useCursus();
  return (
    <Layout
      title="Niveaus vergelijken"
      description={`De niveaus van ${cursus ?? 'de cursus'} naast elkaar: per concept de moeilijkheid op elk niveau.`}
    >
      <main className="container margin-vert--lg">
        <h1>Niveaus vergelijken{cursus ? `: ${cursus}` : ''}</h1>
        <p>
          Per concept zie je hier of het op elk niveau basis, gevorderd of expert is. Een verschil
          met het niveau ervoor heeft een rand. Terug naar het{' '}
          <Link to="/leerdoelen">overzicht van de leerdoelen</Link>.
        </p>
        <Vergelijking leerdoelen={leerdoelen} />
      </main>
    </Layout>
  );
}

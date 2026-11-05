import Link from '@docusaurus/Link';
import Layout from '@theme/Layout';
import type { ReactNode } from 'react';
import { type Leerdoelen, moeilijkhedenTekst } from '../../leerdoelen';
import { useCursus } from './LeerdoelenPagina';
import Vergelijking from './Vergelijking';

// De route /leerdoelen/vergelijken (plugins/leerdoelen.js), alleen bij een
// cursus met meer dan één niveau: per concept de moeilijkheid op elk niveau.
export default function VergelijkPagina({ leerdoelen }: { leerdoelen: Leerdoelen }): ReactNode {
  const cursus = useCursus();
  // Een concept met null hoort niet bij dat niveau; de tabel toont een streepje.
  const metStreepje = leerdoelen.concepten.some((c) => Object.values(c.niveau).includes(null));
  return (
    <Layout
      title="Niveaus vergelijken"
      description={`De niveaus van ${cursus ?? 'de cursus'} naast elkaar: per concept de moeilijkheid op elk niveau.`}
    >
      <main className="container margin-vert--lg">
        <h1>Niveaus vergelijken{cursus ? `: ${cursus}` : ''}</h1>
        <p>
          Per concept zie je hier of het op elk niveau {moeilijkhedenTekst(leerdoelen)} is. Een
          verschil met het niveau ervoor heeft een rand.
          {metStreepje && ' Een streepje: dat concept hoort niet bij dat niveau.'} Terug naar het{' '}
          <Link to="/leerdoelen">overzicht van de leerdoelen</Link>.
        </p>
        <Vergelijking leerdoelen={leerdoelen} />
      </main>
    </Layout>
  );
}

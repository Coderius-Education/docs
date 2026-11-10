import Link from '@docusaurus/Link';
import Heading from '@theme/Heading';
import Layout from '@theme/Layout';
import type { ReactNode } from 'react';
import { type Leerdoelen, moeilijkhedenTekst } from '../../leerdoelen';
import { useCursus } from './LeerdoelenPagina';
import Vergelijking from './Vergelijking';
import Verschillen from './Verschillen';

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
          Eerst per overgang wat er verandert. Daaronder staan de niveaus naast elkaar: per concept
          of het op elk niveau {moeilijkhedenTekst(leerdoelen)} is. Terug naar het{' '}
          <Link to="/leerdoelen">overzicht van de leerdoelen</Link>.
        </p>
        <Verschillen leerdoelen={leerdoelen} />
        <Heading as="h2" id="naast-elkaar">
          De niveaus naast elkaar
        </Heading>
        <p>
          Een cel die anders is dan het niveau ervoor, zegt wat het concept daar was, en de rij
          heeft een streep links.
          {metStreepje && ' Een streepje: dat concept hoort niet bij dat niveau.'}
        </p>
        <Vergelijking leerdoelen={leerdoelen} />
      </main>
    </Layout>
  );
}

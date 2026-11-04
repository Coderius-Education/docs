import Link from '@docusaurus/Link';
import Layout from '@theme/Layout';
import type { ReactNode } from 'react';
import type { Leerdoelen } from '../../leerdoelen';
import { useCursus } from './LeerdoelenPagina';
import Niveau from './Niveau';

// De route /leerdoelen/<niveau> (plugins/leerdoelen.js): één niveau, om te
// printen of met een klas te delen.
export default function NiveauPagina({
  leerdoelen,
  niveau,
}: {
  leerdoelen: Leerdoelen;
  niveau: string;
}): ReactNode {
  const cursus = useCursus();
  const label = leerdoelen.niveaus.find((n) => n.id === niveau)?.label ?? niveau;
  return (
    <Layout
      title={`Leerdoelen ${label}`}
      description={`De concepten van ${cursus ?? 'de cursus'}, niveau ${label}.`}
    >
      <main className="container margin-vert--lg">
        <h1>
          Leerdoelen{cursus ? ` ${cursus}` : ''}: {label}
        </h1>
        <p>
          Op deze concepten beoordeelt je docent je project op het niveau {label}. Alle niveaus
          naast elkaar staan op <Link to="/leerdoelen">Leerdoelen</Link>, en hoe het cijfer tot
          stand komt bij <Link to="/leerdoelen/bloom">Beoordelen met Bloom</Link>.
        </p>
        <Niveau leerdoelen={leerdoelen} niveau={niveau} kop="h2" />
      </main>
    </Layout>
  );
}

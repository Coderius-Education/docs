import Link from '@docusaurus/Link';
import Layout from '@theme/Layout';
import type { ReactNode } from 'react';
import type { Leerdoelen } from '../../leerdoelen';
import { useCursus } from './LeerdoelenPagina';
import Niveau from './Niveau';
import Tentamen from './Tentamen';

// De route /leerdoelen/niveau-<n> (plugins/leerdoelen.js): de concepten van
// één niveau, om te printen of met een klas te delen.
export default function NiveauPagina({
  leerdoelen,
  niveau,
}: {
  leerdoelen: Leerdoelen;
  niveau: string;
}): ReactNode {
  const cursus = useCursus();
  const label = leerdoelen.niveaus.find((n) => n.id === niveau)?.label ?? niveau;
  if (leerdoelen.tentamen?.niveau === niveau) {
    return (
      <Layout
        title={`Leerdoelen ${label}`}
        description={`Het tentamen van ${cursus ?? 'de cursus'} op ${label}: wat erin komt en waar je het oefent.`}
      >
        <main className="container margin-vert--lg">
          <h1>
            Leerdoelen{cursus ? ` ${cursus}` : ''}: {label}
          </h1>
          <p>
            Op {label} sluit je af met een tentamen. Hieronder staat wat erin komt, en bij elk
            onderdeel de les waar je het oefent. De andere niveaus staan op het{' '}
            <Link to="/leerdoelen">overzicht</Link>.
          </p>
          <Tentamen leerdoelen={leerdoelen} />
        </main>
      </Layout>
    );
  }
  return (
    <Layout
      title={`Leerdoelen ${label}`}
      description={`De concepten van ${cursus ?? 'de cursus'} op ${label}.`}
    >
      <main className="container margin-vert--lg">
        <h1>
          Leerdoelen{cursus ? ` ${cursus}` : ''}: {label}
        </h1>
        <p>
          Op deze concepten beoordeelt je docent je project op {label}. De andere niveaus en hoe het
          cijfer tot stand komt, staan op het <Link to="/leerdoelen">overzicht</Link>.
        </p>
        <Niveau leerdoelen={leerdoelen} niveau={niveau} kop="h2" />
      </main>
    </Layout>
  );
}

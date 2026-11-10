import Link from '@docusaurus/Link';
import Layout from '@theme/Layout';
import type { ReactNode } from 'react';
import { type Leerdoelen, heeftExpert, opsomming, verschilTelling } from '../../leerdoelen';
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
  // Wat er anders is dan het niveau ervoor; bij het eerste niveau niets.
  // Wat afvalt, staat niet op deze pagina en wordt apart geteld.
  const telling = verschilTelling(leerdoelen, niveau);
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
        {telling &&
          telling.opPagina +
            telling.afgevallen +
            telling.nieuweOnderwerpen.length +
            telling.weggevallenOnderwerpen.length >
            0 && (
            <p>
              {telling.nieuweOnderwerpen.length > 0 && (
                <>
                  {telling.nieuweOnderwerpen.length === 1 ? 'Het onderwerp' : 'De onderwerpen'}{' '}
                  {opsomming(telling.nieuweOnderwerpen.map((o) => o.label))}{' '}
                  {telling.nieuweOnderwerpen.length === 1 ? 'begint' : 'beginnen'} op dit niveau.{' '}
                </>
              )}
              {telling.weggevallenOnderwerpen.length > 0 && (
                <>
                  {opsomming(telling.weggevallenOnderwerpen.map((o) => o.label))} van{' '}
                  {telling.van.label}{' '}
                  {telling.weggevallenOnderwerpen.length === 1 ? 'hoort' : 'horen'} er niet meer
                  bij.{' '}
                </>
              )}
              {telling.opPagina > 0 && (
                <>
                  Anders dan {telling.van.label}: {telling.opPagina}{' '}
                  {telling.opPagina === 1 ? 'concept' : 'concepten'} hieronder. Bij elk staat wat
                  het daar was, of dat het nieuw is.{' '}
                </>
              )}
              {telling.afgevallen > 0 && (
                <>
                  {telling.afgevallen} {telling.afgevallen === 1 ? 'concept' : 'concepten'} van{' '}
                  {telling.van.label} {telling.afgevallen === 1 ? 'hoort' : 'horen'} er niet meer
                  bij.{' '}
                </>
              )}
              <Link to="/leerdoelen/vergelijken">Vergelijk de niveaus</Link> om alle verschillen
              naast elkaar te zien.
            </p>
          )}
        {heeftExpert(leerdoelen, niveau) && (
          <p>
            De concepten op expert zijn er vooral om te laten zien dat je meer kunt dan het
            lesmateriaal. Voor het cijfer tellen ze als gevorderd.
          </p>
        )}
        <Niveau leerdoelen={leerdoelen} niveau={niveau} kop="h2" />
      </main>
    </Layout>
  );
}

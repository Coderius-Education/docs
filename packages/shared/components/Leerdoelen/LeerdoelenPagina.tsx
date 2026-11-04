import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Heading from '@theme/Heading';
import Layout from '@theme/Layout';
import type { ReactNode } from 'react';
import {
  CONCEPT_MOEILIJKHEDEN,
  type Leerdoelen,
  moeilijkhedenTekst,
  projectNiveaus,
} from '../../leerdoelen';
import { siteByUrl } from '../../sites';
import Bloom from './Bloom';
import styles from './styles.module.css';

/** De cursus, voor in de titel. */
export function useCursus(): string | null {
  const { siteConfig } = useDocusaurusContext();
  return siteByUrl(siteConfig.url + siteConfig.baseUrl)?.label ?? null;
}

// De overzichtspagina /leerdoelen (plugins/leerdoelen.js): links naar de
// niveaus, bij meer niveaus een link naar de vergelijking, en de uitleg van
// de beoordeling volgens Bloom. De gegevens komen uit src/leerdoelen.json van de cursus.
export default function LeerdoelenPagina({ leerdoelen }: { leerdoelen: Leerdoelen }): ReactNode {
  const cursus = useCursus();
  const tel = (niveau: string, m: string) =>
    leerdoelen.concepten.filter((c) => c.niveau[niveau] === m).length;
  // Een cursus kan een niveau hebben dat met een tentamen wordt getoetst. Zijn
  // alle niveaus zo, dan is er geen project en geen cijfer volgens Bloom.
  const project = projectNiveaus(leerdoelen);
  const tentamen = leerdoelen.tentamen;
  return (
    <Layout
      title="Leerdoelen"
      description={
        project.length > 0
          ? `De concepten waarop je project bij ${cursus ?? 'deze cursus'} wordt beoordeeld, per niveau, en hoe het cijfer tot stand komt.`
          : `Wat er bij ${cursus ?? 'deze cursus'} getoetst wordt, per niveau, en waar je het oefent.`
      }
    >
      <main className="container margin-vert--lg">
        <h1>Leerdoelen{cursus ? ` ${cursus}` : ''}</h1>
        {project.length > 0 && (
          <p>
            Op de concepten van je niveau beoordeelt je docent je project. Bij elk concept staat of
            het {moeilijkhedenTekst(leerdoelen)} is. Hoe je docent daar een cijfer van maakt, staat{' '}
            <a href="#bloom">onderaan deze pagina</a>.
          </p>
        )}
        {tentamen && (
          <p>
            {leerdoelen.niveaus.find((n) => n.id === tentamen.niveau)?.label} sluit je af met een
            tentamen. Op de pagina van dat niveau staat wat erin komt, en waar je elk onderdeel
            oefent.
          </p>
        )}

        <Heading as="h2" id="niveaus">
          Niveaus
        </Heading>
        <ul>
          {leerdoelen.niveaus.map((n) => {
            const delen =
              n.id === tentamen?.niveau
                ? ['tentamen']
                : CONCEPT_MOEILIJKHEDEN.map((m) => [tel(n.id, m), m] as const)
                    .filter(([aantal]) => aantal > 0)
                    .map(([aantal, m]) => `${aantal} ${m}`);
            return (
              <li key={n.id}>
                <Link to={`/leerdoelen/niveau-${n.id}`}>{n.label}</Link>
                <span className={styles.toelichting}>{delen.join(', ')}</span>
              </li>
            );
          })}
        </ul>

        {project.length > 1 && (
          <p>
            Een concept kan op het ene niveau basis zijn en op het andere gevorderd.{' '}
            <Link to="/leerdoelen/vergelijken">Vergelijk de niveaus</Link> om de verschillen naast
            elkaar te zien.
          </p>
        )}

        {project.length > 0 && <Bloom leerdoelen={leerdoelen} />}
      </main>
    </Layout>
  );
}

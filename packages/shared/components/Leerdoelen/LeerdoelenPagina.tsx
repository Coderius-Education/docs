import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import type { ReactNode } from 'react';
import { type Leerdoelen, moeilijkhedenTekst } from '../../leerdoelen';
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
  return (
    <Layout
      title="Leerdoelen"
      description={`De concepten waarop je project bij ${cursus ?? 'deze cursus'} wordt beoordeeld, per niveau, en hoe het cijfer tot stand komt.`}
    >
      <main className="container margin-vert--lg">
        <h1>Leerdoelen{cursus ? ` ${cursus}` : ''}</h1>
        <p>
          Op de concepten van je niveau beoordeelt je docent je project. Bij elk concept staat of
          het {moeilijkhedenTekst(leerdoelen)} is. Hoe je docent daar een cijfer van maakt, staat{' '}
          <a href="#bloom">onderaan deze pagina</a>.
        </p>

        <h2 id="niveaus">Niveaus</h2>
        <ul>
          {leerdoelen.niveaus.map((n) => {
            const delen = [
              ['basis', 'basis'],
              ['gevorderd', 'gevorderd'],
              ['expert', 'expert'],
            ]
              .map(([m, woord]) => [tel(n.id, m), woord] as const)
              .filter(([aantal]) => aantal > 0)
              .map(([aantal, woord]) => `${aantal} ${woord}`);
            return (
              <li key={n.id}>
                <Link to={`/leerdoelen/niveau-${n.id}`}>{n.label}</Link>
                <span className={styles.toelichting}>{delen.join(', ')}</span>
              </li>
            );
          })}
        </ul>

        {leerdoelen.niveaus.length > 1 && (
          <p>
            Een concept kan op het ene niveau basis zijn en op het andere gevorderd.{' '}
            <Link to="/leerdoelen/vergelijken">Vergelijk de niveaus</Link> om de verschillen naast
            elkaar te zien.
          </p>
        )}

        <Bloom />
      </main>
    </Layout>
  );
}

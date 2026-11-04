import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import type { ReactNode } from 'react';
import { type Leerdoelen, niveauNaam } from '../../leerdoelen';
import { siteByUrl } from '../../sites';
import Niveau from './Niveau';
import Vergelijking from './Vergelijking';

/** De cursus, voor in de titel. */
export function useCursus(): string | null {
  const { siteConfig } = useDocusaurusContext();
  return siteByUrl(siteConfig.url + siteConfig.baseUrl)?.label ?? null;
}

// De route /leerdoelen (plugins/leerdoelen.js). De gegevens komen uit
// src/leerdoelen.json van de cursus.
export default function LeerdoelenPagina({ leerdoelen }: { leerdoelen: Leerdoelen }): ReactNode {
  const cursus = useCursus();
  const meer = leerdoelen.niveaus.length > 1;
  const heeftExpert = leerdoelen.concepten.some((c) => Object.values(c.niveau).includes('expert'));
  return (
    <Layout
      title="Leerdoelen"
      description={`De concepten waarop je project bij ${cursus ?? 'deze cursus'} wordt beoordeeld, per niveau.`}
    >
      <main className="container margin-vert--lg">
        <h1>Leerdoelen{cursus ? ` ${cursus}` : ''}</h1>
        <p>
          Op deze concepten beoordeelt je docent je project. Bij elk concept staat of het{' '}
          {heeftExpert ? (
            <>
              <strong>basis</strong>, <strong>gevorderd</strong> of <strong>expert</strong>
            </>
          ) : (
            <>
              <strong>basis</strong> of <strong>gevorderd</strong>
            </>
          )}{' '}
          is. Hoe je docent daar een cijfer van maakt, lees je bij{' '}
          <Link to="/leerdoelen/bloom">Beoordelen met Bloom</Link>.
        </p>
        {meer ? (
          <>
            <p>
              De cursus heeft{' '}
              {leerdoelen.niveaus
                .map(niveauNaam)
                .join(', ')
                .replace(/, ([^,]*)$/, ' en $1')}
              . Een concept kan op het ene niveau basis zijn en op het andere gevorderd: zo'n
              verschil heeft een rand.
            </p>
            <h2>De niveaus naast elkaar</h2>
            <Vergelijking leerdoelen={leerdoelen} />
            {leerdoelen.niveaus.map((n) => (
              <section key={n.id}>
                <h2>
                  <Link to={`/leerdoelen/niveau-${n.id}`}>{niveauNaam(n)}</Link>
                </h2>
                <Niveau leerdoelen={leerdoelen} niveau={n.id} />
              </section>
            ))}
          </>
        ) : (
          <>
            <p>De cursus heeft één niveau: {niveauNaam(leerdoelen.niveaus[0])}.</p>
            <Niveau leerdoelen={leerdoelen} niveau={leerdoelen.niveaus[0].id} kop="h2" />
          </>
        )}
      </main>
    </Layout>
  );
}

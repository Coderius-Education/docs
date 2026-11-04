import Link from '@docusaurus/Link';
import Layout from '@theme/Layout';
import type { ReactNode } from 'react';
import { BLOOM, cijferTekst, cijferVoor } from '../../leerdoelen';
import Moeilijkheid from './Moeilijkheid';
import styles from './styles.module.css';

// De route /leerdoelen/bloom (plugins/leerdoelen.js): voor elke cursus gelijk.
// Alles op deze pagina komt uit leerdoelen/bloom.json, dezelfde gegevens
// waarmee de nakijker het cijfer berekent.
export default function BloomPagina(): ReactNode {
  const kolommen = BLOOM.moeilijkheden;
  return (
    <Layout
      title="Beoordelen met Bloom"
      description="Hoe je docent een project beoordeelt: de denkvaardigheden van Bloom, de moeilijkheid van de concepten en het cijfer dat daarbij hoort."
    >
      <main className="container margin-vert--lg">
        <h1>Beoordelen met Bloom</h1>
        <p>
          Je cijfer hangt af van twee dingen. Het eerste is de moeilijkheid van de concepten die je
          gebruikt: basis, gevorderd of expert, zoals ze bij de{' '}
          <Link to="/leerdoelen">leerdoelen</Link> van de cursus staan. Het tweede is wat je met die
          concepten kunt: alleen nadoen, of ook uitleggen, verbeteren en zelf iets nieuws bedenken.
          Dat tweede heet de <strong>denkvaardigheid</strong>, naar de indeling van Benjamin Bloom.
          Je docent ziet hem in je project, tijdens de lessen en in het mondeling.
        </p>

        <h2>De zes denkvaardigheden</h2>
        <p>Van laag naar hoog. Bij elke denkvaardigheid staat wat je docent dan bij je ziet.</p>
        <div className={styles.schuif}>
          <table className={styles.tabel}>
            <thead>
              <tr>
                <th scope="col">Denkvaardigheid</th>
                <th scope="col">Wat je doet</th>
                <th scope="col">Voorbeeld</th>
              </tr>
            </thead>
            {BLOOM.denkvaardigheden.map((d) => (
              <tbody key={d.id}>
                {d.werkwoorden.map((w, i) => (
                  <tr key={w.werkwoord}>
                    {i === 0 && (
                      <th scope="rowgroup" rowSpan={d.werkwoorden.length}>
                        {d.label}
                      </th>
                    )}
                    <td>{w.werkwoord}</td>
                    <td>{w.voorbeeld}</td>
                  </tr>
                ))}
              </tbody>
            ))}
          </table>
        </div>

        <h2>Tijdens de lessen</h2>
        <p>Ook in de les let je docent op je denkvaardigheid:</p>
        <ul>
          {BLOOM.tijdensDeLessen.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>

        <h2>Het cijfer</h2>
        <p>
          Het cijfer staat waar je denkvaardigheid en de moeilijkheid elkaar kruisen. Expert telt
          voor het cijfer als gevorderd.
        </p>
        <div className={styles.schuif}>
          <table className={styles.tabel}>
            <thead>
              <tr>
                <th scope="col">Denkvaardigheid</th>
                {kolommen.map((m) => (
                  <th key={m.id} scope="col">
                    {m.id === 'niet-aan-basis' ? m.label : <Moeilijkheid id={m.id} />}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {BLOOM.denkvaardigheden.map((d) => (
                <tr key={d.id}>
                  <th scope="row">{d.label}</th>
                  {kolommen.map((m) => (
                    <td key={m.id}>{cijferTekst(cijferVoor(d.id, m.id))}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>Op je beoordeling schrijft je docent het zo op:</p>
        <p className={styles.sjabloon}>
          {BLOOM.sjabloon
            .replace('$BLOOM_NIVEAU', '…')
            .replace('$MOEILIJKHEIDSNIVEAU', '…')
            .replace('$CIJFER', '…')}
        </p>
        <p>
          Bijvoorbeeld: je gebruikt bij elk onderwerp een concept op gevorderd, en je voegt
          concepten samen tot iets nieuws. Dat is analyseren op gevorderd, en daar hoort een{' '}
          {cijferTekst(cijferVoor('analyseren', 'gevorderd'))} bij.
        </p>

        <h2>Vuistregels</h2>
        <ul>
          {BLOOM.vuistregels.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>

        <h2>Bronnen</h2>
        <ul>
          {BLOOM.bronnen.map((b) => (
            <li key={b.titel}>
              {b.auteurs} ({b.jaar}).{' '}
              {b.url ? (
                <a href={b.url} target="_blank" rel="noopener noreferrer">
                  <em>{b.titel}</em>
                </a>
              ) : (
                <em>{b.titel}</em>
              )}
              . {b.uitgave}. {b.toelichting}
            </li>
          ))}
        </ul>
      </main>
    </Layout>
  );
}

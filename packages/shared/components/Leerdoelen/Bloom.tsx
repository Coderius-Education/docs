import Heading from '@theme/Heading';
import type { ReactNode } from 'react';
import {
  BLOOM,
  type Leerdoelen,
  cijferKolommen,
  cijferTekst,
  cijferVoor,
  moeilijkhedenTekst,
} from '../../leerdoelen';
import SiteLink from '../SiteLink';
import Moeilijkheid from './Moeilijkheid';
import styles from './styles.module.css';

// De uitleg van de beoordeling volgens Bloom, op de overzichtspagina van de
// leerdoelen. Alles komt uit leerdoelen/bloom.json, dezelfde gegevens waarmee
// de nakijker het cijfer berekent. Een bron staat er alleen als vakdidactiek
// hem uitlegt (`didactiek` in bloom.json; leerdoelen.test.ts eist dat).
export default function Bloom({ leerdoelen }: { leerdoelen: Leerdoelen }): ReactNode {
  // Alleen de moeilijkheden van deze cursus: web heeft geen expert.
  const kolommen = cijferKolommen(leerdoelen);
  const heeftExpert = kolommen.some((m) => m.id === 'expert');
  return (
    <section>
      <Heading as="h2" id="bloom">
        Beoordelen met Bloom
      </Heading>
      <p>
        Je cijfer hangt af van twee dingen. Het eerste is de moeilijkheid van de concepten die je
        gebruikt: {moeilijkhedenTekst(leerdoelen)}, zoals ze bij de niveaus hierboven staan. Het
        tweede is wat je met die concepten kunt: alleen nadoen, of ook uitleggen, verbeteren en zelf
        iets nieuws bedenken. Dat tweede heet de <strong>denkvaardigheid</strong>, naar de indeling
        van Bloom. Je docent ziet hem in je project, tijdens de lessen en in het mondeling.
      </p>

      <h3>De zes denkvaardigheden</h3>
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

      <h3>Tijdens de lessen</h3>
      <p>Ook in de les let je docent op je denkvaardigheid:</p>
      <ul>
        {BLOOM.tijdensDeLessen.map((t) => (
          <li key={t}>{t}</li>
        ))}
      </ul>

      <h3>Het cijfer</h3>
      <p>
        Het cijfer staat waar je denkvaardigheid en de moeilijkheid elkaar kruisen.
        {heeftExpert && ' Expert telt voor het cijfer als gevorderd.'}
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
        Bijvoorbeeld: je gebruikt bij elk onderwerp een concept op gevorderd, en je voegt concepten
        samen tot iets nieuws. Dat is analyseren op gevorderd, en daar hoort een{' '}
        {cijferTekst(cijferVoor('analyseren', 'gevorderd'))} bij.
      </p>

      <h3>Vuistregels</h3>
      <ul>
        {BLOOM.vuistregels.map((r) => (
          <li key={r}>{r}</li>
        ))}
      </ul>

      <h3>Waar komt dit vandaan</h3>
      {BLOOM.bronnen.map((b) => (
        <p key={b.titel}>
          {b.toelichting} De kernpaper is {b.auteurs} ({b.jaar}), <em>{b.titel}</em>. Wat erin staat
          en hoe we het gebruiken, lees je bij vakdidactiek:{' '}
          <SiteLink site="didactiek" to={b.didactiek}>
            {b.didactiekLabel}
          </SiteLink>
          .
        </p>
      ))}
    </section>
  );
}

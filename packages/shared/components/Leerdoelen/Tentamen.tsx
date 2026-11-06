import Link from '@docusaurus/Link';
import Heading from '@theme/Heading';
import type { ReactNode } from 'react';
import { type Leerdoelen, type Les, onderwerpenOpNiveau } from '../../leerdoelen';
import { routeUrl } from '../../sites';
import Lessen from './Lessen';
import styles from './styles.module.css';

/** Een link naar een les van de cursus; het pad heeft de baseUrl al. */
function LesLink({ les }: { les: Les }): ReactNode {
  return (
    <Link to={les.pad} autoAddBaseUrl={false}>
      {les.titel}
    </Link>
  );
}

/**
 * Het tentamen-niveau (leerdoelen.json, `tentamen`): de vorm, de manieren
 * waarop je een concept kunt kennen met het vraagtype uit de bron, en per
 * onderwerp welke manieren gelden, met de les waar je elke manier oefent.
 * Een concept zonder manieren is zelf de vaardigheid en staat als lijst.
 */
export default function Tentamen({ leerdoelen }: { leerdoelen: Leerdoelen }): ReactNode {
  const tentamen = leerdoelen.tentamen;
  if (!tentamen) return null;
  const { manieren } = tentamen;
  const nummer = (id: string) => manieren.findIndex((m) => m.id === id) + 1;
  return (
    <>
      <Heading as="h2" id="tentamen">
        Het tentamen
      </Heading>
      <p>{tentamen.vorm}</p>
      <p>
        Waar de manieren hieronder vandaan komen en hoe wij ze gebruiken, lees je bij{' '}
        {/* Een andere cursus opent in een nieuw tabblad, net als een site:-link. */}
        <Link to={routeUrl('didactiek', tentamen.bron)} target="_blank" rel="noopener noreferrer">
          vakdidactiek
        </Link>
        .
      </p>

      <Heading as="h2" id="manieren">
        Manieren om het te kennen
      </Heading>
      <div className={styles.schuif}>
        <table className={styles.tabel}>
          <thead>
            <tr>
              <th scope="col">Manier</th>
              <th scope="col">Wat je kunt</th>
              <th scope="col">Vraagtype in de bron</th>
            </tr>
          </thead>
          <tbody>
            {manieren.map((m, i) => (
              <tr key={m.id}>
                <th scope="row">
                  {i + 1}. {m.label}
                </th>
                <td>{m.uitleg}</td>
                <td>{m.vraagtype}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {onderwerpenOpNiveau(leerdoelen, tentamen.niveau).map(({ onderwerp, concepten: rijen }) => {
        const metManieren = rijen.filter((c) => c.manieren?.length);
        const zelf = rijen.filter((c) => !c.manieren?.length);
        const kolommen = manieren.filter((m) =>
          metManieren.some((c) => c.manieren?.includes(m.id)),
        );
        return (
          <section key={onderwerp.id}>
            <Heading as="h2" id={onderwerp.id}>
              {onderwerp.label}
            </Heading>
            {tentamen.onderwerpen[onderwerp.id] && <p>{tentamen.onderwerpen[onderwerp.id]}</p>}
            {metManieren.length > 0 && (
              <div className={styles.schuif}>
                <table className={`${styles.tabel} ${styles.manieren}`}>
                  <thead>
                    <tr>
                      <th scope="col">Concept</th>
                      {kolommen.map((m) => (
                        <th key={m.id} scope="col">
                          {nummer(m.id)}. {m.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {metManieren.map((c) => (
                      <tr key={c.id}>
                        <th scope="row">{c.concept}</th>
                        {kolommen.map((m) => {
                          const les = c.oefenen?.[m.id];
                          return (
                            <td key={m.id}>
                              {c.manieren?.includes(m.id) && les?.pad ? (
                                <LesLink les={les} />
                              ) : (
                                <>
                                  {/* Een aria-label op een kale span leest een schermlezer niet voor. */}
                                  <span aria-hidden="true">–</span>
                                  <span className={styles.verborgen}>
                                    hoort niet bij het tentamen
                                  </span>
                                </>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {zelf.length > 0 && (
              <ul>
                {zelf.map((c) => (
                  <li key={c.id}>
                    {c.concept}
                    {c.toelichting && <span className={styles.toelichting}>{c.toelichting}</span>}
                    <Lessen concept={c} />
                  </li>
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </>
  );
}

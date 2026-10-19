import type { ProjectFiles } from '../types';
import {
  OORDELEN,
  type Vraag,
  fragment,
  plekLabel,
  verplaatsVraag,
  verwijderVraag,
  wijzigVraag,
} from '../vragen';
import styles from './Vragen.module.css';
import gedeeld from './styles.module.css';

// De vragen voor het mondeling. Vooraf gemarkeerd in de codeweergave,
// tijdens het gesprek per vraag beoordeeld (goed, deels, niet) met een
// korte notitie. Staat binnen het rapport, dus de vragen gaan mee de PDF in:
// dat is meteen het verslag van het mondeling.

interface VragenProps {
  vragen: Vraag[];
  files: ProjectFiles;
  onWijzig: (vragen: Vraag[]) => void;
  /** Opent het fragment in de codeweergave. */
  onOpen: (v: Vraag) => void;
}

export function Vragen({ vragen, files, onWijzig, onOpen }: VragenProps) {
  return (
    <section className={`${styles.section} ${vragen.length === 0 ? gedeeld.noPrint : ''}`}>
      <h2>
        Vragen voor het mondeling{' '}
        {vragen.length > 0 && <span className={styles.aantal}>{vragen.length}</span>}
      </h2>
      {vragen.length === 0 ? (
        <p className={styles.leeg}>
          Nog geen vragen. Klik op een concept of op iets buiten de lesstof, of op Code bekijken, en
          markeer de regels waarover je iets wilt vragen.
        </p>
      ) : (
        <ol className={styles.lijst}>
          {vragen.map((v, i) => {
            const f = fragment(files, v);
            return (
              <li key={v.id} className={styles.vraag}>
                <div className={styles.kop}>
                  <span className={styles.nummer}>Vraag {i + 1}</span>
                  <button type="button" className={styles.plek} onClick={() => onOpen(v)}>
                    {plekLabel(v)}
                  </button>
                  <span className={`${styles.knoppen} ${gedeeld.noPrint}`}>
                    <button
                      type="button"
                      onClick={() => onWijzig(verplaatsVraag(vragen, v.id, -1))}
                      disabled={i === 0}
                      aria-label={`Vraag ${i + 1} omhoog`}
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => onWijzig(verplaatsVraag(vragen, v.id, 1))}
                      disabled={i === vragen.length - 1}
                      aria-label={`Vraag ${i + 1} omlaag`}
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      className={styles.weg}
                      onClick={() => onWijzig(verwijderVraag(vragen, v.id))}
                    >
                      Verwijderen
                    </button>
                  </span>
                </div>

                {f.ontbreekt ? (
                  <p className={styles.ontbreekt}>Deze regels staan niet (meer) in het project.</p>
                ) : (
                  <pre className={styles.fragment}>
                    {f.regels.map((r) => (
                      <span key={r.nr} className={styles.fragmentRegel}>
                        <span className={styles.fragmentNr}>{r.nr}</span>
                        {r.tekst || ' '}
                      </span>
                    ))}
                    {f.meer > 0 && (
                      <span className={styles.meer}>
                        … nog {f.meer} {f.meer === 1 ? 'regel' : 'regels'}
                      </span>
                    )}
                  </pre>
                )}

                <input
                  className={`${styles.invoer} ${gedeeld.noPrint}`}
                  value={v.vraag}
                  onChange={(e) => onWijzig(wijzigVraag(vragen, v.id, { vraag: e.target.value }))}
                  placeholder="Wat wil je hierover vragen?"
                  aria-label={`Vraag ${i + 1}`}
                />
                {v.vraag.trim() !== '' && (
                  <p className={`${styles.vraagTekst} ${gedeeld.alleenPdf}`}>{v.vraag}</p>
                )}

                <fieldset className={styles.oordeel} aria-label={`Oordeel bij vraag ${i + 1}`}>
                  {OORDELEN.map((o) => {
                    const aan = v.oordeel === o.id;
                    return (
                      <button
                        key={o.id}
                        type="button"
                        className={`${styles.oordeelKnop} ${aan ? styles[o.id] : ''}`}
                        aria-pressed={aan}
                        onClick={() =>
                          onWijzig(wijzigVraag(vragen, v.id, { oordeel: aan ? null : o.id }))
                        }
                      >
                        {aan ? '✓ ' : ''}
                        {o.label}
                      </button>
                    );
                  })}
                </fieldset>

                <textarea
                  className={`${styles.invoer} ${gedeeld.noPrint}`}
                  value={v.notitie}
                  onChange={(e) => onWijzig(wijzigVraag(vragen, v.id, { notitie: e.target.value }))}
                  rows={2}
                  placeholder="Wat zei de leerling?"
                  aria-label={`Notitie bij vraag ${i + 1}`}
                />
                {v.notitie.trim() !== '' && (
                  <p className={`${styles.notitie} ${gedeeld.alleenPdf}`}>{v.notitie}</p>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}

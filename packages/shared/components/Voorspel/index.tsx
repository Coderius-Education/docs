import clsx from 'clsx';
import {
  Children,
  type ReactElement,
  type ReactNode,
  isValidElement,
  useId,
  useState,
} from 'react';
import { BEGIN, type KeuzeInfo, TEKST, kies, kop, markering, oordeel, toonUitleg } from './logica';
import styles from './styles.module.css';

// Een voorspelvraag uit PRIMM met meteen antwoord. Eerst kiest de leerling,
// pas daarna verschijnt de uitleg: bij een <details> met "Antwoord" kon hij
// dat openklappen zonder zelf na te denken. Bij elke keuze staat een zin
// waarom die wel of niet klopt, zodat een foute gok iets oplevert.
//
//   <Voorspel vraag="Wat doet het asje?">
//     <Keuze goed uitleg="Waarom dit klopt.">Het draait heen en weer</Keuze>
//     <Keuze uitleg="Waarom dit niet klopt.">Het draait één keer en stopt</Keuze>
//     <Uitleg>De uitleg voor iedereen, na het kiezen.</Uitleg>
//   </Voorspel>
//
// Een controlevraag na de uitleg werkt net zo, met soort="Controlevraag".
//
// De keuzes zijn gewone knoppen: Tab gaat erlangs en Enter of spatie kiest.
// Een radiogroep zou met de pijltjes al kiezen terwijl je alleen bladert, en
// dan zie je bij elke stap het oordeel. Goed en fout staan er als woord en
// teken bij, niet alleen als kleur. Zonder JavaScript (de server-render, en
// zolang de pagina laadt) staan de keuzes er wel en de uitleg nog niet.

export interface KeuzeProps {
  /** Deze keuze is het goede antwoord. Precies één keuze heeft dit. */
  goed?: boolean;
  /** Eén zin waarom deze keuze wel of niet klopt. */
  uitleg: string;
  children?: ReactNode;
}

/** Eén antwoord in een <Voorspel>. Rendert niets zelf; Voorspel tekent hem. */
export function Keuze({ children }: KeuzeProps): ReactNode {
  return <>{children}</>;
}

/** De uitleg voor iedereen, die na het kiezen verschijnt. */
export function Uitleg({ children }: { children?: ReactNode }): ReactNode {
  return <>{children}</>;
}

const LETTERS = 'ABCDEFGHIJ';

export default function Voorspel({
  vraag,
  soort = 'Voorspel',
  children,
}: {
  vraag: ReactNode;
  /** Het woord boven de vraag; een controlevraag zet hier "Controlevraag". */
  soort?: string;
  children?: ReactNode;
}): ReactNode {
  const id = useId();
  const [toestand, setToestand] = useState(BEGIN);

  const kinderen = Children.toArray(children);
  const keuzeElementen = kinderen.filter(
    (k): k is ReactElement<KeuzeProps> => isValidElement(k) && k.type === Keuze,
  );
  const uitleg = kinderen.filter((k) => isValidElement(k) && k.type === Uitleg);
  const keuzes: KeuzeInfo[] = keuzeElementen.map((k) => ({
    goed: Boolean(k.props.goed),
    uitleg: k.props.uitleg ?? '',
  }));

  const o = oordeel(toestand, keuzes);
  const gekozen = toestand.gekozen;

  return (
    <section className={styles.voorspel} aria-labelledby={`${id}-vraag`}>
      <div className={styles.label}>{soort}</div>
      <div id={`${id}-vraag`} className={styles.vraag}>
        {vraag}
      </div>
      <div className={styles.hint}>
        Kies wat jij denkt. Bij het goede antwoord zie je de uitleg.
      </div>

      <fieldset className={styles.keuzes} aria-labelledby={`${id}-vraag`}>
        {keuzeElementen.map((keuze, i) => {
          const m = markering(toestand, keuzes, i);
          return (
            <button
              // biome-ignore lint/suspicious/noArrayIndexKey: de keuzes staan vast in de les.
              key={i}
              type="button"
              className={clsx(
                styles.keuze,
                gekozen === i && styles.gekozen,
                m === 'goed' && styles.goed,
                m === 'fout' && styles.fout,
              )}
              aria-pressed={gekozen === i}
              onClick={() => setToestand((t) => kies(t, keuzes, i))}
            >
              <span className={styles.teken} aria-hidden="true">
                {m === 'goed' ? '✓' : m === 'fout' ? '×' : LETTERS[i]}
              </span>
              <span className={styles.tekst}>{keuze.props.children}</span>
              {m !== 'open' && (
                <span className={styles.oordeel}>{m === 'goed' ? 'Goed' : 'Niet goed'}</span>
              )}
            </button>
          );
        })}
      </fieldset>

      {/* De live-regio staat er altijd, ook leeg, anders mist een schermlezer
          de eerste terugkoppeling. Het kader zit erbinnen. */}
      <div aria-live="polite">
        {gekozen !== null && (
          <div
            className={clsx(
              styles.terugkoppeling,
              o === 'goed' && styles.goed,
              o === 'fout' && styles.fout,
            )}
          >
            <div className={styles.kop}>
              <span aria-hidden="true">{o === 'goed' ? '✓ ' : '× '}</span>
              {kop(toestand, keuzes)}
            </div>
            <div>{keuzes[gekozen].uitleg}</div>
            {o === 'fout' && <div className={styles.opnieuw}>{TEKST.opnieuw}</div>}
          </div>
        )}
      </div>

      {toonUitleg(toestand, keuzes) && uitleg.length > 0 && (
        <div className={styles.uitleg}>
          <div className={styles.uitlegKop}>Uitleg</div>
          {uitleg}
        </div>
      )}
    </section>
  );
}

import clsx from 'clsx';
import {
  Children,
  type ReactElement,
  type ReactNode,
  isValidElement,
  useId,
  useState,
} from 'react';
import { useInLesTab } from '../LesTabs/paneel';
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
  // In een les-tabblad is elke regel hoogte er een: daar staat de vraag wat
  // dichter op elkaar (zie .inTab).
  const inTab = useInLesTab();

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
  // In een tabblad moet het scherm ook na het antwoord passen: bij twintig
  // van de dertig vragen in fullstack viel de uitleg of de knop Volgende dan
  // onder de rand. Na het goede antwoord staat daar alleen dat antwoord nog,
  // met een knop om de andere terug te zien, en de regel "Kies wat jij
  // denkt" is weg zodra er gekozen is. De terugkoppeling en de uitleg staan
  // in een vak dat de les laat schuiven als het dan nog niet past
  // (LesTabs/speling.ts).
  const [alle, setAlle] = useState(false);
  // De uitleg komt ook als elk fout antwoord is geprobeerd. Dan staan het
  // laatst gekozen antwoord en het goede er nog; de andere zijn al afgevallen.
  const klaar = inTab && toonUitleg(toestand, keuzes);
  const verborgen = (i: number) =>
    klaar && !alle && gekozen !== i && (o === 'goed' || toestand.geprobeerd.includes(i));
  // Een fout antwoord: het kader met "Niet goed", de reden en "Je kunt nog
  // een keer kiezen" was 112 pixels, en de vraag paste daarna in 25 van de
  // 180 schermen niet meer. In een tabblad staat de reden daarom in de rij
  // van het gekozen antwoord, waar "Niet goed" al staat. Het kader blijft
  // voor een schermlezer: die hoort het via de live-regio.
  const inRij = inTab && o === 'fout';

  return (
    <section
      className={clsx(styles.voorspel, inTab && styles.inTab)}
      aria-labelledby={`${id}-vraag`}
      // Voor het meetscript: open, fout of goed (scripts/meet-les-tabs.mjs).
      data-voorspel={o}
    >
      <div className={styles.label}>{soort}</div>
      <div id={`${id}-vraag`} className={styles.vraag}>
        {vraag}
      </div>
      {!(inTab && gekozen !== null) && (
        <div className={styles.hint}>
          Kies wat jij denkt. Bij het goede antwoord zie je de uitleg.
        </div>
      )}

      <fieldset className={styles.keuzes} aria-labelledby={`${id}-vraag`}>
        {keuzeElementen.map((keuze, i) => {
          const m = markering(toestand, keuzes, i);
          if (verborgen(i)) return null;
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
              {inRij && gekozen === i && (
                <span className={styles.waarom} aria-hidden="true" data-voorspel-waarom="">
                  {keuze.props.uitleg}
                </span>
              )}
            </button>
          );
        })}
      </fieldset>
      {klaar && keuzeElementen.length > 1 && (
        <button
          type="button"
          className={styles.andere}
          aria-expanded={alle}
          onClick={() => setAlle((a) => !a)}
        >
          {alle ? 'Verberg de andere antwoorden' : 'Toon de andere antwoorden'}
        </button>
      )}

      {/* De live-regio staat er altijd, ook leeg, anders mist een schermlezer
          de eerste terugkoppeling. Het kader zit erbinnen. */}
      <div className={styles.na} data-voorspel-na="">
        <div aria-live="polite">
          {gekozen !== null && (
            <div
              className={clsx(
                styles.terugkoppeling,
                o === 'goed' && styles.goed,
                o === 'fout' && styles.fout,
                inRij && styles.voorlezer,
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
      </div>
    </section>
  );
}

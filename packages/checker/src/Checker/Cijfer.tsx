import {
  BLOOM,
  type MoeilijkheidId,
  cijferTekst,
  cijferVoor,
  moeilijkheidVoorstel,
  sjabloonZin,
} from '@coderius/shared/leerdoelen';
import { computeLevelSummary } from '../levelSummary';
import type { CheckReport, CheckerConfig } from '../types';
import styles from './Cijfer.module.css';
// noPrint uit de stijl van de nakijker: die verbergt ook tijdens de PDF-export.
import hoofd from './styles.module.css';

interface CijferProps {
  report: CheckReport;
  config: CheckerConfig;
  track: string | null;
  bloom: string | null;
  /** De keuze van de docent; null = het voorstel. */
  moeilijkheid: MoeilijkheidId | null;
  onBloom: (id: string) => void;
  onMoeilijkheid: (id: MoeilijkheidId | null) => void;
}

/**
 * Het cijfer volgens het beoordelingsblad: de docent kiest de denkvaardigheid
 * die hij in het project en het mondeling zag, de nakijker stelt de
 * moeilijkheid voor uit de toegepaste concepten van de gekozen leerroute. De
 * docent kan die aanpassen; de zin en het cijfer komen in de PDF.
 */
export function Cijfer({
  report,
  config,
  track,
  bloom,
  moeilijkheid,
  onBloom,
  onMoeilijkheid,
}: CijferProps) {
  const samenvatting = computeLevelSummary(report, config, track);
  const voorstel = moeilijkheidVoorstel(samenvatting.bySubject);
  const gekozen = moeilijkheid ?? voorstel.moeilijkheid;
  const opties = BLOOM.moeilijkheden.filter(
    (m) => m.id !== 'expert' || samenvatting.expert.total > 0,
  );

  return (
    <section className={styles.cijfer} aria-labelledby="cijfer-kop">
      <h3 id="cijfer-kop" className={styles.kop}>
        Cijfer
      </h3>

      <fieldset className={`${styles.rij} ${hoofd.noPrint}`}>
        <legend className={styles.label}>Denkvaardigheid die je zag</legend>
        {BLOOM.denkvaardigheden.map((d) => (
          <button
            key={d.id}
            type="button"
            className={`${styles.knop} ${bloom === d.id ? styles.knopActief : ''}`}
            aria-pressed={bloom === d.id}
            title={d.werkwoorden.map((w) => w.werkwoord).join(', ')}
            onClick={() => onBloom(d.id)}
          >
            {d.label}
          </button>
        ))}
      </fieldset>
      {bloom && (
        <p className={`${styles.hulp} ${hoofd.noPrint}`}>
          {BLOOM.denkvaardigheden
            .find((d) => d.id === bloom)
            ?.werkwoorden.map((w) => `${w.werkwoord}: ${w.voorbeeld}`)
            .join(' · ')}
        </p>
      )}

      <fieldset className={`${styles.rij} ${hoofd.noPrint}`}>
        <legend className={styles.label}>Moeilijkheid</legend>
        {opties.map((m) => (
          <button
            key={m.id}
            type="button"
            className={`${styles.knop} ${gekozen === m.id ? styles.knopActief : ''}`}
            aria-pressed={gekozen === m.id}
            onClick={() => onMoeilijkheid(m.id === voorstel.moeilijkheid ? null : m.id)}
          >
            {m.label}
            {m.id === voorstel.moeilijkheid && ' (voorstel)'}
          </button>
        ))}
      </fieldset>
      <p className={`${styles.hulp} ${hoofd.noPrint}`}>
        Voorstel: {voorstel.reden}
        {moeilijkheid !== null &&
          moeilijkheid !== voorstel.moeilijkheid &&
          ' Je hebt het aangepast.'}
      </p>

      {bloom ? (
        <p className={styles.zin}>
          <span className={styles.getal}>{cijferTekst(cijferVoor(bloom, gekozen))}</span>
          {sjabloonZin(bloom, gekozen)}
        </p>
      ) : (
        <p className={`${styles.hulp} ${hoofd.noPrint}`}>
          Kies de denkvaardigheid die je in het project en het mondeling zag. Wat bij welke hoort,
          staat op de pagina Beoordelen met Bloom.
        </p>
      )}
    </section>
  );
}

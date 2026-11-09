import {
  BLOOM,
  type MoeilijkheidId,
  cijferTekst,
  cijferVoor,
  moeilijkheidVoorstel,
  sjabloonZin,
} from '@coderius/shared/leerdoelen';
import { alleenMetVinkje, computeLevelSummary, voorstelOnderdelen } from '../levelSummary';
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
  bloom: bewaardeBloom,
  moeilijkheid: bewaardeMoeilijkheid,
  onBloom,
  onMoeilijkheid,
}: CijferProps) {
  // Een bewaarde waarde die bloom.json niet (meer) kent, telt als niet
  // gekozen: anders gooit cijferVoor en valt de hele nakijker weg.
  const bloom = BLOOM.denkvaardigheden.some((d) => d.id === bewaardeBloom) ? bewaardeBloom : null;
  const moeilijkheid = BLOOM.moeilijkheden.some((m) => m.id === bewaardeMoeilijkheid)
    ? bewaardeMoeilijkheid
    : null;
  const samenvatting = computeLevelSummary(report, config, track);
  const voorstel = moeilijkheidVoorstel(voorstelOnderdelen(report, config, track));
  const hint = vinkjesHint(report, config, track, voorstel.moeilijkheid);
  const routeLabel =
    (config.tracks ?? []).length > 1
      ? config.tracks?.find((t) => t.id === track)?.label
      : undefined;
  const gekozen = moeilijkheid ?? voorstel.moeilijkheid;
  // Expert alleen als deze leerroute expertconcepten heeft, of als de docent
  // hem al koos: een gekozen moeilijkheid moet zichtbaar en terug te zetten zijn.
  const opties = BLOOM.moeilijkheden.filter(
    (m) => m.id !== 'expert' || samenvatting.expert.total > 0 || moeilijkheid === 'expert',
  );

  return (
    <section className={styles.cijfer} aria-labelledby="cijfer-kop">
      {/* Zonder denkvaardigheid is er geen cijfer: dan ook geen kop in de PDF. */}
      <h3 id="cijfer-kop" className={`${styles.kop} ${bloom ? '' : hoofd.noPrint}`}>
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
          {(() => {
            const d = BLOOM.denkvaardigheden.find((x) => x.id === bloom);
            if (!d) return null;
            const werkwoorden = d.werkwoorden.map((w) => `${w.werkwoord}: ${w.voorbeeld}`);
            return [d.omschrijving, ...werkwoorden].join(' · ');
          })()}
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
            // Ook een klik op het voorstel bewaart de keuze: anders schoof het
            // cijfer later stil mee met een veranderd voorstel.
            onClick={() => onMoeilijkheid(m.id)}
          >
            {m.label}
            {m.id === voorstel.moeilijkheid && ' (voorstel)'}
          </button>
        ))}
      </fieldset>
      {/* Ook in de PDF: op welk niveau, wat de nakijker voorstelde en waarom.
          Eerst stond het niveau er alleen als ingedrukte knop in. */}
      <p className={styles.hulp}>
        {routeLabel && `${routeLabel}. `}
        Voorstel: {moeilijkheidLabel(voorstel.moeilijkheid)}. {voorstel.reden} {hint}{' '}
        <span className={hoofd.noPrint}>
          {moeilijkheid === null
            ? 'Nog niet gekozen: het cijfer volgt het voorstel tot je een moeilijkheid kiest.'
            : moeilijkheid !== voorstel.moeilijkheid
              ? 'Je koos een andere moeilijkheid dan het voorstel.'
              : 'Je koos het voorstel.'}
        </span>
      </p>

      {bloom ? (
        <p className={styles.zin}>
          <span className={styles.getal}>{cijferTekst(cijferVoor(bloom, gekozen))}</span>
          {sjabloonZin(bloom, gekozen)}
        </p>
      ) : (
        <p className={`${styles.hulp} ${hoofd.noPrint}`}>
          Kies de denkvaardigheid die je in het project en het mondeling zag. Wat bij welke hoort,
          staat op de pagina Leerdoelen onder Beoordelen met Bloom.
        </p>
      )}
    </section>
  );
}

/**
 * Een zin als de volgende moeilijkheid bij een onderdeel alleen met een vinkje
 * te halen is ("Bij Robotica kan gevorderd alleen met een vinkje bij de
 * foto's."), of niets.
 */
function vinkjesHint(
  report: CheckReport,
  config: CheckerConfig,
  track: string | null,
  gehaald: MoeilijkheidId,
): string {
  const volgorde: MoeilijkheidId[] = ['niet-aan-basis', 'basis', 'gevorderd', 'expert'];
  const volgende = volgorde[volgorde.indexOf(gehaald) + 1];
  if (!volgende || volgende === 'niet-aan-basis') return '';
  const onderdelen = alleenMetVinkje(report, config, track, volgende);
  if (onderdelen.length === 0) return '';
  const lijst =
    onderdelen.length === 1
      ? onderdelen[0]
      : `${onderdelen.slice(0, -1).join(', ')} en ${onderdelen.at(-1)}`;
  return `Bij ${lijst} kan ${volgende} alleen met een vinkje bij een concept dat je zelf vaststelt.`;
}

const moeilijkheidLabel = (id: MoeilijkheidId) =>
  BLOOM.moeilijkheden.find((m) => m.id === id)?.label ?? id;

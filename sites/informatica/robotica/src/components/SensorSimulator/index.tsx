import type React from 'react';
import { useId, useState } from 'react';
import {
  AFSTAND_MAX,
  AFSTAND_MIN,
  AFSTAND_START,
  GRENS_MAX,
  GRENS_MIN,
  GRENS_STAP,
  GRENS_START,
  balGezien,
  leesA0,
} from './logica';
import styles from './styles.module.css';

// De tekening: de sensor links, de bal rechts ervan. Eén cm is 20 eenheden.
const SENSOR_RAND = 62;
const PER_CM = 20;
const STRAAL = 14;

function balX(afstand: number): number {
  return SENSOR_RAND + afstand * PER_CM + STRAAL;
}

// Een IR-sensor om mee te spelen, nog voordat de robot aan staat. Met het
// eerste schuifje schuift de bal naar de sensor en zie je het getal op A0
// dalen; met het tweede kies je de grens, en het scherm laat zien of
// "klaar om te golfen!" verschijnt, zoals het programma van stap 2.
export default function SensorSimulator(): React.JSX.Element {
  const id = useId();
  const [afstand, setAfstand] = useState(AFSTAND_START);
  const [geenBal, setGeenBal] = useState(false);
  const [grens, setGrens] = useState(GRENS_START);

  const waarde = leesA0(geenBal ? null : afstand);
  const gezien = balGezien(waarde, grens);

  const tekening = geenBal
    ? 'De sensor, zonder bal ervoor.'
    : `De sensor, met de bal ${afstand} cm ervoor.`;

  return (
    <figure className={styles.simulator}>
      <svg className={styles.tekening} viewBox="0 0 400 112" role="img" aria-label={tekening}>
        <rect className={styles.sensor} x="8" y="22" width="48" height="48" rx="4" />
        <circle className={styles.oog} cx="56" cy="36" r="6" />
        <circle className={styles.oog} cx="56" cy="56" r="6" />
        <text className={styles.label} x="32" y="16" textAnchor="middle">
          sensor
        </text>
        {!geenBal && (
          <>
            <line className={styles.straal} x1="62" y1="46" x2={balX(afstand) - STRAAL} y2="46" />
            <circle className={styles.bal} cx={balX(afstand)} cy="46" r={STRAAL} />
          </>
        )}
        <line
          className={styles.liniaal}
          x1={SENSOR_RAND}
          y1="84"
          x2={SENSOR_RAND + 15 * PER_CM}
          y2="84"
        />
        {Array.from({ length: 16 }, (_, cm) => (
          <line
            // biome-ignore lint/suspicious/noArrayIndexKey: vaste streepjes
            key={cm}
            className={styles.liniaal}
            x1={SENSOR_RAND + cm * PER_CM}
            y1="84"
            x2={SENSOR_RAND + cm * PER_CM}
            y2={cm % 5 === 0 ? 92 : 88}
          />
        ))}
        {[0, 5, 10, 15].map((cm) => (
          <text
            key={cm}
            className={styles.label}
            x={SENSOR_RAND + cm * PER_CM}
            y="109"
            textAnchor="middle"
          >
            {cm === 15 ? '15 cm' : cm}
          </text>
        ))}
      </svg>

      <div className={styles.bediening}>
        <div className={styles.veld}>
          <label htmlFor={`${id}-afstand`}>
            Afstand van de bal: <strong>{geenBal ? 'geen bal' : `${afstand} cm`}</strong>
          </label>
          <input
            id={`${id}-afstand`}
            type="range"
            min={AFSTAND_MIN}
            max={AFSTAND_MAX}
            step={1}
            value={afstand}
            disabled={geenBal}
            onChange={(e) => setAfstand(Number(e.target.value))}
          />
          <label className={styles.vinkje}>
            <input
              type="checkbox"
              checked={geenBal}
              onChange={(e) => setGeenBal(e.target.checked)}
            />
            Geen bal
          </label>
        </div>

        <p className={styles.getal} aria-live="polite" aria-atomic="true">
          <span>Lees anapin A0 geeft</span>
          <output htmlFor={`${id}-afstand`} className={styles.waarde}>
            {waarde}
          </output>
        </p>

        <div className={styles.veld}>
          <label htmlFor={`${id}-grens`}>
            Jouw grens: <strong>{grens}</strong>
          </label>
          <input
            id={`${id}-grens`}
            type="range"
            min={GRENS_MIN}
            max={GRENS_MAX}
            step={GRENS_STAP}
            value={grens}
            onChange={(e) => setGrens(Number(e.target.value))}
          />
        </div>

        <div className={styles.uitkomst} data-gezien={gezien} aria-live="polite" aria-atomic="true">
          <span className={styles.lampje} aria-hidden="true" />
          <p className={styles.vraag}>
            Is{' '}
            <code>
              {waarde} &lt; {grens}
            </code>
            ? <strong>{gezien ? 'waar' : 'niet waar'}</strong>
          </p>
          <div className={styles.scherm}>
            <span className={styles.schermnaam}>Scherm:</span>{' '}
            {gezien ? 'klaar om te golfen!' : <span className={styles.leeg}>(niets)</span>}
          </div>
        </div>
      </div>
    </figure>
  );
}

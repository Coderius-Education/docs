import type React from 'react';
import { useMemo } from 'react';
import { type Boom, tekenBoom } from './boom';
import styles from './styles.module.css';

type ParseTreeProps = {
  /** Een boom zoals de parser-motor van de cfg-track hem teruggeeft. */
  boom: Boom;
  /** Bijschrift, bij meer dan één boom van dezelfde zin. */
  titel?: string;
};

/** De tekst van een knoop staat iets boven het midden; de lijn begint eronder. */
const TEKST_Y = 14;
const LIJN_VAN = 20;
const LIJN_TOT = -2;

export default function ParseTree({ boom, titel }: ParseTreeProps): React.ReactElement {
  const tekening = useMemo(() => tekenBoom(boom), [boom]);
  const { knopen, breedte, hoogte } = tekening;
  const bijId = new Map(knopen.map((k) => [k.id, k]));
  return (
    <figure className={styles.figuur}>
      {titel && <figcaption className={styles.titel}>{titel}</figcaption>}
      <div className={styles.omhulsel}>
        <svg
          className={styles.boom}
          width={breedte}
          height={hoogte}
          viewBox={`0 0 ${breedte} ${hoogte}`}
          role="img"
          aria-label={`Parse-boom${titel ? `, ${titel}` : ''}`}
        >
          {knopen
            .filter((k) => k.ouder !== null)
            .map((k) => {
              const ouder = bijId.get(k.ouder as number);
              if (!ouder) return null;
              return (
                <line
                  key={`lijn-${k.id}`}
                  className={styles.lijn}
                  x1={ouder.x}
                  y1={ouder.y + LIJN_VAN}
                  x2={k.x}
                  y2={k.y + LIJN_TOT}
                />
              );
            })}
          {knopen.map((k) => (
            <g key={k.id}>
              <text className={styles.label} x={k.x} y={k.y + TEKST_Y} textAnchor="middle">
                {k.label}
              </text>
              {k.woord !== null && (
                <text className={styles.woord} x={k.x} y={k.y + TEKST_Y + 20} textAnchor="middle">
                  {k.woord}
                </text>
              )}
            </g>
          ))}
        </svg>
      </div>
    </figure>
  );
}

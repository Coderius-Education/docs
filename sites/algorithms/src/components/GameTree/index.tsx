import clsx from 'clsx';
import type React from 'react';
import { useMemo } from 'react';
import { type Knoop, bouwBoom, naarTekst, parseBord } from './boom';
import styles from './styles.module.css';

type GameTreeProps = {
  /** De positie bovenaan, als `"XXO/OOX/..."` (`.` is leeg). */
  bord: string;
  /** Toon de minimax-waarde bij elke knoop. Zonder: de lege boom om zelf in te vullen. */
  waardes?: boolean;
};

function MiniBord({ bord }: { bord: Knoop['bord'] }): React.ReactElement {
  return (
    <div className={styles.bord} aria-hidden="true">
      {bord.flatMap((rij, i) =>
        rij.map((cel, j) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: de plek op het 3×3-bord ís de identiteit van de cel
          <span key={`${i}${j}`} className={clsx(styles.cel, cel === null && styles.leeg)}>
            {cel ?? ''}
          </span>
        )),
      )}
    </div>
  );
}

function KnoopWeergave({ knoop, waardes }: { knoop: Knoop; waardes: boolean }): React.ReactElement {
  // ▲ is MAX, ▼ is MIN; dat legt de eerste les uit, en zo blijft een knoop
  // smal genoeg om zes bladeren naast elkaar in de tekstkolom te krijgen.
  const kop =
    knoop.speler === null ? 'klaar' : knoop.speler === 'X' ? '▲ X aan zet' : '▼ O aan zet';
  const klasse =
    knoop.speler === null ? styles.klaar : knoop.speler === 'X' ? styles.max : styles.min;
  const zetLabel = knoop.zet ? `(${knoop.zet[0]},${knoop.zet[1]})` : null;

  return (
    <li className={styles.tak}>
      <div className={clsx(styles.knoop, klasse)}>
        {zetLabel && <span className={styles.zet}>{zetLabel}</span>}
        <span className={styles.kop}>{kop}</span>
        <MiniBord bord={knoop.bord} />
        <span className={styles.srOnly}>{naarTekst(knoop.bord)}</span>
        {waardes ? (
          <span className={styles.waarde}>{knoop.waarde}</span>
        ) : (
          <span className={clsx(styles.waarde, styles.open)}>?</span>
        )}
      </div>
      {knoop.kinderen.length > 0 && (
        <ul className={styles.kinderen}>
          {knoop.kinderen.map((kind) => (
            <KnoopWeergave key={naarTekst(kind.bord)} knoop={kind} waardes={waardes} />
          ))}
        </ul>
      )}
    </li>
  );
}

/**
 * De game tree van een tic-tac-toe-positie, met bij elke knoop het echte
 * bord. De waardes komen uit `bouwBoom`, dus de tekening zegt nooit iets
 * anders dan minimax uitrekent.
 */
export default function GameTree({ bord, waardes = false }: GameTreeProps): React.ReactElement {
  const wortel = useMemo(() => bouwBoom(parseBord(bord)), [bord]);
  return (
    <div className={styles.omhulsel}>
      <ul className={clsx(styles.boom, styles.kinderen)}>
        <KnoopWeergave knoop={wortel} waardes={waardes} />
      </ul>
    </div>
  );
}

import React, {useCallback, useMemo, useState} from 'react';
import clsx from 'clsx';
import styles from './styles.module.css';

type HanoiGameProps = {
  /** Aantal schijven waarmee gestart wordt. */
  initialDisks?: number;
  /** Maximaal instelbaar aantal schijven. */
  maxDisks?: number;
};

type Pegs = number[][];

const PEG_NAMEN = ['A', 'B', 'C'] as const;

function maakStart(aantal: number): Pegs {
  // Paal A: grootste schijf onderaan (index 0), kleinste bovenaan (laatste).
  const bron: number[] = [];
  for (let grootte = aantal; grootte >= 1; grootte--) {
    bron.push(grootte);
  }
  return [bron, [], []];
}

function isOpgelost(pegs: Pegs, aantal: number): boolean {
  return pegs[2].length === aantal;
}

export default function HanoiGame({
  initialDisks = 3,
  maxDisks = 6,
}: HanoiGameProps): React.ReactElement {
  const startAantal = Math.min(Math.max(initialDisks, 1), maxDisks);
  const [aantal, setAantal] = useState(startAantal);
  const [pegs, setPegs] = useState<Pegs>(() => maakStart(startAantal));
  const [bron, setBron] = useState<number | null>(null);
  const [zetten, setZetten] = useState(0);
  const [melding, setMelding] = useState('');

  const opgelost = useMemo(() => isOpgelost(pegs, aantal), [pegs, aantal]);

  const herstart = useCallback(
    (nieuwAantal: number) => {
      setAantal(nieuwAantal);
      setPegs(maakStart(nieuwAantal));
      setBron(null);
      setZetten(0);
      setMelding('');
    },
    [],
  );

  const klikPaal = useCallback(
    (index: number) => {
      if (opgelost) return;

      // Nog geen schijf opgepakt: pak de bovenste van deze paal.
      if (bron === null) {
        if (pegs[index].length === 0) {
          setMelding('Die paal is leeg — kies een paal met een schijf.');
          return;
        }
        setBron(index);
        setMelding('');
        return;
      }

      // Zelfde paal nog eens: leg de schijf terug (annuleren).
      if (bron === index) {
        setBron(null);
        setMelding('');
        return;
      }

      // Probeer te verplaatsen van bron naar deze paal.
      const schijf = pegs[bron][pegs[bron].length - 1];
      const bovenste = pegs[index][pegs[index].length - 1];
      if (bovenste !== undefined && schijf > bovenste) {
        setMelding('Mag niet: een grotere schijf mag niet op een kleinere.');
        setBron(null);
        return;
      }

      const volgende: Pegs = pegs.map((paal) => [...paal]);
      volgende[index].push(volgende[bron].pop() as number);
      const klaar = isOpgelost(volgende, aantal);
      setPegs(volgende);
      setBron(null);
      setZetten((n) => n + 1);
      setMelding(
        klaar
          ? `Opgelost in ${zetten + 1} zetten! Kun je het in minder?`
          : '',
      );
    },
    [aantal, bron, opgelost, pegs, zetten],
  );

  return (
    <section className={styles.game} aria-label="Torens van Hanoi — speelbaar">
      <div className={styles.header}>
        <div>
          <p className={styles.kicker}>Speel zelf</p>
          <p className={styles.summary}>
            Klik een paal om de bovenste schijf op te pakken, klik dan een
            andere paal om hem neer te leggen. Verplaats de hele toren naar
            paal C.
          </p>
        </div>
        <div className={styles.zetten} aria-live="polite">
          <span className={styles.zettenGetal}>{zetten}</span>
          <span className={styles.zettenLabel}>zetten</span>
        </div>
      </div>

      <div className={styles.controls}>
        <span className={styles.controlsLabel}>Aantal schijven:</span>
        <div className={styles.diskButtons} role="group" aria-label="Aantal schijven">
          {Array.from({length: maxDisks}, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              type="button"
              className={clsx(styles.diskButton, aantal === n && styles.diskButtonActive)}
              aria-pressed={aantal === n}
              onClick={() => herstart(n)}>
              {n}
            </button>
          ))}
        </div>
        <button type="button" className={styles.resetButton} onClick={() => herstart(aantal)}>
          Opnieuw
        </button>
      </div>

      <div className={styles.board}>
        {pegs.map((paal, index) => {
          const isBron = bron === index;
          return (
            <button
              key={index}
              type="button"
              className={clsx(styles.peg, isBron && styles.pegActive)}
              onClick={() => klikPaal(index)}
              aria-label={
                `Paal ${PEG_NAMEN[index]}, ${paal.length} schijven` +
                (isBron ? ', schijf opgepakt' : '')
              }>
              <div className={styles.pole} aria-hidden="true" />
              <div className={styles.stack}>
                {paal.map((grootte, hoogte) => {
                  const isTop = hoogte === paal.length - 1;
                  return (
                    <span
                      key={grootte}
                      className={clsx(
                        styles.disk,
                        isBron && isTop && styles.diskLifted,
                      )}
                      style={{
                        width: `${20 + (grootte / aantal) * 80}%`,
                        background: `hsl(${(grootte / aantal) * 280} 70% 55%)`,
                      }}>
                      {grootte}
                    </span>
                  );
                })}
              </div>
              <span className={styles.pegNaam} aria-hidden="true">
                {PEG_NAMEN[index]}
              </span>
            </button>
          );
        })}
      </div>

      <div
        className={clsx(styles.status, opgelost && styles.statusWin)}
        role="status"
        aria-live="polite">
        {opgelost
          ? melding || `Opgelost in ${zetten} zetten! Kun je het in minder?`
          : melding || (bron === null
              ? 'Kies een paal om een schijf op te pakken.'
              : `Schijf van paal ${PEG_NAMEN[bron]} opgepakt — kies een doelpaal.`)}
      </div>
    </section>
  );
}

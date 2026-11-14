import { useInLesTab } from '@coderius/shared/components/LesTabs/paneel';
import { MARGE, meetRuimte } from '@coderius/shared/components/LesTabs/pasHoogte';
import clsx from 'clsx';
import type React from 'react';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { type Knoop, bouwBoom, naarTekst, parseBord } from './boom';
import styles from './styles.module.css';
import { boomZoom } from './zoom';

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
  // In een les-tabblad op een breed scherm wordt de boom zo klein als nodig
  // om met de tekst erboven op het scherm te passen (boomZoom). Op ware
  // grootte is hij 633 pixels hoog: dan paste hij ook alleen in een stap niet
  // op 1280 bij 720.
  const inTab = useInLesTab();
  const ref = useRef<HTMLDivElement>(null);
  const ware = useRef(0);
  const [zoom, setZoom] = useState<number | null>(null);
  useLayoutEffect(() => {
    const omhulsel = ref.current;
    const paneel = omhulsel?.closest<HTMLElement>('[data-les-tab]');
    if (!inTab || !omhulsel || !paneel || typeof ResizeObserver === 'undefined') return;
    const breed = window.matchMedia('(min-width: 997px)');
    const meet = () => {
      if (!breed.matches) return setZoom(null);
      const ruimte = meetRuimte(omhulsel, paneel, Number.POSITIVE_INFINITY);
      if (!ruimte) return;
      // De ware hoogte één keer, zolang er nog geen zoom op staat.
      if (ware.current === 0 && !omhulsel.style.zoom) ware.current = omhulsel.offsetHeight;
      if (ware.current === 0) return;
      const vrij = ruimte.scherm - ruimte.boven - ruimte.onder - MARGE;
      setZoom(boomZoom(vrij, ware.current));
    };
    meet();
    const kijker = new ResizeObserver(meet);
    kijker.observe(paneel);
    window.addEventListener('resize', meet);
    breed.addEventListener('change', meet);
    return () => {
      kijker.disconnect();
      window.removeEventListener('resize', meet);
      breed.removeEventListener('change', meet);
    };
  }, [inTab]);
  // Uitgezoomd is een bord klein: de knop toont de boom op ware grootte in
  // een dialog, zoals een plaatje in een les (LesTabs/Vergroot.tsx).
  const [groot, setGroot] = useState(false);
  const dialoog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (groot) dialoog.current?.showModal?.();
  }, [groot]);
  const boom = (
    <ul className={clsx(styles.boom, styles.kinderen)}>
      <KnoopWeergave knoop={wortel} waardes={waardes} />
    </ul>
  );
  const klein = zoom !== null && zoom < 1;
  return (
    <>
      {klein && (
        <button type="button" className={styles.vergroot} onClick={() => setGroot(true)}>
          Bekijk de boom groot
        </button>
      )}
      <div
        ref={ref}
        className={clsx(styles.omhulsel, inTab && styles.inTab)}
        style={klein ? { zoom } : undefined}
      >
        {boom}
      </div>
      {groot && (
        <dialog
          ref={dialoog}
          className={styles.groot}
          aria-label="De spelboom op ware grootte"
          onClose={() => setGroot(false)}
        >
          <form method="dialog" className={styles.grootSluiten}>
            <button type="submit" className="button button--secondary button--sm">
              Sluiten
            </button>
          </form>
          <div className={styles.omhulsel}>{boom}</div>
        </dialog>
      )}
    </>
  );
}

import type React from 'react';
import { useId, useState } from 'react';
import {
  MAX,
  MIDDEN,
  MIN,
  OPDRACHTEN,
  type Opdracht,
  STREEPJES,
  beoordeel,
  draaiing,
  leesInvoer,
  punt,
} from './logica';
import styles from './styles.module.css';

interface ServoSchijfProps {
  // Eigen opdrachten; zonder deze prop de vaste lijst uit `logica.ts`.
  opdrachten?: Opdracht[];
}

// Easybloqs zet de servo bij het opstarten op 90°, dus hier ook.
const BEGIN = 90;
const ARM = 92;
const SCHAAL = 104;

// Een servo van boven, met een halve cirkel van 0° tot 180°. De leerling zet
// de stand met een schuif of typt hem in een veld dat lijkt op het blok
// "Servo 9 op …", en het asje draait mee. Eronder staan kleine opdrachten met
// directe terugkoppeling.
export default function ServoSchijf({
  opdrachten = OPDRACHTEN,
}: ServoSchijfProps): React.JSX.Element {
  const id = useId();
  const [stand, setStand] = useState(BEGIN);
  const [tekst, setTekst] = useState(String(BEGIN));
  const [melding, setMelding] = useState<string | null>(null);
  const [nummer, setNummer] = useState(0);
  // Pas terugkoppeling als de leerling na het begin van de opdracht iets
  // heeft gedaan; anders staat er "Nog niet" voordat hij iets probeerde.
  const [geprobeerd, setGeprobeerd] = useState(false);

  const klaar = nummer >= opdrachten.length;
  const opdracht = klaar ? null : opdrachten[nummer];
  const oordeel = opdracht && geprobeerd ? beoordeel(stand, opdracht) : null;

  const zet = (nieuw: number) => {
    setStand(nieuw);
    setTekst(String(nieuw));
    setGeprobeerd(true);
  };

  const schuif = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMelding(null);
    zet(Number(e.target.value));
  };

  // Tijdens het typen draait het asje mee zolang het getal past. Begrenzen
  // en uitleggen gebeurt pas bij Enter of als je het veld verlaat: wie 135
  // typt, komt anders langs 1 en 13.
  const typ = (e: React.ChangeEvent<HTMLInputElement>) => {
    const waarde = e.target.value;
    setTekst(waarde);
    setMelding(null);
    const { stand: nieuw, melding: m } = leesInvoer(waarde);
    if (nieuw !== null && m === null) {
      setStand(nieuw);
      setGeprobeerd(true);
    }
  };

  const bevestig = () => {
    const { stand: nieuw, melding: m } = leesInvoer(tekst);
    setMelding(m);
    if (nieuw === null) {
      setTekst(String(stand));
      return;
    }
    zet(nieuw);
  };

  const volgende = () => {
    setNummer((n) => (n >= opdrachten.length ? 0 : n + 1));
    setGeprobeerd(false);
  };

  const schuifId = `${id}-schuif`;
  const veldId = `${id}-veld`;
  const meldingId = `${id}-melding`;
  const centrum = `${MIDDEN.x}px ${MIDDEN.y}px`;

  return (
    <div className={styles.schijf}>
      <svg
        className={styles.tekening}
        viewBox="0 0 280 175"
        role="img"
        aria-label={`Een servo van boven. Het asje wijst naar ${stand}°.`}
      >
        <path
          className={styles.boog}
          d={`M ${punt(0, SCHAAL).x} ${MIDDEN.y} A ${SCHAAL} ${SCHAAL} 0 0 1 ${punt(180, SCHAAL).x} ${MIDDEN.y}`}
        />
        {STREEPJES.map((graden) => {
          const binnen = punt(graden, SCHAAL - 8);
          const buiten = punt(graden, SCHAAL + 4);
          const label = punt(graden, SCHAAL + 20);
          const opzij = graden === 0 || graden === 180;
          return (
            <g key={graden}>
              <line
                className={styles.streepje}
                x1={binnen.x}
                y1={binnen.y}
                x2={buiten.x}
                y2={buiten.y}
              />
              <text
                className={styles.getal}
                x={label.x}
                y={opzij ? MIDDEN.y + 22 : label.y}
                textAnchor="middle"
                dominantBaseline="middle"
              >
                {graden}°
              </text>
            </g>
          );
        })}
        <rect
          className={styles.behuizing}
          x={MIDDEN.x - 58}
          y={MIDDEN.y - 22}
          width={116}
          height={44}
          rx={6}
        />
        <rect
          className={styles.oor}
          x={MIDDEN.x - 74}
          y={MIDDEN.y - 8}
          width={16}
          height={16}
          rx={3}
        />
        <rect
          className={styles.oor}
          x={MIDDEN.x + 58}
          y={MIDDEN.y - 8}
          width={16}
          height={16}
          rx={3}
        />
        <g
          className={styles.arm}
          style={{ transform: `rotate(${draaiing(stand)}deg)`, transformOrigin: centrum }}
        >
          <path
            className={styles.armVorm}
            d={`M ${MIDDEN.x} ${MIDDEN.y - 11} L ${MIDDEN.x + ARM} ${MIDDEN.y - 5} A 5 5 0 0 1 ${MIDDEN.x + ARM} ${MIDDEN.y + 5} L ${MIDDEN.x} ${MIDDEN.y + 11} Z`}
          />
          <circle className={styles.gaatje} cx={MIDDEN.x + ARM - 14} cy={MIDDEN.y} r={2.5} />
          <circle className={styles.gaatje} cx={MIDDEN.x + ARM - 34} cy={MIDDEN.y} r={2.5} />
        </g>
        <circle className={styles.as} cx={MIDDEN.x} cy={MIDDEN.y} r={13} />
        <circle className={styles.schroef} cx={MIDDEN.x} cy={MIDDEN.y} r={4} />
      </svg>

      <p className={styles.stand} aria-live="polite" aria-atomic="true">
        Het asje staat op <strong>{stand}°</strong>
      </p>

      <div className={styles.bediening}>
        <label className={styles.schuifLabel} htmlFor={schuifId}>
          Sleep om de servo te draaien
        </label>
        <input
          id={schuifId}
          className={styles.schuif}
          type="range"
          min={MIN}
          max={MAX}
          step={1}
          value={stand}
          aria-valuetext={`${stand}°`}
          onChange={schuif}
        />
        <div className={styles.schuifEinden} aria-hidden="true">
          <span>0°</span>
          <span>180°</span>
        </div>

        {/* noValidate: anders houdt de browser Enter bij 200 tegen (max is
            180) en krijgt de leerling geen uitleg van ons. */}
        <form
          className={styles.blok}
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            bevestig();
          }}
        >
          <label htmlFor={veldId}>Servo 9 op</label>
          <input
            id={veldId}
            className={styles.veld}
            type="number"
            inputMode="numeric"
            min={MIN}
            max={MAX}
            step={1}
            value={tekst}
            aria-describedby={meldingId}
            onChange={typ}
            onBlur={bevestig}
          />
        </form>
        <p className={styles.hint}>Typ een getal en druk op Enter.</p>
        <output id={meldingId} className={styles.melding}>
          {melding}
        </output>
      </div>

      <div className={styles.opdracht}>
        <p className={styles.kop}>
          {klaar ? 'Alle opdrachten gedaan' : `Opdracht ${nummer + 1} van ${opdrachten.length}`}
        </p>
        <p className={styles.vraag}>
          {opdracht ? opdracht.vraag : 'Je weet nu waar 0°, 45°, 90°, 135° en 180° staan.'}
        </p>
        <output className={styles.oordeel} data-goed={oordeel ? String(oordeel.goed) : undefined}>
          {oordeel?.tekst}
        </output>
        <button type="button" className={styles.knop} onClick={volgende}>
          {klaar
            ? 'Begin opnieuw'
            : nummer === opdrachten.length - 1
              ? 'Klaar'
              : 'Volgende opdracht'}
        </button>
      </div>
    </div>
  );
}

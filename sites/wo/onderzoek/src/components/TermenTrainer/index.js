import React, {useState} from 'react';
import Link from '@docusaurus/Link';
import begrippen from '@site/src/data/begrippen';
import styles from './styles.module.css';

function schud(lijst) {
  const kopie = [...lijst];
  for (let i = kopie.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [kopie[i], kopie[j]] = [kopie[j], kopie[i]];
  }
  return kopie;
}

/**
 * Flashcard-trainer over alle begrippen: kaartje omdraaien,
 * "Wist ik" haalt het uit de stapel, "Nog oefenen" legt het achteraan.
 */
export default function TermenTrainer() {
  const alleIds = Object.keys(begrippen);
  const [stapel, setStapel] = useState(null); // null = nog niet gestart
  const [omgedraaid, setOmgedraaid] = useState(false);
  const [gekend, setGekend] = useState(0);
  const [pogingen, setPogingen] = useState(0);

  const start = () => {
    setStapel(schud(alleIds));
    setOmgedraaid(false);
    setGekend(0);
    setPogingen(0);
  };

  if (stapel === null) {
    return (
      <div className={styles.trainer}>
        <p className={styles.introTekst}>
          Test jezelf: {alleIds.length} kaartjes, telkens een term — weet jij
          wat hij betekent voordat je het kaartje omdraait?
        </p>
        <button type="button" className={styles.primair} onClick={start}>
          Start de trainer ({alleIds.length} termen)
        </button>
      </div>
    );
  }

  if (stapel.length === 0) {
    return (
      <div className={styles.trainer}>
        <p className={styles.klaar}>
          🎉 Alle {alleIds.length} termen gekend! Je had {pogingen}{' '}
          {pogingen === 1 ? 'poging' : 'pogingen'} nodig.
        </p>
        <button type="button" className={styles.primair} onClick={start}>
          Nog een keer
        </button>
      </div>
    );
  }

  const huidig = begrippen[stapel[0]];

  const wistIk = () => {
    setGekend((g) => g + 1);
    setPogingen((p) => p + 1);
    setStapel((s) => s.slice(1));
    setOmgedraaid(false);
  };

  const nogOefenen = () => {
    setPogingen((p) => p + 1);
    setStapel((s) => [...s.slice(1), s[0]]);
    setOmgedraaid(false);
  };

  return (
    <div className={styles.trainer}>
      <div className={styles.voortgang}>
        {gekend} van {alleIds.length} gekend · nog {stapel.length} in de stapel
      </div>
      <button
        type="button"
        className={`${styles.kaart} ${omgedraaid ? styles.kaartOm : ''}`}
        onClick={() => {
          if (!omgedraaid) setOmgedraaid(true);
        }}>
        {omgedraaid ? (
          <span className={styles.achterkant}>
            <strong>{huidig.term}</strong>
            <span>{huidig.kort}</span>
            <Link
              to={huidig.url}
              className={styles.meerLink}
              onClick={(e) => e.stopPropagation()}>
              Lees meer →
            </Link>
          </span>
        ) : (
          <span className={styles.voorkant}>
            {huidig.term}
            <span className={styles.hint}>Klik om om te draaien</span>
          </span>
        )}
      </button>
      {omgedraaid && (
        <div className={styles.knoppen}>
          <button type="button" className={styles.wist} onClick={wistIk}>
            ✓ Wist ik
          </button>
          <button type="button" className={styles.oefen} onClick={nogOefenen}>
            ↻ Nog oefenen
          </button>
        </div>
      )}
    </div>
  );
}

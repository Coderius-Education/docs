import React, {useState} from 'react';
import Link from '@docusaurus/Link';
import begrippen from '@site/src/data/begrippen';
import {hoofdstukken, hoofdstukVan} from '@site/src/data/hoofdstukken';
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
  const [ids, setIds] = useState(alleIds); // de gekozen set
  const [stapel, setStapel] = useState(null); // null = nog niet gestart
  const [omgedraaid, setOmgedraaid] = useState(false);
  const [gekend, setGekend] = useState(0);
  const [pogingen, setPogingen] = useState(0);

  const start = (keuze) => {
    setIds(keuze);
    setStapel(schud(keuze));
    setOmgedraaid(false);
    setGekend(0);
    setPogingen(0);
  };

  const idsVan = (hid) => alleIds.filter((id) => hoofdstukVan(begrippen[id]) === hid);

  if (stapel === null) {
    return (
      <div className={styles.trainer}>
        <p className={styles.introTekst}>
          Test jezelf: telkens een term — weet jij wat die betekent voordat je
          het kaartje omdraait? Kies alles of één hoofdstuk.
        </p>
        <button type="button" className={styles.primair} onClick={() => start(alleIds)}>
          Alle termen ({alleIds.length})
        </button>
        <div className={styles.hoofdstukken}>
          {hoofdstukken.map((h) => {
            const n = idsVan(h.id).length;
            return (
              <button
                key={h.id}
                type="button"
                className={styles.hoofdstukKnop}
                onClick={() => start(idsVan(h.id))}>
                {h.naam} ({n})
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  if (stapel.length === 0) {
    return (
      <div className={styles.trainer}>
        <p className={styles.klaar}>
          Alle {ids.length} termen gekend! Je had {pogingen}{' '}
          {pogingen === 1 ? 'poging' : 'pogingen'} nodig.
        </p>
        <div className={styles.knoppen}>
          <button type="button" className={styles.primair} onClick={() => start(ids)}>
            Nog een keer
          </button>
          <button type="button" className={styles.oefen} onClick={() => setStapel(null)}>
            Ander hoofdstuk
          </button>
        </div>
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
        {gekend} van {ids.length} gekend · nog {stapel.length} in de stapel ·{' '}
        <button type="button" className={styles.stopKnop} onClick={() => setStapel(null)}>
          stoppen
        </button>
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
            <span className={styles.hint}>Klik om het kaartje om te draaien</span>
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

import React, {useState} from 'react';
import styles from './styles.module.css';

/**
 * Meerkeuzequiz met directe feedback.
 *
 * @param {{vragen: {vraag: string, opties: string[], juist: number, uitleg: string}[]}} props
 */
export default function Quiz({vragen}) {
  // Per vraag de index van het gekozen antwoord, of null.
  const [antwoorden, setAntwoorden] = useState(() => vragen.map(() => null));

  const beantwoord = antwoorden.filter((a) => a !== null).length;
  const goed = antwoorden.filter((a, i) => a === vragen[i].juist).length;
  const klaar = beantwoord === vragen.length;

  const kies = (vraagIndex, optieIndex) => {
    if (antwoorden[vraagIndex] !== null) return; // vraag is al beantwoord
    setAntwoorden((huidig) =>
      huidig.map((a, i) => (i === vraagIndex ? optieIndex : a)),
    );
  };

  const reset = () => setAntwoorden(vragen.map(() => null));

  return (
    <div className={styles.quiz}>
      {vragen.map((v, vi) => {
        const gekozen = antwoorden[vi];
        const isBeantwoord = gekozen !== null;
        const isGoed = gekozen === v.juist;
        return (
          <div key={vi} className={styles.vraag}>
            <p className={styles.vraagTekst}>
              <span className={styles.vraagNummer}>{vi + 1}</span>
              <em>{v.vraag}</em>
            </p>
            <div className={styles.opties}>
              {v.opties.map((optie, oi) => {
                let klasse = styles.optie;
                if (isBeantwoord) {
                  if (oi === v.juist) klasse += ` ${styles.optieGoed}`;
                  else if (oi === gekozen) klasse += ` ${styles.optieFout}`;
                  else klasse += ` ${styles.optieUit}`;
                }
                return (
                  <button
                    key={oi}
                    type="button"
                    className={klasse}
                    onClick={() => kies(vi, oi)}
                    disabled={isBeantwoord}>
                    {optie}
                    {isBeantwoord && oi === v.juist && ' ✓'}
                    {isBeantwoord && oi === gekozen && oi !== v.juist && ' ✗'}
                  </button>
                );
              })}
            </div>
            {isBeantwoord && (
              <div
                className={`${styles.uitleg} ${
                  isGoed ? styles.uitlegGoed : styles.uitlegFout
                }`}>
                <strong>{isGoed ? 'Goed!' : 'Helaas.'}</strong> {v.uitleg}
              </div>
            )}
          </div>
        );
      })}
      {klaar && (
        <div className={styles.score}>
          <strong>
            Je hebt {goed} van de {vragen.length} goed
            {goed === vragen.length ? ' — perfect! 🎉' : '.'}
          </strong>
          <button type="button" className={styles.resetKnop} onClick={reset}>
            Opnieuw
          </button>
        </div>
      )}
    </div>
  );
}

import React, {useState} from 'react';
import Link from '@docusaurus/Link';
import begrippen from '@site/src/data/begrippen';
import styles from './styles.module.css';

/**
 * Alfabetische begrippenlijst, gegenereerd uit de centrale data, met een
 * zoekveld dat filtert op term en omschrijving.
 */
export default function TermenLijst() {
  const [zoek, setZoek] = useState('');
  const lijst = Object.entries(begrippen).sort(([, a], [, b]) =>
    a.term.localeCompare(b.term, 'nl'),
  );
  const q = zoek.trim().toLowerCase();
  const zichtbaar = q
    ? lijst.filter(([, b]) =>
        `${b.term} ${b.kort} ${b.lang || ''}`.toLowerCase().includes(q),
      )
    : lijst;

  return (
    <>
      <input
        type="search"
        className={styles.zoek}
        placeholder={`Zoek in ${lijst.length} begrippen…`}
        aria-label="Zoek een begrip"
        value={zoek}
        onChange={(e) => setZoek(e.target.value)}
      />
      {zichtbaar.length === 0 && (
        <p className={styles.leeg}>Geen begrip gevonden voor “{zoek}”.</p>
      )}
      <dl className={styles.lijst}>
        {zichtbaar.map(([id, b]) => (
          <React.Fragment key={id}>
            <dt id={id} className={styles.term}>
              {b.term}
            </dt>
            <dd className={styles.definitie}>
              {b.lang || b.kort}{' '}
              <Link to={b.url} className={styles.meer}>
                Lees meer →
              </Link>
            </dd>
          </React.Fragment>
        ))}
      </dl>
    </>
  );
}

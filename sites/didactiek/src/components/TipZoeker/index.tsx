import {type ReactNode, useMemo, useState} from 'react';
import Link from '@docusaurus/Link';
import {tips, type Tip} from '@site/src/data/tips';
import styles from './styles.module.css';

// Alles waar de zoekterm tegen mag matchen, samengevoegd tot één kleine-letter string.
function zoekTekst(tip: Tip): string {
  return [tip.term, tip.categorie, tip.samenvatting, tip.paper.titel, tip.paper.auteurs, ...tip.termen]
    .join(' ')
    .toLowerCase();
}

export default function TipZoeker(): ReactNode {
  const [query, setQuery] = useState('');

  const index = useMemo(() => tips.map((tip) => ({tip, tekst: zoekTekst(tip)})), []);
  const woorden = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const resultaten = woorden.length
    ? index.filter(({tekst}) => woorden.every((w) => tekst.includes(w))).map(({tip}) => tip)
    : tips;

  return (
    <section className={styles.zoeker}>
      <div className="container">
        <input
          type="search"
          className={styles.zoekveld}
          placeholder="Zoek op term, bijvoorbeeld: cognitive load, voorspellen, scaffolding"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Zoek een didactische tip"
        />

        <p className={styles.telling} aria-live="polite">
          {resultaten.length} van {tips.length} tips
        </p>

        {resultaten.length === 0 ? (
          <p className={styles.leeg}>
            Geen tip gevonden voor <strong>{query}</strong>. Probeer een ander trefwoord.
          </p>
        ) : (
          <ul className={styles.lijst}>
            {resultaten.map((tip) => (
              <li key={tip.slug} className={styles.kaart}>
                <div className={styles.kaartKop}>
                  <Link to={tip.detailPad} className={styles.titel}>
                    {tip.term}
                  </Link>
                  <span className={styles.categorie}>{tip.categorie}</span>
                </div>

                <p className={styles.samenvatting}>{tip.samenvatting}</p>

                <div className={styles.termen}>
                  {tip.termen.map((t) => (
                    <Link key={t} to={tip.detailPad} className={styles.term}>
                      {t}
                    </Link>
                  ))}
                </div>

                <p className={styles.bron}>
                  Gebaseerd op {tip.paper.auteurs} ({tip.paper.jaar}).{' '}
                  <Link to={tip.detailPad}>Lees de onderbouwing →</Link>
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

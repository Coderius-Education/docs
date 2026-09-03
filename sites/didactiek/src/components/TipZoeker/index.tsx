import Link from '@docusaurus/Link';
import { tips } from '@site/src/data/tips';
import { type ReactNode, useMemo, useState } from 'react';
import { filterTips } from './filterTips';
import styles from './styles.module.css';

export default function TipZoeker(): ReactNode {
  const [query, setQuery] = useState('');

  // Het filter zelf staat in filterTips.ts, los van React, met eigen tests.
  const resultaten = useMemo(() => filterTips(tips, query), [query]);

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

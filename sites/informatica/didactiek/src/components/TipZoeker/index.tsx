import Link from '@docusaurus/Link';
import { type CategorieId, type Tip, tips } from '@site/src/data/tips';
import { type ReactNode, useMemo, useState } from 'react';
import { filterTips, maakIndex, perCategorie } from './filterTips';
import styles from './styles.module.css';

/** Waar de tip vandaan komt: de paper, of in één zin de praktijk. */
function Bron({ tip }: { tip: Tip }): ReactNode {
  return (
    <p className={styles.bron}>
      {tip.bron === 'onderzoek' ? (
        <>
          Gebaseerd op {tip.paper.auteurs} ({tip.paper.jaar}).{' '}
          <Link to={tip.detailPad}>Lees de onderbouwing →</Link>
        </>
      ) : (
        <>
          Uit de praktijk: {tip.herkomst} <Link to={tip.detailPad}>Lees hoe het ging →</Link>
        </>
      )}
    </p>
  );
}

export default function TipZoeker(): ReactNode {
  const [query, setQuery] = useState('');
  // De gekozen categorie, of null voor alle. Zoeken en kiezen werken samen:
  // de knoppen tellen wat de zoekterm overlaat.
  const [gekozen, setGekozen] = useState<CategorieId | null>(null);

  // Het filter zelf staat in filterTips.ts, los van React, met eigen tests.
  // De zoektekst per tip wordt één keer gebouwd, niet bij elke toetsaanslag.
  const index = useMemo(() => maakIndex(tips), []);
  const gevonden = useMemo(() => filterTips(index, query), [index, query]);
  const groepen = useMemo(() => perCategorie(gevonden), [gevonden]);
  const zichtbaar = groepen.filter(
    (g) => g.tips.length > 0 && (gekozen === null || g.categorie.id === gekozen),
  );
  const aantal = zichtbaar.reduce((n, g) => n + g.tips.length, 0);

  return (
    <section className={styles.zoeker}>
      <div className="container">
        <input
          type="search"
          className={styles.zoekveld}
          placeholder="Zoek op term, bijvoorbeeld: cognitive load, leerdoelen, kleine stappen"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Zoek een didactische tip"
        />

        <fieldset className={styles.categorieen}>
          <legend className={styles.verborgen}>Categorie</legend>
          <button
            type="button"
            className={`button button--sm button--outline button--primary${gekozen === null ? ' button--active' : ''}`}
            aria-pressed={gekozen === null}
            onClick={() => setGekozen(null)}
          >
            Alle ({gevonden.length})
          </button>
          {groepen.map(({ categorie, tips: lijst }) => (
            <button
              key={categorie.id}
              type="button"
              className={`button button--sm button--outline button--primary${gekozen === categorie.id ? ' button--active' : ''}`}
              aria-pressed={gekozen === categorie.id}
              // Een categorie zonder tips blijft staan, maar is niet te kiezen:
              // zo is te zien waar de verzameling nog leeg is.
              disabled={lijst.length === 0 && gekozen !== categorie.id}
              onClick={() => setGekozen(categorie.id)}
            >
              {categorie.label} ({lijst.length})
            </button>
          ))}
        </fieldset>

        <p className={styles.telling} aria-live="polite">
          {aantal} van {tips.length} tips. Elke tip heeft een controlevraag voor een les; ze staan
          bij elkaar op de <Link to="/checklist">checklist</Link>.
        </p>

        {aantal === 0 ? (
          <p className={styles.leeg}>
            Geen tip gevonden
            {query && (
              <>
                {' '}
                voor <strong>{query}</strong>
              </>
            )}
            . Probeer een ander trefwoord of een andere categorie.
          </p>
        ) : (
          zichtbaar.map(({ categorie, tips: lijst }) => (
            <section key={categorie.id} className={styles.groep}>
              <h2 className={styles.groepKop}>{categorie.label}</h2>
              <p className={styles.groepTekst}>{categorie.omschrijving}</p>
              <ul className={styles.lijst}>
                {lijst.map((tip) => (
                  <li key={tip.slug} className={styles.kaart}>
                    <div className={styles.kaartKop}>
                      <Link to={tip.detailPad} className={styles.titel}>
                        {tip.term}
                      </Link>
                      <span className={styles.soort}>
                        {tip.bron === 'onderzoek' ? 'Uit onderzoek' : 'Uit de praktijk'}
                      </span>
                    </div>

                    <p className={styles.samenvatting}>{tip.samenvatting}</p>

                    <p className={styles.controle}>
                      <span className={styles.controleLabel}>Controlevraag</span>{' '}
                      {tip.controlevraag}
                    </p>

                    <div className={styles.termen}>
                      {tip.termen.map((t) => (
                        <Link key={t} to={tip.detailPad} className={styles.term}>
                          {t}
                        </Link>
                      ))}
                    </div>

                    <Bron tip={tip} />
                  </li>
                ))}
              </ul>
            </section>
          ))
        )}
      </div>
    </section>
  );
}

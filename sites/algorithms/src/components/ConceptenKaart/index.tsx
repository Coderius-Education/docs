// sites.js is CommonJS; named imports werken via de bundler-interop.
import { SITES_BY_ID, normalizeUrl } from '@coderius/shared/sites';
import Link from '@docusaurus/Link';
import { algoritmes } from '@site/src/data/algorithms';
import { pythonConcepten, voorkennisPerAlgoritme } from '@site/src/data/conceptenkaart';
import clsx from 'clsx';
import type React from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import styles from './styles.module.css';

// Vaste maten (gespiegeld in styles.module.css) zodat de y-posities van de
// lijnen berekenbaar zijn zonder meet-code.
const NODE_H = 44;
const GAP = 10;
const VIEW_W = 1000;

type Actief = { kind: 'concept' | 'algoritme'; id: string } | null;

const pythonSite = SITES_BY_ID.python;
const pythonBase = normalizeUrl(pythonSite.url);

function rijMidden(index: number): number {
  return index * (NODE_H + GAP) + NODE_H / 2;
}

export default function ConceptenKaart(): React.ReactElement {
  const [actief, setActief] = useState<Actief>(null);
  const [gepind, setGepind] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const conceptIndex = useMemo(() => new Map(pythonConcepten.map((c, i) => [c.id, i])), []);

  const edges = useMemo(
    () =>
      algoritmes.flatMap((algoritme, algoIdx) =>
        (voorkennisPerAlgoritme[algoritme.slug] ?? []).map((conceptId) => ({
          key: `${conceptId}:${algoritme.slug}`,
          conceptId,
          slug: algoritme.slug,
          y1: rijMidden(conceptIndex.get(conceptId) ?? 0),
          y2: rijMidden(algoIdx),
        })),
      ),
    [conceptIndex],
  );

  const hoogte = rijMidden(Math.max(pythonConcepten.length, algoritmes.length) - 1) + NODE_H / 2;

  // Welke nodes horen bij de actieve selectie?
  const verbonden = useMemo(() => {
    if (!actief) return null;
    const concepten = new Set<string>();
    const slugs = new Set<string>();
    for (const edge of edges) {
      const raak =
        actief.kind === 'concept' ? edge.conceptId === actief.id : edge.slug === actief.id;
      if (raak) {
        concepten.add(edge.conceptId);
        slugs.add(edge.slug);
      }
    }
    return { concepten, slugs };
  }, [actief, edges]);

  const wisPin = useCallback(() => {
    setGepind(false);
    setActief(null);
  }, []);

  // Escape en klik buiten de kaart wissen een gepinde selectie.
  useEffect(() => {
    if (!gepind) return undefined;
    const opKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') wisPin();
    };
    const opKlik = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) wisPin();
    };
    document.addEventListener('keydown', opKeyDown);
    document.addEventListener('mousedown', opKlik);
    return () => {
      document.removeEventListener('keydown', opKeyDown);
      document.removeEventListener('mousedown', opKlik);
    };
  }, [gepind, wisPin]);

  const activeer = (kind: 'concept' | 'algoritme', id: string) => {
    if (!gepind) setActief({ kind, id });
  };
  const toggle = (kind: 'concept' | 'algoritme', id: string) => {
    if (gepind && actief && actief.kind === kind && actief.id === id) {
      wisPin();
    } else {
      setActief({ kind, id });
      setGepind(true);
    }
  };
  const laatLos = () => {
    if (!gepind) setActief(null);
  };

  const isActieveNode = (kind: 'concept' | 'algoritme', id: string) =>
    actief !== null && actief.kind === kind && actief.id === id;
  const isVerbondenConcept = (id: string) => !verbonden || verbonden.concepten.has(id);
  const isVerbondenAlgoritme = (slug: string) => !verbonden || verbonden.slugs.has(slug);

  const actieveEdges = edges.filter((edge) =>
    actief
      ? actief.kind === 'concept'
        ? edge.conceptId === actief.id
        : edge.slug === actief.id
      : false,
  );

  const actiefConcept =
    actief?.kind === 'concept' ? pythonConcepten.find((c) => c.id === actief.id) : undefined;
  const actiefAlgoritme =
    actief?.kind === 'algoritme' ? algoritmes.find((a) => a.slug === actief.id) : undefined;

  return (
    <div ref={containerRef}>
      <div className={styles.scroller}>
        <div className={styles.koppen}>
          <h2 className={styles.kolomkop}>Python-concepten</h2>
          <span />
          <h2 className={styles.kolomkop}>Algoritmes</h2>
        </div>
        <div className={styles.kaart} style={{ ['--kaart-hoogte' as string]: `${hoogte}px` }}>
          <div className={styles.kolom}>
            {pythonConcepten.map((concept) => (
              <button
                key={concept.id}
                type="button"
                className={clsx(
                  styles.node,
                  styles.nodeLinks,
                  isActieveNode('concept', concept.id) && styles.nodeActief,
                  actief && !isVerbondenConcept(concept.id) && styles.nodeGedimd,
                )}
                aria-pressed={gepind && isActieveNode('concept', concept.id)}
                onMouseEnter={() => activeer('concept', concept.id)}
                onMouseLeave={laatLos}
                onFocus={() => activeer('concept', concept.id)}
                onClick={() => toggle('concept', concept.id)}
              >
                <span className={styles.nodeLabel}>{concept.label}</span>
                <span className={styles.teller}>
                  {edges.filter((e) => e.conceptId === concept.id).length}
                </span>
              </button>
            ))}
          </div>

          <svg
            className={styles.lijnen}
            viewBox={`0 0 ${VIEW_W} ${hoogte}`}
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            {edges.map((edge) => (
              <path
                key={edge.key}
                className={clsx(styles.lijn, actief && styles.lijnGedimd)}
                d={`M 0 ${edge.y1} C 400 ${edge.y1}, 600 ${edge.y2}, ${VIEW_W} ${edge.y2}`}
                vectorEffect="non-scaling-stroke"
              />
            ))}
            {actieveEdges.map((edge) => (
              <path
                key={`actief-${edge.key}`}
                className={clsx(styles.lijn, styles.lijnActief)}
                d={`M 0 ${edge.y1} C 400 ${edge.y1}, 600 ${edge.y2}, ${VIEW_W} ${edge.y2}`}
                vectorEffect="non-scaling-stroke"
              />
            ))}
          </svg>

          <div className={styles.kolom}>
            {algoritmes.map((algoritme) => (
              <button
                key={algoritme.slug}
                type="button"
                className={clsx(
                  styles.node,
                  isActieveNode('algoritme', algoritme.slug) && styles.nodeActief,
                  actief && !isVerbondenAlgoritme(algoritme.slug) && styles.nodeGedimd,
                )}
                aria-pressed={gepind && isActieveNode('algoritme', algoritme.slug)}
                onMouseEnter={() => activeer('algoritme', algoritme.slug)}
                onMouseLeave={laatLos}
                onFocus={() => activeer('algoritme', algoritme.slug)}
                onClick={() => toggle('algoritme', algoritme.slug)}
              >
                <span className={styles.teller}>
                  {edges.filter((e) => e.slug === algoritme.slug).length}
                </span>
                <span className={styles.nodeLabel}>{algoritme.titel}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.paneel} aria-live="polite">
        {actiefConcept && (
          <>
            <p className={styles.paneelKop}>
              <strong>{actiefConcept.label}</strong> gebruik je bij deze algoritmes.{' '}
              <a href={pythonBase + actiefConcept.to} target="_blank" rel="noopener noreferrer">
                Naar de les op de Python-site
              </a>
            </p>
            <ul className={styles.paneelLinks}>
              {algoritmes
                .filter((a) => (voorkennisPerAlgoritme[a.slug] ?? []).includes(actiefConcept.id))
                .map((a) => (
                  <li key={a.slug}>
                    <Link to={a.startPad}>{a.titel}</Link>
                  </li>
                ))}
            </ul>
          </>
        )}
        {actiefAlgoritme && (
          <>
            <p className={styles.paneelKop}>
              <strong>{actiefAlgoritme.titel}</strong> bouwt voort op deze Python-lessen.{' '}
              <Link to={actiefAlgoritme.startPad}>Naar dit algoritme</Link>
            </p>
            <ul className={styles.paneelLinks}>
              {pythonConcepten
                .filter((c) => (voorkennisPerAlgoritme[actiefAlgoritme.slug] ?? []).includes(c.id))
                .map((c) => (
                  <li key={c.id}>
                    <a href={pythonBase + c.to} target="_blank" rel="noopener noreferrer">
                      {c.label}
                    </a>
                  </li>
                ))}
            </ul>
          </>
        )}
        {!actief && (
          <p className={styles.paneelKop}>
            Beweeg over een blok of klik erop om de verbindingen te zien. De links verschijnen hier.
          </p>
        )}
      </div>
    </div>
  );
}

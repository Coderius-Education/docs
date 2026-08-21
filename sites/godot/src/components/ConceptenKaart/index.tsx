import Link from '@docusaurus/Link';
import {
  HOOFDSTUKKEN,
  LEERLIJNEN,
  type Leerlijn,
  conceptenPerLes,
  godotConcepten,
  lessen,
} from '@site/src/data/conceptenkaart';
import clsx from 'clsx';
import type React from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import styles from './styles.module.css';

// Vaste maten (gespiegeld in styles.module.css) zodat de y-posities van de
// lijnen berekenbaar zijn zonder meet-code.
const NODE_H = 44;
const GAP = 10;
const VIEW_W = 1000;

type Actief = { kind: 'concept' | 'les' | 'leerlijn'; id: string } | null;

const leerlijnKlasse: Record<Leerlijn, string> = {
  editor: styles.nodeEditor,
  nodes: styles.nodeNodes,
  gdscript: styles.nodeGdscript,
};

const lijnKlasse: Record<Leerlijn, string> = {
  editor: styles.lijnEditor,
  nodes: styles.lijnNodes,
  gdscript: styles.lijnGdscript,
};

function rijMidden(index: number): number {
  return index * (NODE_H + GAP) + NODE_H / 2;
}

export default function ConceptenKaart(): React.ReactElement {
  const [hoofdstuk, setHoofdstuk] = useState<number | 'alles'>(HOOFDSTUKKEN[0].nummer);
  const [actief, setActief] = useState<Actief>(null);
  const [gepind, setGepind] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const leerlijnVan = useMemo(() => new Map(godotConcepten.map((c) => [c.id, c.leerlijn])), []);

  // Eén hoofdstuk tegelijk: links alleen de concepten die in de zichtbare
  // lessen voorkomen, in de vaste leerlijn-volgorde van godotConcepten.
  const zichtbareLessen = useMemo(
    () => (hoofdstuk === 'alles' ? lessen : lessen.filter((l) => l.hoofdstuk === hoofdstuk)),
    [hoofdstuk],
  );

  const zichtbareConcepten = useMemo(() => {
    if (hoofdstuk === 'alles') return godotConcepten;
    const gebruikt = new Set(zichtbareLessen.flatMap((l) => conceptenPerLes[l.slug] ?? []));
    return godotConcepten.filter((c) => gebruikt.has(c.id));
  }, [hoofdstuk, zichtbareLessen]);

  const conceptIndex = useMemo(
    () => new Map(zichtbareConcepten.map((c, i) => [c.id, i])),
    [zichtbareConcepten],
  );

  const edges = useMemo(
    () =>
      zichtbareLessen.flatMap((les, lesIdx) =>
        (conceptenPerLes[les.slug] ?? []).map((conceptId) => ({
          key: `${conceptId}:${les.slug}`,
          conceptId,
          slug: les.slug,
          leerlijn: leerlijnVan.get(conceptId) as Leerlijn,
          y1: rijMidden(conceptIndex.get(conceptId) ?? 0),
          y2: rijMidden(lesIdx),
        })),
      ),
    [conceptIndex, leerlijnVan, zichtbareLessen],
  );

  const hoogte =
    rijMidden(Math.max(zichtbareConcepten.length, zichtbareLessen.length) - 1) + NODE_H / 2;

  // Welke nodes horen bij de actieve selectie?
  const verbonden = useMemo(() => {
    if (!actief) return null;
    const concepten = new Set<string>();
    const slugs = new Set<string>();
    for (const edge of edges) {
      const raak =
        actief.kind === 'concept'
          ? edge.conceptId === actief.id
          : actief.kind === 'les'
            ? edge.slug === actief.id
            : edge.leerlijn === actief.id;
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

  const activeer = (kind: 'concept' | 'les' | 'leerlijn', id: string) => {
    if (!gepind) setActief({ kind, id });
  };
  const toggle = (kind: 'concept' | 'les' | 'leerlijn', id: string) => {
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

  const isActieveNode = (kind: 'concept' | 'les' | 'leerlijn', id: string) =>
    actief !== null && actief.kind === kind && actief.id === id;
  const isVerbondenConcept = (id: string) => !verbonden || verbonden.concepten.has(id);
  const isVerbondenLes = (slug: string) => !verbonden || verbonden.slugs.has(slug);

  const actieveEdges = edges.filter((edge) =>
    actief
      ? actief.kind === 'concept'
        ? edge.conceptId === actief.id
        : actief.kind === 'les'
          ? edge.slug === actief.id
          : edge.leerlijn === actief.id
      : false,
  );

  const kiesHoofdstuk = (keuze: number | 'alles') => {
    setHoofdstuk(keuze);
    // Een gepinde selectie kan buiten het nieuwe hoofdstuk vallen.
    setActief(null);
    setGepind(false);
  };

  const actiefConcept =
    actief?.kind === 'concept' ? godotConcepten.find((c) => c.id === actief.id) : undefined;
  const actieveLes = actief?.kind === 'les' ? lessen.find((l) => l.slug === actief.id) : undefined;
  const actieveLeerlijn =
    actief?.kind === 'leerlijn' ? LEERLIJNEN.find((l) => l.id === actief.id) : undefined;

  return (
    <div ref={containerRef}>
      <div className={styles.hoofdstukken}>
        <span className={styles.filterLabel} id="hoofdstuk-label">
          Hoofdstuk
        </span>
        <div className={styles.hoofdstukKnoppen} aria-labelledby="hoofdstuk-label">
          {HOOFDSTUKKEN.map((h) => (
            <button
              key={h.nummer}
              type="button"
              className={clsx(styles.tab, hoofdstuk === h.nummer && styles.tabActief)}
              aria-pressed={hoofdstuk === h.nummer}
              onClick={() => kiesHoofdstuk(h.nummer)}
            >
              <span className={styles.tabNummer}>{h.nummer}</span>
              {h.label}
            </button>
          ))}
          <button
            type="button"
            className={clsx(styles.tab, hoofdstuk === 'alles' && styles.tabActief)}
            aria-pressed={hoofdstuk === 'alles'}
            onClick={() => kiesHoofdstuk('alles')}
          >
            Alles tegelijk
          </button>
        </div>
      </div>

      <div className={styles.legenda}>
        {LEERLIJNEN.map((leerlijn) => (
          <button
            key={leerlijn.id}
            type="button"
            className={clsx(
              styles.chip,
              leerlijnKlasse[leerlijn.id],
              isActieveNode('leerlijn', leerlijn.id) && styles.chipActief,
            )}
            aria-pressed={gepind && isActieveNode('leerlijn', leerlijn.id)}
            onMouseEnter={() => activeer('leerlijn', leerlijn.id)}
            onMouseLeave={laatLos}
            onFocus={() => activeer('leerlijn', leerlijn.id)}
            onClick={() => toggle('leerlijn', leerlijn.id)}
          >
            <span className={styles.chipStip} aria-hidden="true" />
            {leerlijn.label}
          </button>
        ))}
      </div>

      <div className={styles.scroller}>
        <div className={styles.koppen}>
          <h2 className={styles.kolomkop}>Concepten</h2>
          <span />
          <h2 className={styles.kolomkop}>Lessen</h2>
        </div>
        <div className={styles.kaart} style={{ ['--kaart-hoogte' as string]: `${hoogte}px` }}>
          <div className={styles.kolom}>
            {zichtbareConcepten.map((concept) => (
              <button
                key={concept.id}
                type="button"
                className={clsx(
                  styles.node,
                  styles.nodeLinks,
                  leerlijnKlasse[concept.leerlijn],
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
                className={clsx(styles.lijn, styles.lijnActief, lijnKlasse[edge.leerlijn])}
                d={`M 0 ${edge.y1} C 400 ${edge.y1}, 600 ${edge.y2}, ${VIEW_W} ${edge.y2}`}
                vectorEffect="non-scaling-stroke"
              />
            ))}
          </svg>

          <div className={styles.kolom}>
            {zichtbareLessen.map((les) => (
              <button
                key={les.slug}
                type="button"
                className={clsx(
                  styles.node,
                  isActieveNode('les', les.slug) && styles.nodeActief,
                  actief && !isVerbondenLes(les.slug) && styles.nodeGedimd,
                )}
                aria-pressed={gepind && isActieveNode('les', les.slug)}
                onMouseEnter={() => activeer('les', les.slug)}
                onMouseLeave={laatLos}
                onFocus={() => activeer('les', les.slug)}
                onClick={() => toggle('les', les.slug)}
              >
                <span className={styles.teller}>
                  {edges.filter((e) => e.slug === les.slug).length}
                </span>
                <span className={styles.nodeLabel}>{les.titel}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.paneel} aria-live="polite">
        {actiefConcept && (
          <>
            <p className={styles.paneelKop}>
              <strong>{actiefConcept.label}</strong> gebruik je in deze lessen, in de hele cursus.{' '}
              <Link to={actiefConcept.to}>Naar de uitleg</Link>
            </p>
            <ul className={styles.paneelLinks}>
              {lessen
                .filter((l) => (conceptenPerLes[l.slug] ?? []).includes(actiefConcept.id))
                .map((l) => (
                  <li key={l.slug}>
                    <span className={styles.paneelHoofdstuk}>{l.hoofdstuk}</span>
                    <Link to={`/docs/${l.slug}`}>{l.titel}</Link>
                  </li>
                ))}
            </ul>
          </>
        )}
        {actieveLes && (
          <>
            <p className={styles.paneelKop}>
              <strong>{actieveLes.titel}</strong> gebruikt deze concepten.{' '}
              <Link to={`/docs/${actieveLes.slug}`}>Naar de les</Link>
            </p>
            <ul className={styles.paneelLinks}>
              {godotConcepten
                .filter((c) => (conceptenPerLes[actieveLes.slug] ?? []).includes(c.id))
                .map((c) => (
                  <li key={c.id}>
                    <Link to={c.to}>{c.label}</Link>
                  </li>
                ))}
            </ul>
          </>
        )}
        {actieveLeerlijn && (
          <>
            <p className={styles.paneelKop}>
              De leerlijn <strong>{actieveLeerlijn.label}</strong> bevat deze concepten.
            </p>
            <ul className={styles.paneelLinks}>
              {godotConcepten
                .filter((c) => c.leerlijn === actieveLeerlijn.id)
                .map((c) => (
                  <li key={c.id}>
                    <Link to={c.to}>{c.label}</Link>
                  </li>
                ))}
            </ul>
          </>
        )}
        {!actief && (
          <p className={styles.paneelKop}>
            Beweeg over een blok, een les of een leerlijn-chip, of klik erop om de verbindingen te
            zien. De links verschijnen hier.
          </p>
        )}
      </div>
    </div>
  );
}

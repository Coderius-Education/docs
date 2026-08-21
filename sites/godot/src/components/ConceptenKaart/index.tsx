import Link from '@docusaurus/Link';
import {
  HOOFDSTUKKEN,
  LEERLIJNEN,
  type Leerlijn,
  conceptenPerLes,
  godotConcepten,
  lessen,
  uitlegSlug,
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

type Actief = { kind: 'concept' | 'les'; id: string } | null;

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

function pad(y1: number, y2: number): string {
  return `M 0 ${y1} C 400 ${y1}, 600 ${y2}, ${VIEW_W} ${y2}`;
}

export default function ConceptenKaart(): React.ReactElement {
  const [leerlijn, setLeerlijn] = useState<Leerlijn>(LEERLIJNEN[0].id);
  const [hoofdstuk, setHoofdstuk] = useState<number | 'alles'>('alles');
  const [actief, setActief] = useState<Actief>(null);
  const [gepind, setGepind] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Eén leerlijn tegelijk, eventueel ingeperkt tot één hoofdstuk.
  const conceptenVanLeerlijn = useMemo(
    () => godotConcepten.filter((c) => c.leerlijn === leerlijn),
    [leerlijn],
  );

  const lessenVanLeerlijn = useMemo(() => {
    const ids = new Set(conceptenVanLeerlijn.map((c) => c.id));
    return lessen.filter((l) => (conceptenPerLes[l.slug] ?? []).some((id) => ids.has(id)));
  }, [conceptenVanLeerlijn]);

  // Alleen hoofdstukken die in deze leerlijn iets te tonen hebben.
  const beschikbareHoofdstukken = useMemo(() => {
    const aanwezig = new Set(lessenVanLeerlijn.map((l) => l.hoofdstuk));
    return HOOFDSTUKKEN.filter((h) => aanwezig.has(h.nummer));
  }, [lessenVanLeerlijn]);

  const zichtbareLessen = useMemo(
    () =>
      hoofdstuk === 'alles'
        ? lessenVanLeerlijn
        : lessenVanLeerlijn.filter((l) => l.hoofdstuk === hoofdstuk),
    [hoofdstuk, lessenVanLeerlijn],
  );

  const lesVolgorde = useMemo(() => new Map(lessen.map((l, i) => [l.slug, i])), []);

  const zichtbareConcepten = useMemo(() => {
    const basis =
      hoofdstuk === 'alles'
        ? conceptenVanLeerlijn
        : (() => {
            const gebruikt = new Set(zichtbareLessen.flatMap((l) => conceptenPerLes[l.slug] ?? []));
            return conceptenVanLeerlijn.filter((c) => gebruikt.has(c.id));
          })();
    // Sorteren op de les waar het concept wordt uitgelegd: zo lopen de dikke
    // lijnen vrijwel parallel en leest de kolom als de volgorde waarin je ze
    // tegenkomt.
    return [...basis].sort(
      (a, b) => (lesVolgorde.get(uitlegSlug(a)) ?? 0) - (lesVolgorde.get(uitlegSlug(b)) ?? 0),
    );
  }, [conceptenVanLeerlijn, hoofdstuk, lesVolgorde, zichtbareLessen]);

  const conceptIndex = useMemo(
    () => new Map(zichtbareConcepten.map((c, i) => [c.id, i])),
    [zichtbareConcepten],
  );

  const uitlegPerConcept = useMemo(
    () => new Map(godotConcepten.map((c) => [c.id, uitlegSlug(c)])),
    [],
  );

  const edges = useMemo(
    () =>
      zichtbareLessen.flatMap((les, lesIdx) =>
        (conceptenPerLes[les.slug] ?? [])
          .filter((conceptId) => conceptIndex.has(conceptId))
          .map((conceptId) => ({
            key: `${conceptId}:${les.slug}`,
            conceptId,
            slug: les.slug,
            // De ene les waar het concept wordt uitgelegd; de rest gebruikt het.
            isUitleg: uitlegPerConcept.get(conceptId) === les.slug,
            y1: rijMidden(conceptIndex.get(conceptId) ?? 0),
            y2: rijMidden(lesIdx),
          })),
      ),
    [conceptIndex, uitlegPerConcept, zichtbareLessen],
  );

  const hoogte =
    rijMidden(Math.max(zichtbareConcepten.length, zichtbareLessen.length, 1) - 1) + NODE_H / 2;

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

  const activeer = (kind: 'concept' | 'les', id: string) => {
    if (!gepind) setActief({ kind, id });
  };
  const toggle = (kind: 'concept' | 'les', id: string) => {
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

  const isActieveNode = (kind: 'concept' | 'les', id: string) =>
    actief !== null && actief.kind === kind && actief.id === id;
  const isVerbondenConcept = (id: string) => !verbonden || verbonden.concepten.has(id);
  const isVerbondenLes = (slug: string) => !verbonden || verbonden.slugs.has(slug);

  const actieveEdges = edges.filter((edge) =>
    actief
      ? actief.kind === 'concept'
        ? edge.conceptId === actief.id
        : edge.slug === actief.id
      : false,
  );

  const kiesLeerlijn = (keuze: Leerlijn) => {
    setLeerlijn(keuze);
    setHoofdstuk('alles');
    setActief(null);
    setGepind(false);
  };

  const kiesHoofdstuk = (keuze: number | 'alles') => {
    setHoofdstuk(keuze);
    // Een gepinde selectie kan buiten het nieuwe hoofdstuk vallen.
    setActief(null);
    setGepind(false);
  };

  const actiefConcept =
    actief?.kind === 'concept' ? godotConcepten.find((c) => c.id === actief.id) : undefined;
  const actieveLes = actief?.kind === 'les' ? lessen.find((l) => l.slug === actief.id) : undefined;

  const uitlegLes = actiefConcept
    ? lessen.find((l) => l.slug === uitlegSlug(actiefConcept))
    : undefined;
  const herhaalLessen = actiefConcept
    ? lessen.filter(
        (l) =>
          l.slug !== uitlegSlug(actiefConcept) &&
          (conceptenPerLes[l.slug] ?? []).includes(actiefConcept.id),
      )
    : [];

  const lesLeert = actieveLes
    ? godotConcepten.filter(
        (c) =>
          uitlegSlug(c) === actieveLes.slug &&
          (conceptenPerLes[actieveLes.slug] ?? []).includes(c.id),
      )
    : [];
  const lesGebruikt = actieveLes
    ? godotConcepten.filter(
        (c) =>
          uitlegSlug(c) !== actieveLes.slug &&
          (conceptenPerLes[actieveLes.slug] ?? []).includes(c.id),
      )
    : [];

  return (
    <div ref={containerRef}>
      <div className={styles.leerlijnTabs} role="tablist" aria-label="Leerlijn">
        {LEERLIJNEN.map((l) => (
          <button
            key={l.id}
            type="button"
            role="tab"
            aria-selected={leerlijn === l.id}
            className={clsx(
              styles.leerlijnTab,
              leerlijnKlasse[l.id],
              leerlijn === l.id && styles.leerlijnTabActief,
            )}
            onClick={() => kiesLeerlijn(l.id)}
          >
            <span className={styles.stip} aria-hidden="true" />
            {l.label}
          </button>
        ))}
      </div>

      <div className={styles.hoofdstukken}>
        <span className={styles.filterLabel} id="hoofdstuk-label">
          Hoofdstuk
        </span>
        <div className={styles.hoofdstukKnoppen} aria-labelledby="hoofdstuk-label">
          <button
            type="button"
            className={clsx(styles.tab, hoofdstuk === 'alles' && styles.tabActief)}
            aria-pressed={hoofdstuk === 'alles'}
            onClick={() => kiesHoofdstuk('alles')}
          >
            Alle
          </button>
          {beschikbareHoofdstukken.map((h) => (
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
        </div>
      </div>

      <p className={styles.uitlegLegenda}>
        Een{' '}
        <span className={clsx(styles.legendaLijn, leerlijnKlasse[leerlijn])} aria-hidden="true" />{' '}
        dikke lijn wijst naar de les waar je het concept <strong>leert</strong>. De dunne lijnen
        zijn lessen waar je het daarna nog gebruikt.
      </p>

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
            {edges
              .filter((edge) => !edge.isUitleg)
              .map((edge) => (
                <path
                  key={edge.key}
                  className={clsx(styles.lijn, actief && styles.lijnGedimd)}
                  d={pad(edge.y1, edge.y2)}
                  vectorEffect="non-scaling-stroke"
                />
              ))}
            {edges
              .filter((edge) => edge.isUitleg)
              .map((edge) => (
                <path
                  key={edge.key}
                  className={clsx(
                    styles.lijn,
                    styles.lijnUitleg,
                    lijnKlasse[leerlijn],
                    actief && styles.lijnGedimd,
                  )}
                  d={pad(edge.y1, edge.y2)}
                  vectorEffect="non-scaling-stroke"
                />
              ))}
            {actieveEdges.map((edge) => (
              <path
                key={`actief-${edge.key}`}
                className={clsx(
                  styles.lijn,
                  styles.lijnActief,
                  edge.isUitleg && styles.lijnUitleg,
                  lijnKlasse[leerlijn],
                )}
                d={pad(edge.y1, edge.y2)}
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
              <strong>{actiefConcept.label}</strong> leer je in{' '}
              {uitlegLes ? (
                <Link to={actiefConcept.to}>
                  hoofdstuk {uitlegLes.hoofdstuk}, {uitlegLes.titel}
                </Link>
              ) : (
                <Link to={actiefConcept.to}>de uitleg</Link>
              )}
              .
            </p>
            {herhaalLessen.length > 0 && (
              <>
                <p className={styles.paneelSub}>Daarna gebruik je het nog in:</p>
                <ul className={styles.paneelLinks}>
                  {herhaalLessen.map((l) => (
                    <li key={l.slug}>
                      <span className={styles.paneelHoofdstuk}>{l.hoofdstuk}</span>
                      <Link to={`/docs/${l.slug}`}>{l.titel}</Link>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </>
        )}
        {actieveLes && (
          <>
            <p className={styles.paneelKop}>
              <strong>{actieveLes.titel}</strong>{' '}
              <Link to={`/docs/${actieveLes.slug}`}>Naar de les</Link>
            </p>
            {lesLeert.length > 0 && (
              <>
                <p className={styles.paneelSub}>Hier leer je:</p>
                <ul className={styles.paneelLinks}>
                  {lesLeert.map((c) => (
                    <li key={c.id}>
                      <Link to={c.to}>{c.label}</Link>
                    </li>
                  ))}
                </ul>
              </>
            )}
            {lesGebruikt.length > 0 && (
              <>
                <p className={styles.paneelSub}>Hier gebruik je, uit eerdere lessen:</p>
                <ul className={styles.paneelLinks}>
                  {lesGebruikt.map((c) => (
                    <li key={c.id}>
                      <Link to={c.to}>{c.label}</Link>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </>
        )}
        {!actief && (
          <p className={styles.paneelKop}>
            Beweeg over een concept of een les, of klik erop om de verbindingen vast te zetten. De
            links verschijnen hier.
          </p>
        )}
      </div>
    </div>
  );
}

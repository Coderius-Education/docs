import clsx from 'clsx';
import { levelVoor } from '../conceptLevel';
import type { CheckReport, CheckerConfig, Concept, ConceptMatch, Level, Plek } from '../types';
import { BuitenLesstof } from './BuitenLesstof';
import { FileStats } from './FileStats';
import styles from './ReportView.module.css';
import { Samenhang } from './Samenhang';

interface ReportViewProps {
  report: CheckReport;
  config: CheckerConfig;
  activeLevel?: Level | null;
  /** Actieve leerroute; null als de site er geen heeft. */
  track?: string | null;
  /** Aan/uit zetten van een handmatig concept. Weglaten = alleen-lezen. */
  onToggleHandmatig?: (id: string) => void;
  /** Toont waar een concept of vondst in de code staat. Weglaten = niet klikbaar. */
  onToonPlekken?: (titel: string, plekken: Plek[]) => void;
}

function LevelBadge({ level }: { level: Level }) {
  return (
    <span
      className={clsx(
        styles.levelBadge,
        level === 'basis' ? styles.levelBadgeBasis : styles.levelBadgeGevorderd,
      )}
    >
      {level}
    </span>
  );
}

interface Group {
  group: string;
  items: { concept: Concept; match: ConceptMatch }[];
}

function groupConcepts(
  concepts: Concept[],
  matches: Map<string, ConceptMatch>,
  subjectId: string,
  activeLevel: Level | null,
  track: string | null,
): Group[] {
  const groups = new Map<string, Group>();
  for (const concept of concepts) {
    if (concept.subject !== subjectId) continue;
    if (activeLevel && levelVoor(concept, track) !== activeLevel) continue;
    const match = matches.get(concept.id);
    if (!match) continue;
    if (!groups.has(concept.group)) groups.set(concept.group, { group: concept.group, items: [] });
    groups.get(concept.group)?.items.push({ concept, match });
  }
  return Array.from(groups.values());
}

function SubjectSection({
  title,
  groups,
  track,
  onToggleHandmatig,
  onToonPlekken,
}: {
  title: string;
  groups: Group[];
  track: string | null;
  onToggleHandmatig?: (id: string) => void;
  onToonPlekken?: (titel: string, plekken: Plek[]) => void;
}) {
  if (groups.length === 0) return null;
  const total = groups.reduce((sum, g) => sum + g.items.length, 0);
  const usedTotal = groups.reduce((sum, g) => sum + g.items.filter((i) => i.match.used).length, 0);

  return (
    <section className={styles.section}>
      <h2>
        {title}{' '}
        <span className={styles.progress}>
          {usedTotal} / {total} toegepast
        </span>
      </h2>
      <div className={styles.groupGrid}>
        {groups.map((g) => {
          const usedInGroup = g.items.filter((i) => i.match.used).length;
          return (
            <div className={styles.groupCard} key={g.group}>
              <div className={styles.groupHeader}>
                <span className={styles.groupTitle}>{g.group}</span>
                <span className={styles.groupCount}>
                  {usedInGroup}/{g.items.length}
                </span>
              </div>
              <ul className={styles.chipList}>
                {g.items.map(({ concept, match }) => {
                  const klasse = `${styles.chip} ${match.used ? styles.chipUsed : styles.chipUnused}`;
                  const badge = <LevelBadge level={levelVoor(concept, track)} />;

                  // Handmatige concepten stelt de docent zelf vast, met de
                  // foto's ernaast. Bewust een knop met een ✓ of – als tekst
                  // en geen checkbox: html2canvas-pro rastert tekst betrouwbaar
                  // en een native checkbox niet, dus zo staat de beoordeling
                  // ook echt leesbaar in de PDF.
                  if (concept.detect.type === 'handmatig') {
                    return (
                      <li key={concept.id} className={klasse}>
                        <button
                          type="button"
                          className={styles.handmatig}
                          aria-pressed={match.used}
                          disabled={!onToggleHandmatig}
                          onClick={() => onToggleHandmatig?.(concept.id)}
                        >
                          <span className={styles.vink} aria-hidden="true">
                            {match.used ? '✓' : '–'}
                          </span>
                          {concept.label}
                        </button>
                        {badge}
                      </li>
                    );
                  }

                  // Waar staat het? Een klik opent de code op die regels.
                  const plekken = match.plekken ?? [];
                  const label = (
                    <>
                      {match.used ? '✓ ' : ''}
                      {concept.label}
                      {match.used && match.count > 1 && (
                        <span className={styles.chipCount}> ({match.count}×)</span>
                      )}
                      {match.used && (match.delen?.length ?? 0) > 0 && (
                        <span className={styles.chipDelen}>: {match.delen?.join(', ')}</span>
                      )}
                    </>
                  );
                  return (
                    <li key={concept.id} className={klasse}>
                      {onToonPlekken && plekken.length > 0 ? (
                        <button
                          type="button"
                          className={styles.chipKnop}
                          onClick={() => onToonPlekken(concept.label, plekken)}
                          title="Toon waar dit in de code staat"
                        >
                          {label}
                        </button>
                      ) : (
                        label
                      )}
                      {badge}
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/**
 * Wat de leerling gebruikt dat wel in de lessen staat maar niet in de tabel
 * van de docent: herkend en getoond, maar zonder niveau, en het telt niet
 * mee in de samenvatting.
 */
function OokGebruikt({
  report,
  config,
  onToonPlekken,
}: {
  report: CheckReport;
  config: CheckerConfig;
  onToonPlekken?: (titel: string, plekken: Plek[]) => void;
}) {
  const gebruikt = new Set((report.extra ?? []).filter((m) => m.used).map((m) => m.id));
  const matches = new Map((report.extra ?? []).map((m) => [m.id, m]));
  const perOnderwerp = config.subjects
    .map((s) => ({
      onderwerp: s,
      concepten: (config.extra ?? []).filter((c) => c.subject === s.id && gebruikt.has(c.id)),
    }))
    .filter((g) => g.concepten.length > 0);
  if (perOnderwerp.length === 0) return null;
  return (
    <section className={styles.section}>
      <h2>
        Ook gebruikt <span className={styles.progress}>telt niet mee voor het niveau</span>
      </h2>
      <div className={styles.groupGrid}>
        {perOnderwerp.map(({ onderwerp, concepten }) => (
          <div className={styles.groupCard} key={onderwerp.id}>
            <div className={styles.groupHeader}>
              <span className={styles.groupTitle}>{onderwerp.label}</span>
            </div>
            <ul className={styles.chipList}>
              {concepten.map((c) => {
                const m = matches.get(c.id);
                const plekken = m?.plekken ?? [];
                const label = (
                  <>
                    {c.label}
                    {m && m.count > 1 && <span className={styles.chipCount}> ({m.count}×)</span>}
                  </>
                );
                return (
                  <li key={c.id} className={styles.chip}>
                    {onToonPlekken && plekken.length > 0 ? (
                      <button
                        type="button"
                        className={styles.chipKnop}
                        onClick={() => onToonPlekken(c.label, plekken)}
                        title="Toon waar dit in de code staat"
                      >
                        {label}
                      </button>
                    ) : (
                      label
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

export function ReportView({
  report,
  config,
  activeLevel = null,
  track = null,
  onToggleHandmatig,
  onToonPlekken,
}: ReportViewProps) {
  const matches = new Map(report.concepts.map((m) => [m.id, m]));

  return (
    <div className={styles.report}>
      {report.warnings.length > 0 && (
        <output className={styles.warnings} aria-live="polite">
          {report.warnings.map((w) => (
            <p key={w}>{w}</p>
          ))}
        </output>
      )}

      <FileStats report={report} config={config} />

      {config.subjects.map((subject) => (
        <SubjectSection
          key={subject.id}
          title={subject.label}
          groups={groupConcepts(config.concepts, matches, subject.id, activeLevel, track)}
          track={track}
          onToggleHandmatig={onToggleHandmatig}
          onToonPlekken={onToonPlekken}
        />
      ))}

      <OokGebruikt report={report} config={config} onToonPlekken={onToonPlekken} />

      <Samenhang fouten={report.samenhang ?? []} onToonPlekken={onToonPlekken} />

      <BuitenLesstof vondsten={report.buitenLesstof} onToonPlekken={onToonPlekken} />
    </div>
  );
}

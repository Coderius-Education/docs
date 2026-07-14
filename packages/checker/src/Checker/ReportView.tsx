import clsx from 'clsx';
import type { CheckReport, CheckerConfig, Concept, ConceptMatch, Level } from '../types';
import { FileStats } from './FileStats';
import styles from './ReportView.module.css';

interface ReportViewProps {
  report: CheckReport;
  config: CheckerConfig;
  activeLevel?: Level | null;
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
): Group[] {
  const groups = new Map<string, Group>();
  for (const concept of concepts) {
    if (concept.subject !== subjectId) continue;
    if (activeLevel && concept.level !== activeLevel) continue;
    const match = matches.get(concept.id);
    if (!match) continue;
    if (!groups.has(concept.group)) groups.set(concept.group, { group: concept.group, items: [] });
    groups.get(concept.group)?.items.push({ concept, match });
  }
  return Array.from(groups.values());
}

function SubjectSection({ title, groups }: { title: string; groups: Group[] }) {
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
                {g.items.map(({ concept, match }) => (
                  <li
                    key={concept.id}
                    className={`${styles.chip} ${match.used ? styles.chipUsed : styles.chipUnused}`}
                  >
                    {match.used ? '✓ ' : ''}
                    {concept.label}
                    {match.used && match.count > 1 && (
                      <span className={styles.chipCount}> ({match.count}×)</span>
                    )}
                    <LevelBadge level={concept.level} />
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function ReportView({ report, config, activeLevel = null }: ReportViewProps) {
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
          groups={groupConcepts(config.concepts, matches, subject.id, activeLevel)}
        />
      ))}
    </div>
  );
}

import clsx from 'clsx';
import { FileStats } from './FileStats';
import styles from './ReportView.module.css';
import { CSS_TECHNIQUES, HTML_ELEMENTS, JS_TECHNIQUES } from './curriculum';
import type { AnalysisReport, Level, Technique, TechniqueMatch } from './types';

interface ReportViewProps {
  report: AnalysisReport;
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

interface TechniqueGroup {
  group: string;
  items: { technique: Technique; match: TechniqueMatch }[];
}

function groupTechniques(
  techniques: Technique[],
  matches: TechniqueMatch[],
  activeLevel: Level | null,
): TechniqueGroup[] {
  const matchById = new Map(matches.map((m) => [m.id, m]));
  const groups = new Map<string, TechniqueGroup>();
  for (const technique of techniques) {
    if (activeLevel && technique.level !== activeLevel) continue;
    const match = matchById.get(technique.id);
    if (!match) continue;
    if (!groups.has(technique.group))
      groups.set(technique.group, { group: technique.group, items: [] });
    groups.get(technique.group)?.items.push({ technique, match });
  }
  return Array.from(groups.values());
}

function TechniqueSection({ title, groups }: { title: string; groups: TechniqueGroup[] }) {
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
                {g.items.map(({ technique, match }) => (
                  <li
                    key={technique.id}
                    className={`${styles.chip} ${match.used ? styles.chipUsed : styles.chipUnused}`}
                  >
                    {match.used ? '✓ ' : ''}
                    {technique.label}
                    {match.used && match.count > 1 && (
                      <span className={styles.chipCount}> ({match.count}×)</span>
                    )}
                    <LevelBadge level={technique.level} />
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

export function ReportView({ report, activeLevel = null }: ReportViewProps) {
  const allTags = HTML_ELEMENTS.flatMap((e) => e.tags);
  const curriculumTags = new Set(allTags);
  const otherTags = Object.keys(report.html.elementCounts)
    .filter((tag) => !curriculumTags.has(tag))
    .sort();

  const htmlElements = HTML_ELEMENTS.filter((e) => !activeLevel || e.level === activeLevel);
  const cssGroups = groupTechniques(CSS_TECHNIQUES, report.css, activeLevel);
  const jsGroups = groupTechniques(JS_TECHNIQUES, report.js, activeLevel);

  return (
    <div className={styles.report}>
      {report.warnings.length > 0 && (
        <output className={styles.warnings} aria-live="polite">
          {report.warnings.map((w) => (
            <p key={w}>{w}</p>
          ))}
        </output>
      )}

      <FileStats report={report} />

      {htmlElements.length > 0 && (
        <section className={styles.section}>
          <h2>HTML-elementen</h2>
          <ul className={styles.chipList}>
            {htmlElements.map(({ tags, label, level }) => {
              const count = tags.reduce((sum, t) => sum + (report.html.elementCounts[t] || 0), 0);
              const used = count > 0;
              return (
                <li
                  key={tags.join('-')}
                  className={`${styles.chip} ${used ? styles.chipUsed : styles.chipUnused}`}
                >
                  {used ? '✓ ' : ''}
                  {label}
                  {used && count > 1 && <span className={styles.chipCount}> ({count}×)</span>}
                  <LevelBadge level={level} />
                </li>
              );
            })}
          </ul>
          {activeLevel === null && otherTags.length > 0 && (
            <details className={styles.details}>
              <summary>Overige tags gevonden ({otherTags.length})</summary>
              <p className={styles.otherTags}>
                {otherTags.map((tag) => `<${tag}> (${report.html.elementCounts[tag]}×)`).join(', ')}
              </p>
            </details>
          )}
        </section>
      )}

      <TechniqueSection title="CSS-technieken" groups={cssGroups} />
      <TechniqueSection title="JavaScript-technieken" groups={jsGroups} />
    </div>
  );
}

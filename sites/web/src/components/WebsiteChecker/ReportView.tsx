import { FileStats } from './FileStats';
import styles from './ReportView.module.css';
import { CSS_TECHNIQUES, HTML_ELEMENTS, JS_TECHNIQUES } from './curriculum';
import type { AnalysisReport, Technique, TechniqueMatch } from './types';

interface ReportViewProps {
  report: AnalysisReport;
}

interface TechniqueGroup {
  group: string;
  items: { technique: Technique; match: TechniqueMatch }[];
}

function groupTechniques(techniques: Technique[], matches: TechniqueMatch[]): TechniqueGroup[] {
  const matchById = new Map(matches.map((m) => [m.id, m]));
  const groups = new Map<string, TechniqueGroup>();
  for (const technique of techniques) {
    const match = matchById.get(technique.id);
    if (!match) continue;
    if (!groups.has(technique.group))
      groups.set(technique.group, { group: technique.group, items: [] });
    groups.get(technique.group)?.items.push({ technique, match });
  }
  return Array.from(groups.values());
}

function TechniqueSection({ title, groups }: { title: string; groups: TechniqueGroup[] }) {
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

export function ReportView({ report }: ReportViewProps) {
  const curriculumTags = new Set(HTML_ELEMENTS.map((e) => e.tag));
  const otherTags = Object.keys(report.html.elementCounts)
    .filter((tag) => !curriculumTags.has(tag))
    .sort();

  const cssGroups = groupTechniques(CSS_TECHNIQUES, report.css);
  const jsGroups = groupTechniques(JS_TECHNIQUES, report.js);

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

      <section className={styles.section}>
        <h2>HTML-elementen</h2>
        <ul className={styles.chipList}>
          {HTML_ELEMENTS.map(({ tag, label }) => {
            const count = report.html.elementCounts[tag] || 0;
            const used = count > 0;
            return (
              <li
                key={tag}
                className={`${styles.chip} ${used ? styles.chipUsed : styles.chipUnused}`}
              >
                {used ? '✓ ' : ''}
                {label}
                {used && count > 1 && <span className={styles.chipCount}> ({count}×)</span>}
              </li>
            );
          })}
        </ul>
        {otherTags.length > 0 && (
          <details className={styles.details}>
            <summary>Overige tags gevonden ({otherTags.length})</summary>
            <p className={styles.otherTags}>
              {otherTags.map((tag) => `<${tag}> (${report.html.elementCounts[tag]}×)`).join(', ')}
            </p>
          </details>
        )}
      </section>

      <TechniqueSection title="CSS-technieken" groups={cssGroups} />
      <TechniqueSection title="JavaScript-technieken" groups={jsGroups} />
    </div>
  );
}

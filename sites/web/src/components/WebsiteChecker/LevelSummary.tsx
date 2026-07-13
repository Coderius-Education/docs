import clsx from 'clsx';
import styles from './LevelSummary.module.css';
import { type ConceptStats, computeLevelSummary } from './levelSummary';
import type { AnalysisReport, Level } from './types';

interface LevelSummaryProps {
  report: AnalysisReport;
  activeLevel: Level | null;
  onToggleLevel: (level: Level) => void;
}

export function LevelSummary({ report, activeLevel, onToggleLevel }: LevelSummaryProps) {
  const { basis, gevorderd, bySubject } = computeLevelSummary(report);

  const tile = (level: Level, label: string, total: ConceptStats) => (
    <button
      type="button"
      className={clsx(styles.tile, activeLevel === level && styles.tileActive)}
      onClick={() => onToggleLevel(level)}
      aria-pressed={activeLevel === level}
      title={`Klik om de checklist te filteren op ${label.toLowerCase()}`}
    >
      <span className={styles.number}>
        {total.used}/{total.total}
      </span>
      <span className={styles.label}>{label} toegepast</span>
      <span className={styles.breakdown}>
        {bySubject.map((s) => {
          const stat = level === 'basis' ? s.basis : s.gevorderd;
          const done = stat.total > 0 && stat.used === stat.total;
          return (
            <span
              key={s.subject}
              className={clsx(styles.subject, done ? styles.subjectDone : styles.subjectTodo)}
            >
              {s.subject} {stat.used}/{stat.total}
            </span>
          );
        })}
      </span>
    </button>
  );

  return (
    <div className={styles.summary}>
      {tile('basis', 'Basisconcepten', basis)}
      {tile('gevorderd', 'Gevorderde concepten', gevorderd)}
    </div>
  );
}

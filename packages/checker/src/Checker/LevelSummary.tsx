import clsx from 'clsx';
import { type ConceptStats, computeLevelSummary } from '../levelSummary';
import type { CheckReport, CheckerConfig, Level } from '../types';
import styles from './LevelSummary.module.css';

interface LevelSummaryProps {
  report: CheckReport;
  config: CheckerConfig;
  activeLevel: Level | null;
  onToggleLevel: (level: Level) => void;
  /** Actieve leerroute; null als de site er geen heeft. */
  track?: string | null;
}

export function LevelSummary({
  report,
  config,
  activeLevel,
  onToggleLevel,
  track = null,
}: LevelSummaryProps) {
  const { basis, gevorderd, bySubject } = computeLevelSummary(report, config, track);

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
          // Niet elk onderwerp komt op elk niveau voor: fullstack heeft geen
          // basis-concepten voor JavaScript en database, godot niet voor
          // beweging. Een chip "Database 0/0" leest als iets wat nog moet
          // gebeuren terwijl er niets te doen is.
          if (stat.total === 0) return null;
          const done = stat.used === stat.total;
          return (
            <span
              key={s.subject}
              className={clsx(styles.subject, done ? styles.subjectDone : styles.subjectTodo)}
            >
              {s.label} {stat.used}/{stat.total}
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

import styles from './LevelSummary.module.css';
import { computeLevelSummary } from './levelSummary';
import type { AnalysisReport } from './types';

interface LevelSummaryProps {
  report: AnalysisReport;
}

const LABELS = {
  basis: 'Basisconcepten',
  gevorderd: 'Gevorderde concepten',
} as const;

export function LevelSummary({ report }: LevelSummaryProps) {
  const stats = computeLevelSummary(report);

  return (
    <div className={styles.summary}>
      {(['basis', 'gevorderd'] as const).map((level) => (
        <div className={styles.tile} key={level}>
          <span className={styles.number}>
            {stats[level].used}/{stats[level].total}
          </span>
          <span className={styles.label}>{LABELS[level]} toegepast</span>
        </div>
      ))}
    </div>
  );
}

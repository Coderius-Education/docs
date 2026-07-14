import type { CheckReport, CheckerConfig } from '../types';
import styles from './FileStats.module.css';

interface FileStatsProps {
  report: CheckReport;
  config: CheckerConfig;
}

export function FileStats({ report, config }: FileStatsProps) {
  return (
    <section className={styles.section}>
      <h2>Bestandsoverzicht</h2>
      <div className={styles.counterRow}>
        <div className={styles.counter}>
          <span className={styles.counterNumber}>{report.fileStats.total}</span>
          <span className={styles.counterLabel}>Totaal</span>
        </div>
        {config.fileKinds.map((kind) => (
          <div className={styles.counter} key={kind.id}>
            <span className={styles.counterNumber}>{report.fileStats.byKind[kind.id] ?? 0}</span>
            <span className={styles.counterLabel}>{kind.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

import styles from './FileStats.module.css';
import type { AnalysisReport, FileKind } from './types';

interface FileStatsProps {
  report: AnalysisReport;
}

const KIND_LABELS: Record<FileKind, string> = {
  html: 'HTML',
  css: 'CSS',
  js: 'JavaScript',
  image: 'Afbeeldingen',
  other: 'Overig',
};

export function FileStats({ report }: FileStatsProps) {
  return (
    <section className={styles.section}>
      <h2>Bestandsoverzicht</h2>
      <div className={styles.counterRow}>
        <div className={styles.counter}>
          <span className={styles.counterNumber}>{report.fileStats.total}</span>
          <span className={styles.counterLabel}>Totaal</span>
        </div>
        {(['html', 'css', 'js', 'image', 'other'] as const).map((kind) => (
          <div className={styles.counter} key={kind}>
            <span className={styles.counterNumber}>{report.fileStats.byKind[kind]}</span>
            <span className={styles.counterLabel}>{KIND_LABELS[kind]}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

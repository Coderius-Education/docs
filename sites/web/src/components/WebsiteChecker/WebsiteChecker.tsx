import BrowserOnly from '@docusaurus/BrowserOnly';
import { useCallback, useState } from 'react';
import { ReportView } from './ReportView';
import { UploadZone } from './UploadZone';
import styles from './WebsiteChecker.module.css';
import { analyze } from './analyze';
import type { AnalysisReport, ProjectFiles } from './types';

function WebsiteCheckerInner() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<AnalysisReport | null>(null);

  const handleLoaded = useCallback((files: ProjectFiles, warnings: string[]) => {
    setError(null);
    setReport(analyze(files, warnings));
  }, []);

  const handleError = useCallback((message: string) => {
    setError(message);
    setReport(null);
  }, []);

  return (
    <div className={styles.container}>
      <UploadZone onLoaded={handleLoaded} onError={handleError} busy={busy} setBusy={setBusy} />
      {busy && <p className={styles.status}>Bezig met analyseren...</p>}
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
      {report && <ReportView report={report} />}
    </div>
  );
}

export function WebsiteChecker() {
  return (
    <BrowserOnly fallback={<div className={styles.loading}>Website-checker laden...</div>}>
      {() => <WebsiteCheckerInner />}
    </BrowserOnly>
  );
}

export default WebsiteChecker;

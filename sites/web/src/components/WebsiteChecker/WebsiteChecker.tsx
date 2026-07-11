import BrowserOnly from '@docusaurus/BrowserOnly';
import { useCallback, useState } from 'react';
import { LevelSummary } from './LevelSummary';
import { ReportView } from './ReportView';
import { UploadZone } from './UploadZone';
import styles from './WebsiteChecker.module.css';
import { analyze } from './analyze';
import { type OpenInIdeResult, openInIde, pickEntry } from './openInIde';
import type { AnalysisReport, ProjectFiles } from './types';

const IDE_ERROR_MESSAGES: Record<Exclude<OpenInIdeResult, 'opened'>, string> = {
  blocked: 'De pop-up werd geblokkeerd. Sta pop-ups toe voor deze pagina en probeer opnieuw.',
  timeout: 'Kon geen verbinding maken met de editor. Probeer het opnieuw.',
};

function WebsiteCheckerInner() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<AnalysisReport | null>(null);
  const [files, setFiles] = useState<ProjectFiles | null>(null);
  const [ideError, setIdeError] = useState<string | null>(null);

  const handleLoaded = useCallback((loadedFiles: ProjectFiles, warnings: string[]) => {
    setError(null);
    setFiles(loadedFiles);
    setIdeError(null);
    setReport(analyze(loadedFiles, warnings));
  }, []);

  const handleError = useCallback((message: string) => {
    setError(message);
    setReport(null);
    setFiles(null);
  }, []);

  const handleOpenInIde = useCallback(() => {
    if (!files) return;
    setIdeError(null);
    openInIde(files, 'Vanuit Website-checker', (result) => {
      if (result !== 'opened') setIdeError(IDE_ERROR_MESSAGES[result]);
    });
  }, [files]);

  const entry = files ? pickEntry(files) : null;

  return (
    <div className={styles.container}>
      <UploadZone onLoaded={handleLoaded} onError={handleError} busy={busy} setBusy={setBusy} />
      {busy && <p className={styles.status}>Bezig met analyseren...</p>}
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
      {report && (
        <>
          <div className={styles.reportHeader}>
            <LevelSummary report={report} />
            <button
              type="button"
              className={styles.ideButton}
              onClick={handleOpenInIde}
              disabled={!entry}
              title={
                entry
                  ? 'Open dit project in de Online Editor (ide.coderius.nl)'
                  : 'Geen HTML-bestand gevonden'
              }
            >
              Bekijk in Online Editor
            </button>
          </div>
          {ideError && (
            <p className={styles.error} role="alert">
              {ideError}
            </p>
          )}
          <ReportView report={report} />
        </>
      )}
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

import { useCallback, useRef, useState } from 'react';
import { analyze } from '../matchConcepts';
import type { CheckReport, CheckerConfig, Level, ProjectFiles } from '../types';
import { FileStats } from './FileStats';
import { LevelSummary } from './LevelSummary';
import { ReportView } from './ReportView';
import { TeacherGate } from './TeacherGate';
import { UploadZone } from './UploadZone';
import { exportReportToPdf } from './exportPdf';
import styles from './styles.module.css';

export type CheckerVariant = 'leerling' | 'docent';

interface CheckerInnerProps {
  config: CheckerConfig;
  variant: CheckerVariant;
}

export function CheckerInner({ config, variant }: CheckerInnerProps) {
  const isDocent = variant === 'docent';
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<CheckReport | null>(null);
  const [notes, setNotes] = useState('');
  const [exporting, setExporting] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [activeLevel, setActiveLevel] = useState<Level | null>(null);
  const reportRef = useRef<HTMLDivElement>(null);

  const toggleLevel = useCallback((level: Level) => {
    setActiveLevel((prev) => (prev === level ? null : level));
  }, []);

  const handleLoaded = useCallback(
    (files: ProjectFiles, warnings: string[]) => {
      setError(null);
      const result = analyze(files, config);
      result.warnings = [...warnings, ...result.warnings];
      setReport(result);
    },
    [config],
  );

  const handleError = useCallback((message: string) => {
    setError(message);
    setReport(null);
  }, []);

  const handleExportPdf = useCallback(async () => {
    const el = reportRef.current;
    if (!el) return;
    setPdfError(null);
    // De PDF bevat altijd het volledige rapport: zet een actief filter uit en
    // wacht één frame zodat de DOM alle punten toont vóór de capture.
    setActiveLevel(null);
    await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));
    setExporting(true);
    try {
      await exportReportToPdf(el, styles.exporting, config.pdfFilename(new Date()));
    } catch {
      setPdfError('Het opslaan als PDF is mislukt. Probeer het opnieuw.');
    } finally {
      setExporting(false);
    }
  }, [config]);

  const content = (
    <div className={styles.container}>
      <div className={styles.noPrint}>
        <UploadZone
          config={config}
          onLoaded={handleLoaded}
          onError={handleError}
          busy={busy}
          setBusy={setBusy}
        />
        {config.privacyNote && <p className={styles.privacy}>{config.privacyNote}</p>}
        {busy && <p className={styles.status}>Bezig met analyseren...</p>}
        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}
      </div>

      {report && !isDocent && <FileStats report={report} config={config} />}

      {report && isDocent && (
        <div ref={reportRef}>
          <LevelSummary
            report={report}
            config={config}
            activeLevel={activeLevel}
            onToggleLevel={toggleLevel}
          />
          <ReportView report={report} config={config} activeLevel={activeLevel} />

          <section className={styles.teacherPanel}>
            <label className={styles.notesLabel} htmlFor="docent-opmerkingen">
              Opmerkingen voor de leerling
            </label>
            <textarea
              id="docent-opmerkingen"
              className={`${styles.notesInput} ${styles.noPrint}`}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={5}
              placeholder="Typ hier je feedback. Deze verschijnt in de opgeslagen PDF."
            />
            {notes.trim() !== '' && <div className={styles.notesPrint}>{notes}</div>}
            <button
              type="button"
              className={`${styles.printButton} ${styles.noPrint}`}
              onClick={handleExportPdf}
              disabled={exporting}
            >
              {exporting ? 'PDF maken...' : 'Opslaan als PDF'}
            </button>
            {pdfError && (
              <p className={`${styles.error} ${styles.noPrint}`} role="alert">
                {pdfError}
              </p>
            )}
          </section>
        </div>
      )}
    </div>
  );

  if (isDocent) {
    return (
      <TeacherGate password={config.teacher.password} storageKey={config.teacher.storageKey}>
        {content}
      </TeacherGate>
    );
  }
  return content;
}

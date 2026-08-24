import { useCallback, useMemo, useRef, useState } from 'react';
import { analyze } from '../matchConcepts';
import type { CheckReport, CheckerConfig, Level, ProjectFiles } from '../types';
import { FileStats } from './FileStats';
import { LevelSummary } from './LevelSummary';
import { PhotoStrip } from './PhotoStrip';
import { ReportView } from './ReportView';
import { TeacherGate } from './TeacherGate';
import { UploadZone } from './UploadZone';
import { exportReportToPdf } from './exportPdf';
import { type OpenInIdeResult, openInIde, pickEntry } from './openInIde';
import styles from './styles.module.css';

export type CheckerVariant = 'leerling' | 'docent';

interface CheckerInnerProps {
  config: CheckerConfig;
  variant: CheckerVariant;
}

const IDE_ERROR_MESSAGES: Record<Exclude<OpenInIdeResult, 'opened'>, string> = {
  blocked: 'De pop-up werd geblokkeerd. Sta pop-ups toe voor deze pagina en probeer opnieuw.',
  timeout: 'Kon geen verbinding maken met de editor. Probeer het opnieuw.',
};

export function CheckerInner({ config, variant }: CheckerInnerProps) {
  const isDocent = variant === 'docent';
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<CheckReport | null>(null);
  const [files, setFiles] = useState<ProjectFiles | null>(null);
  const [ideError, setIdeError] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [exporting, setExporting] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [activeLevel, setActiveLevel] = useState<Level | null>(null);
  const [track, setTrack] = useState<string | null>(config.tracks?.[0]?.id ?? null);
  const [handmatigAan, setHandmatigAan] = useState<Set<string>>(() => new Set());
  const reportRef = useRef<HTMLDivElement>(null);

  const toggleLevel = useCallback((level: Level) => {
    setActiveLevel((prev) => (prev === level ? null : level));
  }, []);

  const toggleHandmatig = useCallback((id: string) => {
    setHandmatigAan((prev) => {
      const volgende = new Set(prev);
      if (volgende.has(id)) volgende.delete(id);
      else volgende.add(id);
      return volgende;
    });
  }, []);

  // Eén afgeleid rapport waarin de aangevinkte handmatige concepten als
  // "toegepast" gelden. Zo hoeven computeLevelSummary en ReportView niets van
  // vinkjes te weten: die zien gewoon een rapport.
  const effectiefRapport = useMemo<CheckReport | null>(() => {
    if (!report) return null;
    if (handmatigAan.size === 0) return report;
    return {
      ...report,
      concepts: report.concepts.map((m) =>
        handmatigAan.has(m.id) ? { ...m, count: 1, used: true } : m,
      ),
    };
  }, [report, handmatigAan]);

  // Alles wat de docent zelf heeft ingevuld hoort bij één ingeleverd project.
  // Een docent kijkt de hele klas achter elkaar na zonder de pagina te
  // herladen; zonder deze reset dragen de vinkjes en de opmerkingen van de
  // vorige leerling over naar de volgende — en de vinkjes tellen mee in de
  // niveausamenvatting, dus dat verandert stilletjes een score.
  const wisBeoordeling = useCallback(() => {
    setHandmatigAan(new Set());
    setNotes('');
  }, []);

  const handleLoaded = useCallback(
    (loadedFiles: ProjectFiles, warnings: string[]) => {
      setError(null);
      setFiles(loadedFiles);
      setIdeError(null);
      wisBeoordeling();
      const result = analyze(loadedFiles, config);
      result.warnings = [...warnings, ...result.warnings];
      setReport(result);
    },
    [config, wisBeoordeling],
  );

  const handleError = useCallback(
    (message: string) => {
      setError(message);
      setReport(null);
      setFiles(null);
      wisBeoordeling();
    },
    [wisBeoordeling],
  );

  const ideUrl = config.ide?.url;
  const entry = files && ideUrl ? pickEntry(files) : null;
  const handleOpenInIde = useCallback(() => {
    if (!files || !ideUrl) return;
    setIdeError(null);
    openInIde(files, 'Vanuit de nakijker', ideUrl, (result) => {
      if (result !== 'opened') setIdeError(IDE_ERROR_MESSAGES[result]);
    });
  }, [files, ideUrl]);

  const ideButton = ideUrl ? (
    <button
      type="button"
      className={`${styles.ideButton} ${styles.noPrint}`}
      onClick={handleOpenInIde}
      disabled={!entry}
      title={entry ? 'Open dit project in de Online Editor' : 'Geen HTML-bestand gevonden'}
    >
      Bekijk in Online Editor
    </button>
  ) : null;

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

      {report && !isDocent && (
        <>
          <div className={styles.reportHeader}>
            <FileStats report={report} config={config} />
            {ideButton}
          </div>
          {ideError && (
            <p className={`${styles.error} ${styles.noPrint}`} role="alert">
              {ideError}
            </p>
          )}
        </>
      )}

      {effectiefRapport && isDocent && (
        <div ref={reportRef}>
          {config.tracks && config.tracks.length > 1 && (
            <div className={styles.trackRow}>
              <span className={styles.trackLabel}>Leerroute:</span>
              {config.tracks.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className={`${styles.trackButton} ${track === t.id ? styles.trackButtonActief : ''}`}
                  aria-pressed={track === t.id}
                  onClick={() => setTrack(t.id)}
                >
                  {t.label}
                </button>
              ))}
            </div>
          )}
          <div className={styles.reportHeader}>
            <LevelSummary
              report={effectiefRapport}
              config={config}
              activeLevel={activeLevel}
              onToggleLevel={toggleLevel}
              track={track}
            />
            {ideButton}
          </div>
          {ideError && (
            <p className={`${styles.error} ${styles.noPrint}`} role="alert">
              {ideError}
            </p>
          )}
          {files && <PhotoStrip files={files} config={config} />}
          <ReportView
            report={effectiefRapport}
            config={config}
            activeLevel={activeLevel}
            track={track}
            onToggleHandmatig={toggleHandmatig}
          />

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

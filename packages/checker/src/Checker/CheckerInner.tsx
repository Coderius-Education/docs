import { bevestig } from '@coderius/shared/dialoog';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  type Beoordeling,
  type Opslag,
  type Wijziging,
  bewaarNieuw,
  databaseNaam,
  geheugenOpslag,
  lijst,
  open,
  pasAan,
  pdfNaamMetLeerling,
  verwijder,
} from '../beoordelingen';
import { analyze } from '../matchConcepts';
import type { CheckReport, CheckerConfig, Level, ProjectFiles } from '../types';
import { Beoordelingen } from './Beoordelingen';
import { FileStats } from './FileStats';
import { LevelSummary } from './LevelSummary';
import { PhotoStrip } from './PhotoStrip';
import { ReportView } from './ReportView';
import { TeacherGate } from './TeacherGate';
import { UploadZone } from './UploadZone';
import { exportReportToPdf } from './exportPdf';
import { idbOpslag } from './idbOpslag';
import { type OpenInIdeResult, openInIde, pickEntry } from './openInIde';
import styles from './styles.module.css';

export type CheckerVariant = 'leerling' | 'docent';

interface CheckerInnerProps {
  config: CheckerConfig;
  variant: CheckerVariant;
}

const OPSLAG_FOUT =
  'Deze browser bewaart je beoordelingen niet (een privévenster of geblokkeerde sitegegevens). Ze blijven staan tot je de pagina sluit; maak de PDF voor je weggaat.';

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

  // Bewaarde beoordelingen (alleen in de docentweergave). `actiefRef` loopt
  // synchroon mee met `actief`, zodat twee snelle wijzigingen op elkaar
  // voortbouwen in plaats van allebei op de versie van vóór de eerste.
  const [opslag, setOpslag] = useState<Opslag | null>(null);
  const [opslagFout, setOpslagFout] = useState<string | null>(null);
  const [beoordelingen, setBeoordelingen] = useState<Beoordeling[]>([]);
  const [actief, setActief] = useState<Beoordeling | null>(null);
  const actiefRef = useRef<Beoordeling | null>(null);
  const [nieuweNaam, setNieuweNaam] = useState('');
  // Het naamveld van de open beoordeling mag even leeg zijn terwijl de docent
  // een nieuwe naam typt; bewaard wordt alleen een naam die niet leeg is.
  const [naamVeld, setNaamVeld] = useState('');
  const [pdfKlaar, setPdfKlaar] = useState(false);

  useEffect(() => {
    if (!isDocent) return;
    let weg = false;
    idbOpslag(databaseNaam(config))
      .then(async (o) => {
        const alle = await lijst(o);
        if (weg) return;
        setOpslag(o);
        setBeoordelingen(alle);
      })
      .catch(() => {
        if (weg) return;
        setOpslag(geheugenOpslag());
        setOpslagFout(OPSLAG_FOUT);
      });
    return () => {
      weg = true;
    };
  }, [config, isDocent]);

  const zetActief = useCallback((b: Beoordeling | null) => {
    actiefRef.current = b;
    setActief(b);
    setNaamVeld(b?.naam ?? '');
    if (b) setBeoordelingen((prev) => [b, ...prev.filter((x) => x.id !== b.id)]);
  }, []);

  const bewaar = useCallback(
    (wijziging: Wijziging) => {
      const huidig = actiefRef.current;
      if (!opslag || !huidig) return;
      const nieuw = pasAan(huidig, wijziging, new Date());
      zetActief(nieuw);
      setPdfKlaar(false);
      opslag.beoordelingen.schrijf(nieuw.id, nieuw).catch(() => setOpslagFout(OPSLAG_FOUT));
    },
    [opslag, zetActief],
  );

  const toggleLevel = useCallback((level: Level) => {
    setActiveLevel((prev) => (prev === level ? null : level));
  }, []);

  const toggleHandmatig = useCallback(
    (id: string) => {
      const volgende = new Set(handmatigAan);
      if (volgende.has(id)) volgende.delete(id);
      else volgende.add(id);
      setHandmatigAan(volgende);
      bewaar({ handmatig: Array.from(volgende) });
    },
    [handmatigAan, bewaar],
  );

  const kiesTrack = useCallback(
    (id: string) => {
      setTrack(id);
      bewaar({ track: id });
    },
    [bewaar],
  );

  const wijzigNotes = useCallback(
    (tekst: string) => {
      setNotes(tekst);
      bewaar({ notes: tekst });
    },
    [bewaar],
  );

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
    setPdfKlaar(false);
    zetActief(null);
  }, [zetActief]);

  const toonProject = useCallback(
    (loadedFiles: ProjectFiles, warnings: string[]) => {
      setError(null);
      setFiles(loadedFiles);
      setIdeError(null);
      setActiveLevel(null);
      const result = analyze(loadedFiles, config);
      result.warnings = [...warnings, ...result.warnings];
      setReport(result);
    },
    [config],
  );

  const handleLoaded = useCallback(
    (loadedFiles: ProjectFiles, warnings: string[]) => {
      wisBeoordeling();
      toonProject(loadedFiles, warnings);
      if (!isDocent || !opslag) return;
      // Elke upload in de docentweergave wordt meteen een bewaarde
      // beoordeling; de volgende upload laat hem staan.
      const naam = nieuweNaam;
      setNieuweNaam('');
      bewaarNieuw(opslag, naam, { files: loadedFiles, warnings }, new Date(), track)
        .then(zetActief)
        .catch(() => setOpslagFout(OPSLAG_FOUT));
    },
    [isDocent, opslag, nieuweNaam, track, toonProject, wisBeoordeling, zetActief],
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

  const openBeoordeling = useCallback(
    async (id: string) => {
      if (!opslag || id === actiefRef.current?.id) return;
      const gevonden = await open(opslag, id);
      if (!gevonden) {
        setError('Deze beoordeling is niet meer compleet en kan niet open.');
        setBeoordelingen(await lijst(opslag));
        return;
      }
      const { beoordeling, project } = gevonden;
      toonProject(project.files, project.warnings);
      setHandmatigAan(new Set(beoordeling.handmatig));
      setNotes(beoordeling.notes);
      setTrack(beoordeling.track ?? config.tracks?.[0]?.id ?? null);
      setPdfKlaar(false);
      zetActief(beoordeling);
    },
    [opslag, config, toonProject, zetActief],
  );

  const verwijderBeoordeling = useCallback(
    async (b: Beoordeling) => {
      if (!opslag) return;
      const ja = await bevestig(
        `De beoordeling van ${b.naam} verwijderen? Dat kan niet ongedaan.`,
        {
          bevestigLabel: 'Verwijderen',
          gevaarlijk: true,
        },
      );
      if (!ja) return;
      await verwijder(opslag, b.id);
      setBeoordelingen((prev) => prev.filter((x) => x.id !== b.id));
      if (actiefRef.current?.id === b.id) {
        wisBeoordeling();
        setReport(null);
        setFiles(null);
      }
    },
    [opslag, wisBeoordeling],
  );

  const verwijderAlles = useCallback(async () => {
    if (!opslag) return;
    const ja = await bevestig(`Alle ${beoordelingen.length} beoordelingen verwijderen?`, {
      bevestigLabel: 'Alles verwijderen',
      gevaarlijk: true,
    });
    if (!ja) return;
    for (const b of beoordelingen) await verwijder(opslag, b.id);
    setBeoordelingen([]);
    wisBeoordeling();
    setReport(null);
    setFiles(null);
  }, [opslag, beoordelingen, wisBeoordeling]);

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
      const naam = actiefRef.current?.naam ?? '';
      const bestand = pdfNaamMetLeerling(config.pdfFilename(new Date()), naam);
      setPdfKlaar(await exportReportToPdf(el, styles.exporting, bestand));
    } catch {
      setPdfError('Het opslaan als PDF is mislukt. Probeer het opnieuw.');
    } finally {
      setExporting(false);
    }
  }, [config]);

  const content = (
    <div className={styles.container}>
      <div className={styles.noPrint}>
        {isDocent && (
          <>
            <Beoordelingen
              lijst={beoordelingen}
              actiefId={actief?.id ?? null}
              onOpen={openBeoordeling}
              onVerwijder={verwijderBeoordeling}
              onVerwijderAlles={verwijderAlles}
              opslagFout={opslagFout}
            />
            <h2 className={styles.nieuwKop}>Nieuwe beoordeling</h2>
            <label className={styles.naamLabel} htmlFor="nieuwe-leerling">
              Naam van de leerling
            </label>
            <input
              id="nieuwe-leerling"
              className={styles.naamInput}
              value={nieuweNaam}
              onChange={(e) => setNieuweNaam(e.target.value)}
              placeholder="Bijvoorbeeld Sam, 5V2"
              autoComplete="off"
            />
          </>
        )}
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
        <div ref={reportRef} className={styles.rapport}>
          {actief && (
            <div className={styles.leerlingRij}>
              <label className={`${styles.naamLabel} ${styles.noPrint}`} htmlFor="leerling-naam">
                Leerling
              </label>
              <input
                id="leerling-naam"
                className={`${styles.naamInput} ${styles.noPrint}`}
                value={naamVeld}
                onChange={(e) => {
                  const naam = e.target.value;
                  setNaamVeld(naam);
                  if (naam.trim() !== '') bewaar({ naam });
                }}
                autoComplete="off"
              />
              <h2 className={styles.naamPrint}>{actief.naam}</h2>
            </div>
          )}
          {config.tracks && config.tracks.length > 1 && (
            <div className={styles.trackRow}>
              <span className={styles.trackLabel}>Leerroute:</span>
              {config.tracks.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className={`${styles.trackButton} ${track === t.id ? styles.trackButtonActief : ''}`}
                  aria-pressed={track === t.id}
                  onClick={() => kiesTrack(t.id)}
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
              onChange={(e) => wijzigNotes(e.target.value)}
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
            {pdfKlaar && actief && (
              <p className={`${styles.pdfKlaar} ${styles.noPrint}`}>
                PDF opgeslagen. Klaar met {actief.naam}?{' '}
                <button
                  type="button"
                  className={styles.linkKnop}
                  onClick={() => verwijderBeoordeling(actief)}
                >
                  Verwijder deze beoordeling
                </button>
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

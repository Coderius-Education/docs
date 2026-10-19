import { bevestig } from '@coderius/shared/dialoog';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  type Beoordeling,
  Bewaarder,
  type Wijziging,
  databaseNaam,
  geheugenOpslag,
  nieuwId,
  pdfNaamMetLeerling,
} from '../beoordelingen';
import { analyze } from '../matchConcepts';
import type { CheckReport, CheckerConfig, Level, Plek, ProjectFiles } from '../types';
import { type Vraag, nieuweVraag } from '../vragen';
import { Beoordelingen } from './Beoordelingen';
import { type CodeOpen, CodeWeergave } from './CodeWeergave';
import { FileStats } from './FileStats';
import { LevelSummary } from './LevelSummary';
import { PhotoStrip } from './PhotoStrip';
import { ReportView } from './ReportView';
import { TeacherGate } from './TeacherGate';
import { UploadZone } from './UploadZone';
import { Vragen } from './Vragen';
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

  // Bewaarde beoordelingen (alleen in de docentweergave). De Bewaarder is de
  // enige die de opslag aanraakt; de pagina werkt met zijn lijst, en de open
  // beoordeling is alleen een id in die lijst.
  const bewaarderRef = useRef<Bewaarder | null>(null);
  const [opslagFout, setOpslagFout] = useState<string | null>(null);
  const [beoordelingen, setBeoordelingen] = useState<Beoordeling[]>([]);
  const [actiefId, setActiefId] = useState<string | null>(null);
  const actiefIdRef = useRef<string | null>(null);
  const actief = beoordelingen.find((b) => b.id === actiefId) ?? null;
  const [nieuweNaam, setNieuweNaam] = useState('');
  // Het naamveld van de open beoordeling mag even leeg zijn terwijl de docent
  // een nieuwe naam typt; bewaard wordt alleen een naam die niet leeg is. Het
  // veld volgt daarom alleen bij openen en uploaden de bewaarde naam, niet
  // bij elke wijziging.
  const [naamVeld, setNaamVeld] = useState('');
  const [pdfKlaar, setPdfKlaar] = useState(false);

  // UploadZone roept onLoaded aan nadat het inlezen klaar is, met de
  // callback van het moment waarop het bestand werd losgelaten. De naam en
  // de leerroute lezen we daarom uit een ref: wat de docent tijdens het
  // inlezen typt, telt mee.
  const nieuweNaamRef = useRef('');
  const trackRef = useRef(track);
  trackRef.current = track;
  // Elke upload en elke klik op een beoordeling krijgt een nummer; een
  // openactie die klaar is nadat er al iets nieuwers gebeurde, doet niets.
  const verzoekRef = useRef(0);

  useEffect(() => {
    if (!isDocent) return;
    const opslag = idbOpslag(databaseNaam(config)).catch(() => {
      setOpslagFout(OPSLAG_FOUT);
      return geheugenOpslag();
    });
    const bewaarder = new Bewaarder(opslag, {
      onLijst: setBeoordelingen,
      onFout: setOpslagFout,
    });
    bewaarderRef.current = bewaarder;
    return () => {
      bewaarderRef.current = null;
      bewaarder.sluit();
    };
  }, [config, isDocent]);

  const zetActief = useCallback((id: string | null) => {
    actiefIdRef.current = id;
    setActiefId(id);
  }, []);

  const bewaar = useCallback((wijziging: Wijziging) => {
    const id = actiefIdRef.current;
    if (!id) return;
    bewaarderRef.current?.wijzig(id, wijziging);
    setPdfKlaar(false);
  }, []);

  // De codeweergave: welke plekken open staan, of null als hij dicht is.
  const [codeOpen, setCodeOpen] = useState<CodeOpen | null>(null);

  const toonPlekken = useCallback((titel: string, plekken: Plek[]) => {
    setCodeOpen({ titel, plekken });
  }, []);

  const toonVraag = useCallback((v: Vraag) => {
    const plekken = [];
    for (let regel = v.van; regel <= v.tot; regel++) plekken.push({ bestand: v.bestand, regel });
    setCodeOpen({ titel: v.vraag.trim() || 'Vraag', plekken });
  }, []);

  // De vragen komen uit de Bewaarder, niet uit de render: zo bouwt een vraag
  // die je markeert vlak na een wijziging voort op die wijziging.
  const huidigeVragen = useCallback(() => {
    const id = actiefIdRef.current;
    return (id && bewaarderRef.current?.get(id)?.vragen) || [];
  }, []);

  const markeer = useCallback(
    (bestand: string, van: number, tot: number, vraag: string) => {
      bewaar({ vragen: [...huidigeVragen(), nieuweVraag(nieuwId(), bestand, van, tot, vraag)] });
    },
    [bewaar, huidigeVragen],
  );

  const wijzigVragen = useCallback((vragen: Vraag[]) => bewaar({ vragen }), [bewaar]);

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
    setCodeOpen(null);
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
      // Buiten de lesstof ziet alleen de docent; de leerling hoeft er niet
      // op te wachten.
      const result = analyze(loadedFiles, config, { buitenLesstof: isDocent });
      result.warnings = [...warnings, ...result.warnings];
      setReport(result);
    },
    [config, isDocent],
  );

  const handleLoaded = useCallback(
    (loadedFiles: ProjectFiles, warnings: string[]) => {
      verzoekRef.current++;
      wisBeoordeling();
      toonProject(loadedFiles, warnings);
      const bewaarder = bewaarderRef.current;
      if (!isDocent || !bewaarder) return;
      // Elke upload in de docentweergave wordt meteen een beoordeling; de
      // Bewaarder schrijft hem weg, de volgende upload laat hem staan.
      const b = bewaarder.nieuw(
        nieuweNaamRef.current,
        { files: loadedFiles, warnings },
        trackRef.current,
      );
      zetActief(b.id);
      setNaamVeld(b.naam);
      nieuweNaamRef.current = '';
      setNieuweNaam('');
    },
    [isDocent, toonProject, wisBeoordeling, zetActief],
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
      const bewaarder = bewaarderRef.current;
      if (!bewaarder || id === actiefIdRef.current) return;
      const verzoek = ++verzoekRef.current;
      const gevonden = await bewaarder.open(id);
      if (verzoek !== verzoekRef.current) return;
      if (!gevonden) {
        setError('Deze beoordeling is niet meer compleet en kan niet open.');
        return;
      }
      const { beoordeling, project } = gevonden;
      toonProject(project.files, project.warnings);
      setHandmatigAan(new Set(beoordeling.handmatig));
      setNotes(beoordeling.notes);
      setTrack(beoordeling.track ?? config.tracks?.[0]?.id ?? null);
      setPdfKlaar(false);
      zetActief(beoordeling.id);
      setNaamVeld(beoordeling.naam);
    },
    [config, toonProject, zetActief],
  );

  const sluitRapport = useCallback(() => {
    verzoekRef.current++;
    wisBeoordeling();
    setReport(null);
    setFiles(null);
  }, [wisBeoordeling]);

  const verwijderBeoordeling = useCallback(
    async (b: Beoordeling) => {
      const bewaarder = bewaarderRef.current;
      if (!bewaarder) return;
      const ja = await bevestig(
        `De beoordeling van ${b.naam} verwijderen? Dat kan niet ongedaan.`,
        { bevestigLabel: 'Verwijderen', gevaarlijk: true },
      );
      if (!ja) return;
      if (actiefIdRef.current === b.id) sluitRapport();
      // Mislukt het, dan meldt de Bewaarder dat en toont hij wat er nog staat.
      await bewaarder.verwijder(b.id);
    },
    [sluitRapport],
  );

  const verwijderAlles = useCallback(async () => {
    const bewaarder = bewaarderRef.current;
    if (!bewaarder) return;
    const aantal = bewaarder.lijst().length;
    const ja = await bevestig(`Alle ${aantal} beoordelingen verwijderen?`, {
      bevestigLabel: 'Alles verwijderen',
      gevaarlijk: true,
    });
    if (!ja) return;
    sluitRapport();
    await bewaarder.verwijderAlles();
  }, [sluitRapport]);

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
      const naam = actief?.naam ?? '';
      const bestand = pdfNaamMetLeerling(config.pdfFilename(new Date()), naam);
      setPdfKlaar(await exportReportToPdf(el, styles.exporting, bestand));
    } catch {
      setPdfError('Het opslaan als PDF is mislukt. Probeer het opnieuw.');
    } finally {
      setExporting(false);
    }
  }, [config, actief]);

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
              onChange={(e) => {
                nieuweNaamRef.current = e.target.value;
                setNieuweNaam(e.target.value);
              }}
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
            <div className={styles.kopKnoppen}>
              <button
                type="button"
                className={`${styles.ideButton} ${styles.noPrint}`}
                onClick={() => setCodeOpen({ titel: 'Code bekijken', plekken: [] })}
              >
                Code bekijken
              </button>
              {ideButton}
            </div>
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
            onToonPlekken={toonPlekken}
          />

          {actief && files && (
            <Vragen
              vragen={actief.vragen}
              files={files}
              onWijzig={wijzigVragen}
              onOpen={toonVraag}
            />
          )}

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

      {isDocent && files && (
        <CodeWeergave
          files={files}
          textKinds={config.textKinds}
          open={codeOpen}
          onSluit={() => setCodeOpen(null)}
          onMarkeer={actief ? markeer : undefined}
        />
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

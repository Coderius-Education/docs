import { bevestig, meld, vraag } from '@coderius/shared/dialoog';
import clsx from 'clsx';
import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { downloadBestand } from '../../lib/download';
import { languageForPath } from '../../lib/languages';
import { useVolledigScherm } from '../../lib/volledigScherm';
import MonacoPane from '../../monaco/MonacoPane';
import { RUNNER_META } from '../../runners/registry';
import type { RunnerId } from '../../runners/types';
import {
  DEFAULT_STORAGE_PREFIX,
  deleteProject,
  listProjects,
  loadProject,
  newProjectId,
  saveProject,
} from '../../vfs/store';
import { BUILTIN_TEMPLATES } from '../../vfs/templates';
import type { Project, ProjectSummary, ProjectTemplate } from '../../vfs/types';
import Console from '../shared/Console';
import RunControls from '../shared/RunControls';
import { useRunSession } from '../shared/useRunSession';
import FileTree from './FileTree';
import type { ProjectEditorProps } from './index';
import {
  deleteFromProject,
  isDeletedPath,
  isValidPath,
  pathExists,
  renameInProject,
  renamedPath,
} from './paths';
import styles from './styles.module.css';

const AUTOSAVE_DEBOUNCE_MS = 500;
const AUTO_RUN_DEBOUNCE_MS = 600;

const DEFAULT_RUNNERS: RunnerId[] = ['python', 'web', 'micropython'];

export default function ProjectEditorImpl({
  runners = DEFAULT_RUNNERS,
  storagePrefix = DEFAULT_STORAGE_PREFIX,
  templates,
  height = '100%',
}: ProjectEditorProps): ReactNode {
  const allTemplates = useMemo(
    () => [...BUILTIN_TEMPLATES, ...(templates ?? [])].filter((t) => runners.includes(t.runnerId)),
    [templates, runners],
  );

  const [summaries, setSummaries] = useState<ProjectSummary[] | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [openTabs, setOpenTabs] = useState<string[]>([]);
  const [activePath, setActivePath] = useState<string | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle');

  const sessionClearRef = useRef<() => void>(() => {});
  const session = useRunSession(project?.runnerId ?? 'python');
  sessionClearRef.current = session.clear;

  // Het hele project (bestanden, editor, uitvoer) op volledig scherm; zonder
  // navbar en browserbalken is er op een schoollaptop van 1366x768 merkbaar
  // meer regels code te zien.
  const rootRef = useRef<HTMLDivElement>(null);
  const volledig = useVolledigScherm(rootRef);
  const projectRef = useRef(project);
  projectRef.current = project;

  const switchToProject = useCallback((next: Project) => {
    setProject(next);
    setOpenTabs([next.entry]);
    setActivePath(next.entry);
    setShowTemplates(false);
    setSaveState('idle');
    // Console-output hoort bij het vorige project.
    sessionClearRef.current();
  }, []);

  // Bij het openen: projectlijst laden en het meest recente project openen.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const list = await listProjects(storagePrefix);
      if (cancelled) return;
      setSummaries(list);
      if (list.length > 0) {
        const latest = await loadProject(storagePrefix, list[0].id);
        if (!cancelled && latest) switchToProject(latest);
      } else {
        setShowTemplates(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [storagePrefix, switchToProject]);

  // Telt elke wijziging; "Opgeslagen ✓" verschijnt pas als de laatste
  // wijziging echt in IndexedDB staat (en niet een eerdere save).
  const dirtyCounterRef = useRef(0);

  const persist = useCallback(
    async (p: Project) => {
      const atCounter = dirtyCounterRef.current;
      setSaveState('saving');
      await saveProject(storagePrefix, p);
      setSummaries((prev) => {
        const summary = { id: p.id, name: p.name, runnerId: p.runnerId, updatedAt: p.updatedAt };
        return [summary, ...(prev ?? []).filter((s) => s.id !== p.id)];
      });
      if (dirtyCounterRef.current === atCounter) {
        setSaveState('saved');
      }
    },
    [storagePrefix],
  );

  // Autosave met debounce; direct wegschrijven bij tab-sluiten/verbergen.
  useEffect(() => {
    if (!project) return;
    const timer = window.setTimeout(() => void persist(project), AUTOSAVE_DEBOUNCE_MS);
    const flush = () => {
      if (projectRef.current) void persist(projectRef.current);
    };
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') flush();
    };
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pagehide', flush);
    window.addEventListener('beforeunload', flush);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pagehide', flush);
      window.removeEventListener('beforeunload', flush);
    };
  }, [project, persist]);

  const mutateProject = useCallback((mutate: (p: Project) => Project) => {
    dirtyCounterRef.current += 1;
    setSaveState('saving');
    setProject((prev) => (prev ? { ...mutate(prev), updatedAt: Date.now() } : prev));
  }, []);

  // ---- projectbeheer ----

  const createFromTemplate = useCallback(
    async (template: ProjectTemplate) => {
      const name = await vraag('Hoe heet je project?', {
        titel: 'Nieuw project',
        standaard: template.name,
        bevestigLabel: 'Maken',
      });
      if (name === null) return;
      // Openstaande wijzigingen van het huidige project niet kwijtraken.
      if (projectRef.current) void persist(projectRef.current);
      const now = Date.now();
      const next: Project = {
        id: newProjectId(),
        name: name || template.name,
        runnerId: template.runnerId,
        entry: template.entry,
        files: { ...template.files },
        folders: [],
        createdAt: now,
        updatedAt: now,
      };
      switchToProject(next);
      void persist(next);
    },
    [persist, switchToProject],
  );

  const openProject = useCallback(
    async (id: string) => {
      if (projectRef.current?.id === id) return;
      if (projectRef.current) await persist(projectRef.current);
      const next = await loadProject(storagePrefix, id);
      if (next) switchToProject(next);
    },
    [persist, storagePrefix, switchToProject],
  );

  const renameProject = useCallback(async () => {
    if (!projectRef.current) return;
    const name = await vraag('Nieuwe naam voor dit project:', {
      titel: 'Project hernoemen',
      standaard: projectRef.current.name,
      bevestigLabel: 'Hernoemen',
      valideer: (w) => (w ? null : 'Geef het project een naam.'),
    });
    if (!name) return;
    mutateProject((p) => ({ ...p, name }));
  }, [mutateProject]);

  const removeProject = useCallback(async () => {
    const current = projectRef.current;
    if (!current) return;
    const zeker = await bevestig(
      `"${current.name}" en alle bestanden erin verdwijnen uit deze browser. Download het eerst als je het wilt bewaren.`,
      { titel: 'Project verwijderen?', bevestigLabel: 'Verwijderen', gevaarlijk: true },
    );
    if (!zeker) return;
    await deleteProject(storagePrefix, current.id);
    const list = await listProjects(storagePrefix);
    setSummaries(list);
    if (list.length > 0) {
      const next = await loadProject(storagePrefix, list[0].id);
      if (next) {
        switchToProject(next);
        return;
      }
    }
    setProject(null);
    setOpenTabs([]);
    setActivePath(null);
    setShowTemplates(true);
  }, [storagePrefix, switchToProject]);

  // fflate laadt pas bij de klik: de meeste leerlingen downloaden nooit, en
  // dan hoort het niet in de bundel van de editor.
  const downloadProject = useCallback(async () => {
    const current = projectRef.current;
    if (!current) return;
    try {
      const { projectNaarZip, zipBestandsnaam } = await import('./zip');
      downloadBestand(projectNaarZip(current), zipBestandsnaam(current.name), 'application/zip');
    } catch {
      void meld('Probeer het nog een keer, of ververs de pagina.', {
        titel: 'Downloaden is niet gelukt',
      });
    }
  }, []);

  // ---- bestandsbeheer ----

  const openFile = useCallback((path: string) => {
    setOpenTabs((tabs) => (tabs.includes(path) ? tabs : [...tabs, path]));
    setActivePath(path);
  }, []);

  const closeTab = useCallback((path: string) => {
    setOpenTabs((tabs) => {
      const next = tabs.filter((t) => t !== path);
      setActivePath((current) =>
        current === path ? (next.length > 0 ? next[next.length - 1] : null) : current,
      );
      return next;
    });
  }, []);

  const newFile = useCallback(async () => {
    const current = projectRef.current;
    if (!current) return;
    const path = await vraag('Naam van het nieuwe bestand:', {
      titel: 'Nieuw bestand',
      placeholder: 'utils.py of map/data.txt',
      bevestigLabel: 'Maken',
      valideer: (w) => {
        if (!isValidPath(w)) return 'Dat is geen geldige bestandsnaam.';
        if (current.files[w] !== undefined) return 'Er bestaat al een bestand met deze naam.';
        return null;
      },
    });
    if (!path) return;
    mutateProject((p) => ({ ...p, files: { ...p.files, [path]: '' } }));
    openFile(path);
  }, [mutateProject, openFile]);

  const newFolder = useCallback(async () => {
    const current = projectRef.current;
    if (!current) return;
    const path = await vraag('Naam van de nieuwe map:', {
      titel: 'Nieuwe map',
      placeholder: 'afbeeldingen',
      bevestigLabel: 'Maken',
      valideer: (w) => (isValidPath(w) ? null : 'Dat is geen geldige mapnaam.'),
    });
    if (!path) return;
    if (current.folders.includes(path)) return;
    mutateProject((p) => ({ ...p, folders: [...p.folders, path] }));
  }, [mutateProject]);

  const renamePath = useCallback(
    async (path: string, isFolder: boolean) => {
      const current = projectRef.current;
      if (!current) return;
      const next = await vraag('Nieuwe naam, inclusief de map waar het in staat:', {
        titel: isFolder ? 'Map hernoemen' : 'Bestand hernoemen',
        standaard: path,
        bevestigLabel: 'Hernoemen',
        valideer: (w) => {
          if (w === path) return null;
          if (!isValidPath(w)) return 'Dat is geen geldige naam.';
          if (pathExists(current, w)) {
            return isFolder
              ? 'Er bestaat al een map met deze naam.'
              : 'Er bestaat al een bestand met deze naam.';
          }
          return null;
        },
      });
      if (!next || next === path) return;
      mutateProject((p) => renameInProject(p, path, next, isFolder));
      const mapTab = (t: string) => renamedPath(t, path, next, isFolder);
      setOpenTabs((tabs) => tabs.map(mapTab));
      setActivePath((p) => (p ? mapTab(p) : p));
    },
    [mutateProject],
  );

  const deletePath = useCallback(
    async (path: string, isFolder: boolean) => {
      const current = projectRef.current;
      if (!current) return;
      if (isDeletedPath(current.entry, path, isFolder)) {
        await meld(
          `${current.entry} is het bestand dat Uitvoeren start. Zonder dat bestand draait je project niet.`,
          { titel: 'Dit bestand kan niet weg' },
        );
        return;
      }
      const label = isFolder ? `De map "${path}" en alles erin` : `"${path}"`;
      const zeker = await bevestig(`${label} verdwijnt uit je project.`, {
        titel: isFolder ? 'Map verwijderen?' : 'Bestand verwijderen?',
        bevestigLabel: 'Verwijderen',
        gevaarlijk: true,
      });
      if (!zeker) return;
      mutateProject((p) => deleteFromProject(p, path, isFolder));
      setOpenTabs((tabs) => tabs.filter((t) => !isDeletedPath(t, path, isFolder)));
      setActivePath((p) => (p && !isDeletedPath(p, path, isFolder) ? p : null));
    },
    [mutateProject],
  );

  const handleChange = useCallback(
    (value: string) => {
      if (!activePath) return;
      mutateProject((p) => ({ ...p, files: { ...p.files, [activePath]: value } }));
    },
    [activePath, mutateProject],
  );

  // ---- uitvoeren ----

  const handleRun = useCallback(() => {
    const current = projectRef.current;
    if (!current) return;
    session.clear();
    void session.run(current.files, current.entry);
  }, [session.run, session.clear]);

  const runRef = useRef(handleRun);
  runRef.current = handleRun;

  // Live preview voor runners met autoRun (web).
  const wantAutoRun = session.runner?.capabilities.autoRun ?? false;
  useEffect(() => {
    if (!wantAutoRun || !project) return;
    const timer = window.setTimeout(() => {
      void session.run(project.files, project.entry);
    }, AUTO_RUN_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [wantAutoRun, project, session.run]);

  // ---- render ----

  if (summaries === null) {
    return <div className={styles.loading}>Projecten laden…</div>;
  }

  const runner = session.runner;
  const Preview = runner?.capabilities.preview ? runner.PreviewComponent : undefined;
  const Input = runner?.InputComponent;

  return (
    <div ref={rootRef} className={styles.root} style={{ height }}>
      <div className={styles.projectBar}>
        <div className={styles.projectControls}>
          {project && (
            <select
              className={styles.projectSelect}
              value={project.id}
              onChange={(e) => void openProject(e.target.value)}
              title="Project openen"
            >
              {(summaries ?? []).map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({RUNNER_META[s.runnerId]?.label ?? s.runnerId})
                </option>
              ))}
            </select>
          )}
          <button type="button" className={styles.barButton} onClick={() => setShowTemplates(true)}>
            Nieuw project
          </button>
          {project && (
            <>
              <button
                type="button"
                className={styles.barButton}
                onClick={() => void renameProject()}
              >
                Hernoemen
              </button>
              <button
                type="button"
                className={styles.barButton}
                onClick={() => void removeProject()}
              >
                Verwijderen
              </button>
              <button
                type="button"
                className={styles.barButton}
                onClick={() => void downloadProject()}
                title="Het hele project als .zip-bestand, als reservekopie of om in te leveren"
              >
                Downloaden (.zip)
              </button>
              <span className={styles.saveState}>
                {saveState === 'saving' && 'Opslaan…'}
                {saveState === 'saved' && 'Opgeslagen ✓'}
              </span>
            </>
          )}
        </div>
        <div className={styles.projectControls}>
          {volledig.kan && (
            <button
              type="button"
              className={styles.barButton}
              onClick={volledig.wissel}
              aria-pressed={volledig.aan}
              title={
                volledig.aan
                  ? 'Terug (of druk op Escape)'
                  : 'De editor op het hele beeldscherm, zonder de balken van de site en de browser'
              }
            >
              {volledig.aan ? 'Sluiten (Esc)' : 'Volledig scherm'}
            </button>
          )}
          {project && <RunControls session={session} onRun={handleRun} />}
        </div>
      </div>

      {showTemplates && (
        <div className={styles.templatePicker}>
          <h2 className={styles.templateTitle}>
            {project ? 'Nieuw project' : 'Waar wil je mee aan de slag?'}
          </h2>
          <div className={styles.templateGrid}>
            {allTemplates.map((t) => (
              <button
                key={t.id}
                type="button"
                className={styles.templateCard}
                onClick={() => void createFromTemplate(t)}
              >
                <span className={styles.templateName}>{t.name}</span>
                <span className={styles.templateDescription}>{t.description}</span>
              </button>
            ))}
          </div>
          {project && (
            <button
              type="button"
              className={styles.barButton}
              onClick={() => setShowTemplates(false)}
            >
              Annuleren
            </button>
          )}
        </div>
      )}

      {project && !showTemplates && (
        <div className={styles.main}>
          <aside className={styles.sidebar}>
            <div className={styles.sidebarHeader}>
              <span>Bestanden</span>
              <span>
                <button
                  type="button"
                  className={styles.treeAction}
                  title="Nieuw bestand"
                  onClick={() => void newFile()}
                >
                  ＋
                </button>
                <button
                  type="button"
                  className={styles.treeAction}
                  title="Nieuwe map"
                  onClick={() => void newFolder()}
                >
                  ▸＋
                </button>
              </span>
            </div>
            <FileTree
              files={Object.keys(project.files)}
              folders={project.folders}
              activePath={activePath}
              entry={project.entry}
              onOpen={openFile}
              onRename={renamePath}
              onDelete={deletePath}
            />
          </aside>

          <section className={styles.editorArea}>
            {openTabs.length > 0 && (
              <div className={styles.tabs} role="tablist">
                {openTabs.map((tab) => (
                  <span
                    key={tab}
                    className={clsx(styles.tab, tab === activePath && styles.tabActive)}
                  >
                    <button
                      type="button"
                      role="tab"
                      aria-selected={tab === activePath}
                      className={styles.tabName}
                      onClick={() => setActivePath(tab)}
                    >
                      {tab.split('/').pop()}
                    </button>
                    <button
                      type="button"
                      className={styles.tabClose}
                      title="Tab sluiten"
                      onClick={() => closeTab(tab)}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
            <div className={styles.editorPane}>
              {activePath !== null ? (
                <MonacoPane
                  value={project.files[activePath] ?? ''}
                  onChange={handleChange}
                  language={languageForPath(activePath)}
                  path={`project-${project.id}/${activePath}`}
                  height="100%"
                  onMount={(editor, monaco) => {
                    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
                      runRef.current();
                    });
                    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
                      const p = projectRef.current;
                      if (p) void persist(p);
                    });
                  }}
                />
              ) : (
                <div className={styles.emptyEditor}>Open een bestand om te beginnen.</div>
              )}
            </div>
          </section>

          <section className={styles.outputArea}>
            {Preview && (
              <div className={styles.previewPane}>
                <Preview session={session} />
              </div>
            )}
            <Console events={session.events} />
            {Input && <Input session={session} />}
          </section>
        </div>
      )}
    </div>
  );
}

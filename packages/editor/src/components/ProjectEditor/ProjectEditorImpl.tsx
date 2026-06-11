import clsx from 'clsx';
import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { languageForPath } from '../../lib/languages';
import MonacoPane from '../../monaco/MonacoPane';
import { RUNNER_META } from '../../runners/registry';
import type { RunnerId } from '../../runners/types';
import {
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
import styles from './styles.module.css';

const AUTOSAVE_DEBOUNCE_MS = 500;
const AUTO_RUN_DEBOUNCE_MS = 600;

const DEFAULT_RUNNERS: RunnerId[] = ['python', 'web', 'micropython'];

function isValidPath(path: string): boolean {
  return (
    path.length > 0 &&
    !path.startsWith('/') &&
    !path.endsWith('/') &&
    !path.includes('//') &&
    !path.includes('..') &&
    !/[\\:*?"<>|]/.test(path)
  );
}

export default function ProjectEditorImpl({
  runners = DEFAULT_RUNNERS,
  storagePrefix = 'coderius-editor',
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
    (template: ProjectTemplate) => {
      const name = window.prompt('Hoe heet je project?', template.name);
      if (name === null) return;
      // Openstaande wijzigingen van het huidige project niet kwijtraken.
      if (projectRef.current) void persist(projectRef.current);
      const now = Date.now();
      const next: Project = {
        id: newProjectId(),
        name: name.trim() || template.name,
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

  const renameProject = useCallback(() => {
    if (!projectRef.current) return;
    const name = window.prompt('Nieuwe naam voor dit project:', projectRef.current.name);
    if (name === null || !name.trim()) return;
    mutateProject((p) => ({ ...p, name: name.trim() }));
  }, [mutateProject]);

  const removeProject = useCallback(async () => {
    const current = projectRef.current;
    if (!current) return;
    if (!window.confirm(`Weet je zeker dat je "${current.name}" wilt verwijderen?`)) return;
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

  const newFile = useCallback(() => {
    const current = projectRef.current;
    if (!current) return;
    const path = window
      .prompt('Naam van het nieuwe bestand (bijv. utils.py of map/data.txt):')
      ?.trim();
    if (!path) return;
    if (!isValidPath(path)) {
      window.alert('Dat is geen geldige bestandsnaam.');
      return;
    }
    if (current.files[path] !== undefined) {
      window.alert('Er bestaat al een bestand met deze naam.');
      return;
    }
    mutateProject((p) => ({ ...p, files: { ...p.files, [path]: '' } }));
    openFile(path);
  }, [mutateProject, openFile]);

  const newFolder = useCallback(() => {
    const current = projectRef.current;
    if (!current) return;
    const path = window.prompt('Naam van de nieuwe map (bijv. afbeeldingen):')?.trim();
    if (!path) return;
    if (!isValidPath(path)) {
      window.alert('Dat is geen geldige mapnaam.');
      return;
    }
    if (current.folders.includes(path)) return;
    mutateProject((p) => ({ ...p, folders: [...p.folders, path] }));
  }, [mutateProject]);

  const renamePath = useCallback(
    (path: string, isFolder: boolean) => {
      const next = window.prompt('Nieuwe naam (inclusief map):', path)?.trim();
      if (!next || next === path) return;
      if (!isValidPath(next)) {
        window.alert('Dat is geen geldige naam.');
        return;
      }
      const current = projectRef.current;
      if (!current) return;
      if (isFolder) {
        const prefix = `${path}/`;
        mutateProject((p) => ({
          ...p,
          files: Object.fromEntries(
            Object.entries(p.files).map(([k, v]) => [
              k.startsWith(prefix) ? `${next}/${k.slice(prefix.length)}` : k,
              v,
            ]),
          ),
          folders: p.folders.map((f) =>
            f === path ? next : f.startsWith(prefix) ? `${next}/${f.slice(prefix.length)}` : f,
          ),
          entry: current.entry.startsWith(prefix)
            ? `${next}/${current.entry.slice(prefix.length)}`
            : current.entry,
        }));
        const mapTab = (t: string) =>
          t.startsWith(prefix) ? `${next}/${t.slice(prefix.length)}` : t;
        setOpenTabs((tabs) => tabs.map(mapTab));
        setActivePath((p) => (p ? mapTab(p) : p));
      } else {
        if (current.files[next] !== undefined) {
          window.alert('Er bestaat al een bestand met deze naam.');
          return;
        }
        mutateProject((p) => {
          const files = { ...p.files };
          files[next] = files[path] ?? '';
          delete files[path];
          return { ...p, files, entry: p.entry === path ? next : p.entry };
        });
        setOpenTabs((tabs) => tabs.map((t) => (t === path ? next : t)));
        setActivePath((p) => (p === path ? next : p));
      }
    },
    [mutateProject],
  );

  const deletePath = useCallback(
    (path: string, isFolder: boolean) => {
      const current = projectRef.current;
      if (!current) return;
      const prefix = `${path}/`;
      const affectsEntry = isFolder ? current.entry.startsWith(prefix) : current.entry === path;
      if (affectsEntry) {
        window.alert(`Het startbestand (${current.entry}) kan niet verwijderd worden.`);
        return;
      }
      const label = isFolder ? `de map "${path}" en alles erin` : `"${path}"`;
      if (!window.confirm(`Weet je zeker dat je ${label} wilt verwijderen?`)) return;
      mutateProject((p) => ({
        ...p,
        files: isFolder
          ? Object.fromEntries(Object.entries(p.files).filter(([k]) => !k.startsWith(prefix)))
          : Object.fromEntries(Object.entries(p.files).filter(([k]) => k !== path)),
        folders: isFolder
          ? p.folders.filter((f) => f !== path && !f.startsWith(prefix))
          : p.folders,
      }));
      setOpenTabs((tabs) => tabs.filter((t) => (isFolder ? !t.startsWith(prefix) : t !== path)));
      setActivePath((p) => {
        if (!p) return p;
        const gone = isFolder ? p.startsWith(prefix) : p === path;
        return gone ? null : p;
      });
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
    <div className={styles.root} style={{ height }}>
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
              <button type="button" className={styles.barButton} onClick={renameProject}>
                Hernoemen
              </button>
              <button
                type="button"
                className={styles.barButton}
                onClick={() => void removeProject()}
              >
                Verwijderen
              </button>
              <span className={styles.saveState}>
                {saveState === 'saving' && 'Opslaan…'}
                {saveState === 'saved' && 'Opgeslagen ✓'}
              </span>
            </>
          )}
        </div>
        {project && <RunControls session={session} onRun={handleRun} />}
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
                onClick={() => createFromTemplate(t)}
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
                  onClick={newFile}
                >
                  ＋
                </button>
                <button
                  type="button"
                  className={styles.treeAction}
                  title="Nieuwe map"
                  onClick={newFolder}
                >
                  📁＋
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

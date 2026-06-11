import { createStore, del, get, set } from 'idb-keyval';
import type { Project, ProjectSummary } from './types';

// IndexedDB in plaats van localStorage: geen ~5 MB-plafond en async, zodat
// grotere projecten (meerdere bestanden) zonder gedoe passen.
const INDEX_KEY = 'project-index';

type IdbStore = ReturnType<typeof createStore>;

const stores = new Map<string, IdbStore>();

function getStore(prefix: string): IdbStore {
  let store = stores.get(prefix);
  if (!store) {
    store = createStore(prefix, 'projects');
    stores.set(prefix, store);
  }
  return store;
}

export async function listProjects(prefix: string): Promise<ProjectSummary[]> {
  const index = await get<ProjectSummary[]>(INDEX_KEY, getStore(prefix));
  return (index ?? []).slice().sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function loadProject(prefix: string, id: string): Promise<Project | undefined> {
  return get<Project>(`project:${id}`, getStore(prefix));
}

export async function saveProject(prefix: string, project: Project): Promise<void> {
  const store = getStore(prefix);
  await set(`project:${project.id}`, project, store);
  const index = (await get<ProjectSummary[]>(INDEX_KEY, store)) ?? [];
  const summary: ProjectSummary = {
    id: project.id,
    name: project.name,
    runnerId: project.runnerId,
    updatedAt: project.updatedAt,
  };
  const next = [summary, ...index.filter((p) => p.id !== project.id)];
  await set(INDEX_KEY, next, store);
}

export async function deleteProject(prefix: string, id: string): Promise<void> {
  const store = getStore(prefix);
  await del(`project:${id}`, store);
  const index = (await get<ProjectSummary[]>(INDEX_KEY, store)) ?? [];
  await set(
    INDEX_KEY,
    index.filter((p) => p.id !== id),
    store,
  );
}

export function newProjectId(): string {
  return crypto.randomUUID();
}

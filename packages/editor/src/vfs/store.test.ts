import { describe, expect, it, vi } from 'vitest';
import { deleteProject, listProjects, loadProject, newProjectId, saveProject } from './store';
import type { Project } from './types';

// De projectopslag houdt naast elk project een index van samenvattingen bij
// (voor de projectenlijst). Die twee moeten in de pas blijven: twee keer
// opslaan mag geen dubbele regel in de lijst opleveren, verwijderen moet ook
// de samenvatting weghalen, en de lijst staat nieuwste-eerst. Zonder IndexedDB
// in node vervangt een Map per store het idb-keyval-pakket.

vi.mock('idb-keyval', () => {
  type Store = Map<string, unknown>;
  return {
    createStore: (): Store => new Map(),
    get: async (key: string, store: Store) => store.get(key),
    set: async (key: string, value: unknown, store: Store) => {
      store.set(key, value);
    },
    del: async (key: string, store: Store) => {
      store.delete(key);
    },
  };
});

let volgnummer = 0;
/** Eigen database per test, zodat de gecachte stores elkaar niet zien. */
function versePrefix(): string {
  volgnummer += 1;
  return `test-${volgnummer}`;
}

function project(id: string, naam: string, updatedAt: number): Project {
  return {
    id,
    name: naam,
    runnerId: 'python',
    entry: 'main.py',
    files: { 'main.py': 'print(1)' },
    folders: [],
    createdAt: updatedAt,
    updatedAt,
  };
}

describe('saveProject en loadProject', () => {
  it('slaat het project op en levert het ongewijzigd terug', async () => {
    const prefix = versePrefix();
    const p = project('a', 'Alfa', 10);

    await saveProject(prefix, p);

    expect(await loadProject(prefix, 'a')).toEqual(p);
    expect(await loadProject(prefix, 'bestaat-niet')).toBeUndefined();
  });

  it('houdt na twee keer opslaan één samenvatting over, vooraan in de index', async () => {
    const prefix = versePrefix();
    await saveProject(prefix, project('a', 'Alfa', 10));
    await saveProject(prefix, project('b', 'Beta', 20));

    await saveProject(prefix, project('a', 'Alfa hernoemd', 30));

    const lijst = await listProjects(prefix);
    expect(lijst.map((s) => s.id)).toEqual(['a', 'b']);
    expect(lijst[0]).toEqual({ id: 'a', name: 'Alfa hernoemd', runnerId: 'python', updatedAt: 30 });
  });

  it('houdt databases met een andere prefix gescheiden', async () => {
    const een = versePrefix();
    const twee = versePrefix();

    await saveProject(een, project('a', 'Alfa', 10));

    expect(await listProjects(twee)).toEqual([]);
    expect(await loadProject(twee, 'a')).toBeUndefined();
  });
});

describe('deleteProject', () => {
  it('verwijdert het project én zijn samenvatting', async () => {
    const prefix = versePrefix();
    await saveProject(prefix, project('a', 'Alfa', 10));
    await saveProject(prefix, project('b', 'Beta', 20));

    await deleteProject(prefix, 'a');

    expect(await loadProject(prefix, 'a')).toBeUndefined();
    expect((await listProjects(prefix)).map((s) => s.id)).toEqual(['b']);
  });

  it('doet niets bij een onbekend id', async () => {
    const prefix = versePrefix();
    await saveProject(prefix, project('a', 'Alfa', 10));

    await deleteProject(prefix, 'bestaat-niet');

    expect((await listProjects(prefix)).map((s) => s.id)).toEqual(['a']);
  });
});

describe('listProjects', () => {
  it('geeft een lege lijst voor een verse database', async () => {
    expect(await listProjects(versePrefix())).toEqual([]);
  });

  it('sorteert op updatedAt, nieuwste eerst, ongeacht de opslagvolgorde', async () => {
    const prefix = versePrefix();
    await saveProject(prefix, project('oud', 'Oud', 100));
    await saveProject(prefix, project('nieuw', 'Nieuw', 300));
    await saveProject(prefix, project('midden', 'Midden', 200));

    const lijst = await listProjects(prefix);

    expect(lijst.map((s) => s.id)).toEqual(['nieuw', 'midden', 'oud']);
  });
});

describe('newProjectId', () => {
  it('geeft een UUID en elke keer een andere', () => {
    const id = newProjectId();
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
    expect(newProjectId()).not.toBe(id);
  });
});

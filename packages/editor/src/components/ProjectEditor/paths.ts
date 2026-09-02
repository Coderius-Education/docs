import type { Project } from '../../vfs/types';

// Pure padlogica van de projecteditor: geldigheid, hernoemen en verwijderen.
// De component houdt de prompts en de tab-boekhouding; wat hier staat is
// precies het stuk dat je zonder browser wilt kunnen testen. Een map is in
// een project alleen een prefix ("src/"), dus hernoemen en verwijderen van
// een map is prefix-werk — en "src" mag "src2" niet raken.

export function isValidPath(path: string): boolean {
  return (
    path.length > 0 &&
    !path.startsWith('/') &&
    !path.endsWith('/') &&
    !path.includes('//') &&
    !path.includes('..') &&
    !/[\\:*?"<>|]/.test(path)
  );
}

/** Het pad na hernoemen van `from` naar `to`; paden die er niet onder vallen blijven gelijk. */
export function renamedPath(path: string, from: string, to: string, isFolder: boolean): string {
  if (!isFolder) return path === from ? to : path;
  const prefix = `${from}/`;
  return path.startsWith(prefix) ? `${to}/${path.slice(prefix.length)}` : path;
}

export function renameInProject<P extends Pick<Project, 'files' | 'folders' | 'entry'>>(
  project: P,
  from: string,
  to: string,
  isFolder: boolean,
): P {
  if (isFolder) {
    return {
      ...project,
      files: Object.fromEntries(
        Object.entries(project.files).map(([k, v]) => [renamedPath(k, from, to, true), v]),
      ),
      folders: project.folders.map((f) => (f === from ? to : renamedPath(f, from, to, true))),
      entry: renamedPath(project.entry, from, to, true),
    };
  }
  const files = { ...project.files };
  files[to] = files[from] ?? '';
  delete files[from];
  return { ...project, files, entry: project.entry === from ? to : project.entry };
}

/** Valt `path` weg als `deleted` (bestand of map) verwijderd wordt? */
export function isDeletedPath(path: string, deleted: string, isFolder: boolean): boolean {
  return isFolder ? path.startsWith(`${deleted}/`) : path === deleted;
}

export function deleteFromProject<P extends Pick<Project, 'files' | 'folders'>>(
  project: P,
  path: string,
  isFolder: boolean,
): P {
  return {
    ...project,
    files: Object.fromEntries(
      Object.entries(project.files).filter(([k]) => !isDeletedPath(k, path, isFolder)),
    ),
    folders: isFolder
      ? project.folders.filter((f) => f !== path && !isDeletedPath(f, path, true))
      : project.folders,
  };
}

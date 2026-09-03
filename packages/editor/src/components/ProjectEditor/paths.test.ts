import { describe, expect, it } from 'vitest';
import {
  deleteFromProject,
  isDeletedPath,
  isValidPath,
  pathExists,
  renameInProject,
  renamedPath,
} from './paths';

// Hernoemen en verwijderen van een map is prefix-werk op platte paden. Het
// onderscheidende geval is steeds een buurman met dezelfde letters: "src2"
// mag niet meebewegen met "src".

const project: { files: Record<string, string>; folders: string[]; entry: string } = {
  files: {
    'index.html': '<h1>',
    'src/a.py': 'A',
    'src/sub/b.py': 'B',
    'src2/x.py': 'X',
  },
  folders: ['src', 'src/sub', 'src2', 'leeg'],
  entry: 'src/a.py',
};

describe('isValidPath', () => {
  it.each(['main.py', 'map/data.txt', 'mijn bestand.py', 'a.b/c'])('accepteert %s', (path) => {
    expect(isValidPath(path)).toBe(true);
  });

  it.each(['', '/x', 'x/', 'a//b', '../x', 'a..b', 'C:\\x', 'a?b', 'a*b', 'a"b', 'a<b', 'a|b'])(
    'weigert %j',
    (path) => {
      expect(isValidPath(path)).toBe(false);
    },
  );
});

describe('renameInProject — bestand', () => {
  it('verplaatst alleen die sleutel en laat het startbestand volgen als het dat was', () => {
    const next = renameInProject(project, 'src/a.py', 'src/hoofd.py', false);
    expect(Object.keys(next.files).sort()).toEqual([
      'index.html',
      'src/hoofd.py',
      'src/sub/b.py',
      'src2/x.py',
    ]);
    expect(next.files['src/hoofd.py']).toBe('A');
    expect(next.entry).toBe('src/hoofd.py');
    expect(next.folders).toBe(project.folders);
  });

  it('laat het startbestand met rust als een ander bestand hernoemd wordt', () => {
    expect(renameInProject(project, 'index.html', 'home.html', false).entry).toBe('src/a.py');
  });
});

describe('renameInProject — map', () => {
  const next = renameInProject(project, 'src', 'lib', true);

  it('verplaatst alles onder de map, maar niet de buurman src2', () => {
    expect(next.files).toEqual({
      'index.html': '<h1>',
      'lib/a.py': 'A',
      'lib/sub/b.py': 'B',
      'src2/x.py': 'X',
    });
    expect(next.folders).toEqual(['lib', 'lib/sub', 'src2', 'leeg']);
  });

  it('laat het startbestand meeverhuizen', () => {
    expect(next.entry).toBe('lib/a.py');
  });

  it('geeft met renamedPath dezelfde mapping voor open tabs', () => {
    expect(renamedPath('src/sub/b.py', 'src', 'lib', true)).toBe('lib/sub/b.py');
    expect(renamedPath('src2/x.py', 'src', 'lib', true)).toBe('src2/x.py');
    expect(renamedPath('src/a.py', 'src/a.py', 'b.py', false)).toBe('b.py');
    expect(renamedPath('src/c.py', 'src/a.py', 'b.py', false)).toBe('src/c.py');
  });
});

describe('deleteFromProject', () => {
  it('verwijdert één bestand en laat de mappen staan', () => {
    const next = deleteFromProject(project, 'src/a.py', false);
    expect(Object.keys(next.files).sort()).toEqual(['index.html', 'src/sub/b.py', 'src2/x.py']);
    expect(next.folders).toBe(project.folders);
  });

  it('verwijdert een map met alles erin, maar niet de buurman src2', () => {
    const next = deleteFromProject(project, 'src', true);
    expect(next.files).toEqual({ 'index.html': '<h1>', 'src2/x.py': 'X' });
    expect(next.folders).toEqual(['src2', 'leeg']);
  });
});

describe('isDeletedPath', () => {
  it.each([
    ['src/index.html', 'src', true, true],
    ['index.html', 'src', true, false],
    ['src2/x.py', 'src', true, false],
    ['index.html', 'index.html', false, true],
    ['index.htm', 'index.html', false, false],
  ])('%s bij verwijderen van %s (map: %s) → %s', (path, deleted, isFolder, verwacht) => {
    expect(isDeletedPath(path, deleted, isFolder)).toBe(verwacht);
  });
});

describe('pathExists — de botsingscheck vóór hernoemen', () => {
  // Alleen bestanden werden gecontroleerd; een map hernoemen naar een
  // bestaande buurman overschreef stil src2/a.py en gaf een dubbele mapregel.
  it('een bestand bestaat als het in files staat', () => {
    expect(pathExists(project, 'src/a.py', false)).toBe(true);
    expect(pathExists(project, 'src/b.py', false)).toBe(false);
  });

  it('een map bestaat als hij expliciet is, of als er een bestand onder staat', () => {
    expect(pathExists(project, 'src2', true)).toBe(true);
    expect(pathExists(project, 'leeg', true)).toBe(true);
    expect(pathExists({ files: { 'impliciet/x.py': '' }, folders: [] }, 'impliciet', true)).toBe(
      true,
    );
    expect(pathExists(project, 'src3', true)).toBe(false);
  });

  it('src is geen prefix van src2', () => {
    expect(pathExists({ files: { 'src2/x.py': '' }, folders: [] }, 'src', true)).toBe(false);
  });
});

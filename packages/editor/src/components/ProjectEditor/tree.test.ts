import { describe, expect, it } from 'vitest';
import { buildTree } from './tree';

// Mappen bestaan in een project alleen impliciet (in de paden) of als
// expliciet lege map. De boom moet uit die twee bronnen één consistente
// structuur maken, anders zie je een map dubbel of een bestand op de
// verkeerde plek.

describe('buildTree', () => {
  it('zet mappen vóór bestanden en sorteert daarbinnen op naam', () => {
    const tree = buildTree(['banaan.py', 'Appel.py'], ['zz']);
    expect(tree.map((n) => n.name)).toEqual(['zz', 'Appel.py', 'banaan.py']);
  });

  it('maakt de oudermap van een genest bestand impliciet aan', () => {
    expect(buildTree(['src/utils.py'], [])).toEqual([
      {
        name: 'src',
        path: 'src',
        isFolder: true,
        children: [{ name: 'utils.py', path: 'src/utils.py', isFolder: false, children: [] }],
      },
    ]);
  });

  it('toont een expliciet lege map', () => {
    expect(buildTree([], ['leeg'])).toEqual([
      { name: 'leeg', path: 'leeg', isFolder: true, children: [] },
    ]);
  });

  it('maakt geen dubbele map als die expliciet én impliciet bestaat', () => {
    const tree = buildTree(['src/a.py'], ['src']);
    expect(tree).toHaveLength(1);
    expect(tree[0].children.map((n) => n.path)).toEqual(['src/a.py']);
  });

  it('geeft op elke diepte het volledige pad', () => {
    const [a] = buildTree(['a/b/c.txt'], []);
    expect(a.path).toBe('a');
    expect(a.children[0].path).toBe('a/b');
    expect(a.children[0].children[0]).toEqual({
      name: 'c.txt',
      path: 'a/b/c.txt',
      isFolder: false,
      children: [],
    });
  });
});

import { afterEach, describe, expect, it, vi } from 'vitest';
import type { BoardFS } from './filesystem';
import { installLeaphyLibrary } from './leaphyInstaller';

// De installer haalt de library-bestanden van GitHub en zet ze in /lib op het
// board. fetch en BoardFS worden nagemaakt; de tests controleren de selectie
// (alleen blobs onder leaphymicropython/), de doelpaden en de voortgang.

function nepFs() {
  const geschreven: Array<{ path: string; inhoud: string }> = [];
  const fs = {
    writeFile: async (path: string, inhoud: Uint8Array | string) => {
      geschreven.push({
        path,
        inhoud: typeof inhoud === 'string' ? inhoud : new TextDecoder().decode(inhoud),
      });
    },
  } as unknown as BoardFS;
  return { fs, geschreven };
}

function nepFetch(tree: unknown, bestanden: Record<string, string>) {
  return vi.fn(async (url: string) => {
    if (url.includes('api.github.com')) {
      return { ok: true, status: 200, json: async () => tree } as Response;
    }
    // raw.githubusercontent.com/<eigenaar>/<repo>/<branch>/<pad...>
    const pad = new URL(url).pathname.split('/').slice(4).join('/');
    const inhoud = bestanden[pad];
    if (inhoud === undefined) return { ok: false, status: 404 } as Response;
    return {
      ok: true,
      status: 200,
      arrayBuffer: async () => new TextEncoder().encode(inhoud).buffer,
    } as Response;
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('installLeaphyLibrary', () => {
  it('zet alleen de library-blobs op het board, onder /lib', async () => {
    const tree = {
      truncated: false,
      tree: [
        { path: 'leaphymicropython/__init__.py', type: 'blob', sha: 'a' },
        { path: 'leaphymicropython/sensors/tof.py', type: 'blob', sha: 'b' },
        { path: 'leaphymicropython/sensors', type: 'tree', sha: 'c' },
        { path: 'README.md', type: 'blob', sha: 'd' },
      ],
    };
    vi.stubGlobal(
      'fetch',
      nepFetch(tree, {
        'leaphymicropython/__init__.py': '',
        'leaphymicropython/sensors/tof.py': 'class TimeOfFlight: pass\n',
      }),
    );
    const { fs, geschreven } = nepFs();

    await installLeaphyLibrary(fs, () => {});

    expect(geschreven.map((g) => g.path)).toEqual([
      '/lib/leaphymicropython/__init__.py',
      '/lib/leaphymicropython/sensors/tof.py',
      '/lib/leaphymicropython_meta.json',
    ]);
    expect(geschreven[1].inhoud).toBe('class TimeOfFlight: pass\n');
  });

  it('laat een herkomst-stempel achter op het board', async () => {
    const tree = {
      truncated: false,
      tree: [{ path: 'leaphymicropython/a.py', type: 'blob', sha: 'a' }],
    };
    vi.stubGlobal('fetch', nepFetch(tree, { 'leaphymicropython/a.py': '' }));
    const { fs, geschreven } = nepFs();

    await installLeaphyLibrary(fs, () => {}, { repo: 'iemand/fork', branch: 'test' });

    const meta = JSON.parse(geschreven[geschreven.length - 1].inhoud);
    expect(meta.repo).toBe('iemand/fork');
    expect(meta.branch).toBe('test');
    expect(typeof meta.installedAt).toBe('string');
  });

  it('meldt voortgang per bestand en sluit af met klaar', async () => {
    const tree = {
      truncated: false,
      tree: [
        { path: 'leaphymicropython/a.py', type: 'blob', sha: 'a' },
        { path: 'leaphymicropython/b.py', type: 'blob', sha: 'b' },
      ],
    };
    vi.stubGlobal(
      'fetch',
      nepFetch(tree, { 'leaphymicropython/a.py': '', 'leaphymicropython/b.py': '' }),
    );
    const { fs } = nepFs();
    const voortgang: Array<{ done: number; total: number; current: string }> = [];

    await installLeaphyLibrary(fs, (p) => voortgang.push(p));

    expect(voortgang).toEqual([
      { done: 0, total: 2, current: 'leaphymicropython/a.py' },
      { done: 1, total: 2, current: 'leaphymicropython/b.py' },
      { done: 2, total: 2, current: 'klaar' },
    ]);
  });

  it('faalt begrijpelijk als de lijst niet op te halen is', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: false, status: 502 }) as Response),
    );
    const { fs } = nepFs();

    await expect(installLeaphyLibrary(fs, () => {})).rejects.toThrow(
      'Kon library-lijst niet ophalen (HTTP 502)',
    );
  });

  it('faalt als er geen library-bestanden in de tree zitten', async () => {
    vi.stubGlobal(
      'fetch',
      nepFetch({ truncated: false, tree: [{ path: 'README.md', type: 'blob', sha: 'a' }] }, {}),
    );
    const { fs } = nepFs();

    await expect(installLeaphyLibrary(fs, () => {})).rejects.toThrow(
      'Geen library-bestanden gevonden.',
    );
  });

  it('stopt zodra één bestand niet op te halen is', async () => {
    const tree = {
      truncated: false,
      tree: [{ path: 'leaphymicropython/weg.py', type: 'blob', sha: 'a' }],
    };
    vi.stubGlobal('fetch', nepFetch(tree, {}));
    const { fs, geschreven } = nepFs();

    await expect(installLeaphyLibrary(fs, () => {})).rejects.toThrow(
      'Kon leaphymicropython/weg.py niet ophalen (HTTP 404)',
    );
    expect(geschreven).toHaveLength(0);
  });
});

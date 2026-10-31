import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { alleSiteMappen } from '@coderius/shared/sites';
import { afterEach, describe, expect, it, vi } from 'vitest';

// Elke site serveert Pyodide zelf, uit static/pyodide/. De gedeelde lader
// (getPyodide in PyodideProvider.ts) weet dat adres alleen als de site het
// zet, met setPyodideBaseUrl in een clientModule. Tot november 2026 viel hij
// zonder die regel stil terug op cdn.jsdelivr.net: een nieuwe cursus die hem
// vergat, werkte thuis gewoon, en op een schoolnetwerk dat de CDN blokkeert
// niet. Nu is er geen standaard meer (getPyodide zegt wat er mist), en eist
// deze test de regel al vóór de build.

const ROOT = fileURLToPath(new URL('../../..', import.meta.url));

/**
 * Wat via de gedeelde lader Pyodide laadt: de speeltuin-componenten, de
 * editor (zijn Python-runner roept getPyodide aan), en wie getPyodide zelf
 * importeert of alles uit PyodideProvider doorgeeft.
 */
function laadtViaGedeeldeLader(bron: string): boolean {
  if (/@coderius\/python-runner\/(CodeExercise|PythonPlayground)\b/.test(bron)) return true;
  if (/@coderius\/editor\/(InlineEditor|ProjectEditor|runners)['/]/.test(bron)) return true;
  for (const m of bron.matchAll(
    /(?:import|export)\s*(\*|\{[^}]*\})\s*from\s*['"]@coderius\/python-runner\/PyodideProvider['"]/g,
  )) {
    if (m[1] === '*' || /\bgetPyodide\b/.test(m[1])) return true;
  }
  return false;
}

/** Bronbestanden van een map, zonder tests, builds en node_modules. */
function bronnen(map: string): string[] {
  if (!existsSync(map)) return [];
  const uit: string[] = [];
  for (const item of readdirSync(map, { withFileTypes: true })) {
    if (['node_modules', 'build', 'static'].includes(item.name) || item.name.startsWith('.'))
      continue;
    const pad = join(map, item.name);
    if (item.isDirectory()) uit.push(...bronnen(pad));
    else if (/\.(ts|tsx|js|jsx|mjs|md|mdx)$/.test(item.name) && !/\.test\./.test(item.name))
      uit.push(pad);
  }
  return uit;
}

/** De clientModules uit docusaurus.config van een site, als absolute paden. */
function clientModules(siteMap: string): string[] {
  const config = ['docusaurus.config.ts', 'docusaurus.config.js']
    .map((n) => join(siteMap, n))
    .find(existsSync);
  if (!config) return [];
  const m = readFileSync(config, 'utf8').match(/clientModules:\s*\[([^\]]*)\]/);
  if (!m) return [];
  return [...m[1].matchAll(/['"]([^'"]+)['"]/g)].map((x) => resolve(siteMap, x[1]));
}

const sites = alleSiteMappen().map((s) => ({ id: s.id, map: join(ROOT, s.dir) }));

describe('laadtViaGedeeldeLader', () => {
  it('herkent de speeltuin, de editor en getPyodide', () => {
    expect(laadtViaGedeeldeLader("import X from '@coderius/python-runner/CodeExercise';")).toBe(
      true,
    );
    expect(laadtViaGedeeldeLader("import E from '@coderius/editor/ProjectEditor';")).toBe(true);
    expect(
      laadtViaGedeeldeLader(
        "import { getPyodide, runPython } from '@coderius/python-runner/PyodideProvider';",
      ),
    ).toBe(true);
    expect(laadtViaGedeeldeLader("export * from '@coderius/python-runner/PyodideProvider';")).toBe(
      true,
    );
  });

  it('en laat een site met een eigen lader of alleen hulpjes met rust', () => {
    // algorithms laadt Pyodide zelf en gebruikt alleen de opnemer.
    expect(
      laadtViaGedeeldeLader(
        "import { tracePython } from '@coderius/python-runner/PyodideProvider';",
      ),
    ).toBe(false);
    expect(laadtViaGedeeldeLader("import { leesProject } from '@coderius/editor/vfs/store';")).toBe(
      false,
    );
    expect(
      laadtViaGedeeldeLader("import H from '@coderius/python-runner/HighlightedEditor';"),
    ).toBe(false);
  });
});

describe('elke site die de gedeelde lader gebruikt', () => {
  const gebruikers = sites.filter(({ map }) =>
    // Ook de lessen: ctf importeert InlineEditor in een .md onder docs/.
    bronnen(map).some((pad) => laadtViaGedeeldeLader(readFileSync(pad, 'utf8'))),
  );

  it('er zijn er zo een paar', () => {
    // Ondergrens tegen een stille lege lijst: verhuist de lader of verandert
    // een importpad, dan hoort dat hier rood te worden en niet groen over niets.
    expect(gebruikers.map((s) => s.id).sort()).toEqual(
      expect.arrayContaining(['ctf', 'ide', 'python']),
    );
  });

  it('zet in een clientModule het adres van zijn eigen static/pyodide/', () => {
    const zonder = gebruikers
      .filter(({ map }) => {
        const zet = clientModules(map).some(
          (pad) =>
            existsSync(pad) &&
            /setPyodideBaseUrl\(\s*`\$\{siteConfig\.baseUrl\}pyodide\/`\s*\)/.test(
              readFileSync(pad, 'utf8'),
            ),
        );
        return !zet;
      })
      .map((s) => s.id);
    expect(zonder, 'roep setPyodideBaseUrl(`${siteConfig.baseUrl}pyodide/`) aan').toEqual([]);
  });

  it('serveert die Pyodide ook echt', () => {
    const zonder = gebruikers
      .filter(({ map }) => !existsSync(join(map, 'static', 'pyodide', 'pyodide.asm.wasm')))
      .map((s) => s.id);
    expect(zonder, 'draai `pnpm --filter <site> copy:pyodide`').toEqual([]);
  });
});

describe('de bron van sites en packages', () => {
  it('laadt Pyodide nergens van een CDN', () => {
    const treffers = [join(ROOT, 'sites'), join(ROOT, 'packages')]
      .flatMap(bronnen)
      // Een ophaalscript (haal-pyodide-wheels.mjs) mag de CDN noemen: dat
      // draait in CI of bij een auteur, niet in de browser van een leerling.
      .filter((pad) => !pad.split('/').includes('scripts'))
      .filter((pad) =>
        /cdn\.jsdelivr\.net\/pyodide|pyodide\/v\d+\.\d+\.\d+\/full/.test(readFileSync(pad, 'utf8')),
      )
      .map((pad) => relative(ROOT, pad));
    expect(treffers).toEqual([]);
  });
});

describe('getPyodide zonder adres', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it('valt niet terug op een CDN maar zegt wat er mist', async () => {
    vi.resetModules();
    const createElement = vi.fn();
    vi.stubGlobal('window', {});
    vi.stubGlobal('document', { createElement, head: { appendChild: vi.fn() } });
    const { getPyodide, GEEN_PYODIDE_ADRES } = await import('./PyodideProvider');

    await expect(getPyodide()).rejects.toThrow(GEEN_PYODIDE_ADRES);
    expect(createElement).not.toHaveBeenCalled();
  });

  it('laadt met een adres van dat adres, en na een fout opnieuw', async () => {
    vi.resetModules();
    const venster: { loadPyodide?: (o: { indexURL: string }) => Promise<unknown> } = {};
    const loadPyodide = vi.fn(async () => ({ versie: 'nep' }));
    const script: { src?: string; onload?: () => void } = {};
    vi.stubGlobal('window', venster);
    vi.stubGlobal('document', {
      createElement: () => script,
      head: {
        appendChild: () => {
          venster.loadPyodide = loadPyodide;
          script.onload?.();
        },
      },
    });
    const { getPyodide, setPyodideBaseUrl } = await import('./PyodideProvider');

    await expect(getPyodide()).rejects.toThrow();
    setPyodideBaseUrl('/python/pyodide');
    expect(await getPyodide()).toEqual({ versie: 'nep' });
    expect(script.src).toBe('/python/pyodide/pyodide.js');
    expect(loadPyodide).toHaveBeenCalledWith({ indexURL: '/python/pyodide/' });
  });
});

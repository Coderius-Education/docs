import { readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { type ViteDevServer, createServer, transformWithEsbuild } from 'vite';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import config, { JS_VAN_EEN_SITE, jsMetJsx } from '../../vitest.config';

// Een site schrijft JSX ook in een `.js`, zoals
// sites/informatica/play/src/components/CodeRunner/CodeEditor.js: Docusaurus
// vertaalt die bij de build, Vite leest een `.js` als gewone JavaScript.
//
// PygbagRunner.test.tsx importeert de speeltuin van play, en die de
// CodeEditor. De test vervangt hem met vi.mock, dus `pnpm test` was groen.
// `vitest related` loopt de imports van elke test af zonder mocks, en stopte
// daar met "Failed to parse source for import analysis". De job test in CI
// draait `related` bij elke wijziging die niet alles draait: sinds die test
// er was, was de job rood bij elke PR die geen globaal bestand raakte, ook
// als de PR alleen de nakijker veranderde.
//
// De stap jsMetJsx in vitest.config.ts vertaalt zo'n bestand eerst. Deze test
// legt elk `.js` in de repo dat geen gewone JavaScript is langs dezelfde weg
// als `related`: een server van Vite met de config van vitest.

const ROOT = fileURLToPath(new URL('../..', import.meta.url));
const OVERSLAAN = new Set([
  'node_modules',
  'build',
  'static',
  'dist',
  '.docusaurus',
  '.svelte-kit',
  '__fixtures__',
]);

function jsBestanden(map: string, uit: string[] = []): string[] {
  for (const item of readdirSync(map, { withFileTypes: true })) {
    if (OVERSLAAN.has(item.name)) continue;
    const pad = join(map, item.name);
    if (item.isDirectory()) jsBestanden(pad, uit);
    else if (item.name.endsWith('.js')) uit.push(pad);
  }
  return uit;
}

async function isGewoneJs(code: string, pad: string): Promise<boolean> {
  try {
    await transformWithEsbuild(code, pad, { loader: 'js' });
    return true;
  } catch {
    return false;
  }
}

const metJsx: string[] = [];
let server: ViteDevServer;

beforeAll(async () => {
  for (const pad of [...jsBestanden(join(ROOT, 'sites')), ...jsBestanden(join(ROOT, 'packages'))])
    if (!(await isGewoneJs(readFileSync(pad, 'utf8'), pad))) metJsx.push(pad);
  server = await createServer({
    root: ROOT,
    configFile: join(ROOT, 'vitest.config.ts'),
    server: { middlewareMode: true, ws: false, hmr: false, watch: null },
    optimizeDeps: { noDiscovery: true, include: [] },
    logLevel: 'silent',
    appType: 'custom',
  });
}, 60_000);

afterAll(async () => {
  await server?.close();
});

/** Zoals `vitest related` een bestand leest: vertalen en de imports nalopen. */
async function fout(pad: string, via: ViteDevServer = server): Promise<string> {
  try {
    await via.transformRequest(`/${relative(ROOT, pad).split('\\').join('/')}`, { ssr: true });
    return '';
  } catch (err) {
    return err instanceof Error ? err.message : String(err);
  }
}

describe('een .js met JSX in vitest', () => {
  it('de config van vitest heeft de stap', () => {
    const namen = (config.plugins ?? []).flat().map((p) => (p as { name?: string })?.name);
    expect(namen).toContain('coderius:js-met-jsx');
  });

  it('de repo heeft zulke bestanden, waaronder de CodeEditor van play', () => {
    const paden = metJsx.map((p) => relative(ROOT, p).split('\\').join('/'));
    expect(paden).toContain('sites/informatica/play/src/components/CodeRunner/CodeEditor.js');
  });

  it('elk van die bestanden valt onder de stap', () => {
    // Een `.js` met JSX buiten src/ van een site (in een package) heet .jsx.
    for (const pad of metJsx)
      expect(JS_VAN_EEN_SITE.test(pad.split('\\').join('/')), relative(ROOT, pad)).toBe(true);
  });

  it('Vite leest elk van die bestanden, zoals vitest related dat doet', async () => {
    for (const pad of metJsx)
      expect(await fout(pad), relative(ROOT, pad)).not.toMatch(/Failed to parse source/);
  }, 60_000);

  it('zonder de stap stopt Vite op zo een bestand', async () => {
    // De controle hierboven zegt alleen iets als hij zonder de stap faalt.
    const kaal = await createServer({
      root: ROOT,
      configFile: false,
      server: { middlewareMode: true, ws: false, hmr: false, watch: null },
      optimizeDeps: { noDiscovery: true, include: [] },
      logLevel: 'silent',
      appType: 'custom',
    });
    try {
      const pad = join(ROOT, 'sites/informatica/play/src/components/CodeRunner/CodeEditor.js');
      expect(await fout(pad, kaal)).toMatch(/Failed to parse source/);
    } finally {
      await kaal.close();
    }
  }, 60_000);

  it('de stap laat de rest met rust', async () => {
    const stap = jsMetJsx().transform as (code: string, id: string) => Promise<unknown>;
    const code = 'export const x = 1;\n';
    for (const id of [
      join(ROOT, 'packages/shared/sites.js'),
      join(ROOT, 'sites/informatica/play/src/components/PygbagRunner/maat.test.ts'),
      join(ROOT, 'sites/informatica/play/node_modules/pakket/src/index.js'),
      join(ROOT, 'sites/informatica/play/docusaurus.config.js'),
    ])
      expect(await stap(code, id), id).toBeNull();
    const uit = (await stap(
      'export default () => <p>hoi</p>;\n',
      join(ROOT, 'sites/informatica/play/src/theme/Root.js?v=1'),
    )) as { code: string };
    expect(await isGewoneJs(uit.code, 'Root.js')).toBe(true);
  });
});

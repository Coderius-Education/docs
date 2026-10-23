import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { siteMappenOpSchijf } from '@coderius/shared/voorkennis';
import { describe, expect, it, vi } from 'vitest';

// De sites werden gebouwd met de babel-preset van Docusaurus: preset-env in
// losse modus, met de browsers uit .browserslistrc. Zonder dat bestand zette
// hij alles om naar ES5, en in losse modus wordt [...x] dan [].concat(x).
// Voor een array maakt dat niet uit; een Map, Set of string wordt een lijst
// met één element. Zo werkte doorbladeren met dezelfde letter in elke
// keuzelijst niet ([...letters] op een string, Keuzelijst/logica.ts), en
// crashte de docentweergave van de nakijker op een Map — terwijl alle tests
// groen waren, want node draait de bron zonder die omzetting.
//
// Met Docusaurus Faster vertaalt niet babel maar de swc in rspack de code
// (builtin:swc-loader), en minifieert swc hem daarna. Deze test bouwt een
// proefbestand vanuit elke site met de vertaler die de build gebruikt, en
// voert het resultaat uit. Eerst draaide hij alleen nog babel, dat de build
// niet meer gebruikte.

const ROOT = fileURLToPath(new URL('../..', import.meta.url));
const require = createRequire(import.meta.url);
const { FASTER } = require('./config');

// @babel/core heeft geen eigen typen; dit is het stukje dat de test gebruikt.
interface Babel {
  transformSync(code: string, opties: Record<string, unknown>): { code?: string | null } | null;
}

/** De preset en @babel/core zoals een site ze bij het bouwen vindt. */
function babelVoor(site: string) {
  const vanSite = createRequire(join(site, 'package.json'));
  const presetPad = vanSite.resolve('@docusaurus/babel/preset');
  const vanPreset = createRequire(presetPad);
  const babel = vanPreset('@babel/core') as Babel;
  const preset = vanPreset(presetPad).default;
  return async (code: string) =>
    babel.transformSync(code, {
      filename: join(site, 'src/proef.js'),
      cwd: site,
      root: site,
      babelrc: false,
      configFile: false,
      presets: [preset],
      // Zo noemt Docusaurus de clientbuild; de serverbuild richt zich op node.
      caller: { name: 'client' },
    })?.code ?? '';
}

// Wat de test van @docusaurus/faster gebruikt.
interface Faster {
  // biome-ignore lint/suspicious/noExplicitAny: de config van rspack zelf
  rspack: any;
  getSwcLoaderOptions(opties: { isServer: boolean; bundlerName: string }): object;
  getSwcJsMinimizerOptions(): { ecma: number };
}

/**
 * Rspack zoals Docusaurus hem voor de clientbuild instelt: builtin:swc-loader
 * met de opties van @docusaurus/faster, en de swc-minifier met diens opties
 * (zie getRspackMinimizers in @docusaurus/bundler). De browsers leest faster
 * uit de map waarin de build draait, en dat is de site.
 */
function rspackVoor(site: string) {
  const faster = createRequire(join(site, 'package.json'))('@docusaurus/faster') as Faster;
  const cwd = vi.spyOn(process, 'cwd').mockReturnValue(site);
  const loaderOpties = faster.getSwcLoaderOptions({ isServer: false, bundlerName: 'rspack' });
  const minifier = faster.getSwcJsMinimizerOptions();
  cwd.mockRestore();
  const { rspack } = faster;

  return async (code: string) => {
    const map = mkdtempSync(join(tmpdir(), 'browsers-'));
    try {
      writeFileSync(join(map, 'proef.js'), code);
      const compiler = rspack({
        context: map,
        entry: './proef.js',
        mode: 'production',
        target: 'web',
        devtool: false,
        output: { path: join(map, 'uit'), filename: 'uit.js' },
        module: { rules: [{ test: /\.js$/, loader: 'builtin:swc-loader', options: loaderOpties }] },
        optimization: {
          minimizer: [
            new rspack.SwcJsMinimizerRspackPlugin({
              minimizerOptions: { minify: true, ...minifier },
            }),
          ],
        },
      });
      await new Promise<void>((klaar, fout) =>
        // biome-ignore lint/suspicious/noExplicitAny: Stats van rspack
        compiler.run((err: Error | null, stats: any) => {
          compiler.close(() => {});
          if (err) fout(err);
          else if (stats?.hasErrors()) fout(new Error(stats.toString()));
          else klaar();
        }),
      );
      return readFileSync(join(map, 'uit', 'uit.js'), 'utf8');
    } finally {
      rmSync(map, { recursive: true, force: true });
    }
  };
}

/** De vertaler die de build gebruikt. */
const vertalerVoor = FASTER.swcJsLoader && FASTER.rspackBundler ? rspackVoor : babelVoor;

const PROEF = `
const set = [...new Set([1, 1, 2])];
const letters = [..."ppp"];
const map = [...new Map([["a", 1]])];
globalThis.__browsersProef = { set, letters, map };
`;

// home bouwt met Vite, niet met Docusaurus.
const sites = siteMappenOpSchijf(ROOT)
  .map(({ map }) => map)
  .filter(
    (map) =>
      JSON.parse(readFileSync(join(map, 'package.json'), 'utf8')).dependencies?.[
        '@docusaurus/core'
      ],
  );

// De build draait met NODE_ENV=production; vitest met 'test'. Een
// browserslist met lijsten per omgeving zou hier dus een andere lijst
// kiezen dan bij het bouwen.
process.env.BROWSERSLIST_ENV = 'production';

describe('de clientbuild van elke site', () => {
  it('vindt de sites', () => {
    expect(sites.length).toBeGreaterThan(5);
  });

  it('.browserslistrc staat in de root, zodat elke site hem vindt', () => {
    expect(readFileSync(join(ROOT, '.browserslistrc'), 'utf8')).toMatch(/not dead/);
  });

  it.each(sites)('%s heeft geen eigen browserslist naast die in de root', (site) => {
    const pkg = JSON.parse(readFileSync(join(site, 'package.json'), 'utf8'));
    expect(pkg.browserslist).toBeUndefined();
  });

  it.each(sites)(
    '%s spreidt een Set, string en Map zoals de browser zelf',
    async (site) => {
      const code = await vertalerVoor(site)(PROEF);
      expect(code).not.toContain('[].concat(');
      new Function(code)();
      const uit = (globalThis as { __browsersProef?: Record<string, unknown> }).__browsersProef;
      expect(uit).toEqual({ set: [1, 2], letters: ['p', 'p', 'p'], map: [['a', 1]] });
    },
    30_000,
  );
});

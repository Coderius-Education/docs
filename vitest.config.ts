import { type Plugin, transformWithEsbuild } from 'vite';
import { defineConfig } from 'vitest/config';

// Een site schrijft JSX ook in een `.js` (24 bestanden: de editor van play, de
// terminal van linux): Docusaurus vertaalt die bij de build. Vite leest een
// `.js` als gewone JavaScript. In een gewone run viel dat niet op, want de
// test die zo'n bestand importeert, vervangt het met vi.mock. `vitest related`
// (de job test in CI, bij een wijziging die niet alles draait) loopt de
// imports van elke test af zonder mocks, en stopte op het eerste `.js` met
// JSX: "Failed to parse source for import analysis". Dat was zo bij elke PR
// sinds PygbagRunner.test.tsx de CodeEditor van play importeert.
// vitest-js-met-jsx.test.ts legt elk `.js` in de repo langs deze stap.
export const JS_VAN_EEN_SITE = /\/sites\/(?:[^/?]+\/)+src\/[^?]+\.js$/;

export function jsMetJsx(): Plugin {
  return {
    name: 'coderius:js-met-jsx',
    enforce: 'pre',
    async transform(code, id) {
      const pad = id.split('?')[0];
      if (!JS_VAN_EEN_SITE.test(pad) || pad.includes('/node_modules/')) return null;
      const uit = await transformWithEsbuild(code, pad, { loader: 'jsx', jsx: 'automatic' });
      return { code: uit.code, map: uit.map };
    },
  };
}

// Bewust een brede include: elk *.test.ts in packages/ of sites/ telt mee. Een
// smalle lijst met mappen zou een nieuwe test buiten die mappen stilzwijgend
// overslaan terwijl `pnpm test` groen blijft — en daar hangen de site-builds
// nu aan.
//
// De tests staan bij de code die ze bewaken: de nakijk-checker en de
// conceptenlijsten per site, de oefenterminal van Linux, de editor-package (preview-builder,
// bestandsboom, paden) en de python-runner. Een componenttest heet *.test.tsx
// en zet bovenaan `// @vitest-environment jsdom`; de rest draait in node. De
// Docusaurus-pagina's zelf worden niet getest — die dekt `pnpm build` af.
export default defineConfig({
  plugins: [jsMetJsx()],
  // Docusaurus lost `@docusaurus/BrowserOnly` en co. op in zijn eigen bundler.
  // Een componenttest (*.test.tsx) heeft het pad nodig om hem te kunnen mocken.
  resolve: {
    alias: {
      '@docusaurus/BrowserOnly': '@docusaurus/core/lib/client/exports/BrowserOnly.js',
      // Begrip (packages/shared/components/Begrip) gebruikt Link en de globale
      // data van zijn plugin; de test vervangt ze met vi.mock.
      '@docusaurus/Link': '@docusaurus/core/lib/client/exports/Link.js',
      '@docusaurus/useGlobalData': '@docusaurus/core/lib/client/exports/useGlobalData.js',
      // LesTabs (packages/shared/components/LesTabs) volgt het adres met
      // useLocation; de test vervangt de router met vi.mock.
      '@docusaurus/router': '@docusaurus/core/lib/client/exports/router.js',
      // Het voorbeeld in de robotica-editor (WebMicroEditor/Voorbeeld) linkt
      // naar een les met de baseUrl ervoor; de test vervangt de hook.
      '@docusaurus/useBaseUrl': '@docusaurus/core/lib/client/exports/useBaseUrl.js',
    },
  },
  test: {
    environment: 'node',
    include: ['{packages,sites}/**/*.test.{ts,tsx}'],
    exclude: ['**/node_modules/**', '**/build/**', '**/.docusaurus/**', '**/__fixtures__/**'],
    setupFiles: ['./vitest.setup.ts'],
    // `pnpm test:dekking`: de dekking van de python-runner, met een
    // ondergrens. De gewone `pnpm test` meet niets. De Python in recorder.ts
    // en turtle/module.ts staat als tekst in TypeScript en telt hier niet;
    // die draait in de node-tests in de echte Pyodide.
    coverage: {
      provider: 'v8',
      include: ['packages/python-runner/src/**'],
      exclude: [
        '**/*.test.{ts,tsx}',
        'packages/python-runner/src/nep-pyodide.ts',
        'packages/python-runner/src/pyodide-in-node.ts',
      ],
      reporter: ['text'],
      // Net onder de stand bij invoering (83% regels, 65% takken): een
      // daling valt op, een kleine schommeling niet. Gaat hij omhoog, zet de
      // grens dan mee.
      thresholds: {
        lines: 80,
        branches: 60,
      },
    },
  },
});

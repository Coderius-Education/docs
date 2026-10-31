import { defineConfig } from 'vitest/config';

// Bewust een brede include: elk *.test.ts in packages/ of sites/ telt mee. Een
// smalle lijst met mappen zou een nieuwe test buiten die mappen stilzwijgend
// overslaan terwijl `pnpm test` groen blijft — en daar hangen de site-builds
// nu aan.
//
// De tests staan bij de code die ze bewaken: de nakijk-checker en de
// conceptenlijsten per site, de DVWA-labs, de editor-package (preview-builder,
// bestandsboom, paden) en de python-runner. Een componenttest heet *.test.tsx
// en zet bovenaan `// @vitest-environment jsdom`; de rest draait in node. De
// Docusaurus-pagina's zelf worden niet getest — die dekt `pnpm build` af.
export default defineConfig({
  // Docusaurus lost `@docusaurus/BrowserOnly` en co. op in zijn eigen bundler.
  // Een componenttest (*.test.tsx) heeft het pad nodig om hem te kunnen mocken.
  resolve: {
    alias: {
      '@docusaurus/BrowserOnly': '@docusaurus/core/lib/client/exports/BrowserOnly.js',
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

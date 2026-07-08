import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [tailwindcss(), sveltekit()],
  // @coderius/shared is een CommonJS workspace-pakket (Docusaurus-toolchain);
  // we gebruiken alleen pure-data/pure-function subpaden (./sites, ./matomo,
  // ./privacy-content — geen React/JSX). Voor de client pre-bundelt esbuild ze
  // (named imports), en in de build neemt rollup ze mee in de CJS-transform.
  // SSR laten we het bewust EXTERNAL zodat Node de CJS-module native laadt —
  // anders evalueert de dev-SSR `module.exports` als ESM ("module is not
  // defined"). Daarom forceren we het EXTERNAL voor SSR (workspace-pakketten
  // worden anders ge-inlined).
  ssr: { external: ['@coderius/shared'] },
  optimizeDeps: {
    include: [
      '@coderius/shared/sites',
      '@coderius/shared/matomo',
      '@coderius/shared/privacy-content',
    ],
  },
  build: { commonjsOptions: { include: [/packages[/\\]shared/, /node_modules/] } },
});

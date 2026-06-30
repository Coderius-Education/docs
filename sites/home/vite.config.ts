import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()],
	// @coderius/shared is een CommonJS workspace-pakket (Docusaurus-toolchain).
	// We gebruiken alleen het pure-data subpad ./sites. Vite transformeert CJS
	// standaard alleen in node_modules; dit workspace-pakket resolved naar zijn
	// echte pad onder packages/shared, dus we nemen het expliciet mee zodat de
	// named imports (SITES_BY_ID, HOME) werken in dev (esbuild) én build (rollup).
	ssr: { noExternal: ['@coderius/shared'] },
	optimizeDeps: { include: ['@coderius/shared/sites'] },
	build: { commonjsOptions: { include: [/packages[/\\]shared/, /node_modules/] } }
});

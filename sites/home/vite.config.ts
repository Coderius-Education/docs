import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()],
	// @coderius/shared is een CommonJS workspace-pakket (Docusaurus-toolchain);
	// we gebruiken alleen het pure-data subpad ./sites. Voor de client pre-bundelt
	// esbuild het (named imports), en in de build neemt rollup het mee in de CJS-
	// transform. SSR laten we het bewust EXTERNAL zodat Node de CJS-module native
	// laadt — anders evalueert de dev-SSR `module.exports` als ESM ("module is not
	// defined"). Daarom forceren we het EXTERNAL voor SSR (workspace-pakketten
	// worden anders ge-inlined).
	ssr: { external: ['@coderius/shared'] },
	optimizeDeps: { include: ['@coderius/shared/sites'] },
	build: { commonjsOptions: { include: [/packages[/\\]shared/, /node_modules/] } }
});

import registry from '@coderius/shared/sites';
import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

// Paden van de cursussen op een vak-host (/python/, /algoritmes/, …). Die horen
// bij een andere build, dus kent de prerender ze niet; een vakpagina mag er wel
// naar linken. Elke andere kapotte link breekt de build nog steeds.
const cursusPaden = new Set(
  [...registry.SITES, ...registry.DOCENTEN_SITES].map((site) => site.path).filter(Boolean),
);

/** @type {import('@sveltejs/kit').Config} */
const config = {
  // Consult https://svelte.dev/docs/kit/integrations
  // for more information about preprocessors
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter({
      fallback: '404.html',
    }),
    prerender: {
      handleHttpError({ path, message }) {
        const eersteSegment = path.split('/')[1];
        if (cursusPaden.has(eersteSegment)) return;
        throw new Error(message);
      },
    },
  },
};

export default config;

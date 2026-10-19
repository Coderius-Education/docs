import { join } from 'node:path';
import type { LoadContext, Plugin } from '@docusaurus/types';
import type { Lesstof } from './buitenLesstof';
import { LESSTOF_BRONNEN, berekenLesstof } from './lesstof';

// Berekent bij het bouwen wat de lessen behandelen, en zet het als data
// klaar voor de docentweergave van de nakijker:
//   import LESSTOF from '@generated/coderius-lesstof/default/lesstof.json';
// In de dev-server rekent hij opnieuw zodra een les verandert.

export default function lesstofPlugin(context: LoadContext): Plugin<Lesstof> {
  return {
    name: 'coderius-lesstof',
    loadContent: async () => berekenLesstof(context.siteDir),
    contentLoaded: async ({ content, actions }) => {
      await actions.createData('lesstof.json', JSON.stringify(content));
    },
    getPathsToWatch: () => LESSTOF_BRONNEN.map((b) => join(context.siteDir, b, '**/*.{md,mdx}')),
  };
}

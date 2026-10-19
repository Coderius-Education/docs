import type { LoadContext, Plugin } from '@docusaurus/types';
import type { Lesstof } from './buitenLesstof';
import { berekenLesstof, lesstofWatchPaden } from './lesstof';

// Berekent bij het bouwen wat de lessen behandelen, en zet het als data
// klaar voor de docentweergave van de nakijker:
//   import LESSTOF from '@generated/coderius-lesstof/default/lesstof.json';
// In de dev-server rekent hij opnieuw zodra een les verandert.

/** De naam van de plugin; hij bepaalt het pad onder @generated. */
export const LESSTOF_PLUGIN = 'coderius-lesstof';

export default function lesstofPlugin(context: LoadContext): Plugin<Lesstof> {
  return {
    name: LESSTOF_PLUGIN,
    loadContent: async () => berekenLesstof(context.siteDir),
    contentLoaded: async ({ content, actions }) => {
      await actions.createData('lesstof.json', JSON.stringify(content));
    },
    getPathsToWatch: () => lesstofWatchPaden(context.siteDir),
  };
}

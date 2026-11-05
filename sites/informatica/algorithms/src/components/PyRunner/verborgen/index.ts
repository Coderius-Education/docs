import cfgParser from './cfg-parser';
import dijkstraCompleet from './dijkstra-compleet';
import doolhofBuren from './doolhof-buren';
import knn from './knn';
import minimaxHelpers from './minimax-helpers';
import nimLeren from './nim-leren';

// Code die een PyRunner vóór de zichtbare code draait maar niet in de editor
// zet: <PyRunner verborgen="cfg-parser" …>. De cfg-runners hadden tachtig
// regels parser-motor onder elf regels grammatica, en de uitvoer stond
// daardoor twee schermen onder de knop. Onder de editor staat hij nog wel,
// uitklapbaar en alleen-lezen, voor wie hem wil lezen.
//
// Elk stuk is één bestand met `export default String.raw\`…\``, zodat
// scripts/draai-python-blokken.py hetzelfde stuk kan lezen (tussen de
// eerste en de laatste backtick) en er vóór de runner-code plakt. Een
// nieuw stuk: bestand erbij, hier registreren, en de naam in de les.
export const VERBORGEN: Record<string, string> = {
  'cfg-parser': cfgParser,
  'dijkstra-compleet': dijkstraCompleet,
  'doolhof-buren': doolhofBuren,
  knn,
  'minimax-helpers': minimaxHelpers,
  'nim-leren': nimLeren,
};

export function verborgenCode(naam: string): string {
  const code = VERBORGEN[naam];
  if (code === undefined)
    throw new Error(
      `onbekende verborgen code "${naam}"; zie src/components/PyRunner/verborgen/index.ts`,
    );
  return code;
}

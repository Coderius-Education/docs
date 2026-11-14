import buurModel from './buur-model';
import cfgParser from './cfg-parser';
import dijkstraCompleet from './dijkstra-compleet';
import doolhofBuren from './doolhof-buren';
import fruitTekenen from './fruit-tekenen';
import fruitToets from './fruit-toets';
import knn from './knn';
import metro from './metro';
import metroZoeken from './metro-zoeken';
import minimaxHelpers from './minimax-helpers';
import muisGang from './muis-gang';
import muisLeert from './muis-leert';
import neuron from './neuron';
import neuronLaag from './neuron-laag';
import nimLeren from './nim-leren';
import spamTellingen from './spam-tellingen';
import tekensLeren from './tekens-leren';
import tekensToetsen from './tekens-toetsen';
import weerHerfst from './weer-herfst';

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
  'buur-model': buurModel,
  'cfg-parser': cfgParser,
  'dijkstra-compleet': dijkstraCompleet,
  'doolhof-buren': doolhofBuren,
  'fruit-tekenen': fruitTekenen,
  'fruit-toets': fruitToets,
  knn,
  metro,
  'metro-zoeken': metroZoeken,
  'minimax-helpers': minimaxHelpers,
  'muis-gang': muisGang,
  'muis-leert': muisLeert,
  neuron,
  'neuron-laag': neuronLaag,
  'nim-leren': nimLeren,
  'spam-tellingen': spamTellingen,
  'tekens-leren': tekensLeren,
  'tekens-toetsen': tekensToetsen,
  'weer-herfst': weerHerfst,
};

export function verborgenCode(naam: string): string {
  const code = VERBORGEN[naam];
  if (code === undefined)
    throw new Error(
      `onbekende verborgen code "${naam}"; zie src/components/PyRunner/verborgen/index.ts`,
    );
  return code;
}

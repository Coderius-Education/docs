import { useSyncExternalStore } from 'react';

/** Een les ervoor of erna: wat Docusaurus onder de pagina zet. */
export type Buur = { titel: string; adres: string };
export type Buren = { vorige?: Buur; volgende?: Buur };

// De vorige en de volgende les. Op het eerste scherm van een les gaat de knop
// Vorige naar de vorige les, op het laatste de knop Volgende naar de volgende.
//
// Docusaurus geeft ze aan zijn paginator onder de les (theme/DocPaginator, een
// wikkel in de gedeelde themamap); die zet ze hier neer. useDoc() kon het niet:
// het gedeelde pakket ziet een andere kopie van de docs-plugin dan het thema,
// met een eigen context, en dan gooit useDoc buiten zijn provider.
//
// Pas na het laden: de paginator staat na de les, en schrijft in een effect.
// Op de server (en in de HTML van de build) zijn er dus geen buren.
let huidig: Buren = {};
const luisteraars = new Set<() => void>();

export function zetBuren(buren: Buren): void {
  const zelfde = (a?: Buur, b?: Buur) => a?.adres === b?.adres && a?.titel === b?.titel;
  if (zelfde(huidig.vorige, buren.vorige) && zelfde(huidig.volgende, buren.volgende)) return;
  huidig = buren;
  for (const luister of luisteraars) luister();
}

function abonneer(luister: () => void) {
  luisteraars.add(luister);
  return () => luisteraars.delete(luister);
}

const geen: Buren = {};

export function useBuren(): Buren {
  return useSyncExternalStore(
    abonneer,
    () => huidig,
    () => geen,
  );
}

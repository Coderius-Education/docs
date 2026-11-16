import { type Opslag, maakOpslag } from '@coderius/shared/oefenveld/opslag';

// Het veld bewaart de code van de leerling in deze browser, zoals het
// oefenveld van web (packages/shared/oefenveld). Elke cursus heeft zijn eigen
// database: alle cursussen van een vak delen één origin.

export interface Code extends Record<string, string> {
  code: string;
}

const perSite = new Map<string, Opslag<Code>>();

/** De opslag van een cursus; `site` is zijn id in de registry. */
export function opslagVoor(site: string): Opslag<Code> {
  let opslag = perSite.get(site);
  if (!opslag) {
    opslag = maakOpslag<Code>({ site, naam: 'oefenvelden', delen: ['code'] });
    perSite.set(site, opslag);
  }
  return opslag;
}

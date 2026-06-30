// Types voor de gedeelde cursus-registry (sites.js is plain CommonJS-data).
// Zo kunnen TS-consumenten zoals de SvelteKit-homepage de registry typed
// importeren via `@coderius/shared/sites`.

export interface Site {
  /** stabiele sleutel, bv. 'python' (gebruikt door <Voorkennis site="...">) */
  id: string;
  /** weergavenaam */
  label: string;
  /** productie-URL (subdomein); bepaalt ook welke site "huidig" is */
  url: string;
  /** korte omschrijving (footer/overzicht) */
  description: string;
  /** leerlijn-voorkennis: cursussen waarop deze voortbouwt */
  requires: string[];
}

/** De apex-homepage. Geen cursus, dus niet opgenomen in SITES. */
export interface HomeSite {
  id: 'home';
  label: string;
  url: string;
  description: string;
}

export const SITES: Site[];
export const SITES_BY_ID: Record<string, Site>;
export const HOME: HomeSite;
export function normalizeUrl(url: string | null | undefined): string;
export function siteByUrl(url: string | null | undefined): Site | undefined;

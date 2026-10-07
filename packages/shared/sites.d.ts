// Types voor de gedeelde cursus-registry (sites.js is plain CommonJS-data).
// Zo kunnen TS-consumenten zoals de SvelteKit-homepage de registry typed
// importeren via `@coderius/shared/sites`.

/** Een vak met een eigen host, bv. informatica.coderius.nl. */
export interface Subject {
  /** stabiele sleutel, bv. 'informatica'; ook de map onder `sites/` */
  id: string;
  /** weergavenaam, bv. 'Informatica' */
  label: string;
  /** kale origin van het vak, zonder slash erachter */
  url: string;
}

export interface Site {
  /** stabiele sleutel, bv. 'python' (gebruikt door <Voorkennis site="...">); ook de mapnaam */
  id: string;
  /** weergavenaam */
  label: string;
  /** id van het vak (SUBJECTS) */
  subject: string;
  /** URL-segment onder de host van het vak, bv. 'algoritmes' */
  path: string;
  /** productie-URL, afgeleid: `${vak.url}/${path}/` (mét slash erachter) */
  url: string;
  /** het oude subdomein (bv. 'https://python.coderius.nl'), als de cursus er een had */
  legacyUrl?: string;
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

export const SUBJECTS: Subject[];
export const SUBJECTS_BY_ID: Record<string, Subject>;
export const SITES: Site[];
/** Sites voor docenten (didactiek); geen cursussen, dus niet in SITES. */
export const DOCENTEN_SITES: Site[];
/** Cursussen én docentensites, op id. */
export const SITES_BY_ID: Record<string, Site>;
export const HOME: HomeSite;

/** De monorepo waarin alle cursussen en gedeelde packages staan. */
export const REPO_URL: string;

/** Basis-URL voor Docusaurus' `editUrl` van de site met dit id. */
export function repoEditUrl(id: string): string;
/** Map van de site relatief aan de repo-root: `sites/<vak>/<id>`, of `sites/home`. */
export function siteDir(id: string): string;
/** Alle sites plus de homepage, met hun map. */
export function alleSiteMappen(): { id: string; dir: string }[];
/** Cursussen (SITES) van één vak, in leerlijn-volgorde. */
export function sitesOfSubject(subjectId: string): Site[];
/** Host van het oude subdomein, bv. 'python.coderius.nl'. */
export function legacyHost(id: string): string | undefined;
export function normalizeUrl(url: string | null | undefined): string;
/** Cursus waaronder deze url valt (origin + pad-prefix). */
export function siteByUrl(url: string | null | undefined): Site | undefined;

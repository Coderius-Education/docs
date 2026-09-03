import { DOCENTEN_SITES, SITES_BY_ID, type Site, normalizeUrl } from '@coderius/shared/sites';
import { type Activity, curriculum } from './Curriculum';

// De docentenpagina koppelt elk subdomein aan zijn cursus én aan de
// docentenhandleiding die elke cursussite op /docenten heeft (schrijfgids
// §15). Of die pagina's bestaan bewaakt docenten.test.ts vóór de build en de
// CI-job cross-links erna, tegen de gebouwde sites.

/** De docentenhandleiding van een cursussite, uit de registry-URL van die site. */
export function docentenUrl(url: string): string {
  return `${normalizeUrl(url)}/docenten`;
}

/** Zichtbare hostnaam van een cursus-URL, voor in de tabel. */
export function hostVan(url: string): string {
  return new URL(url).host;
}

/**
 * Docentensites die de homepage nog niet toont, totdat ze volwassen zijn. Ze
 * blijven in de registry staan: die moet gelijk lopen met de mappen onder
 * sites/, en <SiteLink site="didactiek"> vanuit een les mag blijven werken.
 */
export const NOG_VERBORGEN = ['didactiek'];

/** Hulpmiddelen, geen cursussen: de online editor en de volwassen docentensites. */
export const HULPMIDDELEN: Site[] = [
  SITES_BY_ID.ide,
  ...DOCENTEN_SITES.filter((s) => !NOG_VERBORGEN.includes(s.id)),
].filter(Boolean);

/** De cursussen op de docentenpagina: alles uit het curriculum behalve de hulpmiddelen. */
export const docentenCursussen: Activity[] = curriculum.filter((c) => c.id !== 'ide');

/** Cursussen die zowel in klas 4 als in klas 5+ passen. */
export const GEDEELD = ['robotica', 'godot'];

/** Klas waarin een cursus meestal valt; robotica en godot passen in beide. */
export function klasVan(activity: Activity): string {
  if (GEDEELD.includes(activity.id)) return '4 en 5+';
  return activity.level === 'Beginner' ? '4' : '5+';
}

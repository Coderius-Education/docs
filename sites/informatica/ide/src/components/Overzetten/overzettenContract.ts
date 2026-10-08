import type { Project } from '@coderius/editor/vfs/types';
import { SITES_BY_ID } from '@coderius/shared/sites';

// Projecten van vóór de verhuizing staan in de IndexedDB van de oude origin
// (https://ide.coderius.nl, database 'coderius-editor', store 'projects').
// Vanaf de nieuwe origin (https://informatica.coderius.nl/ide/) zijn ze niet te
// lezen. Daarom serveert ide.coderius.nl nog één pagina, /oud/overzetten/
// (static/oud/overzetten/ in deze site; docs-management laat dat pad door via
// legacy_paths), die de projecten leest en via postMessage aan
// /ide/overzetten geeft.
//
// Het gesprek, met op elke stap een exacte origin- én venstercontrole:
//   1. oude pagina opent de nieuwe met window.open (zonder noopener);
//   2. nieuw -> opener:  { source: BRON_NIEUW, type: 'klaar' }
//   3. oud  -> venster:  { source: BRON_OUD, type: 'projecten', versie: 1, projecten }
//   4. nieuw -> opener:  { source: BRON_NIEUW, type: 'ontvangen', aantal }
//
// Dit zijn wire-waarden tussen twee origins. static/oud/overzetten/overzetten.js
// heeft ze als letterlijke strings; overzettenContract.test.ts eist dat die
// gelijk zijn aan deze.
export const BRON_OUD = 'coderius-ide-oud';
export const BRON_NIEUW = 'coderius-ide-overzetten';
export const VERSIE = 1;

// Wat de oude opslag gebruikte (DEFAULT_STORAGE_PREFIX vóór projectOpslag()).
export const OUDE_DATABASE = 'coderius-editor';
export const OUDE_STORE = 'projects';

// Ruime grenzen: een project is tekst, een paar honderd KB is al veel. Ze
// houden een kapot of vijandig bericht uit de opslag van de leerling.
export const MAX_PROJECTEN = 500;
export const MAX_BESTANDEN = 1000;
export const MAX_TEKENS = 50 * 1024 * 1024;

/**
 * De oude origin bij een nieuwe: informatica.<domein> -> ide.<domein>, met
 * hetzelfde protocol en dezelfde poort (zo werkt het ook op *.localtest.me).
 * In productie is dat legacyUrl van de ide in de registry.
 */
export function oudeOrigin(nieuw: { protocol: string; hostname: string; port: string }): string {
  const vakHost = new URL(SITES_BY_ID.ide.url).hostname; // informatica.coderius.nl
  const vak = vakHost.split('.')[0];
  const domein = nieuw.hostname.startsWith(`${vak}.`)
    ? nieuw.hostname.slice(vak.length + 1)
    : nieuw.hostname;
  const poort = nieuw.port ? `:${nieuw.port}` : '';
  return `${nieuw.protocol}//ide.${domein}${poort}`;
}

function isTekst(v: unknown, max = 1000): v is string {
  return typeof v === 'string' && v.length <= max;
}

/** Bestandspad binnen een project: relatief, zonder '..' of lege stukken. */
function isPad(p: string): boolean {
  if (!p || p.length > 500 || p.startsWith('/') || p.includes('\\')) return false;
  return p.split('/').every((deel) => deel !== '' && deel !== '.' && deel !== '..');
}

/** Eén project uit de oude opslag, of null als het niet de vorm van Project heeft. */
export function leesProject(data: unknown): Project | null {
  if (typeof data !== 'object' || data === null) return null;
  const d = data as Record<string, unknown>;
  if (!isTekst(d.id, 100) || !d.id) return null;
  if (!isTekst(d.name, 200) || !isTekst(d.runnerId, 50) || !d.runnerId) return null;
  if (!isTekst(d.entry, 500)) return null;
  if (typeof d.files !== 'object' || d.files === null || Array.isArray(d.files)) return null;
  const files: Record<string, string> = {};
  const paden = Object.keys(d.files);
  if (paden.length > MAX_BESTANDEN) return null;
  for (const pad of paden) {
    const inhoud = (d.files as Record<string, unknown>)[pad];
    if (!isPad(pad) || typeof inhoud !== 'string') return null;
    files[pad] = inhoud;
  }
  const folders = Array.isArray(d.folders) ? d.folders : [];
  if (!folders.every((f) => typeof f === 'string' && isPad(f))) return null;
  const getal = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : 0);
  return {
    id: d.id,
    name: d.name || 'Naamloos project',
    runnerId: d.runnerId,
    entry: d.entry,
    files,
    folders: folders as string[],
    createdAt: getal(d.createdAt),
    updatedAt: getal(d.updatedAt),
  };
}

/**
 * De projecten uit een bericht (stap 3) of een gedownload bestand (zelfde
 * vorm). Ongeldige projecten vallen af; een bericht dat het contract niet
 * volgt, of te groot is, geeft null.
 */
export function leesProjecten(data: unknown): Project[] | null {
  if (typeof data !== 'object' || data === null) return null;
  const d = data as Record<string, unknown>;
  if (d.source !== BRON_OUD || d.type !== 'projecten' || d.versie !== VERSIE) return null;
  if (!Array.isArray(d.projecten) || d.projecten.length > MAX_PROJECTEN) return null;
  let tekens = 0;
  const uit: Project[] = [];
  for (const ruw of d.projecten) {
    const p = leesProject(ruw);
    if (!p) continue;
    tekens += Object.values(p.files).reduce((n, s) => n + s.length, 0);
    if (tekens > MAX_TEKENS) return null;
    uit.push(p);
  }
  return uit;
}

/**
 * Komt het bericht van de oude IDE-pagina die ons opende? Exacte origin, en
 * het venster moet onze opener zijn: een ander tabblad op ide.coderius.nl
 * telt niet.
 */
export function isVanOudePagina(
  origin: string,
  source: unknown,
  opener: unknown,
  verwacht: string,
): boolean {
  return origin === verwacht && opener != null && source === opener;
}

/**
 * Overschrijven of niet? Een project behoudt zijn id, dus twee keer overzetten
 * geeft geen dubbele projecten. Is het project hier al nieuwer (na de eerste
 * keer verder gewerkt), dan blijft dat staan.
 */
export function moetOpslaan(nieuw: Project, bestaand: Project | undefined): boolean {
  return !bestaand || bestaand.updatedAt < nieuw.updatedAt;
}

export const KLAAR_BERICHT = { source: BRON_NIEUW, type: 'klaar' } as const;

export function ontvangenBericht(aantal: number) {
  return { source: BRON_NIEUW, type: 'ontvangen', aantal } as const;
}

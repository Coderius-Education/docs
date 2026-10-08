export interface LocalStorageRegel {
  van: string;
  naar?: string;
  prefix?: boolean;
  label: string;
}
export interface IndexedDbRegel {
  van: string;
  store: string;
  naar?: string;
  /** Sleutels beginnen met het pagina-pad; zet het cursuspad ervoor. */
  sleutelBegintMetPad?: boolean;
  label: string;
}
export interface OudeOpslagRegels {
  localStorage?: LocalStorageRegel[];
  indexedDB?: IndexedDbRegel[];
}
export interface Gelezen {
  localStorage: [string, string][];
  indexedDB: { regel: IndexedDbRegel; items: [IDBValidKey, unknown][] }[];
}
export interface Schrijfplan {
  localStorage: [string, string][];
  indexedDB: { database: string; store: string; items: [IDBValidKey, unknown][] }[];
}
export const BRON_OUD: string;
export const BRON_NIEUW: string;
export const VERSIE: number;
export const MAX_SLEUTELS: number;
export const MAX_TEKENS: number;
export function controleerRegels(regels: unknown): OudeOpslagRegels;
export function nieuweSleutel(
  siteId: string,
  regels: OudeOpslagRegels,
  sleutel: string,
): string | null;
export function nieuweDatabase(siteId: string, regel: IndexedDbRegel): string;
export function leesBericht(
  data: unknown,
  siteId: string,
  regels: OudeOpslagRegels,
): Gelezen | null;
export function schrijfplan(
  gelezen: Gelezen,
  siteId: string,
  regels: OudeOpslagRegels,
): Schrijfplan;
export function oudeOrigin(
  siteId: string,
  nieuw: { protocol: string; hostname: string; port: string },
): string;
export function paginaGegevens(
  siteId: string,
  regels: OudeOpslagRegels,
): {
  versie: number;
  site: string;
  naam: string;
  vak: string;
  pad: string;
  regels: OudeOpslagRegels;
};
export function sleutelMetPad(sleutel: IDBValidKey, cursusPad: string): IDBValidKey;

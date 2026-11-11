export interface WerkvormTip {
  /** De pagina bij vakdidactiek: /bronnen/<slug>. */
  slug: string;
  /** De naam van de tip, zoals hij bij vakdidactiek heet. */
  term: string;
}

export interface Werkvorm {
  id: string;
  label: string;
  /** Wat de leerling doet, in één zin voor de docent. */
  doet: string;
  /** Reguliere expressies op de tekst van een `##`-kop. */
  koppen: string[];
  /** Van een rij koppen met dit patroon is de laatste deze werkvorm. */
  laatsteVan?: string;
  /** De werkvorm van een kop die bij geen andere hoort. */
  standaard?: boolean;
  tips: WerkvormTip[];
  /** De paden van het icoon, in een vlak van 24 bij 24. */
  icoon: string[];
}

export const WERKVORMEN: Werkvorm[];
export function werkvorm(id: string): Werkvorm | undefined;
export function werkvormVan(titel: string): string;
export function werkvormenVan(titels: string[]): string[];

/** Eén begrip zoals het in src/begrippen.json staat (na leesBegrippen). */
export interface Begrip {
  id: string;
  term: string;
  /** De woorden waarop de tooltip komt; standaard alleen de term. */
  vormen: string[];
  /** Eén zin, voor de tooltip en de woordenlijst. Tussen backticks is code. */
  kort: string;
  /** Doc-id van de les die het begrip uitlegt. */
  les?: string;
  anker?: string;
}

/** Een begrip zoals het in de globale data van de plugin staat. */
export interface GekoppeldBegrip {
  id: string;
  term: string;
  kort: string;
  les?: { titel: string; pad: string };
}

export const VELDEN: string[];
export function begrippenBestand(siteDir: string): string;
export function leesBegrippen(
  data: unknown,
  bron?: string,
): { begrippen: Begrip[]; overslaan: string[]; woordenlijst?: string };

/** De globale data van de plugin (usePluginData('coderius-begrippen')). */
export interface BegrippenData {
  begrippen: GekoppeldBegrip[];
  /** Het adres van de woordenlijst, of null als de cursus er geen heeft. */
  woordenlijst: string | null;
}
export function slaOver(docId: string, overslaan: string[]): boolean;
export function markeer(
  tree: unknown,
  begrippen: Pick<Begrip, 'id' | 'vormen' | 'les'>[],
  opties?: { docId?: string },
): string[];

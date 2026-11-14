export type Bereik = [number, number];
export type Bestanden = Record<string, Bereik[]>;

export type Runner = { draaien: boolean; alles: boolean };

export type Plan = {
  versie: 1;
  base: string | null;
  volledig: boolean;
  reden: string;
  bestanden: Bestanden;
  sites: string[];
  ongewijzigd: string[];
  pakketten: string[];
  jobs: {
    test: boolean;
    checks: boolean;
    lint: boolean;
    tekst: boolean;
    crosslinks: boolean;
    browser: boolean;
    terminal: boolean;
  };
  /**
   * De cursussen met les-tabbladen die de job `schermen` meet. `alles`: de
   * meting zelf veranderde, dus elke cursus met tabbladen, helemaal.
   * `viaPakket`: per cursus een gewijzigd bestand in een package waar hij van
   * afhangt; dan meet de job de hele cursus.
   */
  schermen: { sites: string[]; alles: boolean; viaPakket: Record<string, string> };
  runners: Record<string, Runner>;
  tekst: { alles: boolean; bestanden: string[] };
  vitest: { alles: boolean; bestanden: string[] };
};

export type Gewijzigd = Pick<Plan, 'volledig' | 'bestanden'> & Partial<Pick<Plan, 'runners'>>;

export declare const HEEL_BESTAND: Bereik;
export declare const GLOBAAL: string[];
export declare const PER_JOB: Record<
  'vitest' | 'lint' | 'tekst' | 'crosslinks' | 'browser' | 'terminal' | 'schermen',
  string[]
>;
export declare const RUNNERS: Record<string, { site: string; leest: string[]; alles: string[] }>;
export declare function parseDiff(diff: string): Bestanden;
export declare function overlapt(
  bereiken: Bereik[] | undefined,
  start: number,
  eind?: number,
): boolean;
export declare function binnenWijziging(
  gewijzigd: Partial<Gewijzigd>,
  pad: string,
  start: number,
  eind?: number,
): boolean;
export declare function opGewijzigdeRegels<M extends { regel: number; eind?: number }>(
  meldingen: M[],
  bereiken: Bereik[] | undefined,
): M[];
export declare function runnerAlles(gewijzigd: Partial<Gewijzigd>, naam: string): boolean;
export declare function isGlobaal(pad: string): boolean;
export declare const MAX_BESTANDEN: number;
/** Reden voor een volledige run op grond van alleen de bestandsnamen, of null. */
export declare function volledigOpNamen(namen: string[], max?: number): string | null;
export declare function workspaceAfhankelijkheden(
  pakketten: Record<string, { naam: string; deps: string[] }>,
  dir: string,
): string[];
export declare function plan(invoer: {
  bestanden: Bestanden;
  geraakt: string[];
  alleMappen: string[];
  sites: { id: string; dir: string }[];
  tests: { pad: string; tekst: string }[];
  volledig?: boolean;
  reden?: string;
  base?: string | null;
  metTabbladen?: string[];
  afhankelijkheden?: Record<string, string[]>;
}): Plan;
/** Zet deze docusaurus.config.ts de les-tabbladen aan (een ware `lesTabs`)? */
export declare function heeftLesTabs(bron: string): boolean;
/** De cursussen met les-tabbladen, in de volgorde van `sites`. */
export declare function cursussenMetTabbladen(
  sites: { id: string; dir: string }[],
  leesConfig: (dir: string) => string | null,
): string[];

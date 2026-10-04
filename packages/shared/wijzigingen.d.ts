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
  jobs: { test: boolean; checks: boolean; lint: boolean; tekst: boolean; crosslinks: boolean };
  runners: Record<string, Runner>;
  tekst: { alles: boolean; bestanden: string[] };
  vitest: { alles: boolean; bestanden: string[] };
};

export type Gewijzigd = Pick<Plan, 'volledig' | 'bestanden'> & Partial<Pick<Plan, 'runners'>>;

export declare const HEEL_BESTAND: Bereik;
export declare const GLOBAAL: string[];
export declare const PER_JOB: Record<'vitest' | 'lint' | 'tekst' | 'crosslinks', string[]>;
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
}): Plan;

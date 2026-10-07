export type Niveau = 'fout' | 'waarschuwing';

export type Melding = {
  regel: number;
  /** laatste regel van de melding (een lange zin beslaat er meer) */
  eind: number;
  naam: string;
  niveau: Niveau;
  bericht: string;
};

export type Regel = {
  naam: string;
  niveau: Niveau;
  metLinkdoelen?: boolean;
  nietIn?: RegExp;
  zoek(proza: string): Iterable<{ index: number; lengte?: number; bericht: string }>;
};

export declare const REGELS: Regel[];
export declare const REGELNAMEN: Set<string>;
export declare function alleenProza(tekst: string, opties?: { linkdoelen?: boolean }): string;
export declare function controleer(tekst: string, opties?: { bestand?: string }): Melding[];

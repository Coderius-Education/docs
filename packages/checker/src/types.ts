// Domein-onafhankelijke types voor de gedeelde 'nakijken'-checker. Een site
// levert een CheckerConfig aan (welke concepten, hoe bestanden te classificeren,
// welke onderwerpen) en de engine analyseert een geüpload project client-side.

export type Level = 'basis' | 'gevorderd';

export interface ProjectFile {
  /** Genormaliseerd, "/"-gescheiden pad, geen leidende "/". */
  path: string;
  /** Kind-id uit config.classify (bv. 'py', 'html', 'css', 'image', 'other'). */
  kind: string;
  /** Tekstinhoud (voor tekst-kinds), data-URL (voor image-kinds), of null. */
  content: string | null;
  sizeBytes: number;
  tooLarge: boolean;
}

export type ProjectFiles = Record<string, ProjectFile>;

/** Hoe een concept gedetecteerd wordt. */
export type ConceptDetect =
  | {
      type: 'regex';
      /** Globaal (`/g`) patroon, geteld over de inhoud van bestanden. */
      pattern: RegExp;
      /** Beperk tot bepaalde kinds; standaard alle tekst-kinds. */
      in?: string[];
      /**
       * Hoe vaak het patroon minstens moet voorkomen (standaard 1). Zo houd je
       * twee concepten uit elkaar die hetzelfde patroon delen: "twee
       * IR-sensoren" en "vier IR-sensoren" zijn allebei `AnalogIR(`, alleen
       * met een andere drempel.
       */
      minCount?: number;
    }
  | {
      /** "Aanwezig" als een bestandspad hierop matcht (mappenstructuur-check). */
      type: 'path';
      pattern: RegExp;
    }
  | {
      /**
       * Niet uit de bestanden af te leiden — de docent vinkt dit zelf aan.
       * Voor alles wat je alleen met je ogen vaststelt: is het frame gebouwd,
       * rijdt de robot om een obstakel heen. `analyze()` laat zo'n concept
       * altijd op `used: false` staan; de docentweergave maakt er een
       * vinkvakje van.
       */
      type: 'handmatig';
    };

/**
 * Een cursus met twee leerroutes geeft per concept een niveau per route. Een
 * kale `Level` betekent: in elke track hetzelfde.
 */
export type ConceptLevel = Level | Record<string, Level>;

export interface Concept {
  id: string;
  /** Verwijst naar een SubjectInfo.id. */
  subject: string;
  /** Groepskop binnen het onderwerp (kaartje in het rapport). */
  group: string;
  /** Nederlandstalig label voor de checklist. */
  label: string;
  level: ConceptLevel;
  detect: ConceptDetect;
}

/** Een leerroute; alleen nodig als een site er meer dan één heeft. */
export interface TrackInfo {
  id: string;
  label: string;
}

export interface ConceptMatch {
  id: string;
  count: number;
  used: boolean;
}

export interface SubjectInfo {
  id: string;
  label: string;
}

export interface FileKindInfo {
  id: string;
  label: string;
}

export interface CheckerConfig {
  /** Onderwerpen (bv. FastAPI, HTML, Database) in weergavevolgorde. */
  subjects: SubjectInfo[];
  /**
   * Leerroutes waartussen de docent kan schakelen. Weglaten = één route, en
   * dan gedraagt alles zich als voorheen. De eerste track is de startwaarde.
   */
  tracks?: TrackInfo[];
  concepts: Concept[];
  /** Bestandssoorten voor het bestandsoverzicht (volgorde + labels). */
  fileKinds: FileKindInfo[];
  /** Pad → kind-id. */
  classify: (path: string) => string;
  /** Kinds waarvan de inhoud als tekst wordt gelezen. */
  textKinds: string[];
  /** Kinds die als data-URL worden ingelezen (optioneel; bv. afbeeldingen). */
  imageKinds?: string[];
  /** Accept-attribuut voor de bestandskiezer. */
  accept: string;
  /** Zacht docentwachtwoord (geen echte beveiliging op een statische site). */
  teacher: { password: string; storageKey: string };
  /** Voorgestelde PDF-bestandsnaam. */
  pdfFilename: (date: Date) => string;
  /** Korte privacy-belofte onder de uploadzone. */
  privacyNote?: string;
  /**
   * Optioneel: toon een "Bekijk in Online Editor"-knop die het project via
   * window.open + postMessage naar de IDE stuurt (alleen zinvol voor projecten
   * die in de web-IDE draaien, bv. HTML/CSS/JS).
   */
  ide?: { url: string };
}

export interface CheckReport {
  fileStats: {
    total: number;
    byKind: Record<string, number>;
    skippedTooLarge: number;
  };
  concepts: ConceptMatch[];
  warnings: string[];
}

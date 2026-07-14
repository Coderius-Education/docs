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
    }
  | {
      /** "Aanwezig" als een bestandspad hierop matcht (mappenstructuur-check). */
      type: 'path';
      pattern: RegExp;
    };

export interface Concept {
  id: string;
  /** Verwijst naar een SubjectInfo.id. */
  subject: string;
  /** Groepskop binnen het onderwerp (kaartje in het rapport). */
  group: string;
  /** Nederlandstalig label voor de checklist. */
  label: string;
  level: Level;
  detect: ConceptDetect;
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

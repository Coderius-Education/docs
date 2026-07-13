export type FileKind = 'html' | 'css' | 'js' | 'image' | 'other';

export interface ProjectFile {
  /** Genormaliseerd, "/"-gescheiden pad, geen leidende "/". */
  path: string;
  kind: FileKind;
  /**
   * Voor html/css/js de tekstinhoud; voor een afbeelding een data:-URL
   * (zie readFiles.ts). null = niet gelezen (te groot, of een niet-
   * ondersteund binair bestand).
   */
  content: string | null;
  sizeBytes: number;
  tooLarge: boolean;
}

export type ProjectFiles = Record<string, ProjectFile>;

export type Level = 'basis' | 'gevorderd';

export interface Technique {
  id: string;
  category: 'css' | 'js';
  /** Groepsnaam, sluit aan bij de cheatsheet-koppen (bv. 'Flexbox', 'Events'). */
  group: string;
  /** Nederlandstalig label voor de checklist. */
  label: string;
  pattern: RegExp;
  level: Level;
}

export interface TechniqueMatch {
  id: string;
  count: number;
  used: boolean;
}

export interface HtmlElementInfo {
  /** Eén of meer tags die samen als één checklist-punt tellen (bv. h1–h6). */
  tags: string[];
  label: string;
  level: Level;
  /** Concept-groep voor de niveau-telling (bv. 'Formulieren', 'Koppen'). */
  group: string;
}

export interface AnalysisReport {
  fileStats: {
    total: number;
    byKind: Record<FileKind, number>;
    skippedTooLarge: number;
  };
  html: {
    /** Aantal keer dat elke tag voorkomt (alle tags, ook niet-curriculum). */
    elementCounts: Record<string, number>;
  };
  css: TechniqueMatch[];
  js: TechniqueMatch[];
  warnings: string[];
}

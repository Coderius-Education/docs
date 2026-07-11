export type FileKind = 'html' | 'css' | 'js' | 'image' | 'other';

export interface ProjectFile {
  /** Genormaliseerd, "/"-gescheiden pad, geen leidende "/". */
  path: string;
  kind: FileKind;
  /** null = niet gelezen (binair bestand, of te groot). */
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
  tag: string;
  label: string;
  level: Level;
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

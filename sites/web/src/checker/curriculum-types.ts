// Zelfstandige types voor de web-conceptdata (curriculum.ts). Losgekoppeld van
// de gedeelde @coderius/checker-types, zodat de dataregels ongewijzigd konden
// verhuizen uit de oude WebsiteChecker.

export type Level = 'basis' | 'gevorderd';

export interface Technique {
  id: string;
  category: 'css' | 'js';
  group: string;
  label: string;
  pattern: RegExp;
  level: Level;
}

export interface HtmlElementInfo {
  tags: string[];
  label: string;
  level: Level;
  group: string;
}

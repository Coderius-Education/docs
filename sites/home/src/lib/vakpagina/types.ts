// Een vakpagina: de startpagina van een vak (informatica.coderius.nl/), in
// docs-management ontworpen. Het document staat als JSON in
// src/lib/vakpaginas/<vak>.json; zonder bestand toont het vak de standaardpagina
// (standaard.ts), gelijk aan de homepage van vóór de vakpagina's.
//
// De blokken zijn dezelfde als op de startpagina's van de cursussen
// (HomepageSections in packages/shared), plus het Cursusoverzicht. docs-
// management valideert met dezelfde regels (backend/app/authoring/vakpagina.py);
// de testbestanden in __fixtures__/vakpagina bewaken dat ze gelijk blijven.

export const BLOK_TYPES = [
  'Hero',
  'Section',
  'Columns',
  'Card',
  'Buttons',
  'Button',
  'Picture',
  'Divider',
  'Courses',
] as const;
export type BlokType = (typeof BLOK_TYPES)[number];

export const BREEDTES = ['full', 'wide', 'normal', 'narrow'] as const;
export const RUIMTES = ['none', 'small', 'normal', 'large'] as const;
export const UITLIJNINGEN = ['left', 'center', 'right'] as const;
export const ACHTERGRONDEN = ['transparent', 'muted', 'primary'] as const;

export interface Opmaak {
  width?: (typeof BREEDTES)[number];
  spacing?: (typeof RUIMTES)[number];
  align?: (typeof UITLIJNINGEN)[number];
  background?: (typeof ACHTERGRONDEN)[number];
}

export interface BlokProps extends Opmaak {
  // Hero, Section, Card
  title?: string;
  // Hero
  tagline?: string;
  variant?: 'default' | 'compact' | 'plain' | 'primary' | 'secondary';
  // Section
  subtitle?: string;
  // Columns
  count?: number;
  // Card, Button
  href?: string;
  info?: string;
  // Button
  size?: 'sm' | 'lg';
  // Picture
  src?: string;
  alt?: string;
  caption?: string;
  // Courses
  automatischeKop?: boolean;
  filters?: boolean;
  niveaus?: string[];
  themas?: string[];
  uitgelicht?: string[];
  alleen?: string[];
}

export interface Blok {
  id: string;
  type: BlokType;
  props: BlokProps;
  /** Markdown (Section, Card, Hero) of de tekst van een knop. */
  tekst?: string;
  kinderen?: Blok[];
}

export interface Kleuren {
  primary?: string;
  primaryForeground?: string;
}

export interface VakpaginaThema {
  licht?: Kleuren;
  donker?: Kleuren;
  /** Letter van de koppen; de drie families die home zelf meelevert. */
  kopletter?: 'literata' | 'atkinson' | 'mono';
  logo?: { licht?: string; donker?: string };
}

export interface Vakpagina {
  version: 1;
  vak: string;
  meta?: { titel?: string; omschrijving?: string; afbeelding?: string };
  thema?: VakpaginaThema;
  blokken: Blok[];
}

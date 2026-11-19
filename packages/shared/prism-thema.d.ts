import type { PrismTheme } from 'prism-react-renderer';

/** De kleur van een getal (en van True en False) in licht en donker. */
export const GETAL_KLEUR: string;
/** De kleur van een ingebouwde functie (`range`, `len`) in licht. */
export const INGEBOUWD_LICHT: string;
/** Het Prism-thema in licht: github, met elke soort die dracula kleurt ook gekleurd. */
export const licht: PrismTheme;
/** Het Prism-thema in donker: dracula, zonder cursief behalve commentaar. */
export const donker: PrismTheme;

/** Eén soort code in de CodeMirror-editors: de tags en de kleur per stand. */
export interface CodeMirrorRegel {
  /** Elke tag als pad: ['function', 'variableName'] is tags.function(tags.variableName). */
  soorten: string[][];
  licht: string;
  donker: string;
}
export const CODEMIRROR: CodeMirrorRegel[];

/** De lichte en de donkere stijl van een CodeMirror-editor. */
export function codeMirrorStijlen<S, T>(cm: {
  // T is wat CodeMirror als tag aanneemt; de tags komen uit `tags` hieronder.
  HighlightStyle: { define(specs: { tag: T; color: string }[]): S };
  // biome-ignore lint/suspicious/noExplicitAny: de tags van @lezer/highlight, door de site meegegeven
  tags: Record<string, any>;
}): { licht: S; donker: S };

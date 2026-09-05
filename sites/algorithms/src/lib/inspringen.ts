// Inspringen met de Tab-toets in de code-editors van deze site. Zonder eigen
// afhandeling springt Tab uit het tekstveld, en in Python is inspringen geen
// opmaak maar betekenis. Puur: geen DOM, zodat het in node te testen is.

export const INSPRINGING = '    ';

export type Bewerking = {
  code: string;
  start: number;
  end: number;
};

/** Tab: vervangt de selectie [start, end) door vier spaties, cursor erachter. */
export function tabInvoegen(code: string, start: number, end: number): Bewerking {
  const nieuw = `${code.slice(0, start)}${INSPRINGING}${code.slice(end)}`;
  const cursor = start + INSPRINGING.length;
  return { code: nieuw, start: cursor, end: cursor };
}

/**
 * Shift+Tab: haalt hoogstens vier spaties weg aan het begin van de regel
 * waar de cursor staat. De cursor schuift mee, maar nooit voor het begin van
 * de regel.
 */
export function tabWeghalen(code: string, start: number, end: number): Bewerking {
  const regelBegin = code.lastIndexOf('\n', start - 1) + 1;
  const regel = code.slice(regelBegin);
  const spaties = regel.match(/^ {1,4}/)?.[0].length ?? 0;
  if (spaties === 0) return { code, start, end };
  const nieuw = `${code.slice(0, regelBegin)}${code.slice(regelBegin + spaties)}`;
  const schuif = (positie: number) => Math.max(regelBegin, positie - spaties);
  return { code: nieuw, start: schuif(start), end: schuif(end) };
}

// Inspringen in de textarea-editors (python-cursus, algoritmes): Tab, Shift+Tab
// en Enter. Zonder eigen afhandeling springt Tab uit het tekstveld en begint
// een nieuwe regel op kolom 0, en in Python is inspringen geen opmaak maar
// betekenis. Puur: geen DOM, zodat het in node te testen is.

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

/**
 * Enter: nieuwe regel met de inspringing van de huidige regel, en een niveau
 * dieper als de regel vóór de cursor op een dubbele punt eindigt (def, if,
 * for, while, else). Een selectie wordt vervangen. Wat achter de cursor
 * stond komt op de nieuwe regel te staan, zonder zijn eigen leidende spaties.
 */
export function enterInvoegen(code: string, start: number, end: number): Bewerking {
  const regelBegin = code.lastIndexOf('\n', start - 1) + 1;
  const voor = code.slice(regelBegin, start);
  const basis = voor.match(/^ */)?.[0] ?? '';
  const dieper = voor.trimEnd().endsWith(':') ? INSPRINGING : '';
  const inspringing = basis + dieper;
  const rest = code.slice(end).replace(/^ +/, '');
  const nieuw = `${code.slice(0, start)}\n${inspringing}${rest}`;
  const cursor = start + 1 + inspringing.length;
  return { code: nieuw, start: cursor, end: cursor };
}

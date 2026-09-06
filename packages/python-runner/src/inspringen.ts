// Inspringen in de textarea-editors (python-cursus, algoritmes): Tab, Shift+Tab
// en Enter. Zonder eigen afhandeling springt Tab uit het tekstveld en begint
// een nieuwe regel op kolom 0, en in Python is inspringen geen opmaak maar
// betekenis. Puur: geen DOM, zodat het in node te testen is.
//
// Elke bewerking beschrijft naast de nieuwe code ook het bereik dat verandert
// (`van`..`tot` wordt `tekst`). De editor voert hem daarmee uit via
// document.execCommand, zodat de browser de undo-stack bijhoudt: een bewerking
// die de waarde van de textarea via React zet, wist Ctrl+Z.

export const INSPRINGING = '    ';

export type Bewerking = {
  /** De code na de bewerking. */
  code: string;
  /** Cursor na de bewerking. */
  start: number;
  end: number;
  /** Het bereik in de oude code dat vervangen wordt … */
  van: number;
  tot: number;
  /** … door deze tekst (leeg bij weghalen). */
  tekst: string;
};

function bewerking(
  code: string,
  van: number,
  tot: number,
  tekst: string,
  cursor: number,
  cursorEind = cursor,
): Bewerking {
  return {
    code: `${code.slice(0, van)}${tekst}${code.slice(tot)}`,
    start: cursor,
    end: cursorEind,
    van,
    tot,
    tekst,
  };
}

function regelBeginVan(code: string, positie: number): number {
  return code.lastIndexOf('\n', positie - 1) + 1;
}

/** Tab: vervangt de selectie [start, end) door vier spaties, cursor erachter. */
export function tabInvoegen(code: string, start: number, end: number): Bewerking {
  return bewerking(code, start, end, INSPRINGING, start + INSPRINGING.length);
}

/**
 * Shift+Tab: haalt hoogstens vier spaties weg aan het begin van de regel
 * waar de cursor staat. De cursor schuift mee, maar nooit voor het begin van
 * de regel.
 */
export function tabWeghalen(code: string, start: number, end: number): Bewerking {
  const regelBegin = regelBeginVan(code, start);
  const spaties = code.slice(regelBegin).match(/^ {1,4}/)?.[0].length ?? 0;
  if (spaties === 0) return bewerking(code, start, start, '', start, end);
  const schuif = (positie: number) => Math.max(regelBegin, positie - spaties);
  return bewerking(code, regelBegin, regelBegin + spaties, '', schuif(start), schuif(end));
}

/**
 * Enter: nieuwe regel met de inspringing van de huidige regel, en een niveau
 * dieper als de regel vóór de cursor op een dubbele punt eindigt (def, if,
 * for, while, else). Een selectie wordt vervangen. Wat achter de cursor
 * stond komt op de nieuwe regel te staan, zonder zijn eigen leidende spaties.
 * Staat de cursor nog in de leidende spaties van de regel (Home, Enter), dan
 * schuift de hele regel intact naar beneden.
 */
export function enterInvoegen(code: string, start: number, end: number): Bewerking {
  const regelBegin = regelBeginVan(code, start);
  const regelInspringing = code.slice(regelBegin).match(/^ */)?.[0] ?? '';
  const inLeidendeSpaties = start <= regelBegin + regelInspringing.length;
  const voor = code.slice(regelBegin, start);
  const dieper = !inLeidendeSpaties && voor.trimEnd().endsWith(':') ? INSPRINGING : '';
  const inspringing = regelInspringing + dieper;
  const restSpaties = code.slice(end).match(/^ */)?.[0].length ?? 0;
  const tekst = `\n${inspringing}`;
  return bewerking(code, start, end + restSpaties, tekst, start + tekst.length);
}

/**
 * Voert een bewerking uit in de textarea via document.execCommand, zodat de
 * browser hem in de undo-stack zet (Ctrl+Z werkt) en React via het
 * input-event de nieuwe waarde meekrijgt. Lukt dat niet (oude browser), dan
 * zet de fallback de waarde via onChange en de cursor in het volgende frame.
 */
export function voerUit(
  target: HTMLTextAreaElement,
  b: Bewerking,
  onChange: (code: string) => void,
): void {
  let gelukt = false;
  try {
    target.setSelectionRange(b.van, b.tot);
    gelukt = b.tekst
      ? document.execCommand('insertText', false, b.tekst)
      : b.van === b.tot || document.execCommand('delete', false);
  } catch {
    gelukt = false;
  }
  if (gelukt && target.value === b.code) {
    target.setSelectionRange(b.start, b.end);
    return;
  }
  onChange(b.code);
  requestAnimationFrame(() => target.setSelectionRange(b.start, b.end));
}

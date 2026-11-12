// De hoogte van een oefenveld in een les-tabblad (zie de root-CLAUDE.md).
// Buiten een tabblad heeft een veld de hoogte uit zijn `height`-prop. In een
// tabblad is het doel dat het hele paneel op het scherm past: het veld krijgt
// de ruimte die overblijft na wat er in het paneel boven en onder staat.

/** Lager dan dit is een editor niet meer te gebruiken: een regel of acht. */
export const MIN_HOOGTE = 240;

/** Wat er onder het paneel nog vrij blijft, zodat de rand niet tegen de
 *  onderkant van het scherm staat. */
export const MARGE = 12;

export interface Ruimte {
  /** De hoogte van het scherm (`window.innerHeight`). */
  scherm: number;
  /** Van de bovenkant van de pagina tot de bovenkant van het veld. */
  boven: number;
  /** Van de onderkant van het veld tot de onderkant van het paneel. */
  onder: number;
  /** De hoogte uit de `height`-prop: hoger wordt het veld niet. */
  max: number;
}

/**
 * De hoogte in pixels waarop het veld in zijn tabblad past.
 *
 * @param min lager wordt het veld niet; een veld met een eigen ondergrens
 *   (het Python-veld: de werkbalk en een paar regels) geeft die mee.
 */
export function pasHoogte({ scherm, boven, onder, max }: Ruimte, min = MIN_HOOGTE): number {
  const vrij = scherm - boven - onder - MARGE;
  return Math.round(Math.max(Math.min(min, max), Math.min(vrij, max)));
}

/**
 * Meet de ruimte voor een veld in zijn paneel. Null als er niets te meten
 * valt of niet gemeten moet worden; het veld houdt dan de hoogte die het had.
 *
 *  - Een tabblad dat niet open staat, heeft geen maten.
 *  - Staat er in het paneel een tip of antwoord open, dan is het paneel
 *    langer dan het scherm, wat de editor ook doet. Opnieuw meten liet de
 *    editor krimpen op het moment dat de leerling een tip opende. Is alles
 *    weer dicht, dan klopt de meting weer.
 */
export function meetRuimte(veld: HTMLElement, paneel: HTMLElement, max: number): Ruimte | null {
  const v = veld.getBoundingClientRect();
  const p = paneel.getBoundingClientRect();
  if (p.width === 0 || v.width === 0) return null;
  if (paneel.querySelector('details[open]')) return null;
  return {
    scherm: window.innerHeight,
    boven: v.top + window.scrollY,
    onder: p.bottom - v.bottom,
    max,
  };
}

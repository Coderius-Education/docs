// Hoe breed de code van een PyRunner in een les-tabblad naast zijn uitvoer
// staat (PyRunnerImpl.tsx), los van React zodat het te testen is.

/**
 * Een teken in de editor, als het nog niet gemeten is: 0,9rem in de monospace
 * van de huisstijl (Atkinson Hyperlegible Mono) is 9,1 pixels.
 */
export const TEKEN_PX = 9.1;
/** Regelnummers en marges van de editor (56 + 16), de rand en een schuifbalk van Windows. */
const EDITOR_RAND_PX = 56 + 16 + 2 + 15;
/** Zo breed mag de codekolom naast de uitvoer hooguit worden. */
const MAX_CODE_DEEL = 0.75;
/** Zo breed is de codekolom naast de uitvoer minstens. */
const MIN_CODE_DEEL = 0.5;

/**
 * Hoe breed de code in een tabblad naast de uitvoer staat, in pixels, of null
 * als de langste regel daar niet past: dan staat de uitvoer onder de code. Een
 * regel code breekt niet af (schrijfgids §2); naast de uitvoer brak in 184
 * schermen van algoritmes een regel af, op een vaste zestig procent.
 * `teken` is de breedte van een teken in de editor (gemeten in de browser).
 */
export function codeBreedte(code: string, veld: number, teken = TEKEN_PX): number | null {
  const langste = Math.max(0, ...code.split('\n').map((r) => r.length));
  const nodig = langste * teken + EDITOR_RAND_PX;
  if (nodig > veld * MAX_CODE_DEEL) return null;
  return Math.max(nodig, veld * MIN_CODE_DEEL);
}

/** De breedte van een teken in het lettertype van een textarea, in pixels. */
export function meetTeken(textarea: HTMLTextAreaElement | null): number {
  if (!textarea) return TEKEN_PX;
  const ctx = document.createElement('canvas').getContext('2d');
  if (!ctx) return TEKEN_PX;
  ctx.font = getComputedStyle(textarea).font;
  const breedte = ctx.measureText('x'.repeat(100)).width / 100;
  return breedte > 0 ? breedte : TEKEN_PX;
}

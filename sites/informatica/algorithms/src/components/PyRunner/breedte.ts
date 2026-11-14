// Hoe breed de code van een PyRunner in een les-tabblad naast zijn uitvoer
// staat (PyRunnerImpl.tsx), los van React zodat het te testen is.

/**
 * Een teken in de editor: 0,9rem in de monospace van de huisstijl (Atkinson
 * Hyperlegible Mono) is 9,095 pixels. Een vaste waarde en geen meting: het
 * lettertype van de code laadt pas als er code in beeld komt, en een meting
 * daarvoor gaf het smallere reservelettertype (9,006 pixels), waarna een
 * regel van 95 tekens toch afbrak. Een smaller lettertype past altijd.
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

/** Kleiner dan dit worden de letters in de editor niet, net als bij pasCode. */
export const KLEINSTE_SCHAAL = 0.8;

/**
 * Hoeveel kleiner de letters in de editor moeten om de langste regel heel op
 * één regel te houden in een kolom van `breedte` pixels: 1 als hij past,
 * nooit minder dan KLEINSTE_SCHAAL. Zo doet een codeblok in een les het ook
 * (components/LesTabs/pasCode.ts); een regel die met de kleinste letters nog
 * niet past, hoort korter in de les.
 */
export function codeSchaal(code: string, breedte: number, teken = TEKEN_PX): number {
  const langste = Math.max(0, ...code.split('\n').map((r) => r.length));
  const ruimte = breedte - EDITOR_RAND_PX;
  if (langste === 0 || langste * teken <= ruimte) return 1;
  return Math.max(KLEINSTE_SCHAAL, Math.floor((ruimte / (langste * teken)) * 100) / 100);
}

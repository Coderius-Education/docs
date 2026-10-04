// Kleiner dan dit wordt het werkblad niet: de tekst in de blokken is bij
// schaal 1 16 px (gemeten in Chromium), en onder de 9 px leest een leerling
// hem op een telefoon niet meer; 0,6 geeft 9,6 px. Past het programma dan nog niet, dan schuift het
// werkblad binnen de figuur opzij; de pagina zelf schuift niet.
export const MINSTE_SCHAAL = 0.6;

// De schaal waarop een programma van `breedte` past in `ruimte`, maar nooit
// groter dan 1 en nooit kleiner dan MINSTE_SCHAAL.
export function schaalVoor(ruimte: number, breedte: number): number {
  return Math.max(MINSTE_SCHAAL, Math.min(1, ruimte / breedte));
}

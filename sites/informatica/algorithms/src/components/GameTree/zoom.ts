// Hoe klein de spelboom in een les-tabblad wordt (index.tsx), los van React
// zodat het te testen is.

/**
 * Kleiner dan dit is een bord niet meer te lezen. Op 0,5 waren de labels in
 * minimax 2 zeven pixels hoog; wie het groter wil, klikt op Bekijk de boom
 * groot (index.tsx).
 */
export const KLEINSTE_ZOOM = 0.6;

/**
 * De zoom waarop een boom van `ware` pixels hoog in `ruimte` pixels past: nooit
 * groter dan ware grootte, nooit kleiner dan KLEINSTE_ZOOM. Op 1280 bij 720 was
 * de boom van minimax 2 met zoom 0,72 nog 136 pixels te lang.
 */
export function boomZoom(ruimte: number, ware: number): number {
  if (ware <= 0) return 1;
  const zoom = Math.floor((ruimte / ware) * 100) / 100;
  return Math.min(1, Math.max(KLEINSTE_ZOOM, zoom));
}

// De voorbeeldweergave in de IDE kan doen alsof hij een tablet of telefoon is,
// zodat een leerling zijn CSS @media-regels kan testen zonder de ontwikkel-
// tools van de browser (issue #116). Het iframe krijgt dan echt de breedte en
// hoogte van dat apparaat, want @media kijkt naar de breedte van het venster
// waarin de pagina staat, en wordt daarna verkleind tot het in het paneel past.

export interface Apparaat {
  id: 'desktop' | 'tablet' | 'telefoon';
  label: string;
  /** Afmetingen in CSS-pixels; null is de volle breedte van het paneel. */
  maat: { breedte: number; hoogte: number } | null;
}

export const APPARATEN: Apparaat[] = [
  { id: 'desktop', label: 'Desktop', maat: null },
  { id: 'tablet', label: 'Tablet', maat: { breedte: 768, hoogte: 1024 } },
  { id: 'telefoon', label: 'Telefoon', maat: { breedte: 375, hoogte: 667 } },
];

/**
 * Hoeveel het apparaat verkleind moet worden om in de beschikbare ruimte te
 * passen: nooit groter dan echt (1), en even klein als de krapste kant vraagt.
 */
export function schaal(
  maat: { breedte: number; hoogte: number },
  ruimte: { breedte: number; hoogte: number },
): number {
  if (ruimte.breedte <= 0 || ruimte.hoogte <= 0) return 1;
  return Math.min(1, ruimte.breedte / maat.breedte, ruimte.hoogte / maat.hoogte);
}

// Kleiner dan dit wordt het werkblad niet: de tekst in de blokken is bij
// schaal 1 16 px (gemeten in Chromium), en onder de 9 px leest een leerling
// hem op een telefoon niet meer; 0,6 geeft 9,6 px. Past het programma dan nog niet, dan schuift het
// werkblad binnen de figuur opzij; de pagina zelf schuift niet.
export const MINSTE_SCHAAL = 0.6;

// De schaal waarop een programma van `breedte` past in `ruimte`, maar nooit
// groter dan 1 en nooit kleiner dan MINSTE_SCHAAL. In een les-tabblad telt ook
// de hoogte: een programma van `hoogte` is dan niet hoger dan `maxHoogte`, voor
// zover de kleinste schaal dat toelaat.
export function schaalVoor(
  ruimte: number,
  breedte: number,
  hoogte = 0,
  maxHoogte = Number.POSITIVE_INFINITY,
): number {
  const opHoogte = hoogte > 0 ? maxHoogte / hoogte : 1;
  return Math.max(MINSTE_SCHAAL, Math.min(1, ruimte / breedte, opHoogte));
}

// Hoe hoog een programma in een les-tabblad mag zijn: wat er op het scherm
// overblijft na de titel, de tabbladen, een paar regels tekst en de knop
// Volgende. Op een smal scherm scrolt de leerling, en geldt er geen grens.
export function maxHoogteInTab(schermHoogte: number, breed: boolean): number {
  return breed ? Math.max(240, schermHoogte - 340) : Number.POSITIVE_INFINITY;
}

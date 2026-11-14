// Een rij knoppen die zijwaarts schuift: de rij tabbladen op een telefoon, de
// rij stappen op een telefoon en in de smalle kolom naast een oefenveld (de
// oefenterminal van Linux). Na een link naar een latere stap, na de knop
// Volgende of bij het laden met een stap in het adres stond de knop van de
// open stap daar buiten beeld, en zag de leerling niet waar hij was.
//
// Alleen de rij schuift, met `scrollLeft`. Geen `scrollIntoView`: dat schuift
// ook de pagina als de knop net niet helemaal in het venster staat, en dan
// verspringt de tekst.

/** Zoveel van de knop ernaast blijft te zien: dan zie je dat de rij schuift. */
export const MARGE = 24;

/** Schuift `rij` zijwaarts tot `knop` er helemaal in staat. Een rij die niet
 *  schuift, blijft staan. */
export function schuifInRij(rij: HTMLElement, knop: HTMLElement): void {
  if (rij.scrollWidth <= rij.clientWidth) return;
  const r = rij.getBoundingClientRect();
  const k = knop.getBoundingClientRect();
  if (k.left < r.left) {
    rij.scrollLeft = Math.max(0, rij.scrollLeft - (r.left - k.left + MARGE));
  } else if (k.right > r.right) {
    // Nooit zo ver dat het begin van de knop links uit beeld gaat (een knop
    // die breder is dan de rij).
    const naar = Math.min(k.right - r.right + MARGE, k.left - r.left);
    rij.scrollLeft = rij.scrollLeft + naar;
  }
}

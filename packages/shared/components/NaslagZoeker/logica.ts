// De logica van de zoeker op de naslagpagina's (Cheatsheet, Er gaat iets
// mis), los van React en de DOM, zodat hij in node te testen is.

/** Kleine letters, zonder accenten, met enkele spaties. */
export function normaal(tekst: string): string {
  return tekst.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/\s+/g, ' ').trim();
}

/** De zoekwoorden: wat tussen spaties staat, zonder losse leestekens. */
export function woorden(zoek: string): string[] {
  return normaal(zoek)
    .split(' ')
    .map((w) => w.replace(/^[^\w/.@{}%<>-]+|[^\w/.@{}%<>-]+$/g, ''))
    .filter((w) => w.length > 0);
}

/** Een woord dat een fout aanwijst: een naam als TemplateNotFound of een statuscode. */
function foutwoord(w: string): boolean {
  return /error|exception|notfound/.test(w) || /^[1-5]\d\d$/.test(w);
}

/**
 * Past een onderwerp bij de zoekopdracht? Bij een paar woorden moet elk
 * woord erin staan. Een geplakte foutmelding is langer, en bevat een pad,
 * een bestandsnaam of een regelnummer dat bij jou anders is: dan telt de
 * naam van de fout of de statuscode, en anders twee derde van de woorden van
 * drie letters of meer.
 */
export function past(tekst: string, zoek: string): boolean {
  const alle = woorden(zoek);
  if (alle.length === 0) return true;
  const hooiberg = normaal(tekst);
  if (alle.every((w) => hooiberg.includes(w))) return true;
  // De naam van de fout telt ook los, en van jinja2.exceptions.TemplateNotFound
  // ook alleen het laatste stuk.
  const fout = (w: string) =>
    foutwoord(w) &&
    [w, w.split('.').at(-1) ?? w].some((d) => d.length >= 3 && hooiberg.includes(d));
  if (alle.some(fout)) return true;
  if (alle.length <= 3) return false;
  const tellen = alle.filter((w) => w.length >= 3);
  if (tellen.length === 0) return alle.every((w) => hooiberg.includes(w));
  const raak = tellen.filter((w) => hooiberg.includes(w)).length;
  return raak / tellen.length >= 2 / 3;
}

/**
 * Een cheatsheet-vraag eindigt op de code waar hij over gaat:
 * "Hoe geef ik JSON terug? (@app.get)". Die code komt als label naast de
 * vraag. Zonder haakjes aan het eind blijft de tekst heel.
 */
export function splitsLabel(summary: string): { vraag: string; label: string | null } {
  const m = summary.trim().match(/^(.*\S)\s+\(([^()]+)\)$/);
  return m ? { vraag: m[1], label: m[2] } : { vraag: summary.trim(), label: null };
}

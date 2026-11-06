/**
 * Moet deze runner matplotlib laden? Ja als de code in de editor of de
 * verborgen code ervoor het gebruikt. De verborgen code telt mee: de
 * tekenfuncties van de route machine learning (`fruit-tekenen`) staan daar,
 * en zonder hem laadde de runner matplotlib niet en viel de verborgen code om
 * op een ontbrekende module. Het laden kost ~39 MB, dus een runner die het
 * niet gebruikt, laadt het ook niet.
 */
export function heeftMatplotlibNodig(code: string, verborgen?: string | null): boolean {
  const gebruikt = (tekst: string) => /\b(matplotlib|pyplot|plt\.)\b/.test(tekst);
  return gebruikt(code) || (verborgen != null && gebruikt(verborgen));
}

/**
 * Moet deze runner matplotlib laden? Ja als de code in de editor of de
 * verborgen code ervoor het gebruikt. De verborgen code telt mee: de
 * tekenfuncties van de route machine learning (`fruit-tekenen`) staan daar,
 * en zonder hem laadde de runner matplotlib niet en viel de verborgen code om
 * op een ontbrekende module. Het laden kost ~39 MB, dus een runner die het
 * niet gebruikt, laadt het ook niet.
 */
export function heeftMatplotlibNodig(code: string, verborgen?: string | null): boolean {
  return importeert(code) || (verborgen != null && importeert(verborgen));
}

// Alleen een echte import telt. Eerst zocht een regex het woord overal, dus
// `# zonder matplotlib` of `print("pyplot")` laadde ook 39 MB, en
// `import pylab` (ook matplotlib) laadde niets. Strings en commentaar gaan er
// eerst uit; wie matplotlib zonder import gebruikt, krijgt toch een NameError,
// want elke run begint met lege globals (./draai.ts).
function importeert(tekst: string): boolean {
  const kaal = tekst
    .replace(/("""|''')[\s\S]*?\1/g, '')
    .replace(/"(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*'/g, '')
    .replace(/#.*$/gm, '');
  return /^\s*(?:import|from)\s+(?:matplotlib|pylab)\b/m.test(kaal);
}

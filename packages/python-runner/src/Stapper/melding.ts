/**
 * De tekst onder een opname die op de stappenlimiet is gestopt.
 *
 * Deze melding vroeg eerst "Loopt je code eindeloos door?". Dat is precies de
 * verkeerde vraag bij code die het goed doet: de opnemer stopt na duizend
 * stappen, en een correcte oplossing die een lijst van vijftig getallen
 * sorteert zit daar ruim overheen. De leerling die op Stap voor stap drukt om
 * zijn werkende algoritme te zien lopen, kreeg te horen dat het misschien
 * vastliep. De melding zegt nu wat er echt gebeurde en noemt beide oorzaken
 * naast elkaar.
 */
export function afkapMelding(totaal: number): string {
  return `Alleen de eerste ${totaal} stappen zijn opgenomen; hier houdt de opname op. Een grote lus komt daar snel overheen, en een lus zonder eind natuurlijk ook.`;
}

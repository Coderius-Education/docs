import type { Tip } from '../../data/tips';

// Het zoekfilter van de TipZoeker, los van React zodat het te testen is.
//
// Gedrag: de zoekterm wordt op witruimte in woorden geknipt en elk woord moet
// ergens in de tip voorkomen (term, categorie, samenvatting, papertitel,
// auteurs of trefwoorden). Vergelijken gaat hoofdletterongevoelig; accenten
// worden níet genormaliseerd ('cognitiëve' vindt 'cognitieve' dus niet).

// Alles waar de zoekterm tegen mag matchen, samengevoegd tot één kleine-letter string.
export function zoekTekst(tip: Tip): string {
  return [
    tip.term,
    tip.categorie,
    tip.samenvatting,
    tip.paper.titel,
    tip.paper.auteurs,
    ...tip.termen,
  ]
    .join(' ')
    .toLowerCase();
}

export type TipIndex = { tip: Tip; tekst: string }[];

/** De zoektekst per tip, één keer gebouwd; de component bewaart 'm in een useMemo. */
export function maakIndex(tips: Tip[]): TipIndex {
  return tips.map((tip) => ({ tip, tekst: zoekTekst(tip) }));
}

function isIndex(bron: Tip[] | TipIndex): bron is TipIndex {
  return bron.length > 0 && 'tekst' in bron[0];
}

/**
 * Alle tips die elk woord uit de zoekterm bevatten; een lege zoekterm geeft
 * alles. Accepteert de kale tips (dan wordt de index ter plekke gebouwd) of
 * een vooraf gebouwde index, zodat de component niet bij elke toetsaanslag
 * alle velden opnieuw samenvoegt.
 */
export function filterTips(bron: Tip[] | TipIndex, zoekterm: string): Tip[] {
  const woorden = zoekterm.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (woorden.length === 0) return isIndex(bron) ? bron.map((r) => r.tip) : bron;
  const index = isIndex(bron) ? bron : maakIndex(bron);
  return index.filter((r) => woorden.every((w) => r.tekst.includes(w))).map((r) => r.tip);
}

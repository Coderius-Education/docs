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

/** Alle tips die elk woord uit de zoekterm bevatten; een lege zoekterm geeft alles. */
export function filterTips(tips: Tip[], zoekterm: string): Tip[] {
  const woorden = zoekterm.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (woorden.length === 0) return tips;
  return tips.filter((tip) => {
    const tekst = zoekTekst(tip);
    return woorden.every((w) => tekst.includes(w));
  });
}

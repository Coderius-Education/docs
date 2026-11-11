import { CATEGORIEEN, type Categorie, type CategorieId, type Tip } from '../../data/tips';

// Het zoekfilter van de TipZoeker, los van React zodat het te testen is.
//
// Gedrag: de zoekterm wordt op witruimte in woorden geknipt en elk woord moet
// ergens in de tip voorkomen (term, categorie, samenvatting, controlevraag,
// trefwoorden, en de bron: papertitel en auteurs, of bij een tip uit de
// praktijk de herkomst). Vergelijken gaat hoofdletterongevoelig; accenten
// worden níet genormaliseerd ('cognitiëve' vindt 'cognitieve' dus niet).

/** De categorie bij een id; een onbekend id is een fout in tips.ts. */
export function categorieVan(id: CategorieId): Categorie {
  const c = CATEGORIEEN.find((x) => x.id === id);
  if (!c) throw new Error(`onbekende categorie '${id}'`);
  return c;
}

// Alles waar de zoekterm tegen mag matchen, samengevoegd tot één kleine-letter string.
export function zoekTekst(tip: Tip): string {
  const bron =
    tip.bron === 'onderzoek'
      ? [tip.paper.titel, tip.paper.auteurs, 'onderzoek']
      : [tip.herkomst, 'praktijk'];
  return [
    tip.term,
    categorieVan(tip.categorie).label,
    tip.samenvatting,
    tip.controlevraag,
    ...bron,
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

/**
 * De tips per categorie, in de volgorde van CATEGORIEEN. Elke categorie komt
 * terug, ook een zonder tips: zo ziet een auteur waar de verzameling nog leeg
 * is. Binnen een categorie blijft de volgorde van de lijst.
 */
export function perCategorie(lijst: Tip[]): { categorie: Categorie; tips: Tip[] }[] {
  return CATEGORIEEN.map((categorie) => ({
    categorie,
    tips: lijst.filter((t) => t.categorie === categorie.id),
  }));
}

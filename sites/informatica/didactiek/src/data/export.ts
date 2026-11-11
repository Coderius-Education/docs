import { CATEGORIEEN, type Tip, tips } from './tips';

// Wat de build als tips.json naast de site zet (docusaurus.config.ts). De
// verzameling tips is ook invoer voor het nalopen van een cursus: per
// categorie de controlevragen, met een adres voor de onderbouwing. Wie de
// tips buiten deze repo wil gebruiken, leest dit bestand.

export type TipExport = {
  site: 'didactiek';
  categorieen: { id: string; label: string; omschrijving: string; aantal: number }[];
  tips: {
    slug: string;
    term: string;
    categorie: string;
    samenvatting: string;
    controlevraag: string;
    bron: 'onderzoek' | 'praktijk';
    paper?: { titel: string; auteurs: string; jaar: number };
    herkomst?: string;
    trefwoorden: string[];
    url: string;
  }[];
};

/**
 * @param basis het adres van de site zonder slash aan het eind, bijvoorbeeld
 *   https://informatica.coderius.nl/didactiek
 */
export function exportTips(basis: string, lijst: Tip[] = tips): TipExport {
  return {
    site: 'didactiek',
    categorieen: CATEGORIEEN.map((c) => ({
      ...c,
      aantal: lijst.filter((t) => t.categorie === c.id).length,
    })),
    tips: lijst.map((t) => ({
      slug: t.slug,
      term: t.term,
      categorie: t.categorie,
      samenvatting: t.samenvatting,
      controlevraag: t.controlevraag,
      bron: t.bron,
      ...(t.bron === 'onderzoek' ? { paper: t.paper } : { herkomst: t.herkomst }),
      trefwoorden: t.termen,
      url: `${basis}${t.detailPad}`,
    })),
  };
}

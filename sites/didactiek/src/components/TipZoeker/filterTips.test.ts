import { describe, expect, it } from 'vitest';
import { type Tip, tips } from '../../data/tips';
import { filterTips } from './filterTips';

// Legt het zoekgedrag van de TipZoeker vast: welke velden meedoen, dat
// hoofdletters niet uitmaken, dat meerdere woorden allemaal moeten matchen,
// en dat accenten (nog) niet genormaliseerd worden. Zonder deze test kan een
// verbouwing van de zoeker stil een veld laten vallen, en merkt een docent
// pas op de site dat 'scaffolding' geen tip meer vindt.

function tip(deel: Partial<Tip> & { slug: string }): Tip {
  return {
    term: deel.slug,
    categorie: 'Algemeen',
    termen: [],
    samenvatting: '',
    paper: { titel: '', auteurs: '', jaar: 2000 },
    detailPad: `/bronnen/${deel.slug}`,
    ...deel,
  };
}

const belasting = tip({
  slug: 'belasting',
  term: 'Verlaag de cognitieve belasting',
  categorie: 'Cognitive load',
  termen: ['werkgeheugen', 'intrinsieke belasting'],
  samenvatting: 'Snijd de extrinsieke belasting weg.',
  paper: { titel: 'Cognitive load during problem solving', auteurs: 'Sweller', jaar: 1988 },
});
const voorspellen = tip({
  slug: 'voorspellen',
  term: 'Laat eerst voorspellen',
  categorie: 'PRIMM',
  termen: ['predict', 'scaffolding'],
  samenvatting: 'Eerst raden wat de code doet, dan pas draaien.',
  paper: { titel: 'PRIMM in the classroom', auteurs: 'Sentance & Waite', jaar: 2017 },
});
const alle = [belasting, voorspellen];

describe('filterTips', () => {
  it('geeft alles terug bij een lege of witruimte-zoekterm', () => {
    expect(filterTips(alle, '')).toBe(alle);
    expect(filterTips(alle, '   \t ')).toBe(alle);
  });

  it('vergelijkt hoofdletterongevoelig, ook in de data zelf', () => {
    expect(filterTips(alle, 'SWELLER')).toEqual([belasting]);
    expect(filterTips(alle, 'primm')).toEqual([voorspellen]);
  });

  it('zoekt in term, categorie, samenvatting, papertitel, auteurs en trefwoorden', () => {
    expect(filterTips(alle, 'verlaag')).toEqual([belasting]); // term
    expect(filterTips(alle, 'load')).toEqual([belasting]); // categorie
    expect(filterTips(alle, 'raden')).toEqual([voorspellen]); // samenvatting
    expect(filterTips(alle, 'classroom')).toEqual([voorspellen]); // papertitel
    expect(filterTips(alle, 'waite')).toEqual([voorspellen]); // auteurs
    expect(filterTips(alle, 'scaffolding')).toEqual([voorspellen]); // trefwoord
  });

  it('matcht op een deel van een woord', () => {
    expect(filterTips(alle, 'geheugen')).toEqual([belasting]);
  });

  it('eist bij meerdere woorden dat ze allemaal voorkomen, in welk veld dan ook', () => {
    expect(filterTips(alle, 'cognitive sweller')).toEqual([belasting]);
    expect(filterTips(alle, 'cognitive predict')).toEqual([]);
    expect(filterTips(alle, 'belasting')).toEqual([belasting]);
  });

  it('geeft een lege lijst als niets past', () => {
    expect(filterTips(alle, 'bestaatniet')).toEqual([]);
    expect(filterTips([], 'belasting')).toEqual([]);
  });

  it('normaliseert accenten niet: dat is het huidige gedrag', () => {
    // Bewust vastgelegd, geen wens. Wie dit wil verbeteren (bv. met
    // normalize('NFD')), past deze verwachting én de zoekfunctie samen aan.
    expect(filterTips(alle, 'cognitiëve')).toEqual([]);
    expect(filterTips(alle, 'cognitieve')).toEqual([belasting]);
  });

  it('vindt de echte tips op hun eigen trefwoorden', () => {
    // De lijst in src/data/tips.ts is de bron van de zoeker; elke tip moet
    // op elk van zijn trefwoorden te vinden zijn, anders is dat trefwoord loos.
    const kapot: string[] = [];
    for (const t of tips) {
      for (const trefwoord of [t.term, ...t.termen]) {
        if (!filterTips(tips, trefwoord).includes(t)) kapot.push(`${t.slug}: '${trefwoord}'`);
      }
    }
    expect(kapot).toEqual([]);
    expect(filterTips(tips, '')).toHaveLength(tips.length);
  });
});

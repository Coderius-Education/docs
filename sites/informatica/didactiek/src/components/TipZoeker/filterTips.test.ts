import { describe, expect, it } from 'vitest';
import { type Tip, tips } from '../../data/tips';
import { categorieVan, filterTips, maakIndex, perCategorie } from './filterTips';

// Legt het zoekgedrag van de TipZoeker vast: welke velden meedoen, dat
// hoofdletters niet uitmaken, dat meerdere woorden allemaal moeten matchen,
// en dat accenten (nog) niet genormaliseerd worden. Zonder deze test kan een
// verbouwing van de zoeker stil een veld laten vallen, en merkt een docent
// pas op de site dat 'scaffolding' geen tip meer vindt.

type Deel = Partial<Omit<Tip, 'bron'>> & {
  slug: string;
  paper?: { titel: string; auteurs: string; jaar: number };
  herkomst?: string;
};

// Een tip uit onderzoek, of met `herkomst` een tip uit de praktijk.
function tip({ paper, herkomst, ...deel }: Deel): Tip {
  const basis = {
    term: deel.slug,
    categorie: 'uitleg' as const,
    termen: [],
    samenvatting: '',
    controlevraag: '',
    detailPad: `/bronnen/${deel.slug}`,
    ...deel,
  };
  return herkomst !== undefined
    ? { ...basis, bron: 'praktijk', herkomst }
    : { ...basis, bron: 'onderzoek', paper: paper ?? { titel: '', auteurs: '', jaar: 2000 } };
}

const belasting = tip({
  slug: 'belasting',
  term: 'Verlaag de cognitieve belasting',
  categorie: 'uitleg',
  termen: ['werkgeheugen', 'intrinsieke belasting', 'cognitive load'],
  samenvatting: 'Snijd de extrinsieke belasting weg.',
  paper: { titel: 'Cognitive load during problem solving', auteurs: 'Sweller', jaar: 1988 },
});
const voorspellen = tip({
  slug: 'voorspellen',
  term: 'Laat eerst voorspellen',
  categorie: 'opdrachten',
  termen: ['predict', 'scaffolding', 'PRIMM'],
  samenvatting: 'Eerst raden wat de code doet, dan pas draaien.',
  controlevraag: 'Staat er een gokvraag voor de uitvoer?',
  paper: { titel: 'PRIMM in the classroom', auteurs: 'Sentance & Waite', jaar: 2017 },
});
const stappen = tip({
  slug: 'stappen',
  term: 'Kleine stappen',
  categorie: 'opbouw',
  samenvatting: 'Een stap doet één ding.',
  herkomst: 'De route Online zetten.',
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

  it('zoekt in term, categorie, samenvatting, controlevraag, bron en trefwoorden', () => {
    expect(filterTips(alle, 'verlaag')).toEqual([belasting]); // term
    expect(filterTips(alle, 'uitleg')).toEqual([belasting]); // label van de categorie
    expect(filterTips(alle, 'gokvraag')).toEqual([voorspellen]); // controlevraag
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

describe('een tip uit de praktijk', () => {
  // Zo'n tip heeft geen paper. Eerst las de zoeker tip.paper.titel van elke
  // tip, en dat zou hier omvallen.
  it('is te vinden op zijn herkomst en op het woord praktijk', () => {
    const drie = [...alle, stappen];
    expect(filterTips(drie, 'online zetten')).toEqual([stappen]);
    expect(filterTips(drie, 'praktijk')).toEqual([stappen]);
    expect(filterTips(drie, 'onderzoek')).toEqual(alle);
  });
});

describe('perCategorie', () => {
  it('geeft elke categorie terug in de vaste volgorde, ook een lege', () => {
    const groepen = perCategorie([stappen, voorspellen, belasting]);
    expect(groepen.map((g) => g.categorie.id)).toEqual([
      'uitleg',
      'voorbeelden',
      'opdrachten',
      'fouten',
      'opbouw',
      'beoordelen',
    ]);
    expect(groepen.map((g) => g.tips.map((t) => t.slug))).toEqual([
      ['belasting'],
      [],
      ['voorspellen'],
      [],
      ['stappen'],
      [],
    ]);
  });

  it('verdeelt de echte tips zonder er een kwijt te raken', () => {
    const groepen = perCategorie(tips);
    expect(groepen.flatMap((g) => g.tips)).toHaveLength(tips.length);
    expect(categorieVan('opbouw').label).toBe('Volgorde en opbouw');
  });
});

describe('maakIndex', () => {
  it('geeft met een vooraf gebouwde index hetzelfde resultaat als met de kale tips', () => {
    const index = maakIndex(tips);
    expect(filterTips(index, 'cognitieve')).toEqual(filterTips(tips, 'cognitieve'));
    expect(filterTips(index, '')).toEqual(tips);
  });
});

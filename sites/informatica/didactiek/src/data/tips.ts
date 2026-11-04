export type Tip = {
  slug: string; // = bestandsnaam van de detailpagina onder docs/
  term: string; // titel van de tip
  categorie: string; // thema waaronder de tip valt
  termen: string[]; // klikbare trefwoorden/synoniemen, ook doorzoekbaar
  samenvatting: string; // één zin
  paper: { titel: string; auteurs: string; jaar: number };
  detailPad: string; // '/bronnen/<slug>'
};

// Voeg hier eenvoudig meer tips toe.
// Maak voor elke nieuwe tip ook een bestand docs/<slug>.md aan en houd
// `slug` en `detailPad` (`/bronnen/<slug>`) gelijk.
export const tips: Tip[] = [
  {
    slug: 'cognitieve-belasting',
    term: 'Verlaag de cognitieve belasting',
    categorie: 'Cognitive load',
    termen: [
      'cognitive load',
      'werkgeheugen',
      'intrinsieke belasting',
      'extrinsieke belasting',
      'relevante belasting',
    ],
    samenvatting:
      'Drie soorten belasting op het werkgeheugen — intrinsiek, extrinsiek en relevant; snijd de extrinsieke weg.',
    paper: { titel: 'Cognitive load during problem solving', auteurs: 'Sweller', jaar: 1988 },
    detailPad: '/bronnen/cognitieve-belasting',
  },
  {
    slug: 'taxonomie-van-bloom',
    term: 'Denkvaardigheden volgens Bloom',
    categorie: 'Beoordelen',
    termen: [
      'taxonomie van Bloom',
      'denkvaardigheid',
      'onthouden',
      'creëren',
      'leerdoelen',
      'beoordelen',
    ],
    samenvatting:
      'Beoordeel niet alleen welke concepten een leerling gebruikt, maar ook wat hij ermee kan, van onthouden tot creëren.',
    paper: {
      titel: "A Revision of Bloom's Taxonomy: An Overview",
      auteurs: 'Krathwohl',
      jaar: 2002,
    },
    detailPad: '/bronnen/taxonomie-van-bloom',
  },
];

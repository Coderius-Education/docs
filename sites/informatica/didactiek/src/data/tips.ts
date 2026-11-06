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
  {
    slug: 'toetsing-domein-b',
    term: 'Toetsen van algoritmiek in zeven vraagtypes',
    categorie: 'Beoordelen',
    termen: [
      'toetsen',
      'tentamen',
      'algoritmiek',
      'vraagtypes',
      'stellingen',
      'debuggen',
      'misconcepten',
      'SLO',
    ],
    samenvatting:
      'Toets een algoritme met verschillende soorten vragen, van uitvoeren en debuggen tot zelf opstellen, en varieer de moeilijkheid binnen dezelfde context.',
    paper: {
      titel: 'Toetsing domein B: Grondslagen',
      auteurs: 'Bergervoet, Bruggink, Gijssen, Gnodde, Hendriks, Hoekstra en Weeda',
      jaar: 2021,
    },
    detailPad: '/bronnen/toetsing-domein-b',
  },
  {
    slug: 'constructive-alignment',
    term: 'Leerdoel, les en beoordeling op één lijn',
    categorie: 'Beoordelen',
    termen: [
      'constructive alignment',
      'leerdoelen',
      'lesactiviteit',
      'beoordeling',
      'backwash',
      'Biggs',
    ],
    samenvatting:
      'Schrijf eerst op wat een leerling aan het eind kan, laat de les precies dat oefenen, en beoordeel precies dat.',
    paper: {
      titel: 'Enhancing teaching through constructive alignment',
      auteurs: 'Biggs',
      jaar: 1996,
    },
    detailPad: '/bronnen/constructive-alignment',
  },
];

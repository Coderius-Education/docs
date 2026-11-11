// De tips van vakdidactiek: de bron van de homepage (TipZoeker), de
// checklist (/checklist) en de export (tips.json in de build).
//
// Een tip hoort bij één categorie en heeft één controlevraag: een vraag die
// je aan een les stelt, waarop "ja" betekent dat de tip is toegepast. Zo is
// de verzameling ook een checklist voor het nalopen van een cursus.

/**
 * De categorieën, in de volgorde waarin een auteur een les maakt en een
 * reviewer hem naloopt. Een vaste lijst: een tip met een categorie die hier
 * niet staat, is een typefout (tips.test.ts).
 */
export const CATEGORIEEN = [
  {
    id: 'uitleg',
    label: 'Uitleg',
    omschrijving: 'Hoe je iets nieuws neerzet: hoeveel tegelijk, en in welke woorden.',
  },
  {
    id: 'voorbeelden',
    label: 'Voorbeelden',
    omschrijving: 'De code en de plaatjes waaraan een leerling het nieuwe ziet werken.',
  },
  {
    id: 'opdrachten',
    label: 'Opdrachten',
    omschrijving: 'Wat de leerling zelf doet, en de hulp die hij daarbij krijgt.',
  },
  {
    id: 'fouten',
    label: 'Fouten en feedback',
    omschrijving: 'Wat er misgaat, hoe de leerling dat merkt en hoe hij verder komt.',
  },
  {
    id: 'opbouw',
    label: 'Volgorde en opbouw',
    omschrijving: 'De grootte van een stap, en wat een les van de lessen ervoor mag aannemen.',
  },
  {
    id: 'beoordelen',
    label: 'Beoordelen',
    omschrijving: 'Leerdoelen, toetsen en het cijfer.',
  },
] as const;

export type Categorie = (typeof CATEGORIEEN)[number];
export type CategorieId = Categorie['id'];

export type Paper = { titel: string; auteurs: string; jaar: number };

type TipBasis = {
  slug: string; // = bestandsnaam van de detailpagina onder docs/
  term: string; // titel van de tip
  categorie: CategorieId;
  termen: string[]; // klikbare trefwoorden/synoniemen, ook doorzoekbaar
  samenvatting: string; // één zin
  /** Eén vraag aan een les; "ja" betekent dat de tip is toegepast. */
  controlevraag: string;
  detailPad: string; // '/bronnen/<slug>'
};

/**
 * Een tip komt uit onderzoek (met de paper erbij) of uit de praktijk van
 * Coderius (met in één zin waar hij vandaan komt). De site zegt welke van de
 * twee het is: een tip uit de praktijk is een afspraak die bij ons werkte,
 * geen onderzoeksresultaat.
 */
export type Tip = TipBasis &
  ({ bron: 'onderzoek'; paper: Paper } | { bron: 'praktijk'; herkomst: string });

// Voeg hier eenvoudig meer tips toe.
// Maak voor elke nieuwe tip ook een bestand docs/<slug>.md aan en houd
// `slug` en `detailPad` (`/bronnen/<slug>`) gelijk. De controlevraag staat
// ook op de detailpagina, woord voor woord.
export const tips: Tip[] = [
  {
    slug: 'cognitieve-belasting',
    term: 'Verlaag de cognitieve belasting',
    categorie: 'uitleg',
    termen: [
      'cognitive load',
      'werkgeheugen',
      'intrinsieke belasting',
      'extrinsieke belasting',
      'relevante belasting',
    ],
    samenvatting:
      'Drie soorten belasting op het werkgeheugen — intrinsiek, extrinsiek en relevant; snijd de extrinsieke weg.',
    controlevraag: 'Introduceert de pagina hooguit één of twee nieuwe concepten?',
    bron: 'onderzoek',
    paper: { titel: 'Cognitive load during problem solving', auteurs: 'Sweller', jaar: 1988 },
    detailPad: '/bronnen/cognitieve-belasting',
  },
  {
    slug: 'kleine-stappen',
    term: 'Kleine stappen met een succesmoment',
    categorie: 'opbouw',
    termen: ['kleine stappen', 'succesmoment', 'Gelukt', 'controlevraag', 'één ding per stap'],
    samenvatting:
      'Laat een stap één ding doen, en laat de leerling aan iets concreets zien dat het gelukt is voordat de volgende stap begint.',
    controlevraag: 'Doet de stap één ding, en staat erbij wat de leerling ziet als het gelukt is?',
    bron: 'praktijk',
    herkomst:
      'De routes Online zetten en Veiligheid van de fullstack-cursus, die in november 2026 in kleinere stappen zijn geknipt.',
    detailPad: '/bronnen/kleine-stappen',
  },
  {
    slug: 'taxonomie-van-bloom',
    term: 'Denkvaardigheden volgens Bloom',
    categorie: 'beoordelen',
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
    controlevraag:
      'Zegt de beoordeling naast welke concepten de leerling gebruikt ook wat hij ermee kan?',
    bron: 'onderzoek',
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
    categorie: 'beoordelen',
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
    controlevraag: 'Vraagt de toets een algoritme op meer manieren dan alleen uitvoeren?',
    bron: 'onderzoek',
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
    categorie: 'beoordelen',
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
    controlevraag:
      'Oefent de les het werkwoord uit het leerdoel waarop de leerling beoordeeld wordt?',
    bron: 'onderzoek',
    paper: {
      titel: 'Enhancing teaching through constructive alignment',
      auteurs: 'Biggs',
      jaar: 1996,
    },
    detailPad: '/bronnen/constructive-alignment',
  },
  {
    slug: 'primm',
    term: 'Eerst lezen, dan schrijven met PRIMM',
    categorie: 'opdrachten',
    termen: [
      'PRIMM',
      'Predict',
      'Run',
      'Investigate',
      'Modify',
      'Make',
      'voorspellen',
      'code lezen',
    ],
    samenvatting:
      'Laat een leerling werkende code eerst lezen en voorspellen, dan draaien en onderzoeken, en pas daarna aanpassen en zelf maken.',
    controlevraag: 'Leest en voorspelt de leerling werkende code voordat hij zelf code schrijft?',
    bron: 'onderzoek',
    paper: {
      titel: 'Teaching computer programming with PRIMM: a sociocultural perspective',
      auteurs: 'Sentance, Waite en Kallia',
      jaar: 2019,
    },
    detailPad: '/bronnen/primm',
  },
  {
    slug: 'uitgewerkte-voorbeelden',
    term: 'Eerst een uitgewerkt voorbeeld',
    categorie: 'voorbeelden',
    termen: ['worked example', 'uitgewerkt voorbeeld', 'voorbeeldcode', 'voorbeeld vóór opgave'],
    samenvatting:
      'Laat een beginner een compleet, werkend voorbeeld bestuderen voordat hij zelf een opgave oplost, en geef direct daarna een opgave die erop lijkt.',
    controlevraag:
      'Staat er vóór de eerste opdracht een compleet, werkend voorbeeld van wat de leerling daarna zelf doet?',
    bron: 'onderzoek',
    paper: {
      titel: 'The use of worked examples as a substitute for problem solving in learning algebra',
      auteurs: 'Sweller en Cooper',
      jaar: 1985,
    },
    detailPad: '/bronnen/uitgewerkte-voorbeelden',
  },
  {
    slug: 'hulp-in-stappen',
    term: 'Hulp in stappen, die je weer weghaalt',
    categorie: 'opdrachten',
    termen: ['scaffolding', 'steiger', 'tip', 'antwoord', 'hulp afbouwen'],
    samenvatting:
      'Geef een leerling die vastloopt precies zoveel hulp als hij nodig heeft: eerst een aanwijzing, dan pas het antwoord, en bij de volgende opdracht minder.',
    controlevraag:
      'Krijgt de leerling bij elke opdracht eerst een tip en pas daarna het antwoord, allebei dichtgeklapt?',
    bron: 'onderzoek',
    paper: {
      titel: 'The role of tutoring in problem solving',
      auteurs: 'Wood, Bruner en Ross',
      jaar: 1976,
    },
    detailPad: '/bronnen/hulp-in-stappen',
  },
  {
    slug: 'leren-van-fouten',
    term: 'Laat fouten zien en leg ze uit',
    categorie: 'fouten',
    termen: ['fouten', 'foutmelding', 'feedback', 'error-driven learning', 'Er gaat iets mis'],
    samenvatting:
      'Verstop fouten niet: laat de leerling een fout maken of zien, met de melding die erbij hoort en de reden erachter.',
    controlevraag:
      'Laat de les de fouten zien die een leerling hier maakt, met de melding en de reden erbij?',
    bron: 'onderzoek',
    paper: { titel: 'Learning from errors', auteurs: 'Metcalfe', jaar: 2017 },
    detailPad: '/bronnen/leren-van-fouten',
  },
];

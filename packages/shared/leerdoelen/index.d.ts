/** Basis, gevorderd of expert: de moeilijkheid van een concept binnen een niveau. */
export type ConceptMoeilijkheid = 'basis' | 'gevorderd' | 'expert';
/** De moeilijkheid van een beoordeling: ook "niet aan basis voldaan". */
export type MoeilijkheidId = 'niet-aan-basis' | ConceptMoeilijkheid;

export interface Benoemd {
  id: string;
  label: string;
}

export interface LeerdoelConcept {
  id: string;
  onderwerp: string;
  concept: string;
  /** Per niveau-id ('1' tot en met '4') de moeilijkheid; null als het concept niet bij dat niveau hoort. */
  niveau: Record<string, ConceptMoeilijkheid | null>;
  bloom?: string;
  groep?: string;
  toelichting?: string;
  /**
   * Waar je het concept leert: de doc-id's uit het veld `les`. Na de plugin
   * (plugins/leerdoelen.js) ook met titel en pad binnen de cursus.
   */
  lessen?: Les[];
  /**
   * Alleen op het tentamen-niveau: de manieren van kennen (ids uit
   * `tentamen.manieren`) die voor dit concept gelden. Leeg: het concept is
   * zelf de vaardigheid.
   */
  manieren?: string[];
  /** Na de plugin: per manier de les waar je hem oefent. */
  oefenen?: Record<string, Les>;
}

export interface Les {
  id: string;
  titel?: string;
  /**
   * Pad binnen de cursus, met de baseUrl: '/web/docs/html-css/koppen-lijsten'.
   * Bij een les in een andere cursus (`extern`) de volledige URL.
   */
  pad?: string;
  extern?: boolean;
}

/** Een manier waarop je een concept kunt kennen, op het tentamen-niveau. */
export interface Manier extends Benoemd {
  uitleg: string;
  /** Het vraagtype uit de bron dat erbij hoort. */
  vraagtype: string;
  /** Lesnamen in de map van het concept; "bouwen/" is de eerste les in die submap. */
  lessen: string[];
}

/** Een niveau dat met een tentamen wordt getoetst, in plaats van met een project. */
export interface Tentamen {
  niveau: string;
  vorm: string;
  /** Pad van de pagina bij vakdidactiek: '/bronnen/<slug>'. */
  bron: string;
  manieren: Manier[];
  /** Per onderwerp-id een inleiding op de pagina. */
  onderwerpen: Record<string, string>;
}

/** Een van de vier niveaus, Niveau 1 tot en met Niveau 4 (niveaus.json). */
export type Niveau = Benoemd;

export interface Leerdoelen {
  niveaus: Niveau[];
  onderwerpen: Benoemd[];
  concepten: LeerdoelConcept[];
  tentamen?: Tentamen;
  /**
   * Per niveau en onderwerp: in hoeveel groepen gevorderd een gevorderd
   * concept vraagt (standaard één). Niveau 2 van play: { "2": { "play": 2 } }.
   */
  gevorderdInGroepen?: Record<string, Record<string, number>>;
}

export interface Werkwoord {
  werkwoord: string;
  voorbeeld: string;
}
export interface Denkvaardigheid extends Benoemd {
  /** Eén of twee zinnen: wat je doet, en wat je oplevert. */
  omschrijving: string;
  werkwoorden: Werkwoord[];
}
export interface Moeilijkheid extends Benoemd {
  id: MoeilijkheidId;
  cijferAls?: MoeilijkheidId;
}
/**
 * Een bron staat er alleen als vakdidactiek hem uitlegt: `didactiek` is het
 * pad van die pagina op de didactiek-site (leerdoelen.test.ts eist dat hij
 * bestaat en dezelfde paper noemt).
 */
export interface Bron {
  titel: string;
  auteurs: string;
  jaar: number;
  toelichting: string;
  didactiek: string;
  didactiekLabel: string;
}
export interface Bloom {
  denkvaardigheden: Denkvaardigheid[];
  tijdensDeLessen: string[];
  moeilijkheden: Moeilijkheid[];
  cijfers: Record<string, Record<string, number>>;
  sjabloon: string;
  vuistregels: string[];
  bronnen: Bron[];
}

export interface Telling {
  used: number;
  total: number;
}
export interface OnderwerpTelling {
  label: string;
  basis: Telling;
  gevorderd: Telling;
  expert?: Telling;
  /** Met gevorderdInGroepen: hoeveel groepen nodig zijn, en hoeveel er een gevorderd concept hebben. */
  gevorderdGroepen?: { nodig: number; gehaald: number };
}

export const BLOOM: Bloom;
export const NIVEAUS: Niveau[];
export const CONCEPT_MOEILIJKHEDEN: ConceptMoeilijkheid[];
export const VELDEN: string[];
export function leesLeerdoelen(data: unknown, bron?: string): Leerdoelen;
export function cijferVoor(bloom: string, moeilijkheid: MoeilijkheidId): number;
export function cijferTekst(cijfer: number): string;
export function sjabloonZin(bloom: string, moeilijkheid: MoeilijkheidId): string;
export function moeilijkheidVoorstel(perOnderwerp: OnderwerpTelling[]): {
  moeilijkheid: MoeilijkheidId;
  reden: string;
};
export function moeilijkhedenTekst(leerdoelen: Leerdoelen): string;
export function projectNiveaus(leerdoelen: Leerdoelen): Niveau[];
/** De onderwerpen met minstens één concept op dit niveau, elk met die concepten. */
export function onderwerpenOpNiveau(
  leerdoelen: Leerdoelen,
  niveau: string,
): { onderwerp: Benoemd; concepten: LeerdoelConcept[] }[];
/** De kolommen van de tabel van één onderwerp: basis en gevorderd als het niveau ze heeft, expert alleen als dit onderwerp er een heeft. */
export function kolommenVoorOnderwerp(
  leerdoelen: Leerdoelen,
  niveau: string,
  rijen: Pick<LeerdoelConcept, 'niveau'>[],
): ConceptMoeilijkheid[];
/** Hoe een concept verandert van niveau `van` naar `naar`; null als hij gelijk blijft. */
export type Overgang = 'moeilijker' | 'makkelijker' | 'nieuw' | 'weg';
export function overgang(
  concept: Pick<LeerdoelConcept, 'niveau'>,
  van: string,
  naar: string,
): Overgang | null;
/** Per overgang tussen twee opeenvolgende niveaus (zonder tentamen) de concepten die veranderen, gegroepeerd naar wat ze worden. */
export type VerschilSoort = 'erbij' | ConceptMoeilijkheid | 'valt-af';
export function verschillen(leerdoelen: Leerdoelen): {
  van: Niveau;
  naar: Niveau;
  aantal: number;
  groepen: {
    soort: VerschilSoort;
    concepten: {
      concept: LeerdoelConcept;
      was: ConceptMoeilijkheid | null;
      /** Bij erbij: het laatste niveau ervoor waar het concept al stond ("weer erbij"). */
      eerder: { niveau: Niveau; moeilijkheid: ConceptMoeilijkheid } | null;
    }[];
  }[];
}[];
/** Voor de pagina van een niveau: wat er anders is en op de pagina staat, en wat afvalt. */
export function verschilTelling(
  leerdoelen: Leerdoelen,
  niveau: string,
): { van: Niveau; opPagina: number; afgevallen: number } | null;
/** Of de cursus, of met `niveau` alleen dat niveau, concepten op expert heeft. */
export function heeftExpert(leerdoelen: Leerdoelen, niveau?: string): boolean;
export function cijferKolommen(leerdoelen: Leerdoelen): Moeilijkheid[];
export function denkvaardigheid(id: string): Denkvaardigheid;
export function moeilijkheid(id: string): Moeilijkheid;

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
  /** Per niveau-id de moeilijkheid. */
  niveau: Record<string, ConceptMoeilijkheid>;
  bloom?: string;
  groep?: string;
  toelichting?: string;
}

export interface Leerdoelen {
  niveaus: Benoemd[];
  onderwerpen: Benoemd[];
  concepten: LeerdoelConcept[];
}

export interface Werkwoord {
  werkwoord: string;
  voorbeeld: string;
}
export interface Denkvaardigheid extends Benoemd {
  werkwoorden: Werkwoord[];
}
export interface Moeilijkheid extends Benoemd {
  id: MoeilijkheidId;
  cijferAls?: MoeilijkheidId;
}
export interface Bron {
  titel: string;
  auteurs: string;
  jaar: number;
  uitgave: string;
  url?: string;
  toelichting: string;
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
}

export const BLOOM: Bloom;
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
export function denkvaardigheid(id: string): Denkvaardigheid;
export function moeilijkheid(id: string): Moeilijkheid;

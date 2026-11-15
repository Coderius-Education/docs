import { type ReactNode, createContext, useContext } from 'react';

// Wat een onderdeel in een les-tabblad van het tabblad moet weten. Los van
// index.tsx, zonder iets van Docusaurus: een oefenveld uit een ander pakket
// (de CodeExercise van python-runner) vraagt hier of het in een tabblad
// staat, en zijn tests hoeven daarvoor de router niet na te maken.

/** De volgende stap in een tabblad met stappen, voor de knop Volgende. */
export type Stap = { label: string; ga: () => void } | null;

/** Staat om elk paneel van een tabblad; daarbuiten is hij null. */
export const PaneelContext = createContext<((stap: Stap) => void) | null>(null);

/** De vorige stap in een tabblad met stappen, voor de knop Vorige. */
export const TerugContext = createContext<((stap: Stap) => void) | null>(null);

/** Of dit onderdeel in een les-tabblad staat. Een oefenveld past zich daar
 *  aan het scherm aan. */
export function useInLesTab(): boolean {
  return useContext(PaneelContext) !== null;
}

/** Of het paneel waar dit onderdeel in staat (tabblad en stap) nu open is.
 *  Buiten een tabblad is dat altijd zo. */
export const OpenContext = createContext(true);

/** Of dit onderdeel nu te zien is: het tabblad en de stap waar het in staat,
 *  zijn open. Een onderdeel dat iets meet, doet dat pas dan. */
export function useInBeeld(): boolean {
  return useContext(OpenContext);
}

/** Wat een opdracht moet opleveren: de verwachte uitvoer of een doelplaatje.
 *  <LesVeld> zet het om het oefenveld; het veld toont het in zijn
 *  uitvoerkolom, naast wat de leerling zelf krijgt. */
export const DoelContext = createContext<ReactNode>(null);

/** Het doel van de opdracht waar dit oefenveld bij hoort, of null. */
export function useLesDoel(): ReactNode {
  return useContext(DoelContext);
}

/** De hulp bij een opdracht: de tip en het antwoord, elk als lestekst. */
export type Hulp = {
  tip?: ReactNode;
  antwoord?: ReactNode;
  /** Hoe de les het antwoord noemt: "oplossing" of "antwoord". */
  naam?: string;
  /** De code van het antwoord: het veld kan hem uitvoeren. */
  code?: string;
  /** De langste regel code in het antwoord, in tekens. */
  tekens?: number;
  /** De langste regel code in de tip, in tekens. */
  tipTekens?: number;
};

/** De tip en het antwoord van de opdracht waar een oefenveld bij hoort.
 *  <LesVeld> zet ze om het veld; het veld toont ze op de plek van de
 *  uitvoer, naast de code van de leerling. */
export const HulpContext = createContext<Hulp | null>(null);

/** De hulp bij de opdracht waar dit oefenveld bij hoort, of null. */
export function useLesHulp(): Hulp | null {
  return useContext(HulpContext);
}

/**
 * Een teken code in het vak, in pixels, met de letters op hun kleinst: past
 * een regel niet, dan maakt pasCode de letters van het blok kleiner, tot 80%.
 */
const TEKEN_PX = 7;
/** De ruimte om de code: de rand van het vak en die van het codeblok. */
const RAND_PX = 56;
/** De kolom met regelnummers van een codeblok (algoritmes). */
const NUMMERS_PX = 36;
/** Meer dan dit deel van het veld krijgt de hulp niet: de code blijft te zien. */
const MEESTE_DEEL = 0.7;

/**
 * Hoe breed de kolom met de tip of het antwoord is, in pixels: zo breed als
 * de langste regel code erin nodig heeft (`tekens`, uit de build), minstens
 * `minDeel` van het veld en hoogstens zeventig procent. De code van de
 * leerling levert in, zolang de hulp open staat: in een kolom van 418 pixels
 * was van een antwoord met een regel van 64 tekens het eind afgesneden, en
 * bij de helft van de antwoorden van web past de langste regel niet in de
 * kolom van het voorbeeld. Onder de code zetten hielp niet: in een veld van
 * driehonderd pixels bleef er voor het antwoord één regel over.
 */
export function hulpBreedte(
  tekens: number | undefined,
  veld: number,
  { minDeel = 0.5, nummers = false }: { minDeel?: number; nummers?: boolean } = {},
): number {
  const nodig = tekens ? tekens * TEKEN_PX + RAND_PX + (nummers ? NUMMERS_PX : 0) : 0;
  return Math.round(Math.min(veld * MEESTE_DEEL, Math.max(veld * minDeel, nodig)));
}

/** Het attribuut op het paneel van een tabblad, met zijn id als waarde. */
export const LES_TAB = 'data-les-tab';

/** Het attribuut op de rij onderaan een tabblad, met Vorige en Volgende. */
export const LES_VERDER = 'data-les-verder';

/** Het attribuut op de knop Volgende in die rij: naar de volgende stap of
 *  het volgende tabblad. Niet op de link naar de volgende les, die op het
 *  laatste scherm op die plek staat. */
export const LES_VOLGENDE = 'data-les-volgende';

/** De knop Volgende van het tabblad dat open is. Een oefenveld dat het
 *  toetsenbord vasthoudt (de terminal van Linux, Esc en dan Tab), zet de
 *  focus daarop; met deze selector valt het niet stil als LesTabs zijn
 *  opmaak verandert (LesTabs.test.tsx). Niet de knop Vorige ervoor, en niet
 *  de link naar de volgende les: een Enter daar verlaat de pagina, en dan is
 *  het werk in de terminal weg. */
export const VOLGENDE_KNOP = `[${LES_TAB}]:not([hidden]) > [${LES_VERDER}] [${LES_VOLGENDE}]`;

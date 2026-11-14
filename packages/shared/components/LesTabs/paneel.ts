import { type ReactNode, createContext, useContext } from 'react';

// Wat een onderdeel in een les-tabblad van het tabblad moet weten. Los van
// index.tsx, zonder iets van Docusaurus: een oefenveld uit een ander pakket
// (de CodeExercise van python-runner) vraagt hier of het in een tabblad
// staat, en zijn tests hoeven daarvoor de router niet na te maken.

/** De volgende stap in een tabblad met stappen, voor de knop Volgende. */
export type Stap = { label: string; ga: () => void } | null;

/** Staat om elk paneel van een tabblad; daarbuiten is hij null. */
export const PaneelContext = createContext<((stap: Stap) => void) | null>(null);

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

/** Het attribuut op het paneel van een tabblad, met zijn id als waarde. */
export const LES_TAB = 'data-les-tab';

/** Het attribuut op de alinea met de knop Volgende onderaan een tabblad. De
 *  opmaak verbergt er de link naar de volgende les mee. */
export const LES_VERDER = 'data-les-verder';

/** De knop Volgende van het tabblad dat open is. Een oefenveld dat het
 *  toetsenbord vasthoudt (de terminal van Linux, Esc en dan Tab), zet de
 *  focus daarop; met deze selector valt het niet stil als LesTabs zijn
 *  opmaak verandert (LesTabs.test.tsx). */
export const VOLGENDE_KNOP = `[${LES_TAB}]:not([hidden]) > [${LES_VERDER}] button`;

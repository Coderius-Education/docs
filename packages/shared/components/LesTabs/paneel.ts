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

/** Wat een opdracht moet opleveren: de verwachte uitvoer of een doelplaatje.
 *  <LesVeld> zet het om het oefenveld; het veld toont het in zijn
 *  uitvoerkolom, naast wat de leerling zelf krijgt. */
export const DoelContext = createContext<ReactNode>(null);

/** Het doel van de opdracht waar dit oefenveld bij hoort, of null. */
export function useLesDoel(): ReactNode {
  return useContext(DoelContext);
}

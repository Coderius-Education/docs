import type { Concept, Level } from './types';

// Een concept kan één niveau hebben, of één per leerroute. Deze helper is de
// enige plek die dat verschil kent; de rest van de motor werkt met een gewone
// Level. Zonder tracks in de config verandert er niets aan het gedrag.

/**
 * Het niveau van een concept binnen een track.
 *
 * @param track de track-id, of null als de site er geen heeft
 */
export function levelVoor(concept: Concept, track: string | null): Level {
  if (typeof concept.level === 'string') return concept.level;
  if (track !== null) {
    const perTrack = concept.level[track];
    if (perTrack) return perTrack;
  }
  // Een record zonder de gevraagde track hoort validateConfig al te hebben
  // gemeld. Val terug op de eerste waarde, zodat het concept in elk geval
  // ergens meetelt in plaats van stil uit de tellingen te verdwijnen.
  const eerste = Object.values(concept.level)[0];
  return eerste ?? 'basis';
}

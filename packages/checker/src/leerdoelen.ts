import { type Leerdoelen, leesLeerdoelen, moeilijkheid } from '@coderius/shared/leerdoelen';
import type { CheckerConfig, Concept, ConceptDetect, ConceptLevel } from './types';

// Van de leerdoelen van een cursus (src/leerdoelen.json, zie
// packages/shared/leerdoelen) naar de concepten van de nakijker. De
// leerdoelen zeggen wélke concepten tellen en op welk niveau; de site zegt
// per concept hóé je het in de bestanden vindt. Een concept zonder
// herkenning, of een herkenning zonder concept, is een fout: anders telt een
// nieuwe rij in de leerdoelen stil niet mee, of meet de nakijker iets wat de
// docent niet meer beoordeelt.

export type UitLeerdoelen = Pick<CheckerConfig, 'subjects' | 'concepts'> &
  Pick<CheckerConfig, 'tracks'>;

/**
 * @param data de inhoud van src/leerdoelen.json
 * @param herkenning per concept-id hoe de nakijker het vindt
 */
export function leerdoelenNaarConfig(
  data: unknown,
  herkenning: Record<string, ConceptDetect>,
): UitLeerdoelen & { leerdoelen: Leerdoelen } {
  const leerdoelen = leesLeerdoelen(data);
  const eenNiveau = leerdoelen.niveaus.length === 1;
  const ids = new Set(leerdoelen.concepten.map((c) => c.id));

  const zonder = leerdoelen.concepten.filter((c) => !herkenning[c.id]).map((c) => c.id);
  const over = Object.keys(herkenning).filter((id) => !ids.has(id));
  const fouten = [
    ...zonder.map((id) => `concept '${id}' staat in leerdoelen.json maar heeft geen herkenning`),
    ...over.map((id) => `herkenning voor '${id}', dat niet in leerdoelen.json staat`),
  ];
  if (fouten.length) throw new Error(`nakijker:\n- ${fouten.join('\n- ')}`);

  const concepts: Concept[] = leerdoelen.concepten.map((c) => {
    const level: ConceptLevel = eenNiveau ? c.niveau[leerdoelen.niveaus[0].id] : { ...c.niveau };
    return {
      id: c.id,
      subject: c.onderwerp,
      // Zonder eigen groep: bij één niveau de moeilijkheid als kop (Basis,
      // Gevorderd), zoals de tabel van de docent; bij meer niveaus verschilt
      // die per leerroute, en staat het label bij het concept.
      group: c.groep ?? (eenNiveau ? moeilijkheid(level as string).label : 'Concepten'),
      label: c.concept,
      level,
      ...(c.bloom ? { bloom: c.bloom } : {}),
      detect: herkenning[c.id],
    };
  });

  return {
    leerdoelen,
    subjects: leerdoelen.onderwerpen,
    ...(eenNiveau ? {} : { tracks: leerdoelen.niveaus }),
    concepts,
  };
}

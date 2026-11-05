import { BLOOM, type Leerdoelen, leesLeerdoelen, moeilijkheid } from '@coderius/shared/leerdoelen';
import type { CheckerConfig, Concept, ConceptDetect, ConceptLevel, Level } from './types';

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

  // Een concept dat bij geen enkel niveau hoort (overal null), kan de
  // nakijker nergens tellen; met één niveau is null dus ook een fout.
  const nergens = leerdoelen.concepten
    .filter((c) => Object.values(c.niveau).every((m) => m === null))
    .map((c) => `concept '${c.id}' hoort bij geen enkel niveau`);
  if (nergens.length) throw new Error(`nakijker:\n- ${nergens.join('\n- ')}`);

  const concepts: Concept[] = leerdoelen.concepten.map((c) => {
    const level: ConceptLevel = eenNiveau
      ? (c.niveau[leerdoelen.niveaus[0].id] as Level)
      : { ...c.niveau };
    // Alleen de niveaus waar het concept bij hoort, bepalen de groep.
    const overal = new Set(Object.values(c.niveau).filter((m) => m !== null));
    return {
      id: c.id,
      subject: c.onderwerp,
      // Zonder eigen groep: de moeilijkheid als kop (Basis, Gevorderd), zoals
      // de tabel van de docent. Verschilt die per niveau, dan staat het
      // concept onder "Per niveau anders", met het label van de gekozen
      // leerroute erbij.
      group:
        c.groep ?? (overal.size === 1 ? moeilijkheid([...overal][0]).label : 'Per niveau anders'),
      label: c.concept,
      level,
      ...(c.bloom ? { bloom: c.bloom } : {}),
      detect: herkenning[c.id],
    };
  });

  return {
    leerdoelen,
    subjects: leerdoelen.onderwerpen,
    ...(eenNiveau ? {} : { tracks: leerdoelen.niveaus.map((n) => ({ id: n.id, label: n.label })) }),
    concepts,
  };
}

/**
 * De leerroute die de nakijker gebruikt: de bewaarde, als de config hem nog
 * kent, en anders de eerste. Een beoordeling van vóór een nieuwe indeling
 * (Godot had start en verdieping) rekende anders stil met de eerste waarde
 * van elk concept, zonder dat er een knop gekozen stond. Kent de config de
 * oude route (oudeLeerroutes), dan wordt het de route die ervoor in de plaats
 * kwam: een beoordeling op "verdieping" telde anders ineens op niveau 1.
 */
export function geldigeTrack(
  config: Pick<CheckerConfig, 'tracks' | 'oudeLeerroutes'>,
  track: string | null | undefined,
): string | null {
  const tracks = config.tracks ?? [];
  if (tracks.length === 0) return null;
  const bekend = (id: string | null | undefined) => tracks.some((t) => t.id === id);
  if (bekend(track)) return track as string;
  const nieuw = track ? config.oudeLeerroutes?.[track] : undefined;
  return bekend(nieuw) ? (nieuw as string) : tracks[0].id;
}

/**
 * De denkvaardigheid uit oude handmatige vinkjes (de Gesprek-vinkjes van
 * Godot): de hoogste trede die de docent aanvinkte, of null.
 */
export function bloomUitOudeVinkjes(
  oud: Record<string, string> | undefined,
  handmatig: readonly string[],
): string | null {
  if (!oud) return null;
  const volgorde = BLOOM.denkvaardigheden.map((d) => d.id);
  let hoogste = -1;
  for (const id of handmatig) {
    const i = volgorde.indexOf(oud[id] ?? '');
    if (i > hoogste) hoogste = i;
  }
  return hoogste === -1 ? null : volgorde[hoogste];
}

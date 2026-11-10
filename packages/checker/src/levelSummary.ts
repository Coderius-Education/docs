import { inTrack, levelVoor } from './conceptLevel';
import { type CheckReport, type CheckerConfig, LEVELS, type Level } from './types';

// Vat het rapport samen als basis/gevorderd-tellingen, per onderwerp. Een
// concept telt als "toegepast" zodra het is gedetecteerd (used). Elk concept
// telt individueel (i.t.t. de web-checker, die per techniekgroep telt) — dat
// past bij checklists waar elk concept atomair is.

export interface ConceptStats {
  used: number;
  total: number;
}

export interface SubjectConcepts {
  subject: string;
  label: string;
  basis: ConceptStats;
  gevorderd: ConceptStats;
  expert: ConceptStats;
  /**
   * Met gevorderdInGroepen in de leerdoelen: hoeveel groepen gevorderd vraagt,
   * en in hoeveel er een gevorderd concept is toegepast.
   */
  gevorderdGroepen?: { nodig: number; gehaald: number };
}

export interface LevelSummaryResult {
  basis: ConceptStats;
  gevorderd: ConceptStats;
  expert: ConceptStats;
  bySubject: SubjectConcepts[];
}

export function computeLevelSummary(
  report: CheckReport,
  config: CheckerConfig,
  track: string | null = null,
): LevelSummaryResult {
  const usedById = new Map(report.concepts.map((m) => [m.id, m.used]));

  const bySubject: SubjectConcepts[] = config.subjects.map((s) => {
    const stats = Object.fromEntries(LEVELS.map((l) => [l, { used: 0, total: 0 }])) as Record<
      Level,
      ConceptStats
    >;
    for (const c of config.concepts) {
      if (c.subject !== s.id || !inTrack(c, track)) continue;
      const level = levelVoor(c, track);
      stats[level].total++;
      if (usedById.get(c.id)) stats[level].used++;
    }
    return { subject: s.id, label: s.label, ...stats };
  });

  const sum = (pick: (s: SubjectConcepts) => ConceptStats): ConceptStats =>
    bySubject.reduce(
      (acc, s) => ({ used: acc.used + pick(s).used, total: acc.total + pick(s).total }),
      { used: 0, total: 0 },
    );

  return {
    basis: sum((s) => s.basis),
    gevorderd: sum((s) => s.gevorderd),
    expert: sum((s) => s.expert),
    bySubject,
  };
}

/**
 * De onderdelen waar het voorstel voor een moeilijkheid naar kijkt: de
 * onderwerpen, en als een leerroute maar één onderwerp heeft de groepen
 * daarin. De vuistregel zegt "bij elk onderwerp gevorderde concepten"; met
 * één onderwerp (FastAPI op niveau 1 en 2 van fullstack) gaf één route met
 * een path parameter zo al expert. Met de groepen (Accounts, Gegevens
 * opslaan, Uitbreidingen, …) vraagt het voorstel weer om breedte.
 */
export function voorstelOnderdelen(
  report: CheckReport,
  config: CheckerConfig,
  track: string | null = null,
): SubjectConcepts[] {
  const usedById = new Map(report.concepts.map((m) => [m.id, m.used]));
  // Vraagt gevorderd bij een onderwerp meer groepen (gevorderdInGroepen),
  // tel dan in hoeveel groepen een gevorderd of expert-concept is toegepast.
  const nodigPer = (track && config.leerdoelen?.gevorderdInGroepen?.[track]) || {};
  const bySubject = computeLevelSummary(report, config, track).bySubject.map((s) => {
    const nodig = nodigPer[s.subject];
    if (!nodig) return s;
    const groepen = new Set(
      config.concepts
        .filter(
          (c) =>
            c.subject === s.subject &&
            inTrack(c, track) &&
            levelVoor(c, track) !== 'basis' &&
            usedById.get(c.id),
        )
        .map((c) => c.group),
    );
    return { ...s, gevorderdGroepen: { nodig, gehaald: groepen.size } };
  });
  const metConcepten = bySubject.filter((s) => LEVELS.some((l) => s[l].total > 0));
  if (metConcepten.length !== 1) return bySubject;
  const onderwerp = metConcepten[0].subject;
  const groepen = new Map<string, SubjectConcepts>();
  for (const c of config.concepts) {
    if (c.subject !== onderwerp || !inTrack(c, track)) continue;
    let g = groepen.get(c.group);
    if (!g) {
      g = {
        subject: `${onderwerp}/${c.group}`,
        label: c.group,
        basis: { used: 0, total: 0 },
        gevorderd: { used: 0, total: 0 },
        expert: { used: 0, total: 0 },
      };
      groepen.set(c.group, g);
    }
    const level = levelVoor(c, track);
    g[level].total++;
    if (usedById.get(c.id)) g[level].used++;
  }
  return [...groepen.values()];
}

/**
 * De onderdelen (zie voorstelOnderdelen) waar een moeilijkheid alleen te
 * halen is met een vinkje: elk concept vanaf die moeilijkheid is handmatig,
 * en er staat er geen aan. Zo zegt het voorstel dat het aan een vinkje ligt,
 * en niet aan de code.
 */
export function alleenMetVinkje(
  report: CheckReport,
  config: CheckerConfig,
  track: string | null,
  vanaf: Level,
): string[] {
  const usedById = new Map(report.concepts.map((m) => [m.id, m.used]));
  const vanafIndex = LEVELS.indexOf(vanaf);
  const onderdelen = voorstelOnderdelen(report, config, track);
  const perGroep = onderdelen.some((o) => o.subject.includes('/'));
  return onderdelen
    .filter((o) => {
      const concepten = config.concepts.filter(
        (c) =>
          inTrack(c, track) &&
          (perGroep ? `${c.subject}/${c.group}` === o.subject : c.subject === o.subject) &&
          LEVELS.indexOf(levelVoor(c, track)) >= vanafIndex,
      );
      return (
        concepten.length > 0 &&
        concepten.every((c) => c.detect.type === 'handmatig') &&
        !concepten.some((c) => usedById.get(c.id))
      );
    })
    .map((o) => o.label);
}

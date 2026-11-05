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

import { levelVoor } from './conceptLevel';
import type { CheckReport, CheckerConfig, Level } from './types';

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
}

export interface LevelSummaryResult {
  basis: ConceptStats;
  gevorderd: ConceptStats;
  bySubject: SubjectConcepts[];
}

export function computeLevelSummary(
  report: CheckReport,
  config: CheckerConfig,
  track: string | null = null,
): LevelSummaryResult {
  const usedById = new Map(report.concepts.map((m) => [m.id, m.used]));

  const bySubject: SubjectConcepts[] = config.subjects.map((s) => {
    const stats: Record<Level, ConceptStats> = {
      basis: { used: 0, total: 0 },
      gevorderd: { used: 0, total: 0 },
    };
    for (const c of config.concepts) {
      if (c.subject !== s.id) continue;
      const level = levelVoor(c, track);
      stats[level].total++;
      if (usedById.get(c.id)) stats[level].used++;
    }
    return { subject: s.id, label: s.label, basis: stats.basis, gevorderd: stats.gevorderd };
  });

  const sum = (pick: (s: SubjectConcepts) => ConceptStats): ConceptStats =>
    bySubject.reduce(
      (acc, s) => ({ used: acc.used + pick(s).used, total: acc.total + pick(s).total }),
      { used: 0, total: 0 },
    );

  return {
    basis: sum((s) => s.basis),
    gevorderd: sum((s) => s.gevorderd),
    bySubject,
  };
}

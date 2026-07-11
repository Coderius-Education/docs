import { CSS_TECHNIQUES, HTML_ELEMENTS, JS_TECHNIQUES } from './curriculum';
import type { AnalysisReport, Level } from './types';

export interface LevelStats {
  used: number;
  total: number;
}

export function computeLevelSummary(report: AnalysisReport): Record<Level, LevelStats> {
  const stats: Record<Level, LevelStats> = {
    basis: { used: 0, total: 0 },
    gevorderd: { used: 0, total: 0 },
  };

  for (const el of HTML_ELEMENTS) {
    stats[el.level].total++;
    if ((report.html.elementCounts[el.tag] ?? 0) > 0) stats[el.level].used++;
  }

  const cssUsedById = new Map(report.css.map((m) => [m.id, m.used]));
  for (const t of CSS_TECHNIQUES) {
    stats[t.level].total++;
    if (cssUsedById.get(t.id)) stats[t.level].used++;
  }

  const jsUsedById = new Map(report.js.map((m) => [m.id, m.used]));
  for (const t of JS_TECHNIQUES) {
    stats[t.level].total++;
    if (jsUsedById.get(t.id)) stats[t.level].used++;
  }

  return stats;
}

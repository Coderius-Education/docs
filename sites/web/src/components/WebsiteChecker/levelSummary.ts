import { CSS_TECHNIQUES, HTML_ELEMENTS, JS_TECHNIQUES } from './curriculum';
import type { AnalysisReport, Level } from './types';

export interface ConceptStats {
  /** Aantal toegepaste concepten (een concept telt zodra ≥1 deelitem voorkomt). */
  used: number;
  total: number;
}

export type Subject = 'HTML' | 'CSS' | 'JS';

export interface SubjectConcepts {
  subject: Subject;
  basis: ConceptStats;
  gevorderd: ConceptStats;
}

export interface LevelSummaryResult {
  /** Totaal over alle onderwerpen. */
  basis: ConceptStats;
  gevorderd: ConceptStats;
  bySubject: SubjectConcepts[];
}

interface Item {
  subject: Subject;
  group: string;
  level: Level;
  used: boolean;
}

// Een "concept" is een (onderwerp, groep, niveau)-combinatie: bv. de gevorderde
// kant van "Selectoren", of het concept "Flexbox". Het is toegepast zodra
// minstens één deelitem ervan voorkomt — het gaat om het concept, niet om alle
// losse eigenschappen.
function countConcepts(items: Item[], level: Level): ConceptStats {
  const applied = new Set<string>();
  const all = new Set<string>();
  for (const it of items) {
    if (it.level !== level) continue;
    all.add(it.group);
    if (it.used) applied.add(it.group);
  }
  return { used: applied.size, total: all.size };
}

export function computeLevelSummary(report: AnalysisReport): LevelSummaryResult {
  const htmlUsed = (tags: string[]) => tags.some((t) => (report.html.elementCounts[t] ?? 0) > 0);
  const cssUsedById = new Map(report.css.map((m) => [m.id, m.used]));
  const jsUsedById = new Map(report.js.map((m) => [m.id, m.used]));

  const items: Item[] = [
    ...HTML_ELEMENTS.map(
      (el): Item => ({
        subject: 'HTML',
        group: el.group,
        level: el.level,
        used: htmlUsed(el.tags),
      }),
    ),
    ...CSS_TECHNIQUES.map(
      (t): Item => ({
        subject: 'CSS',
        group: t.group,
        level: t.level,
        used: cssUsedById.get(t.id) ?? false,
      }),
    ),
    ...JS_TECHNIQUES.map(
      (t): Item => ({
        subject: 'JS',
        group: t.group,
        level: t.level,
        used: jsUsedById.get(t.id) ?? false,
      }),
    ),
  ];

  const bySubject: SubjectConcepts[] = (['HTML', 'CSS', 'JS'] as const).map((subject) => {
    const subjectItems = items.filter((it) => it.subject === subject);
    return {
      subject,
      basis: countConcepts(subjectItems, 'basis'),
      gevorderd: countConcepts(subjectItems, 'gevorderd'),
    };
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

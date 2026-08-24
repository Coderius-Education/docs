import { describe, expect, it } from 'vitest';
import { computeLevelSummary } from './levelSummary';
import type { CheckReport, CheckerConfig, Concept } from './types';

function concept(id: string, subject: string, level: 'basis' | 'gevorderd'): Concept {
  return {
    id,
    subject,
    group: 'Groep',
    label: id,
    level,
    detect: { type: 'regex', pattern: /x/g },
  };
}

function config(concepts: Concept[], subjectIds = ['html', 'css']): CheckerConfig {
  return {
    subjects: subjectIds.map((id) => ({ id, label: id.toUpperCase() })),
    concepts,
    fileKinds: [{ id: 'html', label: 'HTML' }],
    classify: () => 'html',
    textKinds: ['html'],
    accept: '.html',
    teacher: { password: 'x', storageKey: 'x' },
    pdfFilename: () => 'x.pdf',
  };
}

function report(used: Record<string, boolean>): CheckReport {
  return {
    fileStats: { total: 0, byKind: {}, skippedTooLarge: 0 },
    concepts: Object.entries(used).map(([id, u]) => ({ id, count: u ? 1 : 0, used: u })),
    warnings: [],
  };
}

describe('computeLevelSummary', () => {
  it('telt per onderwerp en per niveau hoeveel concepten gebruikt zijn', () => {
    const cfg = config([
      concept('a', 'html', 'basis'),
      concept('b', 'html', 'basis'),
      concept('c', 'html', 'gevorderd'),
      concept('d', 'css', 'basis'),
    ]);
    const summary = computeLevelSummary(report({ a: true, b: false, c: true, d: true }), cfg);

    const html = summary.bySubject.find((s) => s.subject === 'html');
    expect(html?.basis).toEqual({ used: 1, total: 2 });
    expect(html?.gevorderd).toEqual({ used: 1, total: 1 });

    const css = summary.bySubject.find((s) => s.subject === 'css');
    expect(css?.basis).toEqual({ used: 1, total: 1 });
    expect(css?.gevorderd).toEqual({ used: 0, total: 0 });
  });

  it('telt de totalen op als de som over alle onderwerpen', () => {
    const cfg = config([
      concept('a', 'html', 'basis'),
      concept('b', 'css', 'basis'),
      concept('c', 'css', 'gevorderd'),
    ]);
    const summary = computeLevelSummary(report({ a: true, b: true, c: false }), cfg);

    expect(summary.basis).toEqual({ used: 2, total: 2 });
    expect(summary.gevorderd).toEqual({ used: 0, total: 1 });
  });

  it('behandelt een concept dat niet in het rapport staat als niet-gebruikt', () => {
    // Gebeurt als een rapport uit een andere config komt: geen crash, geen telling.
    const cfg = config([concept('a', 'html', 'basis')]);
    const summary = computeLevelSummary(report({ onbekend: true }), cfg);

    expect(summary.basis).toEqual({ used: 0, total: 1 });
  });

  it('laat een concept met een onbekend onderwerp stilzwijgend buiten de telling', () => {
    // Vastgelegd bestaand gedrag, geen gewenst gedrag: een typefout in `subject`
    // maakt het concept onzichtbaar in het rapport zonder enige waarschuwing.
    // De guard-test op de echte site-configs zorgt dat dit daar niet voorkomt.
    const cfg = config([concept('a', 'html', 'basis'), concept('zoek', 'typefout', 'basis')]);
    const summary = computeLevelSummary(report({ a: true, zoek: true }), cfg);

    expect(summary.basis).toEqual({ used: 1, total: 1 });
    expect(summary.bySubject.map((s) => s.subject)).toEqual(['html', 'css']);
  });
});

describe('computeLevelSummary — tracks', () => {
  // Hetzelfde project, dezelfde conceptenlijst, andere route: de tellingen
  // horen te verschuiven zonder dat er iets aan het rapport verandert.
  const concepten: Concept[] = [
    {
      id: 'afstand',
      subject: 'robotica',
      group: 'Sensoren',
      label: 'Afstandsensor uitlezen',
      level: { start: 'gevorderd', verdieping: 'basis' },
      detect: { type: 'regex', pattern: /TimeOfFlight\(/g },
    },
    {
      id: 'motoren',
      subject: 'robotica',
      group: 'Aansturen',
      label: 'Motoren aansturen',
      level: 'basis',
      detect: { type: 'regex', pattern: /DCMotors\(/g },
    },
  ];

  const config = {
    subjects: [{ id: 'robotica', label: 'Robotica' }],
    tracks: [
      { id: 'start', label: 'Start' },
      { id: 'verdieping', label: 'Verdieping' },
    ],
    concepts: concepten,
    fileKinds: [{ id: 'py', label: 'Python' }],
    classify: () => 'py',
    textKinds: ['py'],
    accept: '.py',
    teacher: { password: 'x', storageKey: 'x' },
    pdfFilename: () => 'x.pdf',
  };

  const rapport = {
    fileStats: { total: 1, byKind: { py: 1 }, skippedTooLarge: 0 },
    concepts: [
      { id: 'afstand', count: 1, used: true },
      { id: 'motoren', count: 1, used: true },
    ],
    warnings: [],
  };

  it('telt de afstandsensor bij start als gevorderd', () => {
    const s = computeLevelSummary(rapport, config, 'start');
    expect(s.basis).toEqual({ used: 1, total: 1 });
    expect(s.gevorderd).toEqual({ used: 1, total: 1 });
  });

  it('en bij verdieping als basis', () => {
    const s = computeLevelSummary(rapport, config, 'verdieping');
    expect(s.basis).toEqual({ used: 2, total: 2 });
    expect(s.gevorderd).toEqual({ used: 0, total: 0 });
  });

  it('zonder track valt alles terug op het eerste niveau', () => {
    const s = computeLevelSummary(rapport, config);
    expect(s.basis.total + s.gevorderd.total).toBe(2);
  });
});

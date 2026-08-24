import { describe, expect, it } from 'vitest';
import type { CheckerConfig, Concept } from './types';
import { validateCheckerConfig } from './validateConfig';

function concept(overrides: Partial<Concept> = {}): Concept {
  return {
    id: 'basis-concept',
    subject: 'html',
    group: 'Groep',
    label: 'Een concept',
    level: 'basis',
    detect: { type: 'regex', pattern: /iets/g, in: ['html'] },
    ...overrides,
  };
}

function config(concepts: Concept[], overrides: Partial<CheckerConfig> = {}): CheckerConfig {
  return {
    subjects: [{ id: 'html', label: 'HTML' }],
    concepts,
    fileKinds: [
      { id: 'html', label: 'HTML' },
      { id: 'image', label: 'Afbeeldingen' },
    ],
    classify: () => 'html',
    textKinds: ['html'],
    imageKinds: ['image'],
    accept: '.html',
    teacher: { password: 'x', storageKey: 'x' },
    pdfFilename: () => 'x.pdf',
    ...overrides,
  };
}

describe('validateCheckerConfig', () => {
  it('keurt een correcte config goed', () => {
    expect(validateCheckerConfig(config([concept()]))).toEqual([]);
  });

  it('meldt een patroon zonder g-vlag', () => {
    const problems = validateCheckerConfig(
      config([
        concept({ id: 'zonder-g', detect: { type: 'regex', pattern: /iets/, in: ['html'] } }),
      ]),
    );

    expect(problems).toHaveLength(1);
    expect(problems[0]).toContain("'zonder-g'");
    expect(problems[0]).toContain('g-vlag');
  });

  it('meldt een dubbele concept-id', () => {
    const problems = validateCheckerConfig(
      config([concept({ id: 'dubbel' }), concept({ id: 'dubbel' })]),
    );

    expect(problems).toHaveLength(1);
    expect(problems[0]).toContain("'dubbel'");
  });

  it('meldt een onderwerp dat niet bestaat', () => {
    const problems = validateCheckerConfig(config([concept({ subject: 'typefout' })]));

    expect(problems).toHaveLength(1);
    expect(problems[0]).toContain("'typefout'");
  });

  it('meldt een detect.in die geen bekende bestandssoort is', () => {
    const problems = validateCheckerConfig(
      config([concept({ detect: { type: 'regex', pattern: /iets/g, in: ['scss'] } })]),
    );

    // Zowel 'staat niet in fileKinds' als 'wordt niet als tekst ingelezen'.
    expect(problems).toHaveLength(2);
    expect(problems.join(' ')).toContain("'scss'");
  });

  it('meldt een detect.in die wel bestaat maar niet als tekst wordt gelezen', () => {
    const problems = validateCheckerConfig(
      config([concept({ detect: { type: 'regex', pattern: /iets/g, in: ['image'] } })]),
    );

    expect(problems).toHaveLength(1);
    expect(problems[0]).toContain('niet als tekst');
  });

  it('meldt een gelezen bestandssoort die niet in fileKinds staat', () => {
    const problems = validateCheckerConfig(config([], { textKinds: ['html', 'verzonnen'] }));

    expect(problems).toHaveLength(1);
    expect(problems[0]).toContain("'verzonnen'");
  });

  it('laat pad-concepten met rust — die hebben geen g-vlag nodig', () => {
    const problems = validateCheckerConfig(
      config([concept({ detect: { type: 'path', pattern: /main\.py$/ } })]),
    );

    expect(problems).toEqual([]);
  });

  it('meldt meerdere problemen tegelijk', () => {
    const problems = validateCheckerConfig(
      config([
        concept({ id: 'een', subject: 'bestaat-niet' }),
        concept({ id: 'twee', detect: { type: 'regex', pattern: /x/, in: ['html'] } }),
      ]),
    );

    expect(problems).toHaveLength(2);
  });
});

describe('validateCheckerConfig — tracks en minCount', () => {
  const basis = {
    subjects: [{ id: 'a', label: 'A' }],
    fileKinds: [{ id: 'py', label: 'Python' }],
    classify: () => 'py',
    textKinds: ['py'],
    accept: '.py',
    teacher: { password: 'x', storageKey: 'x' },
    pdfFilename: () => 'x.pdf',
  };

  const metConcept = (concept: Concept, tracks?: { id: string; label: string }[]) =>
    validateCheckerConfig({ ...basis, tracks, concepts: [concept] } as CheckerConfig);

  const concept = (level: Concept['level'], detect?: Concept['detect']): Concept => ({
    id: 'c',
    subject: 'a',
    group: 'G',
    label: 'c',
    level,
    detect: detect ?? { type: 'regex', pattern: /x/g },
  });

  it('klaagt over een track die geen niveau heeft', () => {
    const problemen = metConcept({ ...concept({ start: 'basis' }) }, [
      { id: 'start', label: 'Start' },
      { id: 'verdieping', label: 'Verdieping' },
    ]);
    expect(problemen).toContain("Concept 'c' heeft geen niveau voor track 'verdieping'.");
  });

  it('accepteert een niveau per track als alle tracks gedekt zijn', () => {
    expect(
      metConcept(concept({ start: 'basis', verdieping: 'gevorderd' }), [
        { id: 'start', label: 'Start' },
        { id: 'verdieping', label: 'Verdieping' },
      ]),
    ).toEqual([]);
  });

  it('klaagt over een niveau per track zonder tracks in de config', () => {
    expect(metConcept(concept({ start: 'basis' }))).toContain(
      "Concept 'c' geeft een niveau per track, maar de config heeft geen tracks.",
    );
  });

  it('laat een kaal niveau met tracks gewoon toe', () => {
    expect(metConcept(concept('basis'), [{ id: 'start', label: 'Start' }])).toEqual([]);
  });

  it('klaagt over een onbruikbare minCount', () => {
    const problemen = metConcept(concept('basis', { type: 'regex', pattern: /x/g, minCount: 0 }));
    expect(problemen).toContain("Concept 'c' heeft een minCount die geen geheel getal ≥ 1 is.");
  });

  it('laat handmatige concepten met rust', () => {
    expect(metConcept(concept('basis', { type: 'handmatig' }))).toEqual([]);
  });
});

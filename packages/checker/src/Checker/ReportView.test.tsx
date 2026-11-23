// @vitest-environment jsdom
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { analyze } from '../matchConcepts';
import type { CheckerConfig, Concept, ProjectFiles } from '../types';
import { ReportView } from './ReportView';

// Achter een gevonden concept staat hoe vaak, en bij een concept met
// onderdelen welke. Bij soorten (de nieuwe nodes van Godot) is dat aantal het
// aantal soorten: een CanvasModulate in twee levels stond er eerst als
// "nieuwe nodes (2×)", en een docent las dat als twee nieuwe nodes.

const concept = (id: string, label: string, detect: Concept['detect']): Concept => ({
  id,
  subject: 'godot',
  group: 'Nodes',
  label,
  level: 'basis',
  detect,
});

const config: CheckerConfig = {
  subjects: [{ id: 'godot', label: 'Godot' }],
  concepts: [
    concept('nieuw', 'nieuwe nodes', {
      type: 'regex',
      pattern: /type="(\w+)"/g,
      delen: true,
      soorten: true,
    }),
    concept('treffers', 'elke node', { type: 'regex', pattern: /\[node /g }),
  ],
  fileKinds: [{ id: 'tscn', label: 'Scènes' }],
  classify: () => 'tscn',
  textKinds: ['tscn'],
  accept: '.tscn',
  teacher: { password: 'x', storageKey: 'coderius:test:rapport' },
  pdfFilename: () => 'x.pdf',
};

const bestanden = (inhoud: Record<string, string>): ProjectFiles =>
  Object.fromEntries(
    Object.entries(inhoud).map(([path, content]) => [
      path,
      { path, kind: 'tscn', content, sizeBytes: content.length, tooLarge: false },
    ]),
  );

afterEach(cleanup);

describe('ReportView — het aantal achter een concept', () => {
  it('noemt bij soorten de soort, en telt twee keer dezelfde niet als twee', () => {
    const regel = '[node name="Donker" type="CanvasModulate" parent="."]';
    const { container } = render(
      <ReportView
        report={analyze(bestanden({ 'level1.tscn': regel, 'level2.tscn': regel }), config)}
        config={config}
      />,
    );
    const chips = Array.from(container.querySelectorAll('li')).map((li) => li.textContent ?? '');
    const nieuw = chips.find((c) => c.includes('nieuwe nodes'));
    expect(nieuw).toContain('CanvasModulate');
    expect(nieuw).not.toContain('×');
    // Een concept zonder soorten telt nog steeds zijn treffers.
    expect(chips.find((c) => c.includes('elke node'))).toContain('(2×)');
  });

  it('telt twee soorten wel als twee', () => {
    const { container } = render(
      <ReportView
        report={analyze(
          bestanden({
            'a.tscn': '[node name="D" type="CanvasModulate"]\n[node name="M" type="Marker2D"]',
          }),
          config,
        )}
        config={config}
      />,
    );
    const chips = Array.from(container.querySelectorAll('li')).map((li) => li.textContent ?? '');
    const nieuw = chips.find((c) => c.includes('nieuwe nodes')) ?? '';
    expect(nieuw).toContain('(2×)');
    expect(nieuw).toContain('CanvasModulate, Marker2D');
  });
});

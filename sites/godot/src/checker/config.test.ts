import { analyze } from '@coderius/checker/matchConcepts';
import type { ProjectFiles } from '@coderius/checker/types';
import { validateCheckerConfig } from '@coderius/checker/validateConfig';
import { describe, expect, it } from 'vitest';
import { godotConfig } from './config';

function files(entries: Record<string, string | null>): ProjectFiles {
  return Object.fromEntries(
    Object.entries(entries).map(([path, content]) => [
      path,
      {
        path,
        kind: godotConfig.classify(path),
        content,
        sizeBytes: content?.length ?? 0,
        tooLarge: false,
      },
    ]),
  );
}

describe('godotConfig', () => {
  it('bevat geen fouten die stil verkeerd zouden scoren', () => {
    expect(validateCheckerConfig(godotConfig)).toEqual([]);
  });

  it('herkent een Godot-project aan de projectbestanden', () => {
    const report = analyze(
      files({
        'project.godot': null,
        'scenes/Main.tscn': null,
        'scripts/Speler.gd': 'extends CharacterBody2D',
      }),
      godotConfig,
    );
    const perId = new Map(report.concepts.map((c) => [c.id, c.used]));

    expect(perId.get('nd-project-file')).toBe(true);
    expect(perId.get('nd-scene-file')).toBe(true);
  });

  it('herkent geen scene-bestand in een map zonder .tscn', () => {
    const report = analyze(files({ 'scripts/Speler.gd': 'extends Node' }), godotConfig);
    const perId = new Map(report.concepts.map((c) => [c.id, c.used]));

    expect(perId.get('nd-project-file')).toBe(false);
    expect(perId.get('nd-scene-file')).toBe(false);
  });
});

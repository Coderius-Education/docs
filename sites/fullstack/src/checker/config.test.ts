import { analyze } from '@coderius/checker/matchConcepts';
import type { ProjectFiles } from '@coderius/checker/types';
import { validateCheckerConfig } from '@coderius/checker/validateConfig';
import { describe, expect, it } from 'vitest';
import { fullstackConfig } from './config';

function files(entries: Record<string, string | null>): ProjectFiles {
  return Object.fromEntries(
    Object.entries(entries).map(([path, content]) => [
      path,
      {
        path,
        kind: fullstackConfig.classify(path),
        content,
        sizeBytes: content?.length ?? 0,
        tooLarge: false,
      },
    ]),
  );
}

describe('fullstackConfig', () => {
  it('bevat geen fouten die stil verkeerd zouden scoren', () => {
    expect(validateCheckerConfig(fullstackConfig)).toEqual([]);
  });

  it('herkent de mappenstructuur aan de paden', () => {
    // Fullstack en godot zijn de enige sites met pad-detectie; zonder deze test
    // is dat hele codepad in analyze() ongedekt.
    const report = analyze(
      files({
        'main.py': 'from fastapi import FastAPI',
        'static/style.css': 'body { color: red; }',
        'templates/index.html': '<h1>Hoi</h1>',
      }),
      fullstackConfig,
    );
    const perId = new Map(report.concepts.map((c) => [c.id, c.used]));

    expect(perId.get('struct-main')).toBe(true);
    expect(perId.get('struct-static')).toBe(true);
    expect(perId.get('struct-templates')).toBe(true);
  });

  it('vindt de mappen niet als ze er niet zijn', () => {
    const report = analyze(files({ 'app.py': 'print("hoi")' }), fullstackConfig);
    const perId = new Map(report.concepts.map((c) => [c.id, c.used]));

    expect(perId.get('struct-main')).toBe(false);
    expect(perId.get('struct-static')).toBe(false);
    expect(perId.get('struct-templates')).toBe(false);
  });
});

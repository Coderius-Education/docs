import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// De web-cursus leert target="_blank" en stuurt de leerling daarna naar deze
// editor voor "Jouw website". Zonder allow-popups blokkeert de browser zo'n
// link; met alleen allow-popups opent er een tabblad dat de sandbox erft
// (opaque origin, SecurityError op localStorage) en waarin de meeste sites
// het niet doen. Dezelfde guard staat voor het oefenveld van de web-cursus in
// sites/web/src/docs-tests/oefenveld.test.ts.

const RUNNER = fileURLToPath(new URL('./WebRunner.tsx', import.meta.url));

describe('het voorbeeldvenster van de web-runner', () => {
  const vlaggen =
    readFileSync(RUNNER, 'utf8')
      .match(/sandbox="([^"]*)"/)?.[1]
      .split(/\s+/) ?? [];

  it('opent een link met target="_blank" in een echt tabblad', () => {
    expect(vlaggen).toContain('allow-popups');
    expect(vlaggen).toContain('allow-popups-to-escape-sandbox');
  });

  it('geeft de code van de leerling geen toegang tot de editor zelf', () => {
    expect(vlaggen).not.toContain('allow-same-origin');
  });
});

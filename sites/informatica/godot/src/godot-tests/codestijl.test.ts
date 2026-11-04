import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { alleLesbestanden } from '@coderius/shared/voorkennis';
import { describe, expect, it } from 'vitest';
import { BLOK } from './extract';

// De cursus vraagt het positief: `if direction == 0:` (remmen), met lopen in
// de `else`. Het sjabloon van Godot schrijft `if direction:`, dat leunt op de
// regel dat 0 als onwaar telt; een leerling leest er niet aan af wat er
// gecontroleerd wordt. `if direction != 0:` zegt het wel, maar als ontkenning.
// Remmen (Stap 2) legt uit dat tutorials de korte vorm gebruiken. Deze test
// houdt de lessen, de tips en de cheatsheet daaraan.

const SITE = fileURLToPath(new URL('../..', import.meta.url));

function blokken(): { plek: string; code: string }[] {
  const uit: { plek: string; code: string }[] = [];
  for (const wortel of [join(SITE, 'docs'), join(SITE, 'src', 'pages')]) {
    for (const pad of alleLesbestanden(wortel)) {
      const inhoud = readFileSync(pad, 'utf8');
      for (const m of inhoud.matchAll(BLOK)) {
        uit.push({
          plek: `${pad.slice(SITE.length)}:${inhoud.slice(0, m.index).split('\n').length}`,
          code: m[1],
        });
      }
    }
  }
  return uit;
}

describe('codestijl van de GDScript-voorbeelden', () => {
  it('vraagt bij direction positief: if direction == 0', () => {
    const fout = blokken()
      .filter((b) => /^\s*(?:el)?if\s+(?:not\s+)?direction\s*(?::|!=)/m.test(b.code))
      .map((b) => b.plek);
    expect(fout).toEqual([]);
  });
});

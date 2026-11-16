import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// De conceptenkaart stond in de navbar en is in november 2026 weggehaald. Het
// oude adres gaf daarna een 404; nu stuurt het door naar de leerdoelen, waar
// ook per concept de les staat. De versie van Godot stond als blok bovenaan
// elke les en staat nu in de navbar.

const SITE = fileURLToPath(new URL('../..', import.meta.url));
const config = readFileSync(join(SITE, 'docusaurus.config.ts'), 'utf8');

describe('wat uit de navbar en uit de lessen verdween, is nog te vinden', () => {
  it('het oude adres van de conceptenkaart stuurt door naar de leerdoelen', () => {
    expect(config).toMatch(
      /omleidingen:\s*\[\{ van: '\/conceptenkaart', naar: '\/leerdoelen' \}\]/,
    );
    expect(existsSync(join(SITE, 'src/leerdoelen.json'))).toBe(true);
    // Op het oude adres staat geen pagina meer: de plugin weigert dat ook.
    for (const e of ['.tsx', '.mdx', '.md'])
      expect(existsSync(join(SITE, 'src/pages', `conceptenkaart${e}`)), e).toBe(false);
  });

  it('de versie van Godot staat in de navbar, met een link naar Godot-versies', () => {
    expect(config).toMatch(/to: '\/docs\/godot-versies', label: `Godot \$\{GODOT_VERSION\}`/);
    expect(readFileSync(join(SITE, 'docs/godot-versies.md'), 'utf8')).toMatch(
      /^slug: \/godot-versies$/m,
    );
  });
});

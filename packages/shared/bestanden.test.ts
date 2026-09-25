import { readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

// Twee regels over de bestanden zelf, niet over hun inhoud:
// - Zeven sites hadden een eigen kopie van WRITING_STYLE_GUIDE.md die 80
//   regels achterliep op org-handbook; wie de gids in zijn site opzocht,
//   las de oude. Er is er één.
// - Vierentwintig play-lessen begonnen met een UTF-8 BOM. Docusaurus slikt
//   dat, maar scripts en greps zagen daardoor "geen frontmatter".

const ROOT = join(__dirname, '..', '..');
const OVERSLAAN = new Set([
  'node_modules',
  'build',
  '.docusaurus',
  '.svelte-kit',
  '.git',
  'static',
]);

function bestanden(map: string): string[] {
  return readdirSync(map, { withFileTypes: true }).flatMap((e) => {
    if (OVERSLAAN.has(e.name)) return [];
    const pad = join(map, e.name);
    return e.isDirectory() ? bestanden(pad) : [pad];
  });
}
const alle = bestanden(ROOT);

describe('bestanden in de repo', () => {
  it('de schrijfgids staat alleen in org-handbook', () => {
    const gidsen = alle
      .filter((p) => p.endsWith('WRITING_STYLE_GUIDE.md'))
      .map((p) => relative(ROOT, p));
    expect(gidsen).toEqual(['org-handbook/WRITING_STYLE_GUIDE.md']);
  });

  it('geen .md- of .mdx-bestand begint met een BOM', () => {
    const metBom = alle
      .filter((p) => /\.mdx?$/.test(p))
      .filter((p) =>
        readFileSync(p)
          .subarray(0, 3)
          .equals(Buffer.from([0xef, 0xbb, 0xbf])),
      )
      .map((p) => relative(ROOT, p));
    expect(metBom).toEqual([]);
  });
});

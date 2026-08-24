import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { alleLesbestanden, lesBestaat, parseItems } from '@coderius/shared/voorkennis';
import { describe, expect, it } from 'vitest';

// Bewaakt de <Voorkennis>-blokken naar de python-cursus: elk pad moet echt
// bestaan als lespagina in sites/python/docs, en de registry moet python als
// voorkennis van godot noemen. Zonder deze test breekt een hernoemde
// python-les de godot-links pas op in productie — cross-site links vallen
// buiten de linkcheck van `pnpm build`.
//
// Het zoekwerk zelf staat in packages/shared/voorkennis.js, gedeeld met
// fullstack.

const GODOT_DOCS = fileURLToPath(new URL('../../docs', import.meta.url));
const SITES_ROOT = fileURLToPath(new URL('../../..', import.meta.url));
const SITES_JS = fileURLToPath(new URL('../../../../packages/shared/sites.js', import.meta.url));

type Item = { site: string; to: string; label: string };

function voorkennisPerLes(): Map<string, Item[]> {
  const perLes = new Map<string, Item[]>();
  for (const pad of alleLesbestanden(GODOT_DOCS)) {
    const paden = parseItems(readFileSync(pad, 'utf8'));
    if (paden.length > 0) {
      perLes.set(
        pad
          .slice(GODOT_DOCS.length + 1)
          .split('\\')
          .join('/'),
        paden,
      );
    }
  }
  return perLes;
}

describe('godot Voorkennis naar de python-cursus', () => {
  it('precies de afgesproken lessen hebben een Voorkennis-blok', () => {
    // Bewust een exacte lijst: een per ongeluk verwijderd of verplaatst blok
    // valt dan direct op, net als een nieuw blok dat hier nog niet staat.
    expect([...voorkennisPerLes().keys()].sort()).toEqual([
      '04-personage-en-beweging/start_gdscript.md',
      '05-bewegingsscript/afsluiter.md',
      '05-bewegingsscript/grond.md',
      '05-bewegingsscript/skelet.md',
      '06-animaties/animaties_code.md',
      '07-signals-en-score/global_variables.md',
      '07-signals-en-score/groups.md',
    ]);
  });

  it('elk pad wijst naar een bestaande lespagina', () => {
    const kapot: string[] = [];
    for (const [les, items] of voorkennisPerLes()) {
      for (const item of items) {
        if (!lesBestaat(SITES_ROOT, item.site, item.to)) {
          kapot.push(`${les} -> ${item.site}:${item.to}`);
        }
      }
    }
    expect(kapot).toEqual([]);
  });

  it('de URL-vertaling herkent een niet-bestaande les als kapot', () => {
    // Zonder deze check zou een lesBestaat die altijd true geeft de hele
    // suite stil groen laten.
    expect(lesBestaat(SITES_ROOT, 'python', '/docs/basis/bestaat-niet')).toBe(false);
    expect(lesBestaat(SITES_ROOT, 'python', '/docs/bestaat-niet/jij-als-variabele')).toBe(false);
    expect(lesBestaat(SITES_ROOT, 'python', '/docs/basis/jij-als-variabele')).toBe(true);
  });

  it('de registry noemt python als voorkennis van godot', () => {
    expect(existsSync(SITES_JS)).toBe(true);
    const bron = readFileSync(SITES_JS, 'utf8');
    const godotBlok = bron.match(/id: 'godot',[\s\S]*?requires: \[([^\]]*)\]/)?.[1] ?? '';
    expect(godotBlok).toContain("'python'");
  });
});

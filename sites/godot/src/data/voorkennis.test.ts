import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// Bewaakt de <Voorkennis>-blokken naar de python-cursus: elk pad moet echt
// bestaan als lespagina in sites/python/docs, en de registry moet python als
// voorkennis van godot noemen. Zonder deze test breekt een hernoemde
// python-les de godot-links pas op in productie — cross-site links vallen
// buiten de linkcheck van `pnpm build`.

const GODOT_DOCS = fileURLToPath(new URL('../../docs', import.meta.url));
const PYTHON_DOCS = fileURLToPath(new URL('../../../python/docs', import.meta.url));
const SITES_JS = fileURLToPath(new URL('../../../../packages/shared/sites.js', import.meta.url));

// Zelfde afspraak als scripts/check-voorkennis.mjs in algorithms: items staan
// letterlijk in deze vorm in de bron, dus een regex volstaat.
const ITEM_RE = /\{site: 'python', to: '([^']+)', label: '([^']+)'\}/g;

function alleLesbestanden(map: string): string[] {
  const paden: string[] = [];
  for (const entry of readdirSync(map, { withFileTypes: true })) {
    const volledig = join(map, entry.name);
    if (entry.isDirectory()) {
      paden.push(...alleLesbestanden(volledig));
    } else if (/\.mdx?$/.test(entry.name)) {
      paden.push(volledig);
    }
  }
  return paden;
}

// Vertaalt een docs-URL van de python-site terug naar een bronbestand.
// Docusaurus stript alleen een puur numeriek prefix ("01-basis" -> "basis",
// maar "05a-if-else" blijft "05a-if-else"); een slug in de frontmatter wint
// van de bestandsnaam.
function pythonUrlBestaat(to: string): boolean {
  const segmenten = to.replace(/^\/docs\//, '').split('/');
  if (segmenten.length !== 2) return false;
  const [mapSegment, paginaSegment] = segmenten;

  const mapNaam = readdirSync(PYTHON_DOCS).find(
    (naam) => naam === mapSegment || naam.replace(/^\d+-/, '') === mapSegment,
  );
  if (!mapNaam) return false;

  for (const bestand of readdirSync(join(PYTHON_DOCS, mapNaam))) {
    if (!/\.mdx?$/.test(bestand)) continue;
    const inhoud = readFileSync(join(PYTHON_DOCS, mapNaam, bestand), 'utf8');
    const slug = inhoud.match(/^slug:\s*(\S+)/m)?.[1];
    if (slug) {
      if (slug === to || slug === `/${paginaSegment}` || slug === paginaSegment) return true;
      continue;
    }
    const kaal = bestand.replace(/\.mdx?$/, '');
    if (kaal === paginaSegment || kaal.replace(/^\d+-/, '') === paginaSegment) return true;
  }
  return false;
}

function voorkennisPerLes(): Map<string, string[]> {
  const perLes = new Map<string, string[]>();
  for (const pad of alleLesbestanden(GODOT_DOCS)) {
    const inhoud = readFileSync(pad, 'utf8');
    const paden = [...inhoud.matchAll(ITEM_RE)].map((m) => m[1]);
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
      '04-personage-en-beweging/basis_movement_begrijpen/krachten.md',
      '04-personage-en-beweging/basis_movement_begrijpen/motor.md',
      '04-personage-en-beweging/start_gdscript.md',
      '05-animaties/animaties_code.md',
      '06-signals-en-score/groups.md',
    ]);
  });

  it('elk python-pad wijst naar een bestaande lespagina', () => {
    const kapot: string[] = [];
    for (const [les, paden] of voorkennisPerLes()) {
      for (const to of paden) {
        if (!pythonUrlBestaat(to)) kapot.push(`${les} -> ${to}`);
      }
    }
    expect(kapot).toEqual([]);
  });

  it('de URL-vertaling herkent een niet-bestaande les als kapot', () => {
    // Zonder deze check zou een pythonUrlBestaat die altijd true geeft de
    // hele suite stil groen laten.
    expect(pythonUrlBestaat('/docs/basis/bestaat-niet')).toBe(false);
    expect(pythonUrlBestaat('/docs/bestaat-niet/jij-als-variabele')).toBe(false);
    expect(pythonUrlBestaat('/docs/basis/jij-als-variabele')).toBe(true);
  });

  it('de registry noemt python als voorkennis van godot', () => {
    expect(existsSync(SITES_JS)).toBe(true);
    const bron = readFileSync(SITES_JS, 'utf8');
    const godotBlok = bron.match(/id: 'godot',[\s\S]*?requires: \[([^\]]*)\]/)?.[1] ?? '';
    expect(godotBlok).toContain("'python'");
  });
});

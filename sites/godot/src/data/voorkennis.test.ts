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

// De lessen die een blok hébben. Zeven van de achtendertig: godot leunt op
// python precies daar waar er voor het eerst GDScript-stof langskomt die de
// python-cursus al uitlegt.
const MET_BLOK = [
  '04-personage-en-beweging/start_gdscript.md',
  '05-bewegingsscript/afsluiter.md',
  '05-bewegingsscript/grond.md',
  '05-bewegingsscript/skelet.md',
  '06-animaties/animaties_code.md',
  '07-signals-en-score/global_variables.md',
  '07-signals-en-score/groups.md',
];

// En de lessen die er bewust géén hebben, gegroepeerd per reden. Zonder deze
// lijst dekt de test alleen wat er ís: een nieuwe les zonder blok viel er
// buiten en bleef stil ongecontroleerd. Nu hoort elk lesbestand ergens thuis.
const ZONDER_BLOK: { reden: string; lessen: string[] }[] = [
  {
    reden: 'editor- en UI-werk, geen GDScript op de pagina',
    lessen: [
      '01-aan-de-slag/installatie.md',
      '01-aan-de-slag/project.md',
      '02-editor-leren-kennen/bestanden-downloaden.md',
      '02-editor-leren-kennen/interface.md',
      '02-editor-leren-kennen/scene.md',
      '03-level-bouwen/background_image.md',
      '03-level-bouwen/tilemap_collision.md',
      '03-level-bouwen/tilemap_opzetten.md',
      '04-personage-en-beweging/sprite.md',
      '05-bewegingsscript/camera2d.md',
      '06-animaties/animaties.md',
      '06-animaties/eigen_animaties.md',
    ],
  },
  {
    reden: 'bouwt verder aan het script uit de vorige les, binnen deze cursus',
    lessen: [
      '04-personage-en-beweging/sprite_movement.md',
      '05-bewegingsscript/delta.md',
      '05-bewegingsscript/krachten.md',
      '05-bewegingsscript/motor.md',
      '05-bewegingsscript/remmen.md',
      '07-signals-en-score/score_in_karakter.md',
      '07-signals-en-score/score_op_scherm.md',
      '07-signals-en-score/signals_muntje.md',
      '08-meer-levels-en-menu/spawn_timer.md',
      '08-meer-levels-en-menu/spawnen.md',
      '08-meer-levels-en-menu/start_menu.md',
      '08-meer-levels-en-menu/tweede_level.md',
    ],
  },
  {
    reden: 'naslag of uitleiding, geen nieuwe stof',
    lessen: [
      '05-bewegingsscript/fouten-zoeken.md',
      'exporteren.md',
      'godot-versies.md',
      'meer-leren.md',
    ],
  },
  {
    reden: 'projectidee: de leerling kiest zelf wat er van de cursus in past',
    lessen: [
      '09-spel-ideeen/endless_runner.md',
      '09-spel-ideeen/flappy_bird.md',
      '09-spel-ideeen/top_down.md',
    ],
  },
];

const ZONDER_BLOK_LESSEN = ZONDER_BLOK.flatMap((groep) => groep.lessen);

function alleLessen(): string[] {
  return alleLesbestanden(GODOT_DOCS)
    .map((pad) =>
      pad
        .slice(GODOT_DOCS.length + 1)
        .split('\\')
        .join('/'),
    )
    .sort();
}

describe('godot Voorkennis naar de python-cursus', () => {
  it('precies de afgesproken lessen hebben een Voorkennis-blok', () => {
    // Bewust een exacte lijst: een per ongeluk verwijderd of verplaatst blok
    // valt dan direct op, net als een nieuw blok dat hier nog niet staat.
    expect([...voorkennisPerLes().keys()].sort()).toEqual(MET_BLOK);
  });

  it('elke lespagina staat in een van de twee lijsten', () => {
    const bekend = new Set([...MET_BLOK, ...ZONDER_BLOK_LESSEN]);
    const onbesproken = alleLessen().filter((les) => !bekend.has(les));

    expect(onbesproken).toEqual([]);
  });

  it('de twee lijsten spreken elkaar niet tegen', () => {
    // Een les die alsnog een blok krijgt hoort uit ZONDER_BLOK te verdwijnen,
    // en een les die verplaatst of verwijderd wordt uit allebei.
    expect(MET_BLOK.filter((les) => ZONDER_BLOK_LESSEN.includes(les))).toEqual([]);

    const dubbel = ZONDER_BLOK_LESSEN.filter((les, i) => ZONDER_BLOK_LESSEN.indexOf(les) !== i);
    expect(dubbel).toEqual([]);

    const bestaandeLessen = new Set(alleLessen());
    const verdwenen = [...MET_BLOK, ...ZONDER_BLOK_LESSEN].filter(
      (les) => !bestaandeLessen.has(les),
    );
    expect(verdwenen).toEqual([]);

    expect(ZONDER_BLOK.filter((groep) => groep.reden.trim() === '')).toEqual([]);
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

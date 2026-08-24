import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SITES_BY_ID } from '@coderius/shared/sites';
import { alleLesbestanden, lesBestaat, parseItems } from '@coderius/shared/voorkennis';
import { describe, expect, it } from 'vitest';

// Eén controle voor álle sites tegelijk. De per-site tests (fullstack, godot)
// leggen beleid vast: wélke lessen een blok horen te hebben. Wat hier gebeurt
// geldt overal en heeft geen beleid nodig: een <Voorkennis>-link moet ergens
// op uitkomen.
//
// Waarom dit nodig is: cross-site links vallen buiten de linkcheck van
// `pnpm build`. Een hernoemde les in de python-cursus breekt een verwijzing
// vanuit algorithms of robotica pas in productie, en niets merkt dat op.
// Toen deze test er kwam had algorithms 42 bestanden met blokken en geen
// enkele controle erop.

const SITES_ROOT = fileURLToPath(new URL('../../sites', import.meta.url));

// Niet elke site zet zijn lessen in docs/: robotica heeft lego_auto/ en
// click_golfer/, algorithms heeft dev-docs/, editor heeft blog/. Daarom
// lopen we alles af behalve wat gegenereerd of geïnstalleerd is — anders
// mist de controle precies de mappen die niemand verwacht.
const OVERSLAAN = new Set([
  'node_modules',
  'build',
  '.docusaurus',
  'static',
  '__fixtures__',
  'extracted',
]);

type Vondst = { site: string; bestand: string; item: ReturnType<typeof parseItems>[number] };

/** Alle Voorkennis-items van alle sites, met de vindplaats erbij. */
function alleItems(): Vondst[] {
  const vondsten: Vondst[] = [];

  for (const site of Object.keys(SITES_BY_ID)) {
    const siteMap = join(SITES_ROOT, site);
    if (!existsSync(siteMap)) continue;

    for (const entry of readdirSync(siteMap, { withFileTypes: true })) {
      if (!entry.isDirectory() || OVERSLAAN.has(entry.name)) continue;

      for (const pad of alleLesbestanden(join(siteMap, entry.name))) {
        if (pad.split(/[\\/]/).some((deel) => OVERSLAAN.has(deel))) continue;

        for (const item of parseItems(readFileSync(pad, 'utf8'))) {
          vondsten.push({
            site,
            bestand: pad
              .slice(SITES_ROOT.length + 1)
              .split('\\')
              .join('/'),
            item,
          });
        }
      }
    }
  }

  return vondsten;
}

describe('Voorkennis-blokken over alle sites', () => {
  const vondsten = alleItems();

  it('vindt überhaupt blokken om te controleren', () => {
    // Zonder deze check zou een kapotte zoekfunctie alle andere tests groen
    // laten: een lege lijst voldoet aan elke eis hieronder.
    expect(vondsten.length).toBeGreaterThan(50);

    // En dat ze niet allemaal uit één site komen, want dan is de walk stuk.
    const sites = new Set(vondsten.map((v) => v.site));
    expect(sites.size).toBeGreaterThan(3);

    // Robotica zet het lego_auto-traject naast docs/ in een eigen map. Een
    // eerdere versie van deze test keek alleen in docs/ en src/ en liet die
    // vier items dus ongecontroleerd. Zonder deze regel gebeurt dat opnieuw
    // zodra iemand de walk versmalt.
    expect(vondsten.some((v) => v.bestand.includes('lego_auto/'))).toBe(true);
  });

  it('elke doelpagina bestaat', () => {
    const kapot = vondsten
      .filter((v) => !lesBestaat(SITES_ROOT, v.item.site, v.item.to))
      .map((v) => `${v.bestand} -> ${v.item.site}${v.item.to}`);

    expect(kapot).toEqual([]);
  });

  it('elke doelsite staat in de registry', () => {
    const onbekend = vondsten
      .filter((v) => !(v.item.site in SITES_BY_ID))
      .map((v) => `${v.bestand} -> site '${v.item.site}'`);

    expect(onbekend).toEqual([]);
  });

  it('elk item heeft een label', () => {
    const leeg = vondsten.filter((v) => v.item.label.trim() === '').map((v) => v.bestand);

    expect(leeg).toEqual([]);
  });

  it('vindt een verzonnen pad wél als kapot', () => {
    // De vorige test is alleen wat waard als lesBestaat ook nee kan zeggen.
    expect(lesBestaat(SITES_ROOT, 'python', '/docs/basis/bestaat-niet')).toBe(false);
    expect(lesBestaat(SITES_ROOT, 'bestaat-niet', '/docs/x/y')).toBe(false);
  });
});

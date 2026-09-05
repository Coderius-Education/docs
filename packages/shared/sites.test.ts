import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DOCENTEN_SITES, HOME, SITES, SITES_BY_ID } from '@coderius/shared/sites';
import { describe, expect, it } from 'vitest';

// De registry is de enige bron van waarheid voor de cursussites: navbar,
// footer, /cursussen, <SiteLink>, <Voorkennis> en de homepage lezen 'm. Wat
// hier stil kan misgaan: een site die wél in CI gebouwd wordt maar nergens
// in de registry staat (didactiek stond zo een tijd buiten elke dropdown en
// elke guard), een URL met een pad of slash erachter (de === in de
// origin-check van de IDE mislukt dan stil), of een voorkennis-verwijzing
// naar een id dat niet bestaat.

const SITES_ROOT = fileURLToPath(new URL('../../sites', import.meta.url));
const ALLE = [...SITES, ...DOCENTEN_SITES, HOME];

function siteMappen(): string[] {
  return readdirSync(SITES_ROOT)
    .filter((naam) => statSync(join(SITES_ROOT, naam)).isDirectory())
    .sort();
}

describe('de registry van sites', () => {
  it('heeft unieke ids over cursussen, docentensites en de homepage', () => {
    const ids = ALLE.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('elke URL is een kale origin: schema en host, geen pad of slash erachter', () => {
    const kapot = ALLE.filter((s) => new URL(s.url).origin !== s.url).map((s) => s.url);
    expect(kapot).toEqual([]);
  });

  it('elke map onder sites/ staat in de registry, en andersom', () => {
    expect(ALLE.map((s) => s.id).sort()).toEqual(siteMappen());
  });

  it('SITES_BY_ID kent cursussen en docentensites, niet de homepage', () => {
    for (const s of [...SITES, ...DOCENTEN_SITES]) expect(SITES_BY_ID[s.id]).toBe(s);
    expect(SITES_BY_ID[HOME.id]).toBeUndefined();
  });

  it('voorkennis wijst naar een cursus die eerder in de leerlijn staat', () => {
    // De volgorde van SITES is de leerlijn; een cursus hoort ná zijn voorkennis.
    const positie = new Map(SITES.map((s, i) => [s.id, i]));
    const kapot: string[] = [];
    for (const s of SITES) {
      for (const eis of s.requires) {
        const p = positie.get(eis);
        if (p === undefined || p >= (positie.get(s.id) ?? 0)) kapot.push(`${s.id} -> ${eis}`);
      }
    }
    expect(kapot).toEqual([]);
  });
});

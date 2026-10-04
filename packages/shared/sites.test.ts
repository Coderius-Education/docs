import { existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  DOCENTEN_SITES,
  HOME,
  SITES,
  SITES_BY_ID,
  SUBJECTS,
  SUBJECTS_BY_ID,
  legacyHost,
  repoEditUrl,
  siteByUrl,
  siteDir,
  sitesOfSubject,
} from '@coderius/shared/sites';
import { describe, expect, it } from 'vitest';

// De registry is de enige bron van waarheid voor de cursussites: navbar,
// footer, /cursussen, <SiteLink>, <Voorkennis> en de homepage lezen 'm. Wat
// hier stil kan misgaan: een site die wél in CI gebouwd wordt maar nergens
// in de registry staat (didactiek stond zo een tijd buiten elke dropdown en
// elke guard), een URL die niet onder de host van zijn vak valt, of een
// voorkennis-verwijzing naar een id dat niet bestaat.

const ROOT = fileURLToPath(new URL('../..', import.meta.url));
const SITES_ROOT = join(ROOT, 'sites');
const ALLE = [...SITES, ...DOCENTEN_SITES, HOME];
const CURSUSSEN = [...SITES, ...DOCENTEN_SITES];

const isMap = (pad: string) => statSync(pad).isDirectory();

/** Elke map onder sites/<vak>/ met een package.json: een site in de workspace. */
function siteMappen(): string[] {
  return SUBJECTS.flatMap((vak) => {
    const vakMap = join(SITES_ROOT, vak.id);
    if (!existsSync(vakMap)) return [];
    return readdirSync(vakMap)
      .filter((naam) => isMap(join(vakMap, naam)) && existsSync(join(vakMap, naam, 'package.json')))
      .map((naam) => `sites/${vak.id}/${naam}`);
  }).sort();
}

describe('de registry van sites', () => {
  it('heeft unieke ids over cursussen, docentensites en de homepage', () => {
    const ids = ALLE.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('elk vak en de homepage hebben een kale origin: schema en host, geen pad of slash', () => {
    const kapot = [...SUBJECTS, HOME].filter((s) => new URL(s.url).origin !== s.url);
    expect(kapot.map((s) => s.url)).toEqual([]);
  });

  it('een cursus-URL is de host van zijn vak plus zijn pad, met een slash erachter', () => {
    const kapot = CURSUSSEN.filter(
      (s) =>
        s.url !== `${SUBJECTS_BY_ID[s.subject]?.url}/${s.path}/` || !/^[a-z0-9-]+$/.test(s.path),
    );
    expect(kapot.map((s) => s.id)).toEqual([]);
  });

  it('binnen een vak is elk pad uniek', () => {
    const sleutels = CURSUSSEN.map((s) => `${s.subject}/${s.path}`);
    expect(new Set(sleutels).size).toBe(sleutels.length);
  });

  it('een oud subdomein is een kale origin en geen vak-host', () => {
    const vakHosts = new Set([...SUBJECTS, HOME].map((v) => new URL(v.url).host));
    const kapot = CURSUSSEN.filter(
      (s) =>
        s.legacyUrl !== undefined &&
        (new URL(s.legacyUrl).origin !== s.legacyUrl || vakHosts.has(new URL(s.legacyUrl).host)),
    );
    expect(kapot.map((s) => s.id)).toEqual([]);
    expect(legacyHost('algorithms')).toBe('algoritmes.coderius.nl');
  });

  it('elke site-map onder sites/<vak>/ staat in de registry, en andersom', () => {
    expect(CURSUSSEN.map((s) => siteDir(s.id)).sort()).toEqual(siteMappen());
  });

  it('onder sites/ staan alleen de vakken en de homepage', () => {
    const mappen = readdirSync(SITES_ROOT).filter((naam) => isMap(join(SITES_ROOT, naam)));
    expect(mappen.sort()).toEqual([...SUBJECTS.map((v) => v.id), HOME.id].sort());
    expect(existsSync(join(ROOT, siteDir(HOME.id), 'package.json'))).toBe(true);
  });

  it('siteDir en repoEditUrl wijzen naar sites/<vak>/<id>', () => {
    expect(siteDir('algorithms')).toBe('sites/informatica/algorithms');
    expect(repoEditUrl('fullstack')).toBe(
      'https://github.com/Coderius-Education/docs/tree/main/sites/informatica/fullstack/',
    );
    expect(() => siteDir('bestaat-niet')).toThrow();
  });

  it('siteByUrl matcht op host plus pad, niet op een voorvoegsel van het pad', () => {
    expect(siteByUrl('https://informatica.coderius.nl/python/')?.id).toBe('python');
    expect(siteByUrl('https://informatica.coderius.nl/python')?.id).toBe('python');
    expect(siteByUrl('https://informatica.coderius.nl/algoritmes/docs/hanoi')?.id).toBe(
      'algorithms',
    );
    expect(siteByUrl('https://informatica.coderius.nl/pythonx/')).toBeUndefined();
    expect(siteByUrl('https://informatica.coderius.nl')).toBeUndefined();
    expect(siteByUrl('https://python.coderius.nl')).toBeUndefined();
  });

  it('sitesOfSubject geeft de cursussen van één vak in leerlijn-volgorde', () => {
    expect(sitesOfSubject('informatica')).toEqual(SITES.filter((s) => s.subject === 'informatica'));
    expect(sitesOfSubject('bestaat-niet')).toEqual([]);
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

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { DEFAULT_STORAGE_PREFIX } from '@coderius/editor/vfs/store';
import type { Project } from '@coderius/editor/vfs/types';
import { SITES_BY_ID } from '@coderius/shared/sites';
import { describe, expect, it } from 'vitest';
import {
  BRON_NIEUW,
  BRON_OUD,
  MAX_PROJECTEN,
  OUDE_DATABASE,
  OUDE_STORE,
  VERSIE,
  isVanOudePagina,
  leesProject,
  leesProjecten,
  moetOpslaan,
  oudeOrigin,
} from './overzettenContract';

const project = (over: Partial<Project> = {}): Project => ({
  id: 'p1',
  name: 'Mijn spel',
  runnerId: 'python',
  entry: 'main.py',
  files: { 'main.py': 'print(1)', 'lib/hulp.py': 'x = 2' },
  folders: ['leeg'],
  createdAt: 1,
  updatedAt: 2,
  ...over,
});

const bericht = (projecten: unknown[]) => ({
  source: BRON_OUD,
  type: 'projecten',
  versie: VERSIE,
  projecten,
});

describe('wire-waarden met de oude pagina', () => {
  // static/oud/overzetten/overzetten.js draait zonder build op de oude origin
  // en heeft de waarden letterlijk. Wijkt één kant af, dan valt hier iets om.
  const js = readFileSync(join(__dirname, '../../../static/oud/overzetten/overzetten.js'), 'utf8');
  const waarde = (naam: string) => js.match(new RegExp(`const ${naam} = '?([^';]+)'?;`))?.[1];

  it('bronnen, versie en database zijn aan beide kanten gelijk', () => {
    expect(waarde('BRON_OUD')).toBe(BRON_OUD);
    expect(waarde('BRON_NIEUW')).toBe(BRON_NIEUW);
    expect(Number(waarde('VERSIE'))).toBe(VERSIE);
    expect(waarde('OUDE_DATABASE')).toBe(OUDE_DATABASE);
    expect(waarde('OUDE_STORE')).toBe(OUDE_STORE);
  });

  it('de oude database is die van de editor vóór projectOpslag()', () => {
    expect(OUDE_DATABASE).toBe(DEFAULT_STORAGE_PREFIX);
  });

  it('de oude pagina stuurt naar het vak en pad van de ide in de registry', () => {
    const nieuw = new URL(SITES_BY_ID.ide.url);
    expect(`${waarde('NIEUW_VAK')}.coderius.nl`).toBe(nieuw.hostname);
    expect(waarde('NIEUW_PAD')).toBe(nieuw.pathname);
  });
});

describe('oudeOrigin', () => {
  it('is in productie de legacyUrl van de ide', () => {
    const nieuw = new URL(SITES_BY_ID.ide.url);
    expect(oudeOrigin(nieuw)).toBe(SITES_BY_ID.ide.legacyUrl);
  });

  it('werkt ook op een dev-domein met poort', () => {
    expect(
      oudeOrigin({ protocol: 'http:', hostname: 'informatica.localtest.me', port: '8001' }),
    ).toBe('http://ide.localtest.me:8001');
  });
});

describe('isVanOudePagina', () => {
  const opener = {};
  const oud = 'https://ide.coderius.nl';

  it('alleen de opener, op precies de oude origin', () => {
    expect(isVanOudePagina(oud, opener, opener, oud)).toBe(true);
    expect(isVanOudePagina(oud, {}, opener, oud)).toBe(false);
    expect(isVanOudePagina('https://informatica.coderius.nl', opener, opener, oud)).toBe(false);
    expect(isVanOudePagina('https://ide.coderius.nl.evil.com', opener, opener, oud)).toBe(false);
    expect(isVanOudePagina(oud, null, null, oud)).toBe(false);
  });
});

describe('leesProjecten', () => {
  it('neemt geldige projecten over, met hun id', () => {
    expect(leesProjecten(bericht([project()]))).toEqual([project()]);
  });

  it('negeert berichten die het contract niet volgen', () => {
    expect(leesProjecten(null)).toBeNull();
    expect(leesProjecten({ ...bericht([]), source: 'iets-anders' })).toBeNull();
    expect(leesProjecten({ ...bericht([]), versie: 2 })).toBeNull();
    expect(leesProjecten({ ...bericht([]), projecten: 'geen lijst' })).toBeNull();
  });

  it('laat een kapot project vallen en houdt de rest', () => {
    const uit = leesProjecten(bericht([{ id: 'x' }, project({ id: 'p2' })]));
    expect(uit?.map((p) => p.id)).toEqual(['p2']);
  });

  it('weigert paden die uit het project lopen', () => {
    for (const pad of ['../x.py', '/etc/x', 'a//b.py', 'a\\b.py', './a.py']) {
      expect(leesProject(project({ files: { [pad]: '' } })), pad).toBeNull();
    }
  });

  it('weigert te veel projecten of te veel tekst', () => {
    const veel = Array.from({ length: MAX_PROJECTEN + 1 }, (_, i) => project({ id: `p${i}` }));
    expect(leesProjecten(bericht(veel))).toBeNull();
    const groot = project({ files: { 'a.py': 'x'.repeat(60 * 1024 * 1024) } });
    expect(leesProjecten(bericht([groot]))).toBeNull();
  });
});

describe('moetOpslaan', () => {
  it('nieuw project: opslaan', () => {
    expect(moetOpslaan(project(), undefined)).toBe(true);
  });

  it('twee keer overzetten overschrijft niet wat hier nieuwer is', () => {
    expect(moetOpslaan(project({ updatedAt: 5 }), project({ updatedAt: 9 }))).toBe(false);
    expect(moetOpslaan(project({ updatedAt: 5 }), project({ updatedAt: 5 }))).toBe(false);
    expect(moetOpslaan(project({ updatedAt: 9 }), project({ updatedAt: 5 }))).toBe(true);
  });
});

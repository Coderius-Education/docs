import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import sidebars from '../../sidebars';

// Elke categorie van de FastAPI-route heeft een eigen map in docs/FastAPI/,
// zodat je in de map ziet wat in de sidebar bij elkaar hoort. Stonden alle
// lessen los, dan zocht je SqliteDict of de accounts tussen veertig bestanden.
// Hier staat dat elke categorie precies één map heeft, dat geen twee
// categorieën een map delen, en dat er in een map alleen lessen van die
// categorie staan, plus de naslag die bij het onderwerp hoort.

const FASTAPI = fileURLToPath(new URL('../../docs/FastAPI', import.meta.url));

type Categorie = { type: 'category'; label: string; items: string[] };
const items = sidebars.apiSidebar as unknown as (string | Categorie)[];
const categorieen = items.filter((i): i is Categorie => typeof i !== 'string');

// Naslag buiten de sidebar, met de map waar hij bij hoort.
const NASLAG_IN_MAP = ['FastAPI/sqlitedict/op-een-rij'];
// Losse pagina's in docs/FastAPI/ zelf.
const LOS = ['FastAPI/index', 'FastAPI/projectstructuur'];

const mapVan = (id: string) => id.split('/').slice(0, -1).join('/');

describe('een map per categorie in de FastAPI-route', () => {
  it('elke categorie heeft precies één map', () => {
    const fout = categorieen
      .map((c) => ({ label: c.label, mappen: [...new Set(c.items.map(mapVan))] }))
      .filter((c) => c.mappen.length !== 1 || c.mappen[0].split('/').length !== 2);
    expect(fout).toEqual([]);
  });

  it('geen twee categorieën delen een map', () => {
    const mappen = categorieen.map((c) => mapVan(c.items[0]));
    expect(new Set(mappen).size).toBe(mappen.length);
  });

  it('in een map staan alleen de lessen van die categorie en de naslag erbij', () => {
    for (const c of categorieen) {
      const map = mapVan(c.items[0]);
      const bestanden = readdirSync(join(FASTAPI, map.replace(/^FastAPI\//, '')))
        .filter((n) => n.endsWith('.mdx'))
        .map((n) => `${map}/${n.replace(/\.mdx$/, '')}`)
        .sort();
      const verwacht = [...c.items, ...NASLAG_IN_MAP.filter((n) => mapVan(n) === map)].sort();
      expect(bestanden, c.label).toEqual(verwacht);
    }
  });

  it('los in docs/FastAPI/ staan alleen de startpagina en Projectstructuur', () => {
    const los = readdirSync(FASTAPI)
      .filter((n) => !statSync(join(FASTAPI, n)).isDirectory())
      .map((n) => `FastAPI/${n.replace(/\.mdx$/, '')}`)
      .sort();
    expect(los).toEqual(LOS);
    expect(items[0]).toBe('FastAPI/index');
  });
});

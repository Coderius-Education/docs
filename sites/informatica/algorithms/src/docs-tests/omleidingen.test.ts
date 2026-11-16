import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { omleidingen, verhuisd, weg } from '../data/omleidingen';
import { DOCS, projecten, routePaginas } from './ml-route';

// Een verhuisde les houdt zijn oude adres via een omleiding. Wijst een
// omleiding naar een pagina die er niet meer is, of staat er op het oude adres
// weer een pagina, dan klopt de lijst niet meer.

const pagina = (pad: string) => pad.replace(/^\/docs\//, '');
const bestaat = (id: string) => ['.mdx', '.md'].some((e) => existsSync(join(DOCS, id + e)));

describe('omleidingen van de algoritmes-cursus', () => {
  it('elk doel is een stap van de route', () => {
    const route = new Set(routePaginas());
    for (const { van, naar } of verhuisd)
      expect(route.has(pagina(naar)), `${van} -> ${naar}`).toBe(true);
  });

  it('op geen enkel oud adres staat nog een pagina', () => {
    for (const { van } of verhuisd) expect(bestaat(pagina(van)), van).toBe(false);
  });

  it('een pagina die weg is, stuurt door en bestaat niet meer', () => {
    // De conceptenkaart gaf na het weghalen een 404, terwijl hij in de navbar
    // had gestaan. De config krijgt beide lijsten.
    const paginas = fileURLToPath(new URL('../pages', import.meta.url));
    for (const { van, naar } of weg) {
      expect(omleidingen, van).toContainEqual({ van, naar });
      for (const e of ['.tsx', '.mdx', '.md'])
        expect(existsSync(join(paginas, van.slice(1) + e)), van + e).toBe(false);
    }
    expect(weg.map((o) => o.van)).toContain('/conceptenkaart');
  });

  it('elk project van de oude route wijst naar de eerste stap van zijn map', () => {
    const eerste = new Map(projecten().map((p) => [p.id, p.stappen[0]]));
    for (const { van, naar } of verhuisd) {
      const project = pagina(naar).split('/').slice(0, 2).join('/');
      expect(eerste.get(project), van).toBe(pagina(naar));
    }
    expect(verhuisd).toHaveLength(15);
  });
});

import { readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { omleidingen, verhuisd } from './omleidingen';

// Een verhuisde les houdt zijn oude adres via een omleiding: een bladwijzer,
// een werkblad of een link uit een andere cursus komt anders op een 404 uit.
// Wijst een omleiding naar een pagina die er niet meer is, of staat er op het
// oude adres weer een pagina, dan klopt de lijst niet meer.

const DOCS = fileURLToPath(new URL('../../docs', import.meta.url));

const paginas = (map: string): string[] =>
  readdirSync(map).flatMap((naam) => {
    const pad = join(map, naam);
    if (statSync(pad).isDirectory()) return paginas(pad);
    if (!/\.mdx?$/.test(naam)) return [];
    const adres = `/docs/${relative(DOCS, pad)
      .split('\\')
      .join('/')
      .replace(/\.mdx?$/, '')}`;
    return [adres.replace(/\/index$/, '')];
  });

describe('omleidingen van de fullstack-cursus', () => {
  const bestaand = new Set(paginas(DOCS));

  it('elk doel is een pagina die bestaat', () => {
    for (const { van, naar } of omleidingen)
      expect(bestaand.has(naar.split('#')[0]), `${van} -> ${naar}`).toBe(true);
  });

  it('op geen enkel oud adres staat nog een pagina', () => {
    for (const { van } of omleidingen) expect(bestaand.has(van), van).toBe(false);
  });

  it('de verhuizing naar mappen zit erin: elke les die los stond, met de map ervoor', () => {
    expect(verhuisd).toHaveLength(38);
    for (const { van, naar } of verhuisd) {
      expect(van, van).toMatch(/^\/docs\/FastAPI\/[\w-]+$/);
      expect(naar, naar).toMatch(/^\/docs\/FastAPI\/[\w-]+\/[\w-]+$/);
    }
  });

  it('de jouw-project-omleiding komt uit bij het eind van de basis', async () => {
    const { default: sidebars } = await import('../../sidebars');
    const items = sidebars.apiSidebar as unknown as (string | { label: string; items: string[] })[];
    const grens = items.findIndex(
      (i) => typeof i !== 'string' && i.label.startsWith('Uitbreiding:'),
    );
    const laatste = items[grens - 1] as { items: string[] };
    const doel = omleidingen.find((o) => o.van === '/docs/FastAPI/jouw-project')?.naar;
    expect(doel).toBe(`/docs/${laatste.items.at(-1)}`);
  });
});

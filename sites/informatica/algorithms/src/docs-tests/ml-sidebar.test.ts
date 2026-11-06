import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import sidebars from '../../sidebars';
import { ML_MAPPEN, ML_ROUTE, sidebarZonderMl, zonderMl } from '../lib/mlSidebar';

// De route machine learning (niveau 1) heeft een eigen plek in de navbar en
// een eigen sidebar. De sidebar "Algoritmes" is autogegenereerd uit heel
// docs/; zonder filter stond de route daar ook in, onder Unplugged.

const DOCS = fileURLToPath(new URL('../../docs/', import.meta.url));
const CONFIG = fileURLToPath(new URL('../../docusaurus.config.ts', import.meta.url));

describe('de route machine learning in zijn eigen sidebar', () => {
  it('ML_MAPPEN zijn precies de mappen ml-… in docs/', () => {
    const mappen = readdirSync(DOCS, { withFileTypes: true })
      .filter((e) => e.isDirectory() && e.name.startsWith('ml-'))
      .map((e) => e.name)
      .sort();
    expect([...ML_MAPPEN].sort()).toEqual(mappen);
  });

  it('zonderMl haalt de routepagina en de fases weg, en laat de rest staan', () => {
    const gegenereerd = [
      {
        type: 'category',
        label: 'Lineair zoeken',
        items: [{ type: 'doc', id: 'lineair-zoeken/01-concept' }],
      },
      { type: 'doc', id: ML_ROUTE },
      { type: 'category', label: 'ML A', items: [{ type: 'doc', id: 'ml-regels/01-chatbot' }] },
      { type: 'category', label: 'ML B', items: [{ type: 'doc', id: 'ml-afstand/02-k-buren' }] },
      {
        type: 'category',
        label: 'ML C',
        items: [
          {
            type: 'category',
            label: 'Een dobbelsteen',
            items: [{ type: 'doc', id: 'ml-kans/01-dobbelsteen/01-een-worp' }],
          },
        ],
      },
      { type: 'category', label: 'Unplugged', items: [{ type: 'doc', id: 'unplugged/01-zoeken' }] },
    ];
    expect(zonderMl(gegenereerd).map((i) => i.label ?? i.id)).toEqual([
      'Lineair zoeken',
      'Unplugged',
    ]);
  });

  it('de sidebar mlSidebar begint bij de route en heeft elke fase', () => {
    const ml = sidebars.mlSidebar as { type?: string; items?: { dirName?: string }[] }[];
    expect(ml[0]).toBe(ML_ROUTE);
    const mappen = ml.flatMap((c) => (c.items ?? []).map((i) => i.dirName));
    expect(mappen).toEqual(ML_MAPPEN);
  });

  it('de fases staan standaard ingeklapt', () => {
    // Uitgeklapt was de sidebar van de route een lijst van 21 regels, en zag
    // je de fases niet meer. Docusaurus klapt de fase van de pagina waar je
    // bent zelf open.
    const ml = sidebars.mlSidebar as { type?: string; collapsed?: boolean }[];
    const fases = ml.filter((item) => item.type === 'category');
    expect(fases.length).toBe(ML_MAPPEN.length);
    for (const fase of fases) expect(fase.collapsed).toBe(true);
  });

  it('de navbar heeft een eigen item voor de route', () => {
    const config = readFileSync(CONFIG, 'utf8');
    expect(config).toMatch(/sidebarId: 'mlSidebar'[^}]*label: 'Machine learning'/);
  });

  it('de generator haalt de route alleen uit de sidebar van heel docs/', async () => {
    const gegenereerd = [
      { type: 'doc', id: 'lineair-zoeken/01-concept' },
      { type: 'doc', id: ML_ROUTE },
    ];
    const standaard = async () => gegenereerd;
    const heel = await sidebarZonderMl({
      item: { dirName: '.' },
      defaultSidebarItemsGenerator: standaard,
    });
    expect(heel.map((i) => i.id)).toEqual(['lineair-zoeken/01-concept']);
    const fase = await sidebarZonderMl({
      item: { dirName: 'ml-regels' },
      defaultSidebarItemsGenerator: standaard,
    });
    expect(fase).toHaveLength(2);
  });

  it('de docs van de config gebruiken die generator', async () => {
    // Eerst zocht deze test een stuk tekst in de config. Haalde je de regel
    // `sidebarItemsGenerator,` uit de docs-opties, dan bleef hij groen en
    // stond de route weer in de sidebar "Algoritmes".
    const config = (await import('../../docusaurus.config')).default as {
      presets: [string, { docs: { sidebarItemsGenerator?: unknown } }][];
    };
    const docs = config.presets.find(([naam]) => naam === 'classic')?.[1].docs;
    expect(docs?.sidebarItemsGenerator).toBe(sidebarZonderMl);
  });
});

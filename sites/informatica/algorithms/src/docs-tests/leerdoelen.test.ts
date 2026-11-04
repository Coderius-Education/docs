import { readFileSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { leesLeerdoelen } from '@coderius/shared/leerdoelen';
import { describe, expect, it } from 'vitest';
import leerdoelenJson from '../leerdoelen.json';

// Niveau 2 van Algoritmiek is een papieren tentamen. src/leerdoelen.json legt
// vast wat erin komt, zoals het tentamenblad van de docent het zegt: zeven
// manieren om een algoritme te kennen, zes algoritmes waarvoor ze alle zeven
// gelden, en per speciaal geval de eerste twee manieren plus wat dat geval
// eigen heeft. De pagina /leerdoelen/niveau-2 zet bij elke manier de les waar
// je hem oefent. Die les zoekt de plugin pas bij het bouwen; deze test doet
// het eerder, met de docs van de cursus zoals Docusaurus ze een id geeft.

const require = createRequire(import.meta.url);
const plugin = require('@coderius/shared/plugins/leerdoelen');
const DOCS = fileURLToPath(new URL('../../docs/', import.meta.url));

/**
 * De docs zoals Docusaurus ze ziet: het id is het pad zonder extensie, mét het
 * cijferprefix van het bestand ("binair-zoeken/03-stellingen"); de mappen van
 * deze cursus hebben geen prefix.
 */
function docs(
  map = DOCS,
): { id: string; title: string; permalink: string; sidebarPosition?: number }[] {
  return readdirSync(map, { withFileTypes: true }).flatMap((e) => {
    const pad = join(map, e.name);
    if (e.isDirectory()) return docs(pad);
    if (!/\.mdx?$/.test(e.name)) return [];
    const id = relative(DOCS, pad).replace(/\.mdx?$/, '');
    const tekst = readFileSync(pad, 'utf8');
    const positie = tekst.match(/^sidebar_position:\s*(\d+)/m)?.[1];
    return [
      {
        id,
        title: tekst.match(/^# (.*)$/m)?.[1] ?? id,
        permalink: `/algoritmes/docs/${id}`,
        sidebarPosition: positie ? Number(positie) : undefined,
      },
    ];
  });
}

const leerdoelen = leesLeerdoelen(leerdoelenJson);

describe('leerdoelen van Algoritmiek: het tentamen van niveau 2', () => {
  it('kent de zeven manieren uit het tentamenblad, in die volgorde', () => {
    expect(leerdoelen.tentamen?.manieren.map((m) => m.label)).toEqual([
      'Begrijpen',
      'Stellingen',
      'Aanvullen',
      'Debuggen',
      'Programmeren, algoritme genoemd',
      'Programmeren, algoritme niet genoemd',
      'Programmeren met een aanpassing',
    ]);
  });

  it('vraagt alle zeven manieren bij de zes zoek- en sorteeralgoritmes', () => {
    const alle = leerdoelen.tentamen?.manieren.map((m) => m.id);
    const rijen = leerdoelen.concepten.filter((c) => c.onderwerp === 'zoeken-en-sorteren');
    expect(rijen.map((c) => c.concept)).toEqual([
      'Lineair zoeken',
      'Vind het maximum',
      'Max én min in één pass',
      'Binair zoeken',
      'Selection sort',
      'Bubble sort',
    ]);
    for (const c of rijen) expect(c.manieren, c.id).toEqual(alle);
  });

  it('vraagt bij een speciaal geval begrijpen en stellingen, plus wat dat geval eigen heeft', () => {
    const speciaal = ['big-o', 'dijkstra', 'minimax', 'knapsack', 'cfg', 'hanoi', 'pagerank'];
    const eigen = Object.fromEntries(
      speciaal.map((o) => [
        o,
        leerdoelen.concepten.filter((c) => c.onderwerp === o && !c.manieren?.length).length,
      ]),
    );
    // Big-O en context-vrije grammatica hebben er twee, PageRank geen.
    expect(eigen).toEqual({
      'big-o': 2,
      dijkstra: 1,
      minimax: 1,
      knapsack: 1,
      cfg: 2,
      hanoi: 1,
      pagerank: 0,
    });
    for (const o of speciaal) {
      const algoritme = leerdoelen.concepten.find((c) => c.id === o);
      expect(algoritme?.manieren, o).toEqual(['begrijpen', 'stellingen']);
    }
  });

  it('noemt de twaalf Python-concepten, en een fout in code vinden', () => {
    expect(leerdoelen.concepten.filter((c) => c.onderwerp === 'python').map((c) => c.id)).toEqual([
      'f-strings',
      'variabelen',
      'if-elif-else',
      'and-or',
      'for-loop',
      'continue',
      'break',
      'while-loop',
      'functies',
      'parameters',
      'lijsten',
      'dictionaries',
      'fout-in-code',
    ]);
  });

  it('vindt bij elke manier en elk speciaal geval een les die bestaat', () => {
    // Zonder les stopt de build; zo zie je het al bij pnpm test.
    const gekoppeld = plugin.koppelLessen(leerdoelen, docs());
    for (const c of gekoppeld.concepten) {
      expect(Object.keys(c.oefenen ?? {}), c.id).toEqual(c.manieren?.length ? c.manieren : []);
    }
    const binair = gekoppeld.concepten.find((c: { id: string }) => c.id === 'binair-zoeken');
    expect(binair.oefenen.aanvullen.id).toBe('binair-zoeken/bouwen/04-grenzen');
    expect(binair.oefenen.stellingen.id).toBe('binair-zoeken/03-stellingen');
  });

  it('linkt de Python-concepten naar een les van de python-cursus die bestaat', () => {
    const python = fileURLToPath(new URL('../../../python/docs/', import.meta.url));
    const routes = new Set(
      (function lijst(map: string): string[] {
        return readdirSync(map, { withFileTypes: true }).flatMap((e) =>
          e.isDirectory()
            ? lijst(join(map, e.name))
            : /\.mdx?$/.test(e.name)
              ? [
                  relative(python, join(map, e.name))
                    .replace(/\.mdx?$/, '')
                    .split('/')
                    .map((deel) => deel.replace(/^\d+-/, ''))
                    .join('/'),
                ]
              : [],
        );
      })(python),
    );
    const fout = leerdoelen.concepten
      .flatMap((c) => c.lessen ?? [])
      .filter((l) => l.id.startsWith('site:python/docs/'))
      .map((l) => l.id.replace('site:python/docs/', ''))
      .filter((r) => !routes.has(r));
    expect(fout).toEqual([]);
  });
});

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
    const opTentamen = leerdoelen.concepten.filter(
      (c) => c.onderwerp === 'python' && c.niveau['2'] !== null,
    );
    expect(opTentamen.map((c) => c.id)).toEqual([
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

// Niveau 1 is de route machine learning: kleine projecten in de browser, die
// in Python en in algoritme steeds een stap verder gaan, tot een project van
// CS50 AI. De docent beoordeelt de projecten en de Python die je erin laat
// zien. Fase A en B staan er; de rest van de route volgt.
describe('leerdoelen van Algoritmiek: de route machine learning op niveau 1', () => {
  const opNiveau1 = leerdoelen.concepten.filter((c) => c.niveau['1'] != null);
  const rij = (id: string) => leerdoelen.concepten.find((c) => c.id === id);

  it('heeft op niveau 1 alleen Python en de projecten', () => {
    expect([...new Set(opNiveau1.map((c) => c.onderwerp))]).toEqual(['python', 'ml']);
  });

  it('noemt de projecten van fase A en B op volgorde, met CS50 Shopping als laatste', () => {
    const projecten = opNiveau1.filter((c) => c.onderwerp === 'ml');
    expect(projecten.map((c) => [c.id, c.niveau['1']])).toEqual([
      ['ml-chatbot', 'basis'],
      ['ml-spamfilter-regels', 'basis'],
      ['ml-spamfilter-leert', 'basis'],
      ['ml-dichtstbijzijnde-buur', 'basis'],
      ['ml-k-buren', 'basis'],
      ['ml-eerlijk-testen', 'gevorderd'],
      ['ml-shopping', 'gevorderd'],
    ]);
    // Elk project zegt welke Python je ermee laat zien.
    for (const c of projecten) expect(c.toelichting, c.id).toMatch(/Python|scikit-learn/);
  });

  it('elk project hoort bij precies één les van de route, en elke les van de route bij een project', () => {
    const route = docs()
      .map((d) => d.id)
      .filter((id) => /^ml-(regels|afstand)\//.test(id))
      .sort();
    const projectLessen = opNiveau1
      .filter((c) => c.onderwerp === 'ml')
      .flatMap((c) => (c.lessen ?? []).map((l) => l.id))
      .sort();
    expect(projectLessen).toEqual(route);
  });

  it('de Python van de route staat niet op het tentamen, en de Python die er niet in zit niet op niveau 1', () => {
    for (const id of [
      'in-tekst',
      'lower-split',
      'tuples',
      'sorted-slicing',
      'modules',
      'csv-inlezen',
    ]) {
      expect(rij(id)?.niveau['2'], id).toBeNull();
    }
    for (const id of ['f-strings', 'continue', 'break', 'while-loop']) {
      expect(rij(id)?.niveau['1'], id).toBeNull();
    }
  });

  it('gevorderd vraagt een module of een CSV-bestand, en eerlijk testen of Shopping', () => {
    // Zo stelt moeilijkheidVoorstel gevorderd pas voor als beide onderwerpen
    // een gevorderd concept hebben.
    const gevorderd = opNiveau1.filter((c) => c.niveau['1'] === 'gevorderd').map((c) => c.id);
    expect(gevorderd).toEqual(['modules', 'csv-inlezen', 'ml-eerlijk-testen', 'ml-shopping']);
  });

  it('koppelt elke les van niveau 1 aan een les die bestaat', () => {
    const gekoppeld = plugin.koppelLessen(leerdoelen, docs());
    for (const c of gekoppeld.concepten.filter(
      (c: { niveau: Record<string, unknown> }) => c.niveau['1'] != null,
    )) {
      for (const l of c.lessen ?? []) {
        if (l.id.startsWith('site:')) continue;
        expect(l.titel, `${c.id}: ${l.id}`).toBeTruthy();
      }
    }
  });
});

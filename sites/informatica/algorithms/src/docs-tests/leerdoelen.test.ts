import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { leesLeerdoelen } from '@coderius/shared/leerdoelen';
import { describe, expect, it } from 'vitest';
import leerdoelenJson from '../leerdoelen.json';
import { lees, routePaginas, projecten as routeProjecten } from './ml-route';

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
// in Python en in algoritme steeds een stap verder gaan, met na elke fase een
// project van CS50 AI. De docent beoordeelt de projecten en de Python die je
// erin laat zien.
describe('leerdoelen van Algoritmiek: de route machine learning op niveau 1', () => {
  const opNiveau1 = leerdoelen.concepten.filter((c) => c.niveau['1'] != null);
  const rij = (id: string) => leerdoelen.concepten.find((c) => c.id === id);
  const projecten = opNiveau1.filter((c) => c.onderwerp === 'ml');
  // Vijf projecten van CS50 AI zijn één rij: je maakt er drie (november
  // 2026; eerst had elk project een eigen rij, en dat las als allemaal). De
  // lessen staan in de volgorde van de route. Traffic blijft een eigen rij op
  // expert: meer dan het lesmateriaal.
  const cs50 = rij('ml-cs50');
  const traffic = rij('ml-traffic');
  const CS50_PROJECTEN = ['Shopping', 'PageRank', 'Nim', 'Tic-Tac-Toe', 'Degrees'];

  it('heeft op niveau 1 alleen Python en de projecten', () => {
    expect([...new Set(opNiveau1.map((c) => c.onderwerp))]).toEqual(['python', 'ml']);
  });

  it('noemt de projecten van fase A tot en met F op volgorde, en de projecten van CS50 AI als één rij', () => {
    expect(projecten.map((c) => [c.id, c.niveau['1']])).toEqual([
      ['ml-chatbot', 'basis'],
      ['ml-spamfilter-regels', 'basis'],
      ['ml-spamfilter-leert', 'basis'],
      ['ml-dichtstbijzijnde-buur', 'basis'],
      ['ml-k-buren', 'basis'],
      ['ml-eerlijk-testen', 'gevorderd'],
      ['ml-dobbelsteen', 'basis'],
      ['ml-surfer', 'basis'],
      ['ml-op-weg-naar-pagerank', 'gevorderd'],
      ['ml-nim-strategie', 'basis'],
      ['ml-nim-leert', 'gevorderd'],
      ['ml-op-weg-naar-nim', 'gevorderd'],
      ['ml-buren', 'basis'],
      ['ml-kortste-weg', 'gevorderd'],
      ['ml-op-weg-naar-degrees', 'gevorderd'],
      ['ml-neuron', 'basis'],
      ['ml-neuron-leert', 'gevorderd'],
      ['ml-op-weg-naar-traffic', 'gevorderd'],
      ['ml-cs50', 'gevorderd'],
      ['ml-traffic', 'expert'],
    ]);
    expect(cs50?.concept).toBe('Drie van de projecten van CS50 AI');
    expect(cs50?.toelichting).toContain(
      `Je kiest er drie uit: ${CS50_PROJECTEN.slice(0, -1).join(', ')} en Degrees.`,
    );
    expect(traffic?.concept).toBe('Het project Traffic van CS50 AI');
  });

  it('elk project in de browser zegt welke Python je ermee laat zien, elk CS50-project waar je het maakt', () => {
    for (const c of projecten) {
      expect(c.toelichting, c.id).toMatch(
        c === cs50 || c === traffic ? /eigen computer/ : /^Python: /,
      );
    }
  });

  it('elk project van de route is de les van een rij, en elke rij heeft één les van de route', () => {
    // Een project is een map met bouwstappen (ml-route.ts). De rij wijst naar
    // de stap waar je het idee van het project leert; elke map heeft er een.
    const route = new Set(routePaginas());
    const projectLessen = projecten.map((c) => (c.lessen ?? []).map((l) => l.id));
    for (const [i, lessen] of projectLessen.entries()) {
      // De rij van CS50 AI wijst naar de vijf pagina's waar je met een project begint.
      expect(lessen.length, projecten[i].id).toBe(projecten[i] === cs50 ? 5 : 1);
      if (lessen[0].startsWith('ml-')) expect(route.has(lessen[0]), lessen[0]).toBe(true);
    }
    const gedekt = new Set(projectLessen.flat());
    for (const p of routeProjecten()) {
      expect(
        p.stappen.some((s) => gedekt.has(s)),
        `${p.id} is de les van geen enkele rij`,
      ).toBe(true);
    }
  });

  it('een CS50-project leunt op de pagina die erop voorbereidt, en die pagina noemt het project', () => {
    const tekst = (id: string) => {
      const pad = ['.mdx', '.md'].map((e) => join(DOCS, id + e)).find((p) => existsSync(p));
      return readFileSync(pad as string, 'utf8');
    };
    // PageRank en Tic-Tac-Toe leunen op een hoofdstuk van de cursus. Die werden
    // eerst overgeslagen; nu moet het hoofdstuk het project ergens noemen.
    const hoofdstuk = (id: string) => {
      const map = join(DOCS, id.split('/')[0]);
      return readdirSync(map, { recursive: true })
        .map(String)
        .filter((f) => /\.mdx?$/.test(f))
        .map((f) => readFileSync(join(map, f), 'utf8'))
        .join('\n');
    };
    const lessen = [...(cs50?.lessen ?? []), ...(traffic?.lessen ?? [])].map((l) => l.id);
    const namen = [...CS50_PROJECTEN, 'Traffic'];
    expect(lessen.length).toBe(namen.length);
    for (const [i, naam] of namen.entries()) {
      const les = lessen[i];
      const url = new RegExp(
        `cs50\\.harvard\\.edu/ai/projects/\\d/${naam.toLowerCase().replace(/-/g, '')}`,
      );
      const waar = les.startsWith('ml-') ? tekst(les) : hoofdstuk(les);
      expect(waar, `${naam}: ${les}`).toMatch(url);
    }
  });

  it('de Python van de route staat niet op het tentamen, en de Python die er niet in zit niet op niveau 1', () => {
    for (const id of [
      'in-tekst',
      'lower-split',
      'tuples',
      'sorted-slicing',
      'modules',
      'csv-inlezen',
      'loop-in-loop',
      'lijst-in-dictionary',
      'tuple-sleutel',
      'raster',
      'wachtrij',
      'range-len',
      'zip',
      'kiezen-met-kansen',
      'klassen',
    ]) {
      expect(rij(id)?.niveau['2'], id).toBeNull();
    }
    for (const id of ['f-strings', 'continue', 'break']) {
      expect(rij(id)?.niveau['1'], id).toBeNull();
    }
    // Nim en de kortste weg draaien op een while-loop.
    expect(rij('while-loop')?.niveau['1']).toBe('basis');
  });

  it('een Python-rij wijst naar het project waar die Python in de route voor het eerst voorkomt', () => {
    // Bij de review stond range(len(...)) in "de buren van een vakje" al in
    // de opdracht, terwijl het neuron en de leerdoelen het pas daarna nieuw
    // noemden. De route is de volgorde van mlSidebar.
    const route = routePaginas();
    const code = (id: string) => {
      const tekst = lees(id);
      return [
        ...[...tekst.matchAll(/```python\n([\s\S]*?)```/g)].map((m) => m[1]),
        ...[...tekst.matchAll(/initialCode=\{`([\s\S]*?)`\}/g)].map((m) => m[1]),
      ];
    };
    /** Een for-loop binnen een andere for-loop, op inspringing. */
    const loopInLoop = (blok: string) => {
      const open: number[] = [];
      for (const regel of blok.split('\n')) {
        if (!regel.trim()) continue;
        const inspring = regel.length - regel.trimStart().length;
        while (open.length && inspring <= open[open.length - 1]) open.pop();
        if (/^for .* in .*:$/.test(regel.trim())) {
          if (open.length) return true;
          open.push(inspring);
        }
      }
      return false;
    };
    const kenmerk: Record<string, (blok: string) => boolean> = {
      'range-len': (blok) => /range\(len\(/.test(blok),
      'loop-in-loop': loopInLoop,
      wachtrij: (blok) => /\.pop\(0\)/.test(blok),
    };
    for (const [id, komtVoor] of Object.entries(kenmerk)) {
      const eerste = route.find((les) => code(les).some(komtVoor));
      const lessen = (rij(id)?.lessen ?? []).map((l) => l.id).filter((l) => l.startsWith('ml-'));
      expect(lessen[0], id).toBe(eerste);
    }
  });

  it('gevorderd vraagt bij Python een tuple, een module, een CSV-bestand, zip of een klasse', () => {
    // Zo stelt moeilijkheidVoorstel gevorderd pas voor als beide onderwerpen
    // een gevorderd concept hebben. Tuples, een tuple als sleutel, zip en een
    // klasse zijn sinds november 2026 gevorderd (eerst basis).
    const gevorderd = opNiveau1
      .filter((c) => c.onderwerp === 'python' && c.niveau['1'] !== 'basis')
      .map((c) => c.id);
    expect(gevorderd).toEqual([
      'tuples',
      'modules',
      'csv-inlezen',
      'tuple-sleutel',
      'zip',
      'klassen',
    ]);
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

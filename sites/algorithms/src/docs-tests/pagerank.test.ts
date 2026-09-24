import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// De getallen van PageRank in lopende tekst, tabellen en geciteerde meldingen
// zijn met de hand gezet, en het blokken-script kijkt er niet naar. Bij de
// doorloop beweerden de fouten-pagina en stelling 4 dat ranks die je tijdens
// een ronde al bijwerkt "bijna, maar net niet" kloppen en van de volgorde van
// de pagina's afhangen. Nagespeeld komt er precies hetzelfde uit, alleen
// trager; de fout die bouwsteen 4 wél uitlokt (`nieuw = rank`) stond nergens.
// Deze test leest het mini-web uit bouwsteen 1, voert het algoritme en zijn
// foute varianten uit en legt het resultaat naast wat de pagina's zeggen.

const DOCS = fileURLToPath(new URL('../../docs/', import.meta.url));
const MAP = `${DOCS}pagerank/`;

type Web = Record<string, string[]>;
type Rank = Record<string, number>;

function lees(pad: string): string {
  return readFileSync(`${DOCS}${pad}`, 'utf8');
}

/** Het web uit een `WEB = {…}`-blok: `"A": {"B", "C"}` per regel. */
function leesWeb(tekst: string): Web {
  const blok = tekst.match(/WEB = \{([\s\S]*?)\n\}/);
  expect(blok, 'geen WEB = {…} gevonden').not.toBeNull();
  const web: Web = {};
  for (const m of (blok?.[1] ?? '').matchAll(/"([A-Z])": \{([^}]*)\}/g)) {
    web[m[1]] = [...m[2].matchAll(/"([A-Z])"/g)].map((l) => l[1]);
  }
  return web;
}

const WEB = leesWeb(lees('pagerank/bouwen/03-graph.mdx'));

/** Eén ronde van de formule, uit de waarden van `oud`. */
function stemmen(web: Web, oud: Rank, p: string, d: number): number {
  const n = Object.keys(web).length;
  let som = 0;
  for (const [i, links] of Object.entries(web)) {
    if (links.includes(p)) som += oud[i] / links.length;
  }
  return (1 - d) / n + d * som;
}

type Variant = 'goed' | 'ter-plekke' | 'alias' | 'rank-eerst';

/** De `pagerank` van bouwsteen 4, en de manieren waarop een leerling hem anders schrijft. */
function pagerank(web: Web, d = 0.85, variant: Variant = 'goed', volgorde = Object.keys(web)) {
  const n = Object.keys(web).length;
  let rank: Rank = Object.fromEntries(Object.keys(web).map((p) => [p, 1 / n]));
  for (let rondes = 1; rondes < 10_000; rondes++) {
    const oud = { ...rank };
    let nieuw: Rank;
    if (variant === 'goed' || variant === 'rank-eerst') {
      nieuw = {};
      for (const p of volgorde) nieuw[p] = stemmen(web, rank, p, d);
    } else {
      // `nieuw = rank` en ter plekke bijwerken schrijven allebei in de dict
      // waaruit de ronde nog leest.
      nieuw = rank;
      for (const p of volgorde) nieuw[p] = stemmen(web, rank, p, d);
    }
    const tegen = variant === 'goed' ? rank : variant === 'ter-plekke' ? oud : nieuw;
    const verschil = Math.max(...volgorde.map((p) => Math.abs(nieuw[p] - tegen[p])));
    rank = nieuw;
    if (verschil < 1e-9) return { rank, rondes };
  }
  throw new Error('convergeert niet');
}

/** Een rank zoals Python hem met `round(x, 4)` of `:.4f` toont. */
function vier(x: number): number {
  return Number(x.toFixed(4));
}

/** De dict uit een `AssertionError: {'A': 0.25, …}` of een assert met `"A": 0.25`. */
function dictUit(regel: string): Rank {
  return Object.fromEntries(
    [...regel.matchAll(/['"]([A-Z])['"]: ([\d.]+)/g)].map((m) => [m[1], Number(m[2])]),
  );
}

function lessen(map: string): string[] {
  return readdirSync(map).flatMap((naam) => {
    const pad = join(map, naam);
    if (statSync(pad).isDirectory()) return lessen(pad);
    return /\.mdx?$/.test(naam) ? [pad] : [];
  });
}

describe('PageRank: wat de lessen over het algoritme zeggen', () => {
  it('het mini-web van bouwsteen 1 is dat van de concept-pagina', () => {
    expect(WEB).toEqual({ A: ['B', 'C'], B: ['C'], C: ['A'], D: ['C'] });
  });

  it('de eindranks die de test van bouwsteen 4 eist, komen eruit', () => {
    const verwacht = dictUit(
      lees('pagerank/bouwen/06-itereren.mdx').match(/assert afgerond == (\{[^}]*\})/)?.[1] ?? '',
    );
    const { rank } = pagerank(WEB);
    expect(Object.keys(verwacht)).toHaveLength(4);
    expect(Object.fromEntries(Object.entries(rank).map(([p, r]) => [p, vier(r)]))).toEqual(
      verwacht,
    );
  });

  it('de melding bij "Het verschil is meteen nul" is die van nieuw = rank', () => {
    const fouten = lees('pagerank/10-fouten.mdx');
    const melding = fouten.match(/AssertionError: (\{[^}]*\})/)?.[1] ?? '';
    const { rank, rondes } = pagerank(WEB, 0.85, 'alias');
    expect(rondes).toBe(1);
    expect(dictUit(melding)).toEqual(
      Object.fromEntries(Object.entries(rank).map(([p, r]) => [p, vier(r)])),
    );
    // En de variant met rank = nieuw vóór het verschil.
    const eerst = pagerank(WEB, 0.85, 'rank-eerst');
    expect(eerst.rondes).toBe(1);
    expect(fouten).toContain(`'C': ${vier(eerst.rank.C)}`);
  });

  it('ranks ter plekke bijwerken geeft hetzelfde antwoord, in elke volgorde', () => {
    const { rank } = pagerank(WEB);
    for (const volgorde of [
      ['A', 'B', 'C', 'D'],
      ['D', 'C', 'B', 'A'],
    ]) {
      const terPlekke = pagerank(WEB, 0.85, 'ter-plekke', volgorde).rank;
      for (const p of Object.keys(WEB)) expect(terPlekke[p]).toBeCloseTo(rank[p], 8);
    }
    // Dus mag geen les beweren dat het uitmaakt.
    for (const pad of lessen(MAP)) {
      const tekst = readFileSync(pad, 'utf8');
      expect(tekst, pad).not.toMatch(/volgorde van je pagina|scheef of instabiel/);
    }
  });

  it("stelling 4: het mini-web staat pas na zo'n veertig rondes stil", () => {
    expect(lees('pagerank/02-stellingen.mdx')).toContain("zo'n veertig rondes");
    const { rondes } = pagerank(WEB);
    expect(rondes).toBeGreaterThanOrEqual(35);
    expect(rondes).toBeLessThanOrEqual(45);
  });
});

describe('PageRank: de code in de speeltuinen', () => {
  const speeltuinen = lessen(MAP).flatMap((pad) =>
    [...readFileSync(pad, 'utf8').matchAll(/initialCode=\{`([\s\S]*?)`\}/g)].map(
      (m) => [pad, m[1]] as const,
    ),
  );

  it('geen variabele heet als een pagina van het web', () => {
    // `D = 0.85` stond als dempingsfactor onder een web met pagina "D", en de
    // opdracht erna vroeg "laat D ook naar A linken".
    expect(speeltuinen.length).toBeGreaterThan(0);
    for (const [pad, code] of speeltuinen) {
      for (const m of code.matchAll(/^([A-Za-z_]\w*)\s*=/gm)) {
        expect(Object.keys(WEB), `${pad}: ${m[1]}`).not.toContain(m[1]);
      }
    }
  });
});

describe('PageRank: wat bouwsteen 4 nieuw gebruikt, legt hij ook uit', () => {
  it('while True, abs en max staan in de lopende tekst, niet alleen in de code', () => {
    // De python-cursus behandelt `while True` en `abs` niet; bouwsteen 4
    // gebruikte ze zonder een woord uitleg.
    const tekst = lees('pagerank/bouwen/06-itereren.mdx')
      .replace(/```[\s\S]*?```/g, '')
      .replace(/initialCode=\{`[\s\S]*?`\}/g, '');
    for (const nieuw of ['`while True`', '`abs`', '`max`', '`return`'])
      expect(tekst).toContain(nieuw);
  });
});

describe('PageRank: wat een bouwsteen je laat schrijven, komt later terug', () => {
  it('elke functie met "Vul aan" wordt op een latere pagina genoemd', () => {
    // Bouwsteen 1 noemde wie_linkt_naar "straks de kern van de formule",
    // en daarna kwam hij nergens meer voor.
    // De sidebar-volgorde is het nummer van het bestand, ook in bouwen/.
    const nummer = (pad: string) => Number(pad.match(/(\d+)-[^/]*$/)?.[1]);
    const volgorde = lessen(MAP).sort((a, b) => nummer(a) - nummer(b));
    for (const [i, pad] of volgorde.entries()) {
      const tekst = readFileSync(pad, 'utf8');
      for (const m of tekst.matchAll(/def (\w+)\([^)]*\):\n\s*# Vul aan/g)) {
        const later = volgorde.slice(i + 1).some((p) => readFileSync(p, 'utf8').includes(m[1]));
        expect(later, `${pad}: ${m[1]}`).toBe(true);
      }
    }
  });
});

describe('PageRank: de som van de ranks', () => {
  it('is 1 in het mini-web, en niet meer zodra een pagina nergens naartoe linkt', () => {
    // Stelling 1 zei zonder voorbehoud dat de som 1 is, terwijl de
    // compleet-pagina uitnodigt om pagina's toe te voegen.
    const som = (r: Rank) => Object.values(r).reduce((a, b) => a + b, 0);
    expect(som(pagerank(WEB).rank)).toBeCloseTo(1, 9);
    expect(som(pagerank({ ...WEB, E: [] }).rank)).toBeLessThan(0.9);
    expect(lees('pagerank/02-stellingen.mdx')).toMatch(/alle pagina's in het mini-web optelt/);
    expect(lees('pagerank/10-fouten.mdx')).not.toMatch(/dit speelt niet/);
  });
});

describe('PageRank: de antwoordtabellen van aanpassen', () => {
  const aanpassen = lees('pagerank/08-aanpassen.mdx');
  /** De rijen `| label | A | B | C | D |` uit een sectie, als label → ranks. */
  const rijen = (kop: string) => {
    const tekst = aanpassen.slice(aanpassen.indexOf(kop)).split(/\n## /)[0];
    return [
      ...tekst.matchAll(/^\| ([^|]+?) \| ([\d.]+) \| ([\d.]+) \| ([\d.]+) \| ([\d.]+) \|$/gm),
    ].map((m) => [m[1], { A: +m[2], B: +m[3], C: +m[4], D: +m[5] }] as const);
  };
  const afgerond = (r: Rank) => Object.fromEntries(Object.entries(r).map(([p, x]) => [p, vier(x)]));

  it('opdracht 1: de ranks per waarde van DEMPING', () => {
    const tabel = rijen('## Opdracht 1');
    expect(tabel.map(([d]) => d)).toEqual(['0.85', '0.5', '1.0', '0.0']);
    for (const [d, ranks] of tabel)
      expect(ranks, `d = ${d}`).toEqual(afgerond(pagerank(WEB, +d).rank));
  });

  it('opdracht 2: de ranks met en zonder de link van D naar A', () => {
    const tabel = rijen('## Opdracht 2');
    expect(tabel).toHaveLength(2);
    expect(tabel[0][1]).toEqual(afgerond(pagerank(WEB).rank));
    expect(tabel[1][1]).toEqual(afgerond(pagerank({ ...WEB, D: ['C', 'A'] }).rank));
  });
});

describe('PageRank: stemmen met fiches (unplugged 8)', () => {
  const handout = lees('unplugged/08-stemmen-met-fiches.mdx');

  /** Het fichespel: elke ronde deelt elke pagina al zijn fiches gelijk uit, zonder damping. */
  function fiches(rondes: number): Rank[] {
    let stand: Rank = { A: 12, B: 12, C: 12, D: 12 };
    const verloop = [stand];
    for (let r = 0; r < rondes; r++) {
      const nieuw: Rank = { A: 0, B: 0, C: 0, D: 0 };
      for (const [i, links] of Object.entries(WEB)) {
        for (const p of links) nieuw[p] += stand[i] / links.length;
      }
      stand = nieuw;
      verloop.push(stand);
    }
    return verloop;
  }

  it('de antwoordtabel is het spel van vier rondes', () => {
    const antwoorden = handout.slice(handout.indexOf('## Antwoorden'));
    const rijen = [
      ...antwoorden.matchAll(/^\| (start|ronde \d) \| (\d+) \| (\d+) \| (\d+) \| (\d+) \|$/gm),
    ];
    expect(rijen.map((m) => ({ A: +m[2], B: +m[3], C: +m[4], D: +m[5] }))).toEqual(fiches(4));
  });

  it('zonder damping dooft het wiebelen ook uit, met damping sneller', () => {
    // De hand-out zei dat damping het wiebelen van A en C oplost, alsof het
    // zonder damping bleef wiebelen.
    const eind = fiches(400).at(-1) as Rank;
    expect(eind.A).toBeCloseTo(19.2, 6);
    expect(eind.B).toBeCloseTo(9.6, 6);
    expect(eind.C).toBeCloseTo(19.2, 6);
    expect(handout).toContain('A en C naderen allebei 19,2 fiches en B 9,6');
    expect(pagerank(WEB, 0.85).rondes).toBeLessThan(pagerank(WEB, 1).rondes);
    expect(handout).not.toMatch(/dempen\s+de schommelingen/);
  });
});

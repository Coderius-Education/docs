import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// De rondetabellen van Dijkstra op papier — in de les en op de hand-out — zijn
// met de hand geteld, en het blokken-script kijkt er niet naar. Bij de
// doorloop verwezen zeven bouwstenen naar "je pen-en-papier-tabel" met
// getallen van een graph die het papier helemaal niet deed. Nu het papier
// dezelfde kleine graph doet als de code, legt deze test elke cel van beide
// tabellen naast een uitvoering van het algoritme: per ronde wie er gekozen
// wordt en wat elke afstand daarna is.

const DOCS = fileURLToPath(new URL('../../docs/', import.meta.url));

type Graph = Record<string, [string, number][]>;

/** Ongerichte edges naar de dict-vorm van de les, in de volgorde van `nodes`. */
function graph(nodes: string[], edges: [string, string, number][]): Graph {
  const g: Graph = Object.fromEntries(nodes.map((n) => [n, []]));
  for (const [u, v, w] of edges) {
    g[u].push([v, w]);
    g[v].push([u, w]);
  }
  return g;
}

/** Na stap 0 en na elke ronde: de gekozen knoop en de stand van alle afstanden. */
function rondes(
  g: Graph,
  start: string,
): { gekozen: string | null; afstanden: Record<string, number> }[] {
  const afstanden: Record<string, number> = Object.fromEntries(
    Object.keys(g).map((n) => [n, Number.POSITIVE_INFINITY]),
  );
  afstanden[start] = 0;
  const bezocht = new Set<string>();
  const stand = [{ gekozen: null as string | null, afstanden: { ...afstanden } }];
  for (;;) {
    let beste: string | null = null;
    let kleinste = Number.POSITIVE_INFINITY;
    for (const [node, d] of Object.entries(afstanden)) {
      if (bezocht.has(node)) continue;
      if (d < kleinste) {
        kleinste = d;
        beste = node;
      }
    }
    if (beste === null) break;
    bezocht.add(beste);
    for (const [buur, w] of g[beste]) {
      if (afstanden[beste] + w < afstanden[buur]) afstanden[buur] = afstanden[beste] + w;
    }
    stand.push({ gekozen: beste, afstanden: { ...afstanden } });
  }
  return stand;
}

/** De eerste markdown-tabel onder een kop, als cellen per rij (zonder kop en scheidingsregel). */
function tabelOnderKop(tekst: string, kop: string): string[][] {
  const na = tekst.slice(tekst.indexOf(kop) + kop.length);
  const regels = na.split('\n');
  const eerste = regels.findIndex((r) => r.startsWith('|'));
  const rijen: string[][] = [];
  for (const regel of regels.slice(eerste)) {
    if (!regel.startsWith('|')) break;
    rijen.push(
      regel
        .split('|')
        .slice(1, -1)
        .map((c) => c.trim()),
    );
  }
  return rijen.slice(2);
}

/**
 * Legt een rondetabel naast de uitvoering. Kolom 0 is de knoop, kolom 1 de
 * stand na stap 0, daarna één kolom per ronde. Een cel is een getal, `?`
 * (oneindig), een getal met ✓ (in deze ronde gekozen) of — (al eerder
 * gekozen, verandert niet meer).
 */
function controleer(rijen: string[][], stand: ReturnType<typeof rondes>): void {
  for (const rij of rijen) {
    const node = rij[0];
    let gekozenIn = -1;
    for (let r = 0; r < stand.length; r++) {
      const cel = rij[r + 1];
      const { gekozen, afstanden } = stand[r];
      const verwacht = afstanden[node] === Number.POSITIVE_INFINITY ? '?' : String(afstanden[node]);
      if (gekozenIn >= 0) {
        expect(cel, `${node}, kolom ${r}: na ✓ hoort —`).toBe('—');
      } else if (gekozen === node) {
        expect(cel, `${node}, ronde ${r}`).toBe(`${verwacht} ✓`);
        gekozenIn = r;
      } else {
        expect(cel, `${node}, kolom ${r}`).toBe(verwacht);
      }
    }
    expect(gekozenIn, `${node} wordt nooit gekozen`).toBeGreaterThan(0);
  }
}

describe('de rondetabellen op papier kloppen met het algoritme', () => {
  it('de kleine graph in "Doe het met pen en papier"', () => {
    const tekst = readFileSync(`${DOCS}dijkstra/02-met-pen-en-papier.mdx`, 'utf8');
    const rijen = tabelOnderKop(tekst, '## Nu jij');
    const g = graph(
      ['A', 'B', 'C', 'D'],
      [
        ['A', 'B', 4],
        ['A', 'C', 2],
        ['B', 'D', 1],
        ['C', 'D', 8],
      ],
    );
    const stand = rondes(g, 'A');
    expect(rijen.map((r) => r[0])).toEqual(['A', 'B', 'C', 'D']);
    expect(rijen[0].length, 'kolommen: knoop, stap 0, vier rondes').toBe(2 + 4);
    controleer(rijen, stand);
  });

  it('de kaart van de hand-out "Dijkstra op papier"', () => {
    const tekst = readFileSync(`${DOCS}unplugged/03-dijkstra-op-papier.mdx`, 'utf8');
    const rijen = tabelOnderKop(tekst, '## Antwoorden');
    const g = graph(
      ['A', 'B', 'C', 'D', 'E', 'F', 'G'],
      [
        ['A', 'B', 2],
        ['A', 'C', 6],
        ['B', 'C', 2],
        ['B', 'D', 8],
        ['C', 'E', 3],
        ['D', 'E', 2],
        ['D', 'F', 4],
        ['E', 'F', 7],
        ['E', 'G', 4],
        ['F', 'G', 1],
      ],
    );
    const stand = rondes(g, 'A');
    expect(rijen.map((r) => r[0])).toEqual(['A', 'B', 'C', 'D', 'E', 'F', 'G']);
    expect(rijen[0].length, 'kolommen: plek, start, zeven rondes').toBe(2 + 7);
    controleer(rijen, stand);
  });

  it('de invultabel van de hand-out heeft dezelfde kolommen als de antwoordtabel', () => {
    const tekst = readFileSync(`${DOCS}unplugged/03-dijkstra-op-papier.mdx`, 'utf8');
    const leeg = tabelOnderKop(tekst, '## De tabel');
    const antwoord = tabelOnderKop(tekst, '## Antwoorden');
    expect(leeg.map((r) => r[0])).toEqual(antwoord.map((r) => r[0]));
    expect(leeg[0].length).toBe(antwoord[0].length);
  });
});

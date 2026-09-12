import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// De getallen van Dijkstra op papier — de rondetabellen in de les en op de
// hand-out, en de paden op de concept-pagina — zijn met de hand geteld, en het
// blokken-script kijkt er niet naar. Bij de doorloop verwezen zeven
// bouwstenen naar "je pen-en-papier-tabel" met getallen van een graph die het
// papier niet deed, en de concept-pagina telde een pad over een edge die niet
// bestaat. Deze test leest de edges van de pagina zelf (de zin "Vier nodes,
// vier edges: …" en de wegentabel van de hand-out), voert het algoritme
// daarop uit en legt het resultaat naast wat de pagina beweert. Verandert
// iemand een gewicht in de tekst, dan verandert de verwachting mee.

const DOCS = fileURLToPath(new URL('../../docs/', import.meta.url));

type Graph = Record<string, [string, number][]>;

function lees(pad: string): string {
  return readFileSync(`${DOCS}${pad}`, 'utf8');
}

/** De tekst van een sectie: van de kop tot de volgende H2. */
function sectie(tekst: string, kop: string): string {
  const i = tekst.indexOf(kop);
  expect(i, `kop "${kop}" niet gevonden`).toBeGreaterThanOrEqual(0);
  const rest = tekst.slice(i + kop.length);
  const volgende = rest.search(/\n## /);
  return volgende === -1 ? rest : rest.slice(0, volgende);
}

/** Alle `X─Y` n-paren in een stuk tekst, zoals "`A─B` 4" of een tabelcel "A─B | 2". */
function edgesUit(tekst: string): [string, string, number][] {
  return [...tekst.matchAll(/([A-Z])─([A-Z])`?\s*\|?\s*(\d+)/g)].map((m) => [
    m[1],
    m[2],
    Number(m[3]),
  ]);
}

/** Ongerichte edges naar de dict-vorm van de les, knopen alfabetisch (de volgorde van de tabellen). */
function graph(edges: [string, string, number][]): Graph {
  // Alleen de twee knopen, niet het gewicht; biome's autofix maakte hier ooit `flat()` van.
  const nodes = [...new Set(edges.flatMap((e) => e.slice(0, 2) as string[]))].sort();
  const g: Graph = Object.fromEntries(nodes.map((n) => [n, []]));
  for (const [u, v, w] of edges) {
    g[u].push([v, w]);
    g[v].push([u, w]);
  }
  return g;
}

type Ronde = { gekozen: string | null; afstanden: Record<string, number> };

/**
 * Na stap 0 en na elke ronde: de gekozen knoop en de stand van alle afstanden,
 * plus aan het eind per knoop vanaf welke knoop zijn kortste route kwam — de
 * kolom "via" op de hand-out. Die verandert onderweg mee met de afstand: `F`
 * gaat van E naar D naar G, net als 14 → 13 → 12.
 */
function rondes(g: Graph, start: string): { stand: Ronde[]; voorgangers: Record<string, string> } {
  const afstanden: Record<string, number> = Object.fromEntries(
    Object.keys(g).map((n) => [n, Number.POSITIVE_INFINITY]),
  );
  afstanden[start] = 0;
  const bezocht = new Set<string>();
  const voorgangers: Record<string, string> = {};
  const stand: Ronde[] = [{ gekozen: null, afstanden: { ...afstanden } }];
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
      if (afstanden[beste] + w < afstanden[buur]) {
        afstanden[buur] = afstanden[beste] + w;
        voorgangers[buur] = beste;
      }
    }
    stand.push({ gekozen: beste, afstanden: { ...afstanden } });
  }
  return { stand, voorgangers };
}

/** De eerste markdown-tabel onder een kop, als cellen per rij (zonder kop en scheidingsregel). */
function tabelOnderKop(tekst: string, kop: string): string[][] {
  const regels = sectie(tekst, kop).split('\n');
  const eerste = regels.findIndex((r) => r.startsWith('|'));
  expect(eerste, `geen tabel onder "${kop}"`).toBeGreaterThanOrEqual(0);
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
function controleer(
  rijen: string[][],
  { stand, voorgangers }: ReturnType<typeof rondes>,
  metVia = false,
): void {
  expect(rijen.map((r) => r[0])).toEqual(Object.keys(stand[0].afstanden));
  expect(rijen[0].length, 'kolommen: knoop, stap 0, één per ronde, eventueel via').toBe(
    1 + stand.length + (metVia ? 1 : 0),
  );
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
    if (metVia) {
      // De startknoop kwam nergens vandaan en houdt een streepje.
      expect(rij.at(-1), `${node}, kolom via`).toBe(voorgangers[node] ?? '—');
    }
  }
}

describe('de rondetabellen op papier kloppen met het algoritme', () => {
  it('de kleine graph in "Doe het met pen en papier"', () => {
    const tekst = lees('dijkstra/02-met-pen-en-papier.mdx');
    const edges = edgesUit(sectie(tekst, '## Nu jij'));
    expect(edges.length, 'de zin "Vier nodes, vier edges: …"').toBe(4);
    controleer(tabelOnderKop(tekst, '## Nu jij'), rondes(graph(edges), 'A'));
  });

  it('de kaart van de hand-out "Dijkstra op papier"', () => {
    const tekst = lees('unplugged/03-dijkstra-op-papier.mdx');
    const edges = tabelOnderKop(tekst, '## De kaart').flatMap((rij) => edgesUit(rij.join(' | ')));
    expect(edges.length, 'de wegentabel: tien wegen').toBe(10);
    // De hand-out heeft een kolom "via" achteraan, waar de les die niet heeft.
    controleer(tabelOnderKop(tekst, '## Antwoorden'), rondes(graph(edges), 'A'), true);
  });

  it('de invultabel van de hand-out heeft dezelfde kolommen als de antwoordtabel', () => {
    const tekst = lees('unplugged/03-dijkstra-op-papier.mdx');
    const leeg = tabelOnderKop(tekst, '## De tabel');
    const antwoord = tabelOnderKop(tekst, '## Antwoorden');
    expect(leeg.map((r) => r[0])).toEqual(antwoord.map((r) => r[0]));
    expect(leeg[0].length).toBe(antwoord[0].length);
  });
});

describe('de paden op de concept-pagina bestaan en tellen op', () => {
  // De concept-pagina tekent dezelfde kleine graph als "Nu jij"; de edges
  // komen daar vandaan. Elk pad in "Wat is een pad?" wordt nagelopen: elk
  // paar knopen achter elkaar is een edge, de termen van de som zijn de
  // gewichten van die edges, en de som klopt. De concept-pagina beweerde
  // A → C → B → D = 4 over een edge C─B die niet bestaat.
  const g = graph(edgesUit(sectie(lees('dijkstra/02-met-pen-en-papier.mdx'), '## Nu jij')));
  const gewicht = (u: string, v: string): number | undefined =>
    g[u]?.find(([buur]) => buur === v)?.[1];
  const tekst = sectie(lees('dijkstra/01-concept.mdx'), '## Wat is een pad?').replace(
    /\n\s*/g,
    ' ',
  );

  const paden = [
    ...tekst.matchAll(/`((?:[A-D] → )+[A-D])`[^`]*?(\d+(?: \+ \d+)+) = \*\*(\d+)\*\*/g),
  ].map((m) => ({
    knopen: m[1].split(' → '),
    termen: m[2].split(' + ').map(Number),
    totaal: Number(m[3]),
  }));

  it('noemt minstens twee paden met een som', () => {
    expect(paden.length).toBeGreaterThanOrEqual(2);
  });

  it.each(paden.map((p) => [p.knopen.join(' → '), p] as const))('%s', (_naam, pad) => {
    const gewichten = pad.knopen.slice(1).map((v, i) => gewicht(pad.knopen[i], v));
    expect(gewichten, 'elk paar achter elkaar is een edge, met dit gewicht').toEqual(pad.termen);
    expect(pad.termen.reduce((a, b) => a + b, 0)).toBe(pad.totaal);
  });

  it('de kortste die de pagina aanwijst is de kortste', () => {
    const m = tekst.match(/is \*\*`((?:[A-D] → )+[A-D]) = (\d+)`\*\*/);
    expect(m, 'de zin "De kortste … is **`A → … = n`**"').not.toBeNull();
    const eind = rondes(g, 'A').stand.at(-1);
    expect(Number(m?.[2])).toBe(eind?.afstanden[m?.[1].split(' → ').at(-1) ?? '']);
    expect(paden.map((p) => p.totaal)).toContain(Number(m?.[2]));
  });
});

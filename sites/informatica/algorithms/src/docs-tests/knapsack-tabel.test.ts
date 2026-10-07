import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// Twee pagina's laten een leerling de knapsack-tabel met de hand invullen en
// geven de ingevulde tabel als antwoord: vul de tabel in (5 items, 11 kg) en
// de hand-out (4 items, 8 kg). Getallen in een markdown-tabel controleert het
// blokken-script niet, en een leerling die een cel anders uitkomt denkt dat
// hij het fout heeft. Deze test leest de items en de antwoordtabel uit de
// pagina en legt er het algoritme naast.

const DOCS = fileURLToPath(new URL('../../docs/', import.meta.url));

type Item = { waarde: number; gewicht: number };

function knapsack(items: Item[], capaciteit: number): number[][] {
  const tabel = Array.from({ length: items.length + 1 }, () =>
    new Array<number>(capaciteit + 1).fill(0),
  );
  for (let i = 1; i <= items.length; i++) {
    const { waarde, gewicht } = items[i - 1];
    for (let w = 0; w <= capaciteit; w++) {
      tabel[i][w] =
        gewicht > w
          ? tabel[i - 1][w]
          : Math.max(tabel[i - 1][w], waarde + tabel[i - 1][w - gewicht]);
    }
  }
  return tabel;
}

/** De rijen `| … | 0 | 1 | 6 | … |` van de tabel die begint bij `kop`: alleen de getallen. */
function tabelUit(tekst: string, kop: string): number[][] {
  const start = tekst.indexOf(kop);
  expect(start, `kop '${kop}' staat op de pagina`).toBeGreaterThan(-1);
  const regels = tekst.slice(start).split('\n');
  const rijen: number[][] = [];
  let begonnen = false;
  for (const regel of regels) {
    if (/^\| \*\*(i=|geen items|t\/m item)/.test(regel)) {
      begonnen = true;
      const cellen = regel
        .split('|')
        .slice(2, -1)
        .map((c) => c.trim().replace(/\*\*/g, ''));
      rijen.push(cellen.map(Number));
    } else if (begonnen && !regel.startsWith('|')) {
      break;
    }
  }
  return rijen;
}

/** `| 1 | 1 | 1 |`-rijen van een items-tabel: (nummer, waarde, gewicht). */
function itemsUit(tekst: string, kop: string): Item[] {
  const start = tekst.indexOf(kop);
  expect(start, `kop '${kop}' staat op de pagina`).toBeGreaterThan(-1);
  const items: Item[] = [];
  for (const m of tekst
    .slice(start)
    .matchAll(/^\| (\d) \| (\d+) \| (\d+)(?: kg)? \| ([\d,]+) \|$/gm)) {
    items.push({ waarde: Number(m[2]), gewicht: Number(m[3]) });
    // De kolom waarde per kilo, afgerond op één decimaal met een komma.
    const perKilo = Number(m[2]) / Number(m[3]);
    const getoond = Number(m[4].replace(',', '.'));
    if (Math.abs(getoond - perKilo) > 0.05) {
      throw new Error(
        `item ${m[1]}: waarde per kg is ${perKilo.toFixed(2)}, de tabel zegt ${m[4]}`,
      );
    }
    if (items.length && Number(m[1]) !== items.length) throw new Error('items niet op volgorde');
  }
  return items;
}

/** Pak in de gegeven volgorde alles wat nog past: wat een leerling doet die sorteert. */
function gretig(items: Item[], capaciteit: number, volgorde: (a: Item, b: Item) => number): number {
  let ruimte = capaciteit;
  let waarde = 0;
  for (const item of [...items].sort(volgorde)) {
    if (item.gewicht <= ruimte) {
      ruimte -= item.gewicht;
      waarde += item.waarde;
    }
  }
  return waarde;
}

const OP_WAARDE = (a: Item, b: Item) => b.waarde - a.waarde;
const PER_KILO = (a: Item, b: Item) => b.waarde / b.gewicht - a.waarde / a.gewicht;

describe('knapsack — de tabellen op de pagina zijn de tabellen van het algoritme', () => {
  it('vul de tabel in: de complete tabel voor de vijf items en 11 kg', () => {
    const tekst = readFileSync(`${DOCS}knapsack/02-vul-de-tabel-in.mdx`, 'utf8');
    const items = itemsUit(tekst, '## De items');
    expect(items).toHaveLength(5);
    const tabel = tabelUit(tekst, '## De complete tabel');
    expect(tabel).toEqual(knapsack(items, 11));
    // De antwoorden per rij, ook die in de uitklapblokken.
    const perRij = [...tekst.matchAll(/^\| \*\*i=(\d)\*\* \| (.+) \|$/gm)]
      .filter((m) => m.index !== undefined && m.index < tekst.indexOf('## De complete tabel'))
      .map((m) => [
        Number(m[1]),
        m[2].split('|').map((c) => Number(c.trim().replace(/\*\*/g, ''))),
      ]);
    expect(perRij.length).toBe(5);
    for (const [i, rij] of perRij as [number, number[]][])
      expect(rij, `rij ${i}`).toEqual(tabel[i]);
  });

  it('de hand-out: de antwoordtabel voor de vier items en 8 kg, en de beste rugzak', () => {
    const tekst = readFileSync(`${DOCS}unplugged/05-pak-de-rugzak-in.mdx`, 'utf8');
    const items = itemsUit(tekst, '## De items');
    expect(items).toHaveLength(4);
    const tabel = knapsack(items, 8);
    expect(tabelUit(tekst, '## Antwoorden')).toEqual(tabel);
    // De invultabel draagt dezelfde items in zijn rijkoppen.
    const koppen = [...tekst.matchAll(/^\| \*\*t\/m item (\d)\*\* \((\d+), (\d+) kg\)/gm)];
    expect(koppen.map((m) => [Number(m[2]), Number(m[3])])).toEqual(
      items.map((x) => [x.waarde, x.gewicht]),
    );
    expect(tekst).toContain(`waarde **${tabel[4][8]}**`);
    // De extra vraag: de kolom van 5 kg, zonder opnieuw te rekenen.
    expect(tekst).toContain(`**Bij 5 kg** staat in de kolom van 5 kg onderaan **${tabel[4][5]}**`);
  });

  it('sorteren verliest van de tabel, op waarde én op waarde per kilo, in les en hand-out', () => {
    // Het punt van de werkvorm. De vorige items van de hand-out gaven bij
    // sorteren per kilo precies het optimum, en dan leert de leerling het
    // omgekeerde. De les zelf zegt 35 tegen 40.
    for (const [naam, pad, capaciteit] of [
      ['les', 'knapsack/02-vul-de-tabel-in.mdx', 11],
      ['hand-out', 'unplugged/05-pak-de-rugzak-in.mdx', 8],
    ] as const) {
      const items = itemsUit(readFileSync(`${DOCS}${pad}`, 'utf8'), '## De items');
      const beste = knapsack(items, capaciteit)[items.length][capaciteit];
      expect(gretig(items, capaciteit, OP_WAARDE), `${naam}: op waarde`).toBeLessThan(beste);
      expect(gretig(items, capaciteit, PER_KILO), `${naam}: per kilo`).toBeLessThan(beste);
    }
    const les = itemsUit(
      readFileSync(`${DOCS}knapsack/02-vul-de-tabel-in.mdx`, 'utf8'),
      '## De items',
    );
    expect([gretig(les, 11, OP_WAARDE), gretig(les, 11, PER_KILO)]).toEqual([35, 35]);
  });
});

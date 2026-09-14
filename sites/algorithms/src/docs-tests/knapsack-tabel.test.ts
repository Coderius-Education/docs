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
  for (const m of tekst.slice(start).matchAll(/^\| (\d) \| (\d+) \| (\d+)(?: kg)? \|$/gm)) {
    items.push({ waarde: Number(m[2]), gewicht: Number(m[3]) });
    if (items.length && Number(m[1]) !== items.length) throw new Error('items niet op volgorde');
  }
  return items;
}

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
    // Gretig (waardevolste eerst): item 4 (6 kg), dan item 1 (2 kg): 15.
    expect(tabel[4][8]).toBeGreaterThan(12 + 3);
  });
});

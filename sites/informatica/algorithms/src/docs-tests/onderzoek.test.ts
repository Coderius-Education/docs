import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// Een Onderzoek- of Experimenteer-sectie stelt vragen boven een runner. Bij
// Dijkstra (10-compleet) stonden drie aanpasvragen boven een runner van 39
// regels, en de graph die je aanpast stond onderaan, zo'n 800 pixels onder
// de vragen: scrollen voor elke vraag (web-issue #154 in een andere
// cursus). Bij knapsack (08-compleet) stond het antwoord tussen de vragen en
// de runner, dus las je het voordat je iets had geprobeerd.

const DOCS = fileURLToPath(new URL('../../docs/', import.meta.url));

/** Ongeveer 700 pixels in de runner: één scherm van 720 hoog, min de vragen. */
const MAX_REGELS_ONDER_VRAGEN = 30;

function lessen(map: string): string[] {
  return readdirSync(map)
    .sort()
    .flatMap((naam) => {
      const pad = join(map, naam);
      if (statSync(pad).isDirectory()) return lessen(pad);
      return /\.mdx?$/.test(naam) ? [pad] : [];
    });
}

const secties = lessen(DOCS).flatMap((pad) => {
  const tekst = readFileSync(pad, 'utf8');
  return [...tekst.matchAll(/^## (Onderzoek|Experimenteer)[^\n]*\n/gm)].map((m) => {
    const rest = tekst.slice((m.index ?? 0) + m[0].length);
    const eind = rest.search(/^## /m);
    return {
      naam: `${relative(DOCS, pad)}: ${m[0].trim()}`,
      tekst: eind < 0 ? rest : rest.slice(0, eind),
    };
  });
});

describe('onderzoeksvragen staan bij hun runner', () => {
  it('er zijn onderzoek-secties', () => {
    expect(secties.length).toBeGreaterThan(20);
  });

  it('het antwoord staat ná de runner, niet ertussen', () => {
    const fout = secties.filter(({ tekst }) => {
      const runner = tekst.indexOf('<PyRunner');
      const details = tekst.indexOf('<details');
      return runner >= 0 && details >= 0 && details < runner;
    });
    expect(fout.map((s) => s.naam)).toEqual([]);
  });

  it('onder een lijst vragen staat een runner die in één scherm past', () => {
    const fout = secties.flatMap(({ naam, tekst }) => {
      const runner = tekst.indexOf('<PyRunner');
      if (runner < 0 || !/^\d+\. /m.test(tekst.slice(0, runner))) return [];
      const code = tekst.slice(runner).match(/initialCode=\{`([\s\S]*?)`\}/)?.[1] ?? '';
      const regels = code.split('\n').length;
      return regels > MAX_REGELS_ONDER_VRAGEN ? [`${naam}: ${regels} regels`] : [];
    });
    expect(fout).toEqual([]);
  });
});

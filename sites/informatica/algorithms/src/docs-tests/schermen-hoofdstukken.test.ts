import { readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// Wat een review als leerling vond in de hoofdstukken big-o, dijkstra,
// knapsack, minimax, cfg, hanoi en pagerank, en wat bij het opknappen
// overal is rechtgezet. De hoofdstukken die nog niet zo zijn nagelopen,
// staan hier (nog) niet in; een hoofdstuk dat erbij komt, zet je in
// HOOFDSTUKKEN.
//
// - Een scherm dat de leerling iets laat schrijven met een while, waarschuwt
//   dat het tabblad van de browser vastloopt als de loop nooit stopt. De
//   speeltuin heeft geen stopknop.
// - Er gaat iets mis: oorzaak en oplossing staan op hetzelfde scherm, en een
//   kop is een korte Nederlandse zin, geen stuk code.
// - Geen bijna lege schermen: Specificatie en Wat nu nog mist waren een
//   lijstje of twee zinnen op een eigen scherm.
// - Een regel van de startcode is hooguit 66 tekens: dan past de uitvoer
//   naast de code.

const DOCS = fileURLToPath(new URL('../../docs/', import.meta.url));
const HOOFDSTUKKEN = ['big-o', 'dijkstra', 'knapsack', 'minimax', 'cfg', 'hanoi', 'pagerank'];

function bestanden(map: string): string[] {
  return readdirSync(map, { withFileTypes: true }).flatMap((f) =>
    f.isDirectory()
      ? bestanden(join(map, f.name))
      : /\.mdx?$/.test(f.name)
        ? [join(map, f.name)]
        : [],
  );
}

const lessen = HOOFDSTUKKEN.flatMap((h) => bestanden(join(DOCS, h))).map((pad) => ({
  naam: relative(DOCS, pad),
  bron: readFileSync(pad, 'utf8'),
}));

/** De stukken van een les tussen twee koppen (## of ###): ongeveer de schermen. */
function stukken(bron: string): { kop: string; tekst: string }[] {
  return bron
    .split(/^(?=#{2,3} )/m)
    .slice(1)
    .map((tekst) => ({ kop: tekst.split('\n')[0], tekst }));
}

const startcodes = (tekst: string) =>
  [...tekst.matchAll(/initialCode=\{`([\s\S]*?)`\}/g)].map((m) => m[1]);

describe('de hoofdstukken na de review als leerling', () => {
  it('vindt de lessen', () => {
    expect(lessen.length).toBeGreaterThan(80);
  });

  it('een scherm waar de leerling een while schrijft, waarschuwt voor het vastlopen', () => {
    const fout: string[] = [];
    for (const { naam, bron } of lessen) {
      if (/cheatsheet/.test(naam)) continue;
      for (const { kop, tekst } of stukken(bron)) {
        const code = startcodes(tekst).join('\n');
        if (!code) continue;
        const antwoord =
          tekst.match(/<summary>Antwoord<\/summary>([\s\S]*?)<\/details>/)?.[1] ?? '';
        const tel = (s: string) => (s.match(/\bwhile\b/g) ?? []).length;
        // Een while in de startcode waar de leerling iets in aanvult, of een
        // antwoord met meer while dan de startcode.
        const schrijft = (tel(code) > 0 && /vul aan/i.test(code)) || tel(antwoord) > tel(code);
        if (schrijft && !/tabblad van de\s+browser/.test(tekst) && !/kladblok/.test(tekst))
          fout.push(`${naam} | ${kop}`);
      }
    }
    expect(fout).toEqual([]);
  });

  it('er gaat iets mis: oorzaak en oplossing op één scherm, korte Nederlandse koppen', () => {
    const fout: string[] = [];
    for (const { naam, bron } of lessen.filter((l) => /fouten/.test(l.naam))) {
      for (const { kop, tekst } of stukken(bron)) {
        if (/^### Oplossing/.test(kop)) fout.push(`${naam} | ${kop}: een eigen stap Oplossing`);
        if (/^#{2,3} `/.test(kop)) fout.push(`${naam} | ${kop}: de kop begint met code`);
        const eerste = tekst
          .split('\n')
          .slice(1)
          .find((r) => r.trim() && !r.startsWith('{/*'));
        if (eerste?.startsWith('**Oplossing:**'))
          fout.push(`${naam} | ${kop}: het scherm begint met de oplossing`);
      }
    }
    expect(fout).toEqual([]);
  });

  it('geen scherm dat alleen een specificatie of "wat nu nog mist" is', () => {
    const fout = lessen.flatMap(({ naam, bron }) =>
      [
        ...bron.matchAll(/^#{2,3} (Specificatie|Wat nu nog mist|Wat nu\?|Wat is er nu klaar\?)$/gm),
      ].map((m) => `${naam}: ${m[1]}`),
    );
    expect(fout).toEqual([]);
  });

  it('een regel van de startcode is hooguit 66 tekens', () => {
    // Een zin van de opdracht blijft heel: een string die over twee regels
    // breekt, leest in een lijst zinnen als twee zinnen.
    const HEEL = ['"I had a country walk on Thursday and came home in a dreadful mess",'];
    const fout: string[] = [];
    for (const { naam, bron } of lessen) {
      for (const code of startcodes(bron)) {
        for (const regel of code.split('\n')) {
          const echt = regel.replace(/\\\\/g, '\\');
          if (echt.length > 66 && !HEEL.includes(echt.trim()))
            fout.push(`${naam}: ${echt.length}: ${echt.trim()}`);
        }
      }
    }
    expect(fout).toEqual([]);
  });
});

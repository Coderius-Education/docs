import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// De schrijfgids (§6) eist bij elke opdracht een oplossing in een <details>,
// zodat een leerling zichzelf kan controleren. Bij de doorloop van de zoek-
// en sorteerhoofdstukken bleek dat alle zes uitdagingen zonder oplossing
// stonden: "Uitdaging (optioneel)" las als "hier hoeft niets bij". Deze test
// legt het formaat vast: elke H2 die een opdracht, uitdaging of bouw-zelf
// aankondigt heeft vóór de volgende H2 een <summary>Antwoord</summary>.
//
// De hoofdstukken die nog niet zijn doorgelopen staan in ACHTERSTAND met
// hun openstaande koppen. Die lijst is exact: een nieuwe opdracht zonder
// antwoord valt meteen op, en een opgeloste hoort hier weg.

const DOCS = fileURLToPath(new URL('../../docs/', import.meta.url));

const OPDRACHT_KOP = /^(Opdracht|Uitdaging|Bouw zelf)\b/;

const ACHTERSTAND = new Map<string, string[]>([
  ['cfg/14-aanpassen.mdx', ['Opdracht 1 — voeg een woord toe', 'Opdracht 2 — zoek een ambigue zin']],
  ['dijkstra/12-zelf-bouwen.mdx', ['Uitdaging (optioneel)']],
  ['knapsack/09-aanpassen.mdx', ['Opdracht']],
  ['knapsack/10-zelf-bouwen.mdx', ['Opdracht', 'Uitdaging (optioneel)']],
  ['knapsack/bouwen/04-items.mdx', ['Bouw zelf en test']],
  ['knapsack/bouwen/05-tabel-leeg.mdx', ['Bouw zelf en test']],
  ['knapsack/bouwen/06-een-rij.mdx', ['Bouw zelf en test']],
  ['knapsack/bouwen/07-volledige-tabel.mdx', ['Bouw zelf en test']],
  ['minimax/bouwen/06-initial_state.mdx', ['Bouw zelf en test']],
  ['minimax/bouwen/07-player.mdx', ['Bouw zelf en test']],
  ['minimax/bouwen/08-actions.mdx', ['Bouw zelf en test']],
  ['minimax/bouwen/10-result.mdx', ['Bouw zelf en test']],
  ['minimax/bouwen/11-winner.mdx', ['Bouw zelf en test']],
  ['minimax/bouwen/12-terminal.mdx', ['Bouw zelf en test']],
  ['minimax/bouwen/13-utility.mdx', ['Bouw zelf en test']],
  ['minimax/bouwen/14-helpers.mdx', ['Bouw zelf en test']],
  ['minimax/bouwen/16-minimax.mdx', ['Bouw zelf in `tictactoe.py`']],
  ['pagerank/08-aanpassen.mdx', ['Opdracht 1 — draai aan `d`', 'Opdracht 2 — voeg een link toe']],
]);

function lessen(map: string): string[] {
  return readdirSync(map)
    .sort()
    .flatMap((naam) => {
      const pad = join(map, naam);
      if (statSync(pad).isDirectory()) return lessen(pad);
      return /\.mdx?$/.test(naam) ? [pad] : [];
    });
}

/** Alles wat geen proza is eruit, zodat een `##` in code niet als kop telt. */
function zonderCode(tekst: string): string {
  const leeg = (m: string) => m.replace(/[^\n]/g, ' ');
  return tekst.replace(/```[\s\S]*?```/g, leeg).replace(/initialCode=\{`[\s\S]*?`\}/g, leeg);
}

type Sectie = { kop: string; inhoud: string };

function h2Secties(tekst: string): Sectie[] {
  const proza = zonderCode(tekst);
  const koppen = [...proza.matchAll(/^## (.*)$/gm)];
  return koppen.map((m, i) => {
    const eind = i + 1 < koppen.length ? koppen[i + 1].index : proza.length;
    return { kop: m[1].trim(), inhoud: proza.slice(m.index, eind) };
  });
}

function zonderAntwoord(pad: string): string[] {
  return h2Secties(readFileSync(pad, 'utf8'))
    .filter((s) => OPDRACHT_KOP.test(s.kop) && !/<summary>Antwoord<\/summary>/.test(s.inhoud))
    .map((s) => s.kop);
}

describe('opdrachten en uitdagingen', () => {
  const gevonden = new Map<string, string[]>();
  for (const pad of lessen(DOCS)) {
    const open = zonderAntwoord(pad);
    if (open.length) gevonden.set(relative(DOCS, pad), open);
  }

  it('elke opdracht, uitdaging en bouw-zelf heeft een antwoord in een <details>', () => {
    const nieuw = [...gevonden].filter(([les]) => !ACHTERSTAND.has(les));
    expect(Object.fromEntries(nieuw)).toEqual({});
  });

  it('de achterstand is exact: een opgeloste opdracht hoort uit de lijst', () => {
    expect(Object.fromEntries(gevonden)).toEqual(Object.fromEntries(ACHTERSTAND));
  });
});

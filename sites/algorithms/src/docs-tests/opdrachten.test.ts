import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// De schrijfgids (§6) eist bij elke opdracht een oplossing in een <details>,
// zodat een leerling zichzelf kan controleren. Bij de doorloop van de zoek-
// en sorteerhoofdstukken bleek dat alle zes uitdagingen zonder oplossing
// stonden: "Uitdaging (optioneel)" las als "hier hoeft niets bij". Deze test
// legt het formaat vast: elke H2 of H3 die een opdracht, uitdaging of
// bouw-zelf aankondigt heeft in zijn eigen sectie een
// <summary>Antwoord</summary>. Alleen een kop die de hele pagina tot één
// opdracht maakt ("De uitdaging", "Bouw zelf") mag het antwoord in een
// latere sectie hebben, tot de volgende opdracht-kop; zo staan de
// zelf-bouwen-pagina's van hanoi en cfg in elkaar.
//
// De hoofdstukken die nog niet zijn doorgelopen staan in ACHTERSTAND met
// hun openstaande koppen. Die lijst is exact: een nieuwe opdracht zonder
// antwoord valt meteen op, en een opgeloste hoort hier weg.
//
// Ook een H3 telt, en "Extra uitdaging" ook: bij de doorloop van Torens van
// Hanoi stond een "### Extra uitdaging" zonder antwoord onder de opdracht,
// en die ontsnapte aan een test die alleen H2's las.

const DOCS = fileURLToPath(new URL('../../docs/', import.meta.url));

// "De uitdaging" telt ook: zo heette de kop van cfg/15-zelf-bouwen, en die
// ontsnapte aan een regex die alleen aan het begin van de kop keek.
const OPDRACHT_KOP = /^(De |Extra )?(Opdracht|Uitdaging|Bouw zelf)\b/i;

const ACHTERSTAND = new Map<string, string[]>([]);

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

/** De secties per H2 of H3; een sectie loopt tot de volgende kop van niveau 2 of 3. */
function secties(tekst: string): Sectie[] {
  const proza = zonderCode(tekst);
  const koppen = [...proza.matchAll(/^##{1,2} (.*)$/gm)];
  return koppen.map((m, i) => {
    const eind = i + 1 < koppen.length ? koppen[i + 1].index : proza.length;
    return { kop: m[1].trim(), inhoud: proza.slice(m.index, eind) };
  });
}

// Een kop die de hele pagina tot één opdracht maakt: de zelf-bouwen-pagina's
// van hanoi en cfg zetten de opdracht onder "De uitdaging" en het antwoord
// onder "Bouw en test". Precies die kop, want "Bouw zelf en test" is de
// opdracht van elke bouwsteen en die heeft zijn antwoord in zijn eigen sectie.
const HELE_PAGINA_KOP = /^(De uitdaging|Bouw zelf)$/i;

/**
 * De koppen die een opdracht aankondigen en geen antwoord hebben. Een
 * genummerde opdracht heeft het antwoord in zijn eigen sectie; alleen een
 * hele-pagina-kop mag het in de secties erna hebben, tot de volgende
 * opdracht-kop. Anders zou het antwoord van een voorspelling verderop op
 * de pagina een ontbrekend antwoord maskeren.
 */
function zonderAntwoord(tekst: string): string[] {
  const alle = secties(tekst);
  const open: string[] = [];
  alle.forEach((s, i) => {
    if (!OPDRACHT_KOP.test(s.kop)) return;
    let einde = i + 1;
    if (HELE_PAGINA_KOP.test(s.kop)) {
      while (einde < alle.length && !OPDRACHT_KOP.test(alle[einde].kop)) einde += 1;
    }
    const inhoud = alle
      .slice(i, einde)
      .map((x) => x.inhoud)
      .join('\n');
    if (!/<summary>Antwoord<\/summary>/.test(inhoud)) open.push(s.kop);
  });
  return open;
}

describe('zonderAntwoord', () => {
  it('een antwoord van een voorspelling verderop telt niet voor een genummerde opdracht', () => {
    const pagina = `## Opdracht 1
Maak iets.

## Voorspel
<details>
<summary>Antwoord</summary>
Dit hoort bij de voorspelling.
</details>
`;
    expect(zonderAntwoord(pagina)).toEqual(['Opdracht 1']);
  });

  it('een hele-pagina-kop mag het antwoord onder "Bouw en test" hebben', () => {
    const pagina = `## De uitdaging
Bouw iets.

## Bouw en test
<details>
<summary>Antwoord</summary>
</details>

## Uitdaging (optioneel)
Zonder antwoord.
`;
    expect(zonderAntwoord(pagina)).toEqual(['Uitdaging (optioneel)']);
  });

  it('"Bouw zelf en test" van een bouwsteen heeft het antwoord in zijn eigen sectie', () => {
    const pagina = `## Bouw zelf en test
Vul de functie aan.

## Voorspel
<details>
<summary>Antwoord</summary>
</details>
`;
    expect(zonderAntwoord(pagina)).toEqual(['Bouw zelf en test']);
  });
});

describe('opdrachten en uitdagingen', () => {
  const gevonden = new Map<string, string[]>();
  for (const pad of lessen(DOCS)) {
    const open = zonderAntwoord(readFileSync(pad, 'utf8'));
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

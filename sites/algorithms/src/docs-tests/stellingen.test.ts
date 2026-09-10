import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// De regel van deze site (CLAUDE.md): elke stelling heeft een antwoord dat
// waar of niet waar is. "Waar — als je alleen die ene bestemming nodig hebt"
// of "Waar — in een niet-gerichte graph" is geen antwoord maar een
// herformulering die de leerling zelf had moeten krijgen; bij de doorloop van
// dijkstra stonden er twee. De stellingen die nog zo'n voorwaarde dragen
// staan exact in ACHTERSTAND, zodat een nieuwe meteen opvalt en een opgeloste
// hier weg moet.

const DOCS = fileURLToPath(new URL('../../docs/', import.meta.url));

const VOORWAARDE = /^\*\*(Waar|Niet waar|Juist|Onjuist) — (als|in|voor|niet voor|alleen)\b/;

const ACHTERSTAND = new Map<string, string[]>([
  ['big-o/02-stellingen.mdx', ['Stelling 1', 'Stelling 4']],
  ['minimax/03-stellingen.mdx', ['Stelling 4']],
]);

function stellingenPaginas(): string[] {
  return readdirSync(DOCS, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .flatMap((e) =>
      readdirSync(join(DOCS, e.name))
        .filter((n) => n.includes('stellingen'))
        .map((n) => `${e.name}/${n}`),
    )
    .sort();
}

/** Per stelling-kop de eerste regel van het antwoord. */
function antwoorden(tekst: string): { kop: string; eerste: string }[] {
  const uit: { kop: string; eerste: string }[] = [];
  let kop = '';
  const regels = tekst.split('\n');
  for (let i = 0; i < regels.length; i++) {
    const m = regels[i].match(/^## (.+)$/);
    if (m) kop = m[1].trim();
    // cfg en pagerank wikkelen het antwoord in "Waar of niet waar?".
    if (/<summary>(Antwoord|Waar of niet waar\?)<\/summary>/.test(regels[i])) {
      const eerste = regels.slice(i + 1).find((r) => r.trim() !== '') ?? '';
      uit.push({ kop, eerste: eerste.trim() });
    }
  }
  return uit;
}

describe('stellingen hebben een antwoord zonder voorwaarde', () => {
  const perPagina = new Map(
    stellingenPaginas().map((pagina) => [
      pagina,
      antwoorden(readFileSync(join(DOCS, pagina), 'utf8')),
    ]),
  );
  const metVoorwaarde = new Map<string, string[]>();
  for (const [pagina, lijst] of perPagina) {
    const koppen = lijst.filter((a) => VOORWAARDE.test(a.eerste)).map((a) => a.kop);
    if (koppen.length > 0) metVoorwaarde.set(pagina, koppen);
  }

  it('elke stellingen-pagina heeft antwoorden', () => {
    for (const [pagina, lijst] of perPagina) {
      expect(lijst.length, pagina).toBeGreaterThan(0);
    }
  });

  // Eén vergelijking dekt beide richtingen: een nieuwe "Waar — als …" is
  // een sleutel te veel, een opgeloste is een sleutel te weinig.
  it('de achterstand is exact', () => {
    expect(Object.fromEntries(metVoorwaarde)).toEqual(Object.fromEntries(ACHTERSTAND));
  });
});

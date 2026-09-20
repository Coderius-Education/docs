import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// Een hand-out die op één dubbelzijdig vel moet passen heeft een vaste opbouw
// (sites/algorithms/CLAUDE.md): <Handout compact>, de invultabel mét zijn
// uitleg in een handout-teltabel, de vragen in handout-vragen, de antwoorden
// achter een paginawissel of in een Antwoordblad, en de links de site op in
// handout-alleen-scherm. Bij de doorloop van Torens van Hanoi printte die
// hand-out op vier pagina's: de tabel los van zijn werkvorm, "Bespreek na"
// alleen op een blad, en de links op papier. Of het echt twee pagina's zijn
// meet alleen een browser (Playwright, zie CLAUDE.md); dit pint de opbouw
// vast waar dat van afhangt.

const UNPLUGGED = fileURLToPath(new URL('../../docs/unplugged/', import.meta.url));

type Regel = { nr: number; tekst: string; omhulsels: string[] };

/** Elke regel met de classNames van de divs en details eromheen. */
function regels(tekst: string): Regel[] {
  const stapel: string[] = [];
  return tekst.split('\n').map((regel, i) => {
    const open = regel.match(/^<(div|details)(?: className="([^"]*)")?/);
    const dicht = /^<\/(div|details)>/.test(regel);
    const uit = { nr: i + 1, tekst: regel, omhulsels: [...stapel] };
    if (open) stapel.push(open[2] ?? '');
    if (dicht) stapel.pop();
    return uit;
  });
}

function heeft(r: Regel, klasse: string): boolean {
  return r.omhulsels.some((c) => c.split(/\s+/).includes(klasse));
}

const compact = readdirSync(UNPLUGGED)
  .filter((n) => n.endsWith('.mdx'))
  .map((n) => ({ naam: n, tekst: readFileSync(join(UNPLUGGED, n), 'utf8') }))
  .filter((h) => h.tekst.includes('<Handout compact>'));

// Invultabellen die nog los staan, exact: de kaarten-hand-out past op zijn vel
// zonder de omhulling, dus die blijft zoals hij is tot iemand hem aanraakt.
const LOSSE_TABELLEN = new Map<string, number[]>([
  ['01-zoeken-en-sorteren-met-kaarten.mdx', [26, 60]],
]);

const ANTWOORD = ['handout-paginawissel', 'handout-alleen-scherm', 'handout-antwoorden'];

describe('compacte hand-outs volgen de opbouw voor één dubbelzijdig vel', () => {
  it('Torens van Hanoi is er een van', () => {
    expect(compact.map((h) => h.naam)).toContain('07-hanoi-op-tafel.mdx');
  });

  for (const { naam, tekst } of compact) {
    describe(naam, () => {
      const alle = regels(tekst);

      it('de links de site op staan in handout-alleen-scherm', () => {
        const kop = alle.find((r) => r.tekst.startsWith('## Verder op de site'));
        expect(kop, 'een kop "Verder op de site"').toBeDefined();
        expect(kop && heeft(kop, 'handout-alleen-scherm')).toBe(true);
      });

      it('elke invultabel staat in een handout-teltabel of handout-overzicht', () => {
        const los = alle.filter(
          (r) =>
            /^\|[\s:-]*---/.test(r.tekst) &&
            !heeft(r, 'handout-teltabel') &&
            !heeft(r, 'handout-overzicht') &&
            !ANTWOORD.some((k) => heeft(r, k)),
        );
        expect(los.map((r) => r.nr)).toEqual(LOSSE_TABELLEN.get(naam) ?? []);
      });

      it('de antwoorden staan niet zomaar tussen de werkvormen', () => {
        const kop = alle.find((r) => /^## Antwoorden/.test(r.tekst));
        const blad =
          /<Antwoordblad/.test(tekst) || /<details className="handout-alleen-scherm">/.test(tekst);
        expect(blad || (kop !== undefined && heeft(kop, 'handout-paginawissel'))).toBe(true);
      });
    });
  }

  it('bij Torens van Hanoi staan de vragen van werkvorm 2 en 3 in handout-vragen', () => {
    // Daar komt op papier de schrijfruimte per vraag vandaan; zonder die
    // omhulling staan de regels ____ strak op elkaar.
    const hanoi = compact.find((h) => h.naam === '07-hanoi-op-tafel.mdx');
    const alle = regels(hanoi?.tekst ?? '');
    for (const werkvorm of ['## Werkvorm 2', '## Werkvorm 3']) {
      const kop = alle.find((r) => r.tekst.startsWith(werkvorm));
      expect(kop && heeft(kop, 'handout-vragen'), werkvorm).toBe(true);
    }
    const tabel = alle.find((r) => r.tekst.startsWith('## Werkvorm 1'));
    expect(tabel && heeft(tabel, 'handout-teltabel'), 'werkvorm 1 mét zijn tabel').toBe(true);
  });
});

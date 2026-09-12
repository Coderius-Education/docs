import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// Elke bouwsteen van minimax eindigt met een blok asserts onder de startcode.
// Het blokken-script draait die startcode ongewijzigd en eist dat hij op een
// AssertionError omvalt — maar het kan niet weten of een góéde oplossing de
// tests wél haalt. Bij de doorloop bleek dat niet zo: Test 2 van bouwsteen 8
// eiste `min_value == 0` op een bord waar X twee dreigingen had, dus een
// leerling die het goed deed zag "O kan X blokkeren naar remise" als fout.
//
// Daarom hier: de complete code van de cheatsheet, gevolgd door het
// antwoord van de pagina zelf, gevolgd door de tests van de pagina. Dat moet
// "Alle tests gehaald ✓" printen. De cheatsheet is zo de maat voor elke
// bouwsteen, en het antwoord van elke pagina wordt echt gedraaid.

const DOCS = fileURLToPath(new URL('../../docs/minimax/', import.meta.url));

const BOUWSTENEN = [
  'bouwen/06-initial_state.mdx',
  'bouwen/07-player.mdx',
  'bouwen/08-actions.mdx',
  'bouwen/10-result.mdx',
  'bouwen/11-winner.mdx',
  'bouwen/12-terminal.mdx',
  'bouwen/13-utility.mdx',
  'bouwen/14-helpers.mdx',
];

function lees(naam: string): string {
  return readFileSync(`${DOCS}${naam}`, 'utf8');
}

/**
 * De inhoud van een JS-template-literal, met de ontsnappingen teruggedraaid
 * zoals de browser dat doet vóór Python de code ziet: \n, \t, \r, \\ en \`.
 * Andere ontsnappingen komen in de startcodes niet voor; komen ze er wel,
 * dan valt dit om in plaats van stil andere code te draaien.
 */
function ontsnap(code: string): string {
  const bekend: Record<string, string> = {
    n: '\n',
    t: '\t',
    r: '\r',
    '\\': '\\',
    '`': '`',
    $: '$',
  };
  return code.replace(/\\(.)/g, (heel, c: string) => {
    const uit = bekend[c];
    if (uit === undefined) throw new Error(`onbekende ontsnapping ${heel} in startcode`);
    return uit;
  });
}

/** Het codeblok in het `<details><summary>Antwoord</summary>` van de pagina. */
function antwoord(tekst: string): string | null {
  const m = tekst.match(/<summary>Antwoord<\/summary>\s*```python\n([\s\S]*?)```/);
  return m ? m[1] : null;
}

/** De laatste PyRunner van de pagina, ontsnapt: de startcode met de tests eronder. */
function startcode(tekst: string): string {
  const runners = [...tekst.matchAll(/<PyRunner initialCode=\{`([\s\S]*?)`\} \/>/g)];
  expect(runners.length, 'de pagina heeft een PyRunner met startcode').toBeGreaterThan(0);
  return ontsnap(runners[runners.length - 1][1]);
}

/** Alleen het testblok onder de startcode. */
function tests(tekst: string): string {
  const code = startcode(tekst);
  const i = code.indexOf('# === Tests ===');
  expect(i, 'de startcode heeft een blok # === Tests ===').toBeGreaterThan(-1);
  return code.slice(i);
}

function cheatsheet(): string {
  const m = lees('18-cheatsheet.mdx').match(
    /<summary>Alle .*? bij elkaar<\/summary>\s*```python\n([\s\S]*?)```/,
  );
  expect(m, 'de cheatsheet heeft een blok met de complete code').not.toBeNull();
  return m?.[1] ?? '';
}

function draai(code: string): { status: number | null; uit: string } {
  const r = spawnSync('python3', ['-'], { input: code, encoding: 'utf8', timeout: 60_000 });
  return { status: r.status, uit: `${r.stdout}${r.stderr}` };
}

describe('minimax — een goede oplossing haalt de tests van elke bouwsteen', () => {
  const compleet = cheatsheet();

  it('de cheatsheet zelf draait en definieert de tien functies', () => {
    // De positie van de pen-en-papier-pagina: de blokkade op (2,0). Vanaf
    // een leeg bord duurt de zoektocht seconden, en dat hoeft hier niet.
    const r = draai(`${compleet}\nprint(minimax([["X","X","O"],["O","O","X"],[None,None,None]]))`);
    expect(r.uit, r.uit).toContain('(2, 0)');
    expect(r.status).toBe(0);
    const defs = [...compleet.matchAll(/^def (\w+)\(/gm)].map((m) => m[1]);
    expect(defs).toEqual([
      'initial_state',
      'player',
      'actions',
      'result',
      'winner',
      'terminal',
      'utility',
      'max_value',
      'min_value',
      'minimax',
    ]);
  });

  for (const naam of BOUWSTENEN) {
    it(`${naam}: cheatsheet-code + antwoord van de pagina haalt de tests`, () => {
      const tekst = lees(naam);
      const eigen = antwoord(tekst);
      expect(eigen, 'de pagina heeft een Antwoord-blok met de functie').not.toBeNull();
      const r = draai(`${compleet}\n\n${eigen}\n\n${tests(tekst)}`);
      expect(r.uit, r.uit).toContain('Alle tests gehaald ✓');
      expect(r.status).toBe(0);
    });
  }

  it('bouwen/16-minimax.mdx: de lokale tests halen het met de cheatsheet-code', () => {
    const tekst = lees('bouwen/16-minimax.mdx');
    const m = tekst.match(/```python\n(# === Tests ===[\s\S]*?)```/);
    expect(m, 'de pagina heeft een testblok voor tictactoe.py').not.toBeNull();
    const r = draai(`${compleet}\n\n${m?.[1] ?? ''}`);
    expect(r.uit, r.uit).toContain('Alle tests gehaald ✓');
    expect(r.status).toBe(0);
  });

  it('de startcode van elke bouwsteen valt op zijn eigen tests om, niet op iets anders', () => {
    // Het blokken-script controleert dit ook; hier staat het naast de
    // positieve kant, zodat beide helften van "de tests kloppen" bij elkaar
    // staan.
    for (const naam of BOUWSTENEN) {
      const r = draai(startcode(lees(naam)));
      expect(r.uit, `${naam}: ${r.uit}`).toContain('AssertionError');
      expect(r.uit, `${naam} hoort nog niet te slagen`).not.toContain('Alle tests gehaald');
    }
  });
});

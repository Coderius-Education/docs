import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// Elke bouwsteen en opdracht van knapsack eindigt met een blok asserts onder
// de startcode. Het blokken-script draait die startcode ongewijzigd en eist
// een AssertionError, maar kan niet weten of het antwoord van de pagina de
// tests wél haalt. Hier: de startcode met daarachter het Antwoord-blok van
// de pagina (dat de stub overschrijft), en dat moet "Alle tests gehaald ✓"
// printen. Zo wordt elk antwoord echt gedraaid, en het bewijst meteen dat
// de tests een goede oplossing accepteren — bij minimax deden twee dat niet.

const DOCS = fileURLToPath(new URL('../../docs/knapsack/', import.meta.url));

const PAGINAS = [
  'bouwen/04-items.mdx',
  'bouwen/05-tabel-leeg.mdx',
  'bouwen/06-een-rij.mdx',
  'bouwen/07-volledige-tabel.mdx',
  '09-aanpassen.mdx',
  '10-zelf-bouwen.mdx',
];

function lees(naam: string): string {
  return readFileSync(`${DOCS}${naam}`, 'utf8');
}

/** De inhoud van een JS-template-literal, ontsnapt zoals de browser dat doet. */
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

/** De eerste PyRunner met een testblok: de startcode van de opdracht. */
function startcode(tekst: string): string {
  const runners = [...tekst.matchAll(/<PyRunner initialCode=\{`([\s\S]*?)`\} \/>/g)]
    .map((m) => ontsnap(m[1]))
    .filter((code) => code.includes('# === Tests ==='));
  expect(runners.length, 'de pagina heeft een startcode met een testblok').toBeGreaterThan(0);
  return runners[0];
}

/** Het eerste codeblok in een `<details><summary>Antwoord</summary>`. */
function antwoord(tekst: string): string {
  const m = tekst.match(/<summary>Antwoord<\/summary>\s*```python\n([\s\S]*?)```/);
  expect(m, 'de pagina heeft een Antwoord-blok met code').not.toBeNull();
  return m?.[1] ?? '';
}

function draai(code: string): { status: number | null; uit: string } {
  const r = spawnSync('python3', ['-'], { input: code, encoding: 'utf8', timeout: 60_000 });
  return { status: r.status, uit: `${r.stdout}${r.stderr}` };
}

describe('knapsack — het antwoord van elke pagina haalt de tests van die pagina', () => {
  for (const naam of PAGINAS) {
    it(`${naam}: startcode + Antwoord slaagt, startcode alleen faalt op een assert`, () => {
      const tekst = lees(naam);
      const start = startcode(tekst);
      const i = start.indexOf('# === Tests ===');
      // Het antwoord komt vóór de tests, zodat het de stub overschrijft en de
      // tests daarna de echte functie zien.
      const goed = draai(`${start.slice(0, i)}\n${antwoord(tekst)}\n${start.slice(i)}`);
      expect(goed.uit, goed.uit).toContain('Alle tests gehaald ✓');
      expect(goed.status).toBe(0);

      const kaal = draai(start);
      expect(kaal.uit, `${naam}: ${kaal.uit}`).toContain('AssertionError');
      expect(kaal.uit, `${naam} hoort zonder antwoord niet te slagen`).not.toContain(
        'Alle tests gehaald',
      );
    });
  }
});

describe('knapsack — wat de fouten-pagina beweert, gebeurt ook', () => {
  it('een i-lus vanaf 0 zet het laatste item in rij 0 en telt het twee keer', () => {
    // De pagina belooft: één item van waarde 10 en gewicht 1 in een rugzak
    // van 2 geeft 20. Eerder stond er "crashes diep in de logica", en dat
    // klopte niet.
    const r = draai(
      [
        'items = [(10, 1)]',
        'capaciteit = 2',
        'n = len(items)',
        'tabel = []',
        'for _ in range(n + 1):',
        '    tabel.append([0] * (capaciteit + 1))',
        'for i in range(n + 1):',
        '    waarde, gewicht = items[i - 1]',
        '    for w in range(capaciteit + 1):',
        '        if gewicht > w:',
        '            tabel[i][w] = tabel[i - 1][w]',
        '        else:',
        '            tabel[i][w] = max(tabel[i - 1][w], waarde + tabel[i - 1][w - gewicht])',
        'print(tabel[n][capaciteit], tabel[0])',
      ].join('\n'),
    );
    expect(r.uit.trim()).toBe('20 [0, 10, 10]');
  });
});

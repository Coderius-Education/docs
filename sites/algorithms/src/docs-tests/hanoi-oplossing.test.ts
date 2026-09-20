import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// Het blokken-script draait de startcode van elke bouwsteen en eist dat hij
// op zijn eigen test omvalt, maar het antwoord in het uitklapblok compileert
// het alleen. Hier draait elk antwoord tegen de tests van zijn pagina, zoals
// bij minimax. Daarnaast twee dingen uit de doorloop die geen script vangt
// zonder dat je het opschrijft: de uitdaging van zelf bouwen gaf in de
// opdracht al weg wat de leerling moest ontdekken (zet 2ⁿ⁻¹, "precies in het
// midden"), en stelling 5 zei het al eerder; en stelling 4 noemde `n == 0`
// voordat bouwsteen 2 de leerling laat kiezen tussen nul en één schijf.

const DOCS = fileURLToPath(new URL('../../docs/hanoi/', import.meta.url));

const BOUWSTENEN = [
  'bouwen/04-een-zet.mdx',
  'bouwen/05-basisgeval.mdx',
  'bouwen/06-recursie-stap.mdx',
  '08-aanpassen.mdx',
];

function lees(naam: string): string {
  return readFileSync(`${DOCS}${naam}`, 'utf8');
}

/** De inhoud van een JS-template-literal, met de ontsnappingen teruggedraaid. */
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

/** De laatste PyRunner van de pagina: de startcode met de tests eronder. */
function startcode(tekst: string): string {
  const runners = [...tekst.matchAll(/<PyRunner[^>]*initialCode=\{`([\s\S]*?)`\} \/>/g)];
  expect(runners.length, 'de pagina heeft een PyRunner met startcode').toBeGreaterThan(0);
  return ontsnap(runners[runners.length - 1][1]);
}

function tests(tekst: string): string {
  const code = startcode(tekst);
  const i = code.indexOf('# === Tests ===');
  expect(i, 'de startcode heeft een blok # === Tests ===').toBeGreaterThan(-1);
  return code.slice(i);
}

/** De codeblokken in de <details><summary>Antwoord</summary>-blokken, op volgorde. */
function antwoorden(tekst: string): string[] {
  return [...tekst.matchAll(/<summary>Antwoord<\/summary>\s*```python\n([\s\S]*?)```/g)].map(
    (m) => m[1],
  );
}

function draai(code: string): { status: number | null; uit: string } {
  const r = spawnSync('python3', ['-'], { input: code, encoding: 'utf8', timeout: 60_000 });
  return { status: r.status, uit: `${r.stdout}${r.stderr}` };
}

describe('hanoi — het antwoord van elke pagina haalt de tests van die pagina', () => {
  for (const naam of BOUWSTENEN) {
    it(`${naam}`, () => {
      const tekst = lees(naam);
      const [eigen] = antwoorden(tekst);
      expect(eigen, 'de pagina heeft een antwoord').toBeDefined();
      const r = draai(`${eigen}\n\n${tests(tekst)}`);
      expect(r.uit, r.uit).toMatch(/✓/);
      expect(r.status).toBe(0);
    });
  }

  it('09-zelf-bouwen.mdx: speel(n) uit het antwoord haalt de tests, met de hanoi uit de startcode', () => {
    const tekst = lees('09-zelf-bouwen.mdx');
    const start = startcode(tekst);
    const hanoi = start.slice(0, start.indexOf('def speel'));
    const [speel] = antwoorden(tekst);
    const r = draai(`${hanoi}\n${speel}\n\n${tests(tekst)}`);
    expect(r.uit, r.uit).toContain('✓');
    expect(r.status).toBe(0);
  });

  it('09-zelf-bouwen.mdx: het antwoord van de uitdaging legt de grootste schijf bij zet 2ⁿ⁻¹', () => {
    const tekst = lees('09-zelf-bouwen.mdx');
    const [, uitdaging] = antwoorden(tekst);
    expect(uitdaging, 'de uitdaging heeft een antwoord').toBeDefined();
    const r = draai(uitdaging);
    expect(r.status, r.uit).toBe(0);
    const regels = [...r.uit.matchAll(/^n=(\d+): zet (\d+) van de (\d+)$/gm)];
    expect(regels.length).toBe(5);
    for (const [, n, zet, totaal] of regels) {
      expect(Number(zet)).toBe(2 ** (Number(n) - 1));
      expect(Number(totaal)).toBe(2 ** Number(n) - 1);
    }
  });

  it('de startcode van elke pagina valt op zijn eigen tests om', () => {
    for (const naam of [...BOUWSTENEN, '09-zelf-bouwen.mdx']) {
      const r = draai(startcode(lees(naam)));
      expect(r.uit, `${naam}: ${r.uit}`).toContain('AssertionError');
      expect(r.uit, `${naam} hoort nog niet te slagen`).not.toMatch(/✓/);
    }
  });
});

describe('hanoi — de fouten-pagina laat zien wat de foute code echt doet', () => {
  // Fout 2 en 3 geven geen foutmelding maar een verkeerde lijst, en de pagina
  // noemt die lijst letterlijk. Hier wordt het fragment uit het FOUT-blok in
  // de functie gezet en voor 2 schijven gedraaid.
  const ROMP =
    'def hanoi(n, bron, doel, hulp):\n    if n == 0:\n        return []\n    zetten = []\n';
  const tekst = lees('10-fouten.mdx');
  const secties = tekst.split(/^## /m).slice(1);
  const stil = secties.filter((s) => /Geen foutmelding/.test(s));

  it('er zijn twee fouten zonder foutmelding', () => {
    expect(stil).toHaveLength(2);
  });

  for (const sectie of stil) {
    const kop = sectie.split('\n')[0];
    it(kop, () => {
      const fragment = sectie.match(/```python\n# FOUT[^\n]*\n([\s\S]*?)```/)?.[1] ?? '';
      expect(fragment).not.toBe('');
      const beloofd = sectie.match(/`(\[\[?[\s\S]*?\]\]?)`/)?.[1] ?? '';
      expect(beloofd, 'de sectie noemt de verkeerde lijst').not.toBe('');
      const romp = fragment
        .split('\n')
        .filter((r) => r.trim())
        .map((r) => `    ${r.replace(/\s+#.*$/, '')}`)
        .join('\n');
      const r = draai(`${ROMP}${romp}\n    return zetten\nprint(hanoi(2, "A", "C", "B"))`);
      expect(r.status, r.uit).toBe(0);
      expect(r.uit.trim().replace(/'/g, '"')).toBe(beloofd);
    });
  }
});

describe('hanoi — een latere ontdekking wordt niet eerder verklapt', () => {
  it('de uitdaging van zelf bouwen geeft in de opdracht niet weg bij welke zet de grootste schijf valt', () => {
    const tekst = lees('09-zelf-bouwen.mdx');
    const opdracht = tekst.slice(
      tekst.indexOf('## Uitdaging'),
      tekst.indexOf('<details', tekst.indexOf('## Uitdaging')),
    );
    expect(opdracht).not.toMatch(/2ⁿ⁻¹|midden/);
  });

  it('de stellingen verklappen die zet niet, en niet het basisgeval van bouwsteen 2', () => {
    const tekst = lees('03-stellingen.mdx');
    expect(tekst).not.toMatch(/midden|4ᵉ van de 7/);
    expect(tekst).not.toContain('n == 0');
  });
});

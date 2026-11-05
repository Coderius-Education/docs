import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { VERBORGEN } from '../components/PyRunner/verborgen';

// De route machine learning zet code uit een eerder project als verborgen
// code onder een latere runner: "die functie staat al klaar". Dat klopt
// alleen zolang de verborgen code hetzelfde doet als de les waar hij
// vandaan komt. Verandert de les, en de verborgen code niet, dan draait de
// leerling op de volgende pagina iets anders dan hij net schreef.

const DOCS = fileURLToPath(new URL('../../docs/', import.meta.url));

function les(pad: string): string {
  return readFileSync(`${DOCS}${pad}`, 'utf8');
}

/** De functie `naam` uit een stuk Python: de def-regel en alles wat inspringt. */
function functie(code: string, naam: string): string {
  const m = code.match(new RegExp(`^def ${naam}\\(.*\\n(?:(?: {4}.*)?\\n)*`, 'm'));
  if (!m) throw new Error(`def ${naam} niet gevonden`);
  return m[0].trimEnd();
}

/** De code van de eerste PyRunner van een les. */
function runner(tekst: string): string {
  const m = tekst.match(/initialCode=\{`([\s\S]*?)`\}/);
  if (!m) throw new Error('geen PyRunner');
  return m[1];
}

/** De Python-blokken van een les. */
function blokken(tekst: string): string[] {
  return [...tekst.matchAll(/```python\n([\s\S]*?)```/g)].map((m) => m[1]);
}

function python(code: string): string {
  const r = spawnSync('python3', ['-c', code], { encoding: 'utf8' });
  expect(r.status, r.stderr).toBe(0);
  return r.stdout.trim();
}

describe('verborgen code van de route machine learning', () => {
  it('knn: afstand en voorspel zijn het antwoord van "laat de buren stemmen"', () => {
    const antwoord = blokken(les('ml-afstand/02-k-buren.mdx')).find((b) =>
      b.includes('def voorspel(nieuw, voorbeelden, k)'),
    );
    expect(antwoord).toBeDefined();
    for (const naam of ['afstand', 'voorspel']) {
      expect(functie(VERBORGEN.knn, naam), naam).toBe(functie(antwoord as string, naam));
    }
  });

  it('doolhof-buren: buren is de functie uit "de buren van een vakje"', () => {
    const eerder = runner(les('ml-zoeken/01-buren.mdx'));
    expect(functie(VERBORGEN['doolhof-buren'], 'buren')).toBe(functie(eerder, 'buren'));
  });

  it('doolhof-buren: de kortste weg gebruikt hetzelfde doolhof als de buren', () => {
    const doolhof = (code: string) => code.match(/doolhof = \[[\s\S]*?\]/)?.[0];
    expect(doolhof(runner(les('ml-zoeken/02-kortste-weg.mdx')))).toBe(
      doolhof(runner(les('ml-zoeken/01-buren.mdx'))),
    );
  });

  it('nim-leren: na het leren speelt hij wat slim uit "Nim met een vaste strategie" speelt', () => {
    // Het spel staat verborgen; de regels moeten die van het vorige project
    // zijn (10 lucifers, pak 1 tot en met 3), anders vergelijkt de pagina
    // twee verschillende spellen.
    const slim = functie(runner(les('ml-spellen/01-nim-strategie.mdx')), 'slim');
    const leren = runner(les('ml-spellen/02-nim-leert.mdx')).replace(/^for stapel in[\s\S]*$/m, '');
    // Bij 5 en 9 verliest elke zet; daar zegt de pagina dat het toeval is.
    const vergelijk =
      'print([s for s in range(2, 11) if (s - 1) % 4 and beste_zet(score, s) != slim(s)])';
    const uit = python([VERBORGEN['nim-leren'], leren, slim, vergelijk].join('\n'));
    expect(uit).toBe('[]');
    expect(VERBORGEN['nim-leren']).toContain('stapel = 10');
    expect(VERBORGEN['nim-leren']).toContain('min(3, stapel)');
  });

  it('nim-leren: de getallen in de antwoorden van het onderzoek zijn die van de runner', () => {
    // De beloofde uitvoer van de runner controleert het blokken-script; deze
    // getallen staan in lopende tekst, en daar kijkt het script niet.
    const pagina = les('ml-spellen/02-nim-leert.mdx');
    const leren = runner(pagina).replace(/^for stapel in[\s\S]*$/m, '');
    const vraag =
      'print(score[(10, 1)], score[(10, 3)], score[(5, 1)], score[(5, 2)], score[(5, 3)])';
    const [tien1, tien3, vijf1, vijf2, vijf3] = python(
      [VERBORGEN['nim-leren'], leren, vraag].join('\n'),
    ).split(' ');
    expect(pagina).toContain(`\`score[(10, 1)]\` is ${tien1} en \`score[(10, 3)]\` is ${tien3}`);
    expect(pagina).toContain(`de scores zijn daar ${vijf1}, ${vijf2} en ${vijf3}`);
  });
});

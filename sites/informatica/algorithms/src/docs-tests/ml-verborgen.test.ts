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

/** De klasse `naam` uit een stuk Python: de class-regel en alles wat inspringt. */
function klasse(code: string, naam: string): string {
  const m = code.match(new RegExp(`^class ${naam}\\b.*\\n(?:(?: {4}.*)?\\n)*`, 'm'));
  if (!m) throw new Error(`class ${naam} niet gevonden`);
  return m[0].trimEnd();
}

/** Alle code van een les: de Python-blokken en de code van elke PyRunner. */
function alleCode(tekst: string): string[] {
  return [
    ...blokken(tekst),
    ...[...tekst.matchAll(/initialCode=\{`([\s\S]*?)`\}/g)].map((m) => `${m[1]}\n`),
  ];
}

/** Elke versie van functie of klasse `naam` op een les, van startcode tot antwoord. */
function versies(pad: string, naam: string): string[] {
  const zoek = naam[0] === naam[0].toUpperCase() ? klasse : functie;
  return alleCode(les(pad)).flatMap((code) => {
    try {
      return [zoek(`${code}\n`, naam)];
    } catch {
      return [];
    }
  });
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
    const antwoord = blokken(les('ml-afstand/02-k-buren/03-de-winnaar.mdx')).find((b) =>
      b.includes('def voorspel(nieuw, voorbeelden, k)'),
    );
    expect(antwoord).toBeDefined();
    for (const naam of ['afstand', 'voorspel']) {
      expect(functie(VERBORGEN.knn, naam), naam).toBe(functie(antwoord as string, naam));
    }
  });

  it('doolhof-buren: buren is de functie uit "de buren van een vakje"', () => {
    const eerder = runner(les('ml-zoeken/01-buren/03-muren.mdx'));
    expect(functie(VERBORGEN['doolhof-buren'], 'buren')).toBe(functie(eerder, 'buren'));
  });

  it('doolhof-buren: de kortste weg gebruikt hetzelfde doolhof als de buren', () => {
    const doolhof = (code: string) => code.match(/doolhof = \[[\s\S]*?\]/)?.[0];
    expect(doolhof(runner(les('ml-zoeken/02-kortste-weg/02-breedte-eerst.mdx')))).toBe(
      doolhof(runner(les('ml-zoeken/01-buren/03-muren.mdx'))),
    );
  });

  it('nim-leren: na het leren speelt hij wat slim uit "Nim met een vaste strategie" speelt', () => {
    // Het spel staat verborgen; de regels moeten die van het vorige project
    // zijn (10 lucifers, pak 1 tot en met 3), anders vergelijkt de pagina
    // twee verschillende spellen.
    const slim = functie(
      blokken(les('ml-spellen/01-nim-strategie/05-pakken-tot-en-met-4.mdx'))[0],
      'slim',
    );
    const leren = runner(les('ml-spellen/02-nim-leert/03-leren-uit-duizend-spellen.mdx')).replace(
      /^for stapel in[\s\S]*$/m,
      '',
    );
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
    const pagina = les('ml-spellen/02-nim-leert/03-leren-uit-duizend-spellen.mdx');
    const leren = runner(pagina).replace(/^for stapel in[\s\S]*$/m, '');
    const vraag =
      'print(score[(10, 1)], score[(10, 3)], score[(5, 1)], score[(5, 2)], score[(5, 3)])';
    const [tien1, tien3, vijf1, vijf2, vijf3] = python(
      [VERBORGEN['nim-leren'], leren, vraag].join('\n'),
    ).split(' ');
    expect(pagina).toContain(`\`score[(10, 1)]\` is ${tien1} en \`score[(10, 3)]\` is ${tien3}`);
    expect(pagina).toContain(`de scores zijn daar ${vijf1}, ${vijf2} en ${vijf3}`);
  });

  // Elke verborgen functie of klasse is een versie die op de les staat waar de
  // leerling hem schreef: de startcode of het antwoord.
  const BRON: [string, string, string][] = [
    ['metro', 'buren', 'ml-zoeken/03-op-weg-naar-degrees/01-een-netwerk.mdx'],
    ['metro-zoeken', 'buren', 'ml-zoeken/03-op-weg-naar-degrees/01-een-netwerk.mdx'],
    ['metro-zoeken', 'Knoop', 'ml-zoeken/03-op-weg-naar-degrees/02-een-knoop.mdx'],
    ['weer-herfst', 'kansen_morgen', 'ml-kans/03-op-weg-naar-pagerank/04-kansen-mengen.mdx'],
    ['neuron', 'neuron', 'ml-neuronen/01-neuron/03-ja-of-nee.mdx'],
    ['neuron-laag', 'neuron', 'ml-neuronen/01-neuron/03-ja-of-nee.mdx'],
    ['neuron-laag', 'laag', 'ml-neuronen/03-op-weg-naar-traffic/02-een-laag.mdx'],
    ['tekens-leren', 'naar_getallen', 'ml-neuronen/03-op-weg-naar-traffic/01-een-plaatje.mdx'],
    ['tekens-leren', 'leer', 'ml-neuronen/02-neuron-leert/06-een-functie-leer.mdx'],
    ['tekens-leren', 'som_van', 'ml-neuronen/03-op-weg-naar-traffic/04-de-grootste-wint.mdx'],
    ['tekens-leren', 'herken', 'ml-neuronen/03-op-weg-naar-traffic/04-de-grootste-wint.mdx'],
    ['tekens-leren', 'lees_tekens', 'ml-neuronen/03-op-weg-naar-traffic/05-de-tekens-inlezen.mdx'],
    [
      'tekens-toetsen',
      'leer_netwerk',
      'ml-neuronen/03-op-weg-naar-traffic/06-de-uitgangen-leren.mdx',
    ],
    ['muis-leert', 'Muis', 'ml-spellen/03-op-weg-naar-nim/06-ontdekken.mdx'],
  ];
  for (const [naam, def, pad] of BRON) {
    it(`${naam}: ${def} staat zo op ${pad.split('/').at(-1)}`, () => {
      const zoek = def[0] === def[0].toUpperCase() ? klasse : functie;
      expect(versies(pad, def)).toContain(zoek(VERBORGEN[naam], def));
    });
  }

  it('metro-zoeken: elke methode van Wachtrij staat zo op "een wachtrij als klasse"', () => {
    // De les bouwt de klasse in twee editors op: haal_eruit en is_leeg in het
    // onderzoek, bevat in de opdracht. De verborgen code heeft ze allemaal.
    const methode = (code: string, naam: string) =>
      code.match(new RegExp(`^    def ${naam}\\(.*\\n(?:(?: {8}.*)?\\n)*`, 'm'))?.[0].trimEnd();
    const pagina = alleCode(les('ml-zoeken/03-op-weg-naar-degrees/03-een-wachtrij-als-klasse.mdx'));
    const wachtrij = klasse(VERBORGEN['metro-zoeken'], 'Wachtrij');
    const namen = [...wachtrij.matchAll(/^ {4}def (\w+)\(/gm)].map((m) => m[1]);
    expect(namen).toEqual(['__init__', 'voeg_toe', 'haal_eruit', 'is_leeg', 'bevat']);
    for (const naam of namen) {
      const opDeLes = pagina.map((code) => methode(`${code}\n`, naam)).filter(Boolean);
      expect(opDeLes, naam).toContain(methode(`${wachtrij}\n`, naam));
    }
  });

  it('een verborgen stuk dat op een ander voortbouwt, heeft diens functies letterlijk', () => {
    const delen: [string, string][] = [
      ['tekens-toetsen', 'tekens-leren'],
      ['muis-leert', 'muis-gang'],
      ['metro-zoeken', 'metro'],
      ['fruit-toets', 'knn'],
    ];
    for (const [groot, klein] of delen) {
      for (const [, def] of VERBORGEN[klein].matchAll(/^def (\w+)\(/gm)) {
        expect(functie(VERBORGEN[groot], def), `${groot}: ${def}`).toBe(
          functie(VERBORGEN[klein], def),
        );
      }
    }
  });

  it('weer-herfst: de kansen die de laatste stap belooft, rekent de verborgen code uit', () => {
    const uit = python(
      `${VERBORGEN['weer-herfst']}\nk = berekend()\nprint(round(k["zon"], 3), round(k["wolken"], 3), round(k["regen"], 3))`,
    );
    expect(uit).toBe('0.277 0.378 0.345');
  });

  it('fruit-toets: het fruit is dat van "Zo test je niet"', () => {
    // De runners van eerlijk testen zetten het fruit in de verborgen code,
    // zodat de code die de leerling aanpast bovenaan de editor staat. De
    // leerling ziet het fruit één keer, in "Zo test je niet"; de seed en de
    // antwoorden hangen aan precies die lijst in precies die volgorde.
    const zoTestJeNiet = runner(les('ml-afstand/03-eerlijk-testen/01-oefenen-en-toetsen.mdx'));
    const fruit = (code: string) => code.match(/^fruit = \[[\s\S]*?^\]/m)?.[0];
    expect(fruit(zoTestJeNiet)).toBeDefined();
    expect(python(`${VERBORGEN['fruit-toets']}\nprint(fruit)`)).toBe(
      python(`${fruit(zoTestJeNiet)}\nprint(fruit)`),
    );
  });

  it('spam-tellingen: de tellingen zijn wat "twee tellingen" uitrekent', () => {
    // Bij de score en wat telt het zwaarst staan de tellingen in de verborgen
    // code; ze moeten zijn wat de leerling in de stap ervoor zelf telde.
    const antwoord = blokken(les('ml-regels/03-spamfilter-leert/02-twee-tellingen.mdx')).find((b) =>
      b.includes('gewoon = {}'),
    );
    expect(antwoord).toBeDefined();
    expect(python(`${VERBORGEN['spam-tellingen']}\nprint(spam)\nprint(gewoon)`)).toBe(
      python(antwoord as string),
    );
  });
});

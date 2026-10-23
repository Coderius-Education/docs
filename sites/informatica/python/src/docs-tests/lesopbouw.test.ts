import { spawnSync } from 'node:child_process';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { lessen } from '../data/lessen';

// Wat elke les volgens het didactisch kader heeft, en wat een doorloop als
// leerling in hoofdstuk 1 miste (oktober 2026):
//
// - Een voorspelvraag (<Voorspel>) vóór de opdrachten, de P van PRIMM. In de
//   hele cursus hadden 2 van de 52 lessen er een; de rest ging van uitleg
//   meteen naar "Schrijf hier je code".
// - Een sectie "## Er gaat iets mis" met de fouten die je in die les maakt.
//   Juist de eerste lessen hadden er geen.
// - "In de volgende les …" wijst naar de les die echt volgt. Toen 3b werd
//   tussengevoegd, beloofde les 3 nog f-strings in de volgende les, en 6b
//   beloofde de while-loop terwijl eerst continue en break kwamen.
//
// De lessen die nog niet zijn doorgelopen staan als exacte achterstand in de
// lijsten hieronder: een les die bijgewerkt is, hoort eruit.

const DOCS = fileURLToPath(new URL('../../docs', import.meta.url));

function alleBestanden(map: string): string[] {
  return readdirSync(map).flatMap((naam) => {
    const pad = join(map, naam);
    return statSync(pad).isDirectory() ? alleBestanden(pad) : /\.mdx?$/.test(naam) ? [pad] : [];
  });
}

const bestanden = alleBestanden(DOCS);
/** Het lesbestand bij een id uit lessen.ts: '03b' → …/03b-tekst-naar-getal.mdx. */
const bestandVan = (id: string) =>
  bestanden.find((pad) => pad.split(/[\\/]/).at(-1)?.startsWith(`${id}-`));

const metCode = lessen
  .map((les) => ({ ...les, bestand: bestandVan(les.id) }))
  .filter((les): les is typeof les & { bestand: string } => les.bestand !== undefined)
  .map((les) => ({ ...les, tekst: readFileSync(les.bestand, 'utf8') }))
  .filter((les) => /```python|<CodeExercise/.test(les.tekst));

const ACHTERSTAND_VOORSPEL = [
  '04a',
  '04b',
  '05a',
  '05b',
  '05c',
  '06a',
  '06b',
  '06c',
  '06d',
  '07',
  '08',
  '09a',
  '09b',
  '09c',
  '09d',
  '09e',
  '09f',
  '10a',
  '10b',
  '11a',
  '11b',
  '11c',
  '12',
  '13',
  '14a',
  '14b',
  '14c',
  '14d',
  '14e',
  '14f',
  '15a',
  '15b',
  '15c',
  '15d',
  '15e',
  '15f',
  '15g',
  '15h',
  '15i',
  '15j',
  '15k',
  '16a',
  '16b',
  '16c',
  '16d',
  '16e',
  '16f',
];

const ACHTERSTAND_FOUTEN = [
  '04a',
  '04b',
  '05a',
  '05b',
  '05c',
  '06a',
  '06b',
  '06c',
  '07',
  '08',
  '09a',
  '09b',
  '10a',
  '10b',
  '11a',
  '11b',
  '12',
  '13',
  '16b',
  '16c',
  '16d',
  '16f',
];

/** Alles vóór de eerste opdracht: daar hoort een voorspelvraag te staan. */
const voorDeOpdrachten = (tekst: string) => tekst.split(/^#{2,3} Opdracht/m)[0];

describe('elke les heeft wat het kader vraagt', () => {
  it('vindt de lessen', () => {
    expect(metCode.length).toBeGreaterThan(40);
  });

  it('een <Voorspel> vóór de opdrachten, op de achterstand na', () => {
    const zonder = metCode
      .filter((les) => !voorDeOpdrachten(les.tekst).includes('<Voorspel'))
      .map((les) => les.id);
    expect(zonder).toEqual(ACHTERSTAND_VOORSPEL);
  });

  it('een sectie "## Er gaat iets mis", op de achterstand na', () => {
    const zonder = metCode
      .filter((les) => !/^## Er gaat iets mis/m.test(les.tekst))
      .map((les) => les.id);
    expect(zonder).toEqual(ACHTERSTAND_FOUTEN);
  });
});

describe('"volgende les" wijst naar de les die echt volgt', () => {
  it('elke "volgende les" is een link naar de volgende les in lessen.ts', () => {
    const fout: string[] = [];
    lessen.forEach((les, i) => {
      const bestand = bestandVan(les.id);
      if (!bestand) return;
      const tekst = readFileSync(bestand, 'utf8');
      const volgende = lessen[i + 1];
      for (const m of tekst.matchAll(/volgende les(?!sen)/gi)) {
        const ervoor = tekst[m.index - 1];
        const erna = tekst.slice(m.index + m[0].length);
        const doel = erna.match(/^\]\(site:python([^)#]+)/)?.[1];
        if (ervoor !== '[' || !volgende || doel !== volgende.pad) {
          fout.push(
            `${les.id}: "volgende les" wijst naar ${doel ?? 'niets'}, de volgende les is ${volgende?.pad}`,
          );
        }
      }
    });
    expect(fout).toEqual([]);
  });
});

describe('invoer en operatoren', () => {
  it('een programma met input() draait in CI met {/* invoer: … */}, niet met niet-draaien', () => {
    // Met niet-draaien liep niemand de beloofde uitvoer na. In 3b.3 beloofde
    // de les één regel, terwijl de speeltuin ook de vraag met het antwoord
    // toont.
    const met = bestanden.filter((pad) =>
      /\{\/\*\s*niet-draaien:[^*]*invoer/.test(readFileSync(pad, 'utf8')),
    );
    expect(met).toEqual([]);
  });

  it('// en % worden pas gebruikt na De rekenmachine, waar ze uitgelegd worden', () => {
    // Les 12 (Tuples) gebruikte getal // deler en getal % deler, en geen les
    // legde ze uit.
    const operator = (tekst: string) =>
      [...tekst.matchAll(/```python[^\n]*\n([\s\S]*?)```|<CodeExercise>\{`([\s\S]*?)`\}/g)]
        .map((m) => m[1] ?? m[2])
        .map((code) =>
          code.replace(/#.*$/gm, '').replace(/f?"(?:[^"\\\n]|\\.)*"|f?'(?:[^'\\\n]|\\.)*'/g, '""'),
        )
        .some((code) => /\/\/|%/.test(code));
    const eerste = metCode.find((les) => operator(les.tekst));
    expect(eerste?.id).toBe('03');
    expect(metCode.find((les) => les.id === '03')?.tekst).toMatch(/## Delen met rest/);
  });
});

// Het goede antwoord van een voorspelvraag is een belofte over Python, net als
// een uitvoerblok; het blokken-script ziet hem niet, want de vraag staat tussen
// de code en het antwoord. Deze test draait het blok direct boven elke
// <Voorspel> en eist dat precies de goede keuze klopt.
describe('het goede antwoord van elke voorspelvraag', () => {
  const vragen = metCode.flatMap((les) =>
    [
      ...les.tekst.matchAll(
        /```python\n((?:(?!```)[\s\S])*?)```\s*<Voorspel vraag="([^"]*)"[^>]*>([\s\S]*?)<\/Voorspel>/g,
      ),
    ].map((m) => ({ les: les.id, code: m[1], vraag: m[2], binnen: m[3] })),
  );

  it('elke voorspelvraag staat direct onder het blok dat hij bevraagt', () => {
    const totaal = metCode.reduce(
      (n, les) => n + (les.tekst.match(/<Voorspel\b/g)?.length ?? 0),
      0,
    );
    expect(vragen.length).toBe(totaal);
    expect(vragen.length).toBeGreaterThan(0);
  });

  it.each(vragen.map((v) => [`${v.les}: ${v.vraag}`, v] as const))('%s', (_naam, v) => {
    const keuzes = [...v.binnen.matchAll(/<Keuze( goed)?[^>]*>([\s\S]*?)<\/Keuze>/g)].map((k) => ({
      goed: Boolean(k[1]),
      tekst: k[2].trim(),
    }));
    // "Je typt 15." in de vraag is wat input() krijgt.
    const invoer = v.vraag.match(/[Jj]e typt (\S+?)[.?]/)?.[1] ?? '';
    const r = spawnSync('python3', ['-c', v.code], { input: `${invoer}\n`, encoding: 'utf8' });
    const uitvoer = r.stdout.trim();
    const klopt = (tekst: string) => {
      if (/foutmelding/i.test(tekst)) return r.status !== 0;
      const waarde = tekst.match(/`([^`]*)`/)?.[1];
      if (waarde === undefined) throw new Error(`keuze "${tekst}" noemt geen waarde in backticks`);
      return r.status === 0 && uitvoer === waarde;
    };
    expect(keuzes.filter((k) => klopt(k.tekst)).map((k) => k.tekst)).toEqual(
      keuzes.filter((k) => k.goed).map((k) => k.tekst),
    );
  });
});

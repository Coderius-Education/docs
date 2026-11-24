import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
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
// Sinds de doorloop van alle hoofdstukken heeft elke les ze; een nieuwe les
// zonder valt om.

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

/** Alles vóór de eerste opdracht: daar hoort een voorspelvraag te staan. */
const voorDeOpdrachten = (tekst: string) => tekst.split(/^#{2,3} Opdracht/m)[0];

describe('elke les heeft wat het kader vraagt', () => {
  it('vindt de lessen', () => {
    expect(metCode.length).toBeGreaterThan(40);
  });

  it('een <Voorspel> vóór de opdrachten', () => {
    const zonder = metCode
      .filter((les) => !voorDeOpdrachten(les.tekst).includes('<Voorspel'))
      .map((les) => les.id);
    expect(zonder).toEqual([]);
  });

  it('een sectie "## Er gaat iets mis"', () => {
    const zonder = metCode
      .filter((les) => !/^## Er gaat iets mis/m.test(les.tekst))
      .map((les) => les.id);
    expect(zonder).toEqual([]);
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

// Wat een doorloop als leerling van de lessen in stappen vond (november
// 2026): code die een les gebruikt voordat een les hem uitlegt. 10a gebruikte
// `[]`, dat pas in een oplossing van 10b stond; 5c noemde `or` en `not` maar
// toonde ze nergens werkend; 11c rondde af met `:.1f` zonder uitleg; en les
// 12 ging uit van `lijst[i] = …`, dat geen les liet zien. Per constructie de
// les die hem uitlegt: daar staat hij voor het eerst in code, en de tekst van
// die les noemt hem.
const UITGELEGD: { wat: string; code: RegExp; les: string; tekst: RegExp; strings?: boolean }[] = [
  { wat: 'een lege lijst', code: /=\s*\[\]/, les: '10b', tekst: /`\[\]`/ },
  { wat: 'or', code: /\bor\b/, les: '05c', tekst: /`or`/ },
  { wat: 'not', code: /\bnot\b/, les: '05c', tekst: /`not`/ },
  { wat: 'afronden in een f-string', code: /:\.\d+f/, les: '11c', tekst: /`:\.1f`/, strings: true },
  {
    wat: 'een element vervangen',
    code: /\w\[[^\]\n]+\]\s*=[^=]/,
    les: '10a',
    tekst: /`team\[1\] = /,
  },
];

/** De code van een les, zonder commentaar en (tenzij gevraagd) zonder tekst tussen aanhalingstekens. */
function codeVan(tekst: string, strings = false) {
  return [
    ...tekst.matchAll(
      /```python[^\n]*\n([\s\S]*?)```|<CodeExercise[^>]*>\{`([\s\S]*?)`\}|code=\{`([\s\S]*?)`\}/g,
    ),
  ].map((m) =>
    (m[1] ?? m[2] ?? m[3])
      .replace(/#.*$/gm, '')
      .replace(/f?"(?:[^"\\\n]|\\.)*"|f?'(?:[^'\\\n]|\\.)*'/g, (s) => (strings ? s : '""')),
  );
}

describe('code staat pas in een les als hij is uitgelegd', () => {
  it.each(UITGELEGD)('$wat: voor het eerst in les $les, en die les noemt hem', (regel) => {
    const eerste = metCode.find((les) =>
      codeVan(les.tekst, regel.strings).some((code) => regel.code.test(code)),
    );
    expect(eerste?.id).toBe(regel.les);
    expect(eerste?.tekst).toMatch(regel.tekst);
  });
});

// Het goede antwoord van een voorspelvraag is een belofte over Python, net als
// een uitvoerblok; het blokken-script ziet hem niet, want de vraag staat tussen
// de code en het antwoord. Deze test draait het blok direct boven elke
// <Voorspel> en eist dat precies de goede keuze klopt.
/**
 * De modules die een les tot dan toe als eigen bestand liet zien: een blok met
 * de kop **`rekenen.py`** erboven. Staat dezelfde naam er twee keer, dan telt
 * de laatste versie, net als wanneer de leerling het bestand overschrijft.
 * main.py is het programma zelf en hoort niet in de map.
 */
function bestandenVoor(tekst: string): Map<string, string> {
  const bestanden = new Map<string, string>();
  for (const m of tekst.matchAll(
    /^\*\*`(\w+\.py)`\*\*\s*\n(?:\s*\{\/\*[\s\S]*?\*\/\}\s*\n)*\s*```python[^\n]*\n([\s\S]*?)```/gm,
  )) {
    if (m[1] !== 'main.py') bestanden.set(m[1], m[2]);
  }
  return bestanden;
}

describe('het goede antwoord van elke voorspelvraag', () => {
  const vragen = metCode.flatMap((les) =>
    [
      ...les.tekst.matchAll(
        /```python[^\n]*\n((?:(?!```)[\s\S])*?)```\s*<Voorspel vraag="([^"]*)"[^>]*>([\s\S]*?)<\/Voorspel>/g,
      ),
    ].map((m) => ({
      les: les.id,
      code: m[1],
      vraag: m[2],
      binnen: m[3],
      bestanden: bestandenVoor(les.tekst.slice(0, m.index)),
    })),
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
    // Het programma draait in een lege map met de modules van de les erin,
    // zoals "twee bestanden in dezelfde map" in Je eigen module.
    const map = mkdtempSync(join(tmpdir(), 'voorspel-'));
    for (const [naam, code] of v.bestanden) writeFileSync(join(map, naam), code);
    const r = spawnSync('python3', ['-c', v.code], {
      cwd: map,
      input: `${invoer}\n`,
      encoding: 'utf8',
    });
    rmSync(map, { recursive: true, force: true });
    const regels = r.stdout.trim() === '' ? [] : r.stdout.trim().split('\n');
    // Een keuze noemt de uitvoer als waarden in backticks, één per regel:
    // "`0`, `1` en `2`" is drie regels. "Niets" is geen uitvoer, "Een
    // foutmelding" een programma dat omvalt.
    const klopt = (tekst: string) => {
      if (/foutmelding/i.test(tekst)) return r.status !== 0;
      if (/^niets\b/i.test(tekst)) return r.status === 0 && regels.length === 0;
      const waarden = [...tekst.matchAll(/`([^`]*)`/g)].map((w) => w[1]);
      if (waarden.length === 0) throw new Error(`keuze "${tekst}" noemt geen waarde in backticks`);
      return r.status === 0 && JSON.stringify(regels) === JSON.stringify(waarden);
    };
    expect(keuzes.filter((k) => klopt(k.tekst)).map((k) => k.tekst)).toEqual(
      keuzes.filter((k) => k.goed).map((k) => k.tekst),
    );
  });
});

import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// De hand-out "Een grammatica op papier" doet dezelfde tien zinnen als de
// bouwstenen op de site, met achter elk woord zijn woordsoort, zodat een
// leerling niets hoeft op te zoeken. Dat houdt alleen stand als papier en
// site aan elkaar vast zitten: dezelfde zin in dezelfde bouwsteen, elke
// woordsoort precies zoals het lexicon in de parser hem kent, en een
// antwoordgrammatica die de parser van de site ook echt op groen zet. Bij
// een verzonnen mini-grammatica kon niets uit de pas lopen; nu wel, dus dit
// is de guard.

const DOCS = fileURLToPath(new URL('../../docs/', import.meta.url));
const lees = (naam: string) => readFileSync(`${DOCS}${naam}`, 'utf8');

const HANDOUT = lees('unplugged/06-zinnen-bouwen-met-kaartjes.mdx');
const BOUWSTENEN = [
  'cfg/bouwen/03-simpele-zin.mdx',
  'cfg/bouwen/04-lijdend-voorwerp.mdx',
  'cfg/bouwen/05-bijvoeglijk-nw.mdx',
  'cfg/bouwen/06-bijwoord-en-nevenschikking.mdx',
  'cfg/bouwen/07-voorzetselgroep.mdx',
  'cfg/bouwen/08-pp-en-zinnen-koppelen.mdx',
  'cfg/bouwen/09-past-al.mdx',
  'cfg/bouwen/10-bijwoord-vooraan.mdx',
  'cfg/bouwen/11-past-al-2.mdx',
  'cfg/bouwen/12-recursie.mdx',
];
const WOORDSOORTEN = ['N', 'V', 'Det', 'Adj', 'Adv', 'Conj', 'P'];

/** De genummerde, vette zinnen onder "## De zinnen" op de hand-out. */
function handoutZinnen(): string[] {
  const na = HANDOUT.slice(HANDOUT.indexOf('## De zinnen'));
  return [...na.matchAll(/^\d+\. \*\*(.+?)\*\*$/gm)].map((m) => m[1]);
}

/** De zin in het citaat bovenaan een bouwsteen: `> **Holmes (N) sat (V).**` */
function bouwsteenZin(naam: string): string {
  const m = lees(naam).match(/^> \*\*(.+?)\*\*$/m);
  if (!m) throw new Error(`geen zin-citaat in ${naam}`);
  return m[1];
}

/** Woord plus woordsoort, overal op de hand-out: `Holmes (N)`. */
function getagdeWoorden(tekst: string): Array<[string, string]> {
  const soorten = WOORDSOORTEN.join('|');
  return [...tekst.matchAll(new RegExp(`\\b([A-Za-z]+)\\*{0,2} \\((${soorten})\\)`, 'g'))].map(
    (m) => [m[1].toLowerCase(), m[2]],
  );
}

/** Het lexicon zoals de parser-motor het in de eerste bouwsteen meekrijgt. */
function lexicon(): Map<string, string> {
  const bron = lees('cfg/bouwen/03-simpele-zin.mdx');
  const blok = bron.match(/LEXICON = """([\s\S]*?)"""/);
  if (!blok) throw new Error('geen LEXICON in de eerste bouwsteen');
  const soortPerWoord = new Map<string, string>();
  for (const regel of blok[1].split('\n')) {
    const m = regel.match(/^(\w+) -> (.+)$/);
    if (!m) continue;
    for (const woord of m[2].matchAll(/"([^"]+)"/g)) soortPerWoord.set(woord[1], m[1]);
  }
  return soortPerWoord;
}

function kaalWoorden(zin: string): string[] {
  return zin
    .replace(/\([^)]*\)/g, '')
    .replace(/[.]/g, '')
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);
}

describe('de kaartjes-hand-out doet dezelfde zinnen als de site', () => {
  const zinnen = handoutZinnen();

  it('tien zinnen, letterlijk de citaten van bouwsteen 1 tot en met 10', () => {
    expect(zinnen).toHaveLength(10);
    expect(zinnen).toEqual(BOUWSTENEN.map(bouwsteenZin));
  });

  it('elke woordsoort op de hand-out is die uit het lexicon van de parser', () => {
    const soortPerWoord = lexicon();
    const scheef = getagdeWoorden(HANDOUT)
      .filter(([woord, soort]) => soortPerWoord.get(woord) !== soort)
      .map(([woord, soort]) => `${woord} (${soort}), lexicon zegt ${soortPerWoord.get(woord)}`);
    expect(scheef).toEqual([]);
  });

  it('elk woord van de zinnen draagt zijn woordsoort', () => {
    // Anders moet een leerling toch iets opzoeken. Getagd: `woord (Soort)`.
    const kaal = zinnen.flatMap(kaalWoorden).length;
    const getagd = zinnen.flatMap((z) => getagdeWoorden(z)).length;
    expect(getagd).toBe(kaal);
  });
});

/** De parser-motor uit de compleet-pagina, met de grammatica ervoor. */
function parserCode(grammatica: string): string {
  const bron = lees('cfg/13-compleet.mdx');
  const start = bron.indexOf('LEXICON = """');
  const einde = bron.indexOf('def toon_boom');
  const motor = bron.slice(start, einde).replace(/\\\\n/g, '\\n');
  return `GRAMMATICA = """\n${grammatica}\n"""\n${motor}\n`;
}

function draai(code: string): string {
  const r = spawnSync('python3', ['-'], { input: code, encoding: 'utf8', timeout: 60_000 });
  if (r.status !== 0) throw new Error(r.stderr);
  return r.stdout;
}

describe('de antwoordgrammatica van de hand-out werkt in de parser van de site', () => {
  const antwoorden = HANDOUT.slice(HANDOUT.indexOf('## Antwoorden'));
  const blok = antwoorden.match(/```\n([\s\S]*?)```/);
  if (!blok) throw new Error('geen grammatica-blok onder Antwoorden');
  // De toelichting "(zin 1)" achter elke regel is voor de lezer; de parser
  // leest tot een #, dus hier wordt hij een commentaar.
  const grammatica = blok[1].replace(/\((zin \d+)\)/g, '# $1');

  it('bouwt de tien zinnen van de hand-out', () => {
    const code = `${parserCode(grammatica)}
grammatica = lees_grammatica(GRAMMATICA + LEXICON)
for zin in ${JSON.stringify(handoutZinnen().map((z) => kaalWoorden(z).join(' ')))}:
    print("OK" if parse(grammatica, zin.split()) else "FOUT", zin)
`;
    const uitvoer = draai(code).trim().split('\n');
    expect(uitvoer).toHaveLength(10);
    expect(uitvoer.filter((r) => !r.startsWith('OK'))).toEqual([]);
  });

  it('keurt de rijtjes van "Keur de zinnen" zoals het antwoordblad zegt', () => {
    const werkvorm = HANDOUT.slice(
      HANDOUT.indexOf('## Keur de zinnen'),
      HANDOUT.indexOf('## Bespreek na'),
    );
    const rijtjes = [...werkvorm.matchAll(/^\d+\. (.+?): ____$/gm)].map((m) =>
      kaalWoorden(m[1]).join(' '),
    );
    const oordelen = [
      ...antwoorden
        .slice(antwoorden.indexOf('**Keur de zinnen.**'))
        .matchAll(/^\d+\. (goed|fout)/gm),
    ].map((m) => m[1]);
    expect(rijtjes).toHaveLength(4);
    expect(oordelen).toHaveLength(4);

    const code = `${parserCode(grammatica)}
grammatica = lees_grammatica(GRAMMATICA + LEXICON)
for zin in ${JSON.stringify(rijtjes)}:
    print("goed" if parse(grammatica, zin.split()) else "fout")
`;
    expect(draai(code).trim().split('\n')).toEqual(oordelen);
  });
});

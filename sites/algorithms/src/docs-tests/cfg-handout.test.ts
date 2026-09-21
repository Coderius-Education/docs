import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import cfgParser from '../components/PyRunner/verborgen/cfg-parser';

// De hand-out "Een grammatica op papier" doet dezelfde tien zinnen als de
// bouwstenen op de site, met achter elk woord zijn woordsoort, zodat een
// leerling niets hoeft op te zoeken. Dat houdt alleen stand als papier en
// site aan elkaar vast zitten: dezelfde zin in dezelfde bouwsteen, elke
// woordsoort precies zoals het lexicon in de parser hem kent, en een
// antwoordgrammatica die de parser van de site ook echt op groen zet. Na
// elke zin staat schrijfruimte voor de grammatica tot dan toe; het aantal
// lijntjes hoort mee te groeien met de antwoordgrammatica. Bij
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

/** De vette zinnen onder "## De zinnen" op de hand-out: `**Zin 3.** **…**`. */
function handoutZinnen(): string[] {
  const na = HANDOUT.slice(HANDOUT.indexOf('## De zinnen'));
  return [...na.matchAll(/^\*\*Zin \d+\.\*\* \*\*(.+?)\*\*$/gm)].map((m) => m[1]);
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

/** Het lexicon zoals de parser-motor (de verborgen code van elke cfg-runner) het meekrijgt. */
function lexicon(): Map<string, string> {
  const blok = cfgParser.match(/LEXICON = """([\s\S]*?)"""/);
  if (!blok) throw new Error('geen LEXICON in de parser-motor');
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

/** De parser-motor (de verborgen code van elke cfg-runner), met de grammatica ervoor. */
function parserCode(grammatica: string): string {
  return `GRAMMATICA = """\n${grammatica}\n"""\n${cfgParser}\n`;
}

function draai(code: string): string {
  const r = spawnSync('python3', ['-'], { input: code, encoding: 'utf8', timeout: 60_000 });
  if (r.status !== 0) throw new Error(r.stderr);
  return r.stdout;
}

describe('de antwoordgrammatica van de hand-out werkt in de parser van de site', () => {
  const antwoorden = HANDOUT.slice(HANDOUT.indexOf('<Antwoordblad'));
  const blok = antwoorden.match(/```\n([\s\S]*?)```/);
  if (!blok) throw new Error('geen grammatica-blok onder Antwoorden');
  // De toelichting "(zin 1)" achter elke regel is voor de lezer; de parser
  // leest tot een #, dus hier wordt hij een commentaar.
  const grammatica = blok[1].replace(/\((zin \d+)\)/g, '# $1');

  it('geeft na zin 2 tot en met 10 minstens zoveel lijntjes als het antwoord dan regels heeft', () => {
    // Zin 1 is voorgedaan en heeft geen lijntjes; de andere negen wel.
    const lijntjes = [...HANDOUT.matchAll(/<Schrijflijnen n=\{(\d+)\} \/>/g)].map((m) =>
      Number(m[1]),
    );
    expect(lijntjes).toHaveLength(9);
    // Per zin: hoeveel regels van het antwoord horen bij zin 1 tot en met deze.
    const perRegel = [...grammatica.matchAll(/# zin (\d+)/g)].map((m) => Number(m[1]));
    const totDanToe = lijntjes.map((_, i) => perRegel.filter((z) => z <= i + 2).length);
    const teKrap = lijntjes
      .map((l, i) => (l < totDanToe[i] ? `zin ${i + 2}: ${l} < ${totDanToe[i]}` : null))
      .filter(Boolean);
    expect(teKrap).toEqual([]);
  });

  it('het voorbeeld bij zin 1 bouwt zin 1 met de parser van de site', () => {
    const blok = HANDOUT.slice(HANDOUT.indexOf('**Zin 1.**'), HANDOUT.indexOf('**Zin 2.**'));
    const code = blok.match(/```\n([\s\S]*?)```/);
    if (!code) throw new Error('geen voorbeeldblok bij zin 1');
    // Links de regels, rechts de boom, gescheiden door drie of meer spaties.
    const regels = code[1]
      .split('\n')
      .map((r) => r.split(/\s{3,}/)[0].trim())
      .filter((r) => r.includes('->'))
      .join('\n');
    expect(regels.split('\n')).toHaveLength(3);
    const py = `${parserCode(regels)}
grammatica = lees_grammatica(GRAMMATICA + LEXICON)
print("OK" if parse(grammatica, "holmes sat".split()) else "FOUT")
print("FOUT" if parse(grammatica, "sat holmes".split()) else "OK")
`;
    expect(draai(py).trim().split('\n')).toEqual(['OK', 'OK']);
  });

  it('de lessen beloven geen exact aantal bomen voor een ambigue zin', () => {
    // Bij de doorloop zeiden drie pagina's dat zin 10 "op (2x)" komt en dat
    // het voorbeeld van opdracht 2 "twee bomen" geeft. Met de grammatica van
    // het antwoordblad, en met elke grammatica die een voorzetselgroep aan
    // een naamwoord- én een werkwoordgroep laat hangen, zijn het er vijf. Het
    // aantal hangt van de regels van de leerling af, dus de tekst zegt
    // "meer dan één"; hier staat vast dat dat met het antwoord ook zo is.
    const cfgDocs = ['bouwen/12-recursie.mdx', '13-compleet.mdx', '14-aanpassen.mdx'].map((n) =>
      lees(`cfg/${n}`),
    );
    for (const tekst of cfgDocs) {
      const proza = tekst.replace(/<PyRunner[\s\S]*?\/>/g, '');
      // Elke "(2x)" is een belofte van een exact aantal, behalve "(2x) of
      // meer" en "zag je al een (2x)": die twee vormen gaan er eerst uit.
      const zonderToegestaan = proza
        .replace(/\(2x\)\*{0,2} of\s+meer/g, '')
        .replace(/een \(2x\)/g, '');
      expect(zonderToegestaan).not.toMatch(/\(2x\)|twee bomen|twee geldige bomen|precies twee/i);
    }
    const code = `${parserCode(grammatica)}
grammatica = lees_grammatica(GRAMMATICA + LEXICON)
for zin in ["I had a little moist red paint in the palm of my hand", "Holmes had a pipe in the armchair in the day"]:
    print(len(parse(grammatica, zin.lower().split())), zin)
`;
    const aantallen = draai(code)
      .trim()
      .split('\n')
      .map((r) => Number(r.split(' ')[0]));
    expect(
      aantallen.every((n) => n > 1),
      'beide zinnen zijn ambigu',
    ).toBe(true);
  });

  it('de motor slaat een kopje met # over en valt om op een regel zonder of met twee pijlen', () => {
    // cfg/16 zegt dat een geplakte zin zonder pijl de ValueError geeft, dat
    // twee pijlen de spiegelbeeldige melding geven en dat een kopje met #
    // niets doet; hier staat vast dat de motor dat ook echt zo doet.
    const code = `${parserCode(grammatica)}
print(len(lees_grammatica("## Zin 1\\nS -> NP VP")))
for regel in ["Holmes lit a pipe", "S -> NP VP -> V"]:
    try:
        lees_grammatica(regel)
    except ValueError as e:
        print("ValueError:", e)
`;
    expect(draai(code).trim().split('\n')).toEqual([
      '1',
      'ValueError: not enough values to unpack (expected 2, got 1)',
      'ValueError: too many values to unpack (expected 2)',
    ]);
  });

  it('het antwoord van zelf-bouwen laat de nieuwe zin en de oude zinnen werken', () => {
    const tekst = lees('cfg/15-zelf-bouwen.mdx');
    const regel = tekst.match(/<summary>Antwoord<\/summary>[\s\S]*?```\n([\s\S]*?)```/)?.[1] ?? '';
    expect(regel.trim()).not.toBe('');
    const zinnen = [...tekst.matchAll(/^ {4}"(.+)",$/gm)].map((m) => m[1]);
    expect(zinnen).toContain('She said Holmes sat');
    const code = `${parserCode(`${grammatica}\n${regel}`)}
grammatica = lees_grammatica(GRAMMATICA + LEXICON)
for zin in ${JSON.stringify(zinnen)}:
    print("OK" if parse(grammatica, zin.lower().split()) else "FOUT", zin)
`;
    const uit = draai(code).trim().split('\n');
    expect(uit.filter((r) => !r.startsWith('OK'))).toEqual([]);
  });

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
});

describe('de parser-motor meldt wat anders stil op FOUT blijft', () => {
  it('een symbool dat alleen in hoofdletters verschilt van een bekend symbool', () => {
    const uit = draai(
      `${parserCode('S -> NP VP\nNP -> N\nVP -> V\nVP -> VP conj VP')}\ncontroleer(GRAMMATICA, ["Holmes sat"])`,
    );
    expect(uit).toContain(
      'LET OP: "conj" in de regel "VP -> VP conj VP" bestaat niet; bedoel je "Conj"?',
    );
    expect(uit).toContain('OK  (1x)  Holmes sat');
  });

  it('een woord zonder aanhalingstekens, en een grammatica zonder S', () => {
    expect(
      draai(`${parserCode('S -> NP VP\nNP -> sam')}\ncontroleer(GRAMMATICA, ["Holmes sat"])`),
    ).toContain('LET OP: "sam" in de regel "NP -> sam" heeft nergens een regel. Is het een woord?');
    expect(draai(`${parserCode('NP -> N')}\ncontroleer(GRAMMATICA, ["Holmes sat"])`)).toContain(
      'LET OP: er is nog geen regel voor S',
    );
  });

  it('de antwoordgrammatica geeft geen enkele melding', () => {
    const grammatica = lees('unplugged/06-zinnen-bouwen-met-kaartjes.mdx');
    const blok = grammatica.slice(grammatica.indexOf('<Antwoordblad')).match(/```\n([\s\S]*?)```/);
    const regels = (blok?.[1] ?? '').replace(/\((zin \d+)\)/g, '');
    expect(draai(`${parserCode(regels)}\ncontroleer(GRAMMATICA, ["Holmes sat"])`)).not.toContain(
      'LET OP',
    );
  });

  it('controleer bewaart per zin die past de eerste boom, met de zin als titel', () => {
    const uit = draai(`${parserCode('S -> NP VP\nNP -> N\nVP -> V\nVP -> V NP\nNP -> Det N')}
controleer(GRAMMATICA, ["Holmes sat", "Holmes lit a pipe", "Holmes chuckled to himself"])
import json
print(json.dumps([(b["titel"], b["boom"][0]) for b in _coderius_bomen]))`);
    expect(JSON.parse(uit.trim().split('\n').pop() ?? '')).toEqual([
      ['Holmes sat', 'S'],
      ['Holmes lit a pipe', 'S'],
    ]);
  });

  it('ontleed bewaart elke boom van de zin, genummerd', () => {
    const uit =
      draai(`${parserCode('S -> NP VP\nNP -> N\nVP -> V\nVP -> V NP\nNP -> Det N\nPP -> P NP\nNP -> NP PP\nVP -> VP PP')}
ontleed(GRAMMATICA, "Holmes lit a pipe in the armchair")
import json
print(json.dumps([b["titel"] for b in _coderius_bomen]))`);
    expect(JSON.parse(uit.trim().split('\n').pop() ?? '')).toEqual(['boom 1', 'boom 2']);
  });
});

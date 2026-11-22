import { spawnSync } from 'node:child_process';
import { readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { gebreken, puzzelsIn } from '../../../../../packages/shared/components/Puzzel/controle';
import { regelsVan } from '../../../../../packages/shared/components/Puzzel/logica';

// Een paar lessen hebben een tabblad Puzzel: de regels van een algoritme
// staan door elkaar, en de leerling zet ze in de goede volgorde (<Puzzel>,
// packages/shared/components/Puzzel; zie vakdidactiek, Parsons-puzzels). Bij
// een algoritme is de volgorde van de stappen de stof zelf. De puzzel staat
// direct vóór het tabblad waarin de leerling het algoritme voor het eerst
// zelf schrijft, zonder dat het al in de startcode staat.
//
// De vorm (eigen kop, de opdracht, de uitleg, het aantal regels en hun
// lengte) controleert `gebreken` uit het gedeelde onderdeel, voor elke cursus
// dezelfde. Hier staat wat bij deze cursus hoort: waar de puzzel in de les
// staat, dat het er een paar blijven, dat hij geen kopie is van code die op
// de pagina al open staat, en dat hij draait.
//
// De puzzel keurt alleen de volgorde van de les goed, dus die moet de enige
// zijn. In de web-cursus ging het daar eerst mis: twee regels die in beide
// volgordes werken, en een goed antwoord werd afgekeurd. Python is te
// draaien, dus hier loopt de test elke volgorde na die geldige Python is, en
// telt hij welke hetzelfde printen als de les. Elke zo'n volgorde moet de
// opdracht met een zin uitsluiten (`VASTGELEGD`). Wat de test niet ziet: of
// die zin ze ook echt allemaal uitsluit. Lees dat na.

const DOCS = fileURLToPath(new URL('../../docs', import.meta.url));

function bestanden(map: string): string[] {
  return readdirSync(map, { withFileTypes: true }).flatMap((f) =>
    f.isDirectory()
      ? bestanden(join(map, f.name))
      : /\.mdx?$/.test(f.name)
        ? [join(map, f.name)]
        : [],
  );
}

const lessen = bestanden(DOCS)
  .map((pad) => ({ naam: relative(DOCS, pad), bron: readFileSync(pad, 'utf8') }))
  .filter((les) => les.bron.includes('<Puzzel'))
  .map((les) => ({ ...les, puzzels: puzzelsIn(les.bron) }));

/** Het hoofdstuk van een les: zijn map, en in de route machine learning zijn project. */
const hoofdstuk = (naam: string) =>
  naam
    .split('/')
    .slice(0, naam.startsWith('ml-') ? 2 : 1)
    .join('/');

/** Een tabblad waarin de leerling zelf code schrijft. */
const SCHRIJFT = /^(Opdracht|Bouw)\b/;

const koppen = (bron: string) => [...bron.matchAll(/^## (.+)$/gm)].map((m) => m[1].trim());

function sectie(bron: string, kop: string): string {
  const start = bron.indexOf(`\n## ${kop}`);
  const eind = bron.indexOf('\n## ', start + 1);
  return bron.slice(start, eind === -1 ? undefined : eind);
}

/**
 * De code die open op de pagina te lezen is: elk codeblok en elke startcode
 * buiten een uitklapblok. Een antwoord dat dicht staat, telt niet.
 */
function openCode(bron: string): string[] {
  const zichtbaar = bron
    .replace(/<details>[\s\S]*?<\/details>/g, '')
    .replace(/<Puzzel\b[\s\S]*?<\/Puzzel>/g, '');
  return [
    ...[...zichtbaar.matchAll(/```python[^\n]*\n([\s\S]*?)```/g)].map((m) => m[1]),
    ...[...zichtbaar.matchAll(/initialCode=\{`([\s\S]*?)`\}/g)].map((m) => m[1]),
  ];
}

function draai(code: string): { status: number | null; uit: string; fout: string } {
  const r = spawnSync('python3', ['-'], { input: code, encoding: 'utf8', timeout: 30_000 });
  return { status: r.status, uit: r.stdout, fout: r.stderr };
}

/**
 * Elke volgorde van de regels die geldige Python is, gedraaid met een grens
 * op het aantal stappen (een `while` in de verkeerde volgorde stopt niet). De
 * uitkomst per puzzel: hoeveel volgordes geldig zijn, en hoeveel er naast de
 * oplossing hetzelfde printen. Een regel na een dubbele punt springt precies
 * een niveau in en anders nooit dieper: zo blijven het er honderden, geen
 * miljoenen.
 */
const VOLGORDES = String.raw`
import contextlib, io, json, sys

GRENS = 20000

class TeLang(Exception):
    pass

def draai(code):
    stappen = [0]
    def volg(frame, gebeurtenis, arg):
        stappen[0] += 1
        if stappen[0] > GRENS:
            raise TeLang()
        return volg
    uit = io.StringIO()
    try:
        with contextlib.redirect_stdout(uit):
            sys.settrace(volg)
            try:
                exec(compile(code, "<puzzel>", "exec"), {"__name__": "__main__"})
            finally:
                sys.settrace(None)
    except BaseException as fout:
        return type(fout).__name__, uit.getvalue()
    return "ok", uit.getvalue()

def volgordes(regels):
    diep = [len(r) - len(r.lstrip()) for r in regels]
    kop = [r.endswith(":") for r in regels]
    rij = []
    def stap():
        if len(rij) == len(regels):
            if not kop[rij[-1]]:
                yield list(rij)
            return
        gezien = set()
        for i, regel in enumerate(regels):
            if i in rij or regel in gezien:
                continue
            if not rij:
                past = diep[i] == 0
            elif kop[rij[-1]]:
                past = diep[i] == diep[rij[-1]] + 4
            else:
                past = diep[i] <= diep[rij[-1]]
            if past:
                gezien.add(regel)
                rij.append(i)
                yield from stap()
                rij.pop()
    yield from stap()

sys.setrecursionlimit(300)
uitkomst = []
for code in json.load(sys.stdin):
    regels = [r.rstrip() for r in code.split("\n") if r.strip()]
    goed = draai("\n".join(regels))
    geldig = 0
    zelfde = []
    for rij in volgordes(regels):
        bron = "\n".join(regels[i] for i in rij)
        try:
            compile(bron, "<puzzel>", "exec")
        except SyntaxError:
            continue
        geldig += 1
        if rij != list(range(len(regels))) and draai(bron) == goed:
            zelfde.append(bron)
    uitkomst.append({"oplossing": goed[0], "geldig": geldig, "zelfde": zelfde})
json.dump(uitkomst, sys.stdout)
`;

/**
 * De puzzels waar naast de volgorde van de les nog een volgorde hetzelfde
 * print: hoeveel, en de zin waarmee de opdracht ze uitsluit. Een puzzel die
 * hier niet staat, heeft er geen.
 */
const VASTGELEGD: Record<string, { aantal: number; zin: RegExp; welke: string }> = {
  'binair-zoeken/11-zelf-bouwen.mdx': {
    aantal: 1,
    zin: /`laag = 1` hoort boven `hoog = 100`/,
    welke: 'de twee startwaarden andersom',
  },
  'bubble-sort/11-zelf-bouwen.mdx': {
    aantal: 3,
    zin: /Elke ronde begint met `geswapt` op `False`, en na een swap gaat de vlag op `True`/,
    welke: 'de vlag aan het eind van de ronde op False, de vlag vóór de swap op True, en allebei',
  },
  'hanoi/bouwen/06-recursie-stap.mdx': {
    aantal: 1,
    zin: /Hij begint met het basisgeval/,
    welke: '`zetten = []` boven het basisgeval',
  },
};

describe('puzzels in de cursus algoritmes', () => {
  it('staan in een paar lessen, niet in elke', () => {
    // "Alleen waar de volgorde het nieuwe is" (vakdidactiek). Een puzzel in
    // elke les is geen keuze meer.
    expect(lessen.length).toBeGreaterThanOrEqual(3);
    expect(lessen.length).toBeLessThanOrEqual(8);
  });

  it('hooguit één per pagina en één per hoofdstuk', () => {
    for (const { naam, bron, puzzels } of lessen) {
      expect(puzzels, naam).toHaveLength(1);
      expect(bron.match(/<Puzzel\b/g), naam).toHaveLength(1);
      expect(
        koppen(bron).filter((k) => k === 'Puzzel'),
        naam,
      ).toHaveLength(1);
    }
    const perHoofdstuk = lessen.map((les) => hoofdstuk(les.naam));
    expect(perHoofdstuk).toEqual([...new Set(perHoofdstuk)]);
  });

  it('hebben de vorm van een puzzel, in Python met de code in de les', () => {
    for (const { naam, bron, puzzels } of lessen) {
      for (const puzzel of puzzels) {
        expect(gebreken(puzzel), naam).toEqual([]);
        // Met taal="python" telt de inspringing mee bij het controleren.
        expect(puzzel.taal, naam).toBe('python');
        // De code staat in de prop zelf, met vier spaties: de pre-loader
        // mdx-inspringing bewaart die binnen {`…`}.
        expect(sectie(bron, 'Puzzel'), naam).toContain('<Puzzel taal="python" code={`');
        const inspringing = regelsVan(puzzel.code ?? '').map(
          (r) => r.tekst.length - r.tekst.trimStart().length,
        );
        expect(
          inspringing.filter((n) => n % 4 !== 0),
          naam,
        ).toEqual([]);
      }
    }
  });

  it('staan direct vóór het eerste tabblad waarin de leerling zelf schrijft', () => {
    for (const { naam, bron, puzzels } of lessen) {
      const [puzzel] = puzzels;
      const rij = koppen(bron);
      const voor = rij.slice(0, rij.indexOf('Puzzel'));
      // Na de uitleg en vóór de opdrachten. Er gaat iets mis zet de build
      // zelf na de opdrachten; in de bron staat de puzzel ervoor.
      expect(
        voor.filter((k) => SCHRIJFT.test(k) || /^(Uitdaging|Er gaat iets mis)/.test(k)),
        naam,
      ).toEqual([]);
      expect(puzzel.kopNa, naam).toMatch(SCHRIJFT);
      expect(sectie(bron, puzzel.kopNa ?? ''), naam).toContain('<PyRunner');
    }
  });

  it('zijn geen kopie van code die open op de pagina staat', () => {
    // Dan is het overtypen. Wel de code die de leerling zo meteen zelf
    // schrijft: het geraamte daarvan mag in de startcode staan, maar minstens
    // drie regels van de puzzel staan in geen enkel open blok.
    for (const { naam, bron, puzzels } of lessen) {
      const regels = regelsVan(puzzels[0].code ?? '').map((r) => r.tekst.trim());
      for (const blok of openCode(bron)) {
        const daar = new Set(blok.split('\n').map((r) => r.trim()));
        const eigen = regels.filter((r) => !daar.has(r));
        expect(
          eigen.length,
          `${naam}: alleen eigen is ${eigen.join(' | ')}`,
        ).toBeGreaterThanOrEqual(3);
      }
    }
  });

  it('draaien, en printen wat de opdracht zegt', () => {
    for (const { naam, puzzels } of lessen) {
      const { code = '', opdracht } = puzzels[0];
      const { status, uit, fout } = draai(code);
      expect(status, `${naam}: ${fout}`).toBe(0);
      // Een puzzel die iets print, noemt die uitvoer in de opdracht: zo weet
      // de leerling wat de goede volgorde moet opleveren. Zonder print is de
      // puzzel één functie, en zegt de opdracht wat die teruggeeft.
      const tekst = opdracht.replace(/\s+/g, ' ');
      const geprint = uit.split('\n').filter((r) => r.trim() !== '');
      if (geprint.length === 0) expect(code.trimStart(), naam).toMatch(/^def /);
      for (const regel of geprint) expect(tekst, naam).toContain(`\`${regel}\``);
    }
  });

  it('hebben één goede volgorde, of de opdracht legt de andere vast', () => {
    const r = spawnSync('python3', ['-c', VOLGORDES], {
      input: JSON.stringify(lessen.map((les) => les.puzzels[0].code ?? '')),
      encoding: 'utf8',
      timeout: 110_000,
    });
    expect(r.status, r.stderr).toBe(0);
    const uitkomst: { oplossing: string; geldig: number; zelfde: string[] }[] = JSON.parse(
      r.stdout,
    );
    lessen.forEach(({ naam, puzzels }, i) => {
      const { oplossing, geldig, zelfde } = uitkomst[i];
      expect(oplossing, naam).toBe('ok');
      // Zonder andere geldige volgordes heeft de loper niets nagelopen.
      expect(geldig, naam).toBeGreaterThan(1);
      const vast = VASTGELEGD[naam];
      expect(zelfde, `${naam}: deze volgordes printen hetzelfde`).toHaveLength(vast?.aantal ?? 0);
      if (vast) expect(puzzels[0].opdracht.replace(/\s+/g, ' '), naam).toMatch(vast.zin);
    });
    // Een puzzel die weg is of anders heet, hoort hier ook weg.
    const namen = lessen.map((les) => les.naam);
    expect(Object.keys(VASTGELEGD).filter((naam) => !namen.includes(naam))).toEqual([]);
  }, 120_000);
});

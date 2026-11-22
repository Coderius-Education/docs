import { spawnSync } from 'node:child_process';
import { readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  type PuzzelInLes,
  gebreken,
  puzzelsIn,
} from '../../../../../packages/shared/components/Puzzel/controle';
import { regelsVan } from '../../../../../packages/shared/components/Puzzel/logica';

// Een paar lessen hebben een tabblad Puzzel: de regels van een werkend
// programma staan door elkaar, en de leerling zet ze in de goede volgorde
// (<Puzzel>, packages/shared/components/Puzzel; zie vakdidactiek,
// Parsons-puzzels). De vorm van een puzzel bewaakt `gebreken` voor elke
// cursus; hier staat wat bij Python hoort: de plek in de les, dat het er een
// paar blijven, dat de puzzel geen kopie is van de code van de les, en dat
// Python zelf maar één volgorde goedkeurt.
//
// Dat laatste is waar het in de web-cursus eerst misging: de puzzel keurt
// alleen de volgorde van de les goed, dus twee regels die ook andersom
// kloppen (twee losse toekenningen, twee functies) maken van een goed antwoord
// een fout. Python kan dat narekenen: deze test draait elke volgorde van de
// regels die Python wil lezen, en eist dat geen andere volgorde hetzelfde
// programma is, dus in elk geval hetzelfde print. Wat hij niet ziet: een
// andere volgorde die iets anders print en toch bij de opdracht past.
// Daarvoor zegt de opdracht wat boven wat hoort ("als laatste", "eerst de
// hoogte"), en dat lees je na.

const DOCS = fileURLToPath(new URL('../../docs', import.meta.url));

function bestanden(map: string): string[] {
  return readdirSync(map, { withFileTypes: true }).flatMap((f) =>
    f.isDirectory()
      ? bestanden(join(map, f.name))
      : f.name.endsWith('.mdx')
        ? [join(map, f.name)]
        : [],
  );
}

const lessen = bestanden(DOCS)
  .map((pad) => ({ naam: relative(DOCS, pad), bron: readFileSync(pad, 'utf8') }))
  .filter((les) => les.bron.includes('<Puzzel'))
  .map((les) => ({ ...les, puzzels: puzzelsIn(les.bron) }));

const puzzels = lessen.flatMap((les) =>
  les.puzzels.map((puzzel) => ({ les: les.naam, bron: les.bron, puzzel })),
);

/** Eén keer draaien: met een andere waarde op een regel, of met wat de leerling typt. */
interface Geval {
  /** Een regel van de puzzel, en wat er in dit geval voor in de plaats staat. */
  regel?: [string, string];
  /** De antwoorden op `input()`, op volgorde. */
  invoer?: string[];
}

/**
 * De gevallen waarmee een puzzel draait, als één keer draaien niet elke regel
 * raakt. Een `if` met `else` draait per keer één tak: met alleen
 * `regenkans = 70` zijn de twee `print`s onder `if` en `else` niet uit elkaar
 * te houden. Elke regel van de puzzel moet in minstens één geval aan de beurt
 * komen; de test hieronder eist dat. Zonder regel hier draait de puzzel één
 * keer, zoals hij in de les staat.
 */
const GEVALLEN: Record<string, Geval[]> = {
  '03-beslissen/05b-if-else.mdx': [{}, { regel: ['regenkans = 70', 'regenkans = 20'] }],
  '03-beslissen/05c-and-or-elif.mdx': [
    {},
    { regel: ['batterij = 45', 'batterij = 90'] },
    { regel: ['batterij = 45', 'batterij = 15'] },
    { regel: ['batterij = 45', 'batterij = 5'] },
  ],
  // Eerst iets dat misgaat en dan iets dat lukt, en een keer meteen goed.
  '10-fouten/16d-proberen-tot-het-lukt.mdx': [{ invoer: ['drie', '3'] }, { invoer: ['3'] }],
};

/** Een regel met alleen een sleutelwoord: die heeft elk programma. */
const SKELET = /^(else:|try:|break|continue)$/;

/** De code van elk codeblok en elk oefenveld van de les. */
const codeVan = (bron: string) =>
  [...bron.matchAll(/```python[^\n]*\n([\s\S]*?)```|<CodeExercise>\{`([\s\S]*?)`\}/g)].map(
    (m) => m[1] ?? m[2],
  );

// Elke volgorde van de regels die Python wil lezen, met wat hij print. Een
// regel die dieper inspringt volgt op een regel met een dubbele punt; zo
// blijven er van de 362880 volgordes van negen regels een paar honderd over.
// Een loop die niet stopt, breekt na 5000 stappen af. Een volgorde is
// hetzelfde programma als hij in elk geval zonder fout draait en hetzelfde
// print als de volgorde van de les.
const NAREKENEN = `
import contextlib, io, json, sys

class Stop(Exception):
    pass

def draai(regels, invoer, geraakt=None):
    uit = io.StringIO()
    stappen = 0
    rij = list(invoer)
    def spoor(frame, gebeurtenis, arg):
        nonlocal stappen
        stappen += 1
        if stappen > 5000:
            raise Stop()
        if geraakt is not None and frame.f_code.co_filename == "<puzzel>":
            geraakt.add(frame.f_lineno - 1)
        return spoor
    def vraag(tekst=""):
        if not rij:
            raise Stop()
        antwoord = rij.pop(0)
        uit.write(f"{tekst}{antwoord}\\n")
        return antwoord
    try:
        programma = compile("\\n".join(regels), "<puzzel>", "exec")
    except SyntaxError:
        return None
    sys.settrace(spoor)
    try:
        with contextlib.redirect_stdout(uit):
            exec(programma, {"input": vraag, "__name__": "__main__"})
    except BaseException:
        return None
    finally:
        sys.settrace(None)
    return uit.getvalue()

def diepte(regel):
    return len(regel) - len(regel.lstrip(" "))

def volgordes(regels):
    """Elke volgorde als lijst van plekken, zonder twee keer dezelfde tekst."""
    gezien = set()
    def verder(gekozen, over):
        if not over:
            tekst = tuple(regels[i] for i in gekozen)
            if not tekst[-1].endswith(":") and tekst not in gezien:
                gezien.add(tekst)
                yield list(gekozen)
            return
        vorige = regels[gekozen[-1]] if gekozen else None
        for n, i in enumerate(over):
            regel = regels[i]
            if any(regels[j] == regel for j in over[:n]):
                continue
            d = diepte(regel)
            if vorige is None:
                past = d == 0
            elif vorige.endswith(":"):
                past = d == diepte(vorige) + 4
            else:
                past = d <= diepte(vorige)
            if past:
                yield from verder(gekozen + [i], over[:n] + over[n + 1:])
    yield from verder([], list(range(len(regels))))

uit = []
for puzzel in json.load(sys.stdin):
    regels = puzzel["regels"]
    gevallen = []
    for geval in puzzel["gevallen"]:
        oud, nieuw = geval.get("regel") or (None, None)
        gevallen.append(([nieuw if r == oud else r for r in regels], geval.get("invoer") or []))
    geraakt = set()
    goed = [draai(code, invoer, geraakt) for code, invoer in gevallen]
    # else: en try: zijn zelf geen stap van Python.
    nooit = [
        r for i, r in enumerate(regels)
        if i not in geraakt and r.strip() not in ("else:", "try:")
    ]
    zelfde, anders = [], 0
    for volgorde in volgordes(regels):
        if [regels[i] for i in volgorde] == regels:
            continue
        uitvoer = [draai([code[i] for i in volgorde], invoer) for code, invoer in gevallen]
        if None in uitvoer:
            continue
        if uitvoer == goed:
            zelfde.append([regels[i] for i in volgorde])
        else:
            anders += 1
    uit.append({"uitvoer": goed, "nooit": nooit, "zelfde": zelfde, "anders": anders})
json.dump(uit, sys.stdout)
`;

interface Nagerekend {
  /** Wat de volgorde van de les print, per geval; null als hij omvalt. */
  uitvoer: (string | null)[];
  /** Regels die in geen enkel geval aan de beurt kwamen. */
  nooit: string[];
  /** Andere volgordes die in elk geval hetzelfde printen. */
  zelfde: string[][];
  /** Het aantal andere volgordes dat draait en iets anders print. */
  anders: number;
}

function rekenNa(vragen: { regels: string[]; gevallen: Geval[] }[]): Nagerekend[] {
  const r = spawnSync('python3', ['-c', NAREKENEN], {
    input: JSON.stringify(vragen),
    encoding: 'utf8',
  });
  if (r.status !== 0) throw new Error(`python3 kon de puzzels niet narekenen:\n${r.stderr}`);
  return JSON.parse(r.stdout);
}

const regelsMet = (puzzel: PuzzelInLes) => regelsVan(puzzel.code ?? '').map((r) => r.tekst);

const nagerekend = rekenNa(
  puzzels.map(({ les, puzzel }) => ({
    regels: regelsMet(puzzel),
    gevallen: GEVALLEN[les] ?? [{}],
  })),
);

describe('puzzels in de python-cursus', () => {
  it('staan in een paar lessen, niet in elke', () => {
    // "Alleen waar de volgorde het nieuwe is" (vakdidactiek). Een puzzel in
    // elke les is geen keuze meer.
    expect(lessen.length).toBeGreaterThanOrEqual(4);
    expect(lessen.length).toBeLessThanOrEqual(12);
  });

  it('hebben de vorm van een puzzel, met de code in de les zelf', () => {
    for (const { les, puzzel } of puzzels) {
      expect(gebreken(puzzel), les).toEqual([]);
      // In Python is de inspringing de opbouw: de puzzel vergelijkt hem mee.
      expect(puzzel.taal, les).toBe('python');
      // Vier spaties per niveau, zoals in elk codeblok van de cursus.
      const scheef = regelsMet(puzzel).filter((r) => (r.length - r.trimStart().length) % 4 !== 0);
      expect(scheef, les).toEqual([]);
    }
    // De code staat als code={`…`} op het onderdeel, niet in een export: de
    // pre-loader bewaart de inspringing binnen die accolades.
    for (const { naam, bron } of lessen)
      expect(bron.match(/<Puzzel taal="python" code=\{`/g), naam).toHaveLength(1);
  });

  it('één per les, op een eigen tabblad na de uitleg en vóór de fouten en de opdrachten', () => {
    for (const { naam, bron, puzzels: inLes } of lessen) {
      expect(inLes, naam).toHaveLength(1);
      expect(bron.match(/^## Puzzel$/gm), naam).toHaveLength(1);
      const [puzzel] = inLes;
      // Er gaat iets mis staat in de bron van de meeste lessen vóór de
      // opdrachten; de build zet dat tabblad erna. De puzzel sluit de uitleg
      // af: hij staat vóór wat in de bron als eerste op de uitleg volgt.
      const fouten = bron.search(/^## Er gaat iets mis$/m);
      const opdracht = bron.search(/^## Opdracht/m);
      expect(opdracht, naam).toBeGreaterThan(-1);
      if (fouten > -1 && fouten < opdracht) expect(puzzel.kopNa, naam).toBe('Er gaat iets mis');
      else expect(puzzel.kopNa, naam).toMatch(/^Opdracht /);
      expect(puzzel.kopVoor ?? '', naam).not.toMatch(/^(Opdracht |Er gaat iets mis$)/);
      // Ook na de voorspelvraag: die hoort bij de uitleg.
      const plek = bron.search(/^## Puzzel$/m);
      expect(bron.slice(plek, opdracht), naam).not.toContain('<Voorspel');
      expect(bron.slice(0, plek), naam).toContain('<Voorspel');
      // Op het tabblad staat alleen de opdracht en de puzzel.
      const eind = bron.indexOf('</Puzzel>', plek) + '</Puzzel>'.length;
      expect(bron.slice(eind, bron.indexOf('\n## ', eind)).trim(), naam).toBe('');
    }
  });

  it('zijn geen kopie van een voorbeeld, een oefenveld of een oplossing van de les', () => {
    for (const { les, bron, puzzel } of puzzels) {
      // Per regel, want een kopie met een regel minder is nog steeds een
      // kopie. Een regel met alleen een sleutelwoord (`else:`, `break`) telt
      // niet: die heeft elk programma.
      const inhoud = regelsMet(puzzel)
        .map((r) => r.trim())
        .filter((r) => !SKELET.test(r));
      expect(inhoud.length, les).toBeGreaterThanOrEqual(3);
      const daar = new Set(
        codeVan(bron)
          .flatMap((code) => code.split('\n'))
          .map((r) => r.trim()),
      );
      const gedeeld = inhoud.filter((r) => daar.has(r));
      expect(
        gedeeld.length * 2,
        `${les} deelt met de les: ${gedeeld.join(' | ')}`,
      ).toBeLessThanOrEqual(inhoud.length);
    }
  });

  it('draaien in Python, en zetten iets op het scherm', () => {
    puzzels.forEach(({ les }, i) => {
      for (const uitvoer of nagerekend[i].uitvoer) {
        expect(uitvoer, les).not.toBeNull();
        expect((uitvoer ?? '').trim(), les).not.toBe('');
      }
    });
  });

  it('elke regel komt in minstens één geval aan de beurt', () => {
    // Een tak die nooit draait, kan de test hieronder niet van een andere tak
    // onderscheiden. Zet er in GEVALLEN een waarde of een invoer bij die hem
    // raakt.
    puzzels.forEach(({ les }, i) => {
      expect(nagerekend[i].nooit, les).toEqual([]);
    });
    // Een geval dat geen regel van de puzzel vervangt, test niets.
    for (const { les, puzzel } of puzzels)
      for (const geval of GEVALLEN[les] ?? [])
        if (geval.regel) expect(regelsMet(puzzel), les).toContain(geval.regel[0]);
    for (const les of Object.keys(GEVALLEN)) expect(lessen.map((l) => l.naam)).toContain(les);
  });

  it('hebben geen tweede volgorde die hetzelfde programma is', () => {
    // Twee losse toekenningen onder elkaar, twee functies, een `print` die
    // ook boven de `def` mag: de puzzel keurde dan een goed antwoord af.
    puzzels.forEach(({ les }, i) => {
      const andere = nagerekend[i].zelfde.map((volgorde) => volgorde.join('\n'));
      expect(andere, les).toEqual([]);
    });
  });

  it('het narekenen ziet een tweede volgorde, en een tak die niet draait', () => {
    // Zonder deze test slagen de twee hierboven ook als python3 niets vindt.
    const [los, loop, tak, takken] = rekenNa([
      { regels: ['a = 1', 'b = 2', 'print(a + b)'], gevallen: [{}] },
      { regels: ['a = 1', 'while a < 3:', '    a += 1', 'print(a)'], gevallen: [{}] },
      {
        regels: ['a = 1', 'if a > 0:', '    print("ja")', 'else:', '    print("nee")'],
        gevallen: [{}],
      },
      {
        regels: ['a = 1', 'if a > 0:', '    print("ja")', 'else:', '    print("nee")'],
        gevallen: [{}, { regel: ['a = 1', 'a = -1'] }],
      },
    ]);
    expect(los.zelfde).toEqual([['b = 2', 'a = 1', 'print(a + b)']]);
    // `print(a)` vóór de loop draait ook, en print iets anders.
    expect(loop).toEqual({ uitvoer: ['3\n'], nooit: [], zelfde: [], anders: 1 });
    // Met één waarde draait `print("nee")` nooit; met twee is de omgekeerde
    // `if` een ander programma.
    expect(tak.nooit).toEqual(['    print("nee")']);
    expect(takken).toEqual({ uitvoer: ['ja\n', 'nee\n'], nooit: [], zelfde: [], anders: 1 });
  });
});

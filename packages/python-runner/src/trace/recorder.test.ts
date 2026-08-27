import { execFileSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';
import { MAX_STAPPEN, RECORDER } from './recorder';

// De opnemer is Python die in de browser draait, maar hij is gewone CPython:
// dus draaien we hem hier tegen de python3 van de machine. Dat vangt precies
// wat een componenttest niet ziet — of de stappen kloppen, of de waarden per
// stap een momentopname zijn en niet de eindtoestand, en of de regelnummers
// overeenkomen met wat de leerling in zijn editor ziet.
//
// De leerlingcode gaat via stdin naar binnen zodat er niets te escapen valt.

type Variabele = { naam: string; soort: string; waarde: string };
type Frame = { naam: string; variabelen: Variabele[] };
type Stap = { regel: number; gebeurtenis: string; frames: Frame[]; uitvoerTot: number };
type Opname = {
  stappen: Stap[];
  uitvoer: string;
  afgekapt: boolean;
  fout: { soort: string; bericht: string; regel: number | null } | null;
};

function neemOp(bron: string, recorder: string = RECORDER): Opname {
  const script = `${recorder}
import sys
sys.stdout.write(_stapper_neem_op(sys.stdin.read()))
`;
  const uit = execFileSync('python3', ['-c', script], {
    input: bron,
    encoding: 'utf8',
    maxBuffer: 32 * 1024 * 1024,
  });
  return JSON.parse(uit);
}

/** Alle variabelen van alle frames van één stap, plat. */
function variabelen(stap: Stap): Record<string, string> {
  const uit: Record<string, string> = {};
  for (const frame of stap.frames) {
    for (const v of frame.variabelen) uit[v.naam] = v.waarde;
  }
  return uit;
}

describe('de opnemer', () => {
  it('volgt een while-lus stap voor stap', () => {
    const opname = neemOp(
      'teller = 3\nwhile teller > 0:\n    print(teller)\n    teller -= 1\nprint("Start!")\n',
    );

    expect(opname.fout).toBe(null);
    expect(opname.afgekapt).toBe(false);
    expect(opname.uitvoer).toBe('3\n2\n1\nStart!\n');

    // Drie rondes van twee regels, plus de kop van de lus die vier keer wordt
    // getest, plus de eerste en de laatste regel.
    expect(opname.stappen.length).toBeGreaterThan(10);

    const tellers = opname.stappen.map((s) => variabelen(s).teller).filter((w) => w !== undefined);
    expect(tellers[0]).toBe('3');
    expect(tellers[tellers.length - 1]).toBe('0');
  });

  it('bewaart de waarde van dat moment, niet de eindwaarde', () => {
    // De kern van de hele opzet: repr() per stap. Bewaar je het object zelf,
    // dan toont elke stap ['Sam', 'Kim'] en is de opname waardeloos.
    const opname = neemOp('namen = []\nnamen.append("Sam")\nnamen.append("Kim")\n');
    const gezien = opname.stappen.map((s) => variabelen(s).namen).filter(Boolean);

    expect(gezien).toEqual(['[]', "['Sam']", "['Sam', 'Kim']"]);
  });

  it('houdt lokale variabelen apart van globale', () => {
    const opname = neemOp(
      'boodschap = "hoi"\n\ndef dubbel(x):\n    uit = x * 2\n    return uit\n\nantwoord = dubbel(5)\n',
    );

    const binnen = opname.stappen.find((s) => s.frames.length === 2);
    expect(binnen, 'geen stap binnen de functie gevonden').toBeDefined();
    if (!binnen) return;

    const [globaal, lokaal] = binnen.frames;
    expect(globaal.naam).toBe('globaal');
    expect(lokaal.naam).toBe('dubbel()');
    expect(globaal.variabelen.map((v) => v.naam)).toContain('boodschap');
    // x hoort bij de functie en mag niet in het globale blok opduiken.
    expect(globaal.variabelen.map((v) => v.naam)).not.toContain('x');
    expect(lokaal.variabelen.map((v) => v.naam)).toContain('x');
    expect(lokaal.variabelen.map((v) => v.naam)).not.toContain('boodschap');
  });

  it('noemt het type bij de waarde', () => {
    const opname = neemOp('naam = "Sam"\nleeftijd = 14\nscores = [7, 8]\n');
    const laatste = opname.stappen[opname.stappen.length - 1];
    const soorten = Object.fromEntries(
      laatste.frames.flatMap((f) => f.variabelen).map((v) => [v.naam, v.soort]),
    );

    expect(soorten).toEqual({ naam: 'str', leeftijd: 'int', scores: 'list' });
  });

  it('laat imports en functies buiten de tabel', () => {
    const opname = neemOp('import math\n\ndef groet():\n    pass\n\nstraal = 2\n');
    const laatste = opname.stappen[opname.stappen.length - 1];
    const namen = laatste.frames.flatMap((f) => f.variabelen).map((v) => v.naam);

    expect(namen).toEqual(['straal']);
  });

  it('geeft regelnummers die overeenkomen met de bron, ook met imports bovenaan', () => {
    // Dit is de test die drift zou vangen als de code ooit in een wrapper
    // belandt: play kent dat probleem met zijn benaderde lineOffset.
    const opname = neemOp('import math\n\nstraal = 2\noppervlak = math.pi * straal\n');
    const regels = opname.stappen.map((s) => s.regel);

    expect(regels[0]).toBe(1);
    expect(regels).toContain(3);
    expect(regels).toContain(4);
    expect(Math.max(...regels)).toBe(4);
  });

  it('houdt bij hoeveel er op dat moment geprint is', () => {
    const opname = neemOp('print("een")\nprint("twee")\n');
    const posities = opname.stappen.map((s) => s.uitvoerTot);

    expect(posities[0]).toBe(0);
    expect(Math.max(...posities)).toBe('een\ntwee\n'.length);
  });

  it('stopt een oneindige lus op de stappenlimiet', () => {
    const opname = neemOp('x = 0\nwhile True:\n    x += 1\n');

    expect(opname.afgekapt).toBe(true);
    expect(opname.stappen.length).toBe(MAX_STAPPEN);
  });

  it('kapt een waarde af die niet in de tabel past', () => {
    const opname = neemOp('lang = "a" * 5000\n');
    const laatste = opname.stappen[opname.stappen.length - 1];
    const waarde = laatste.frames[0].variabelen[0].waarde;

    expect(waarde.length).toBeLessThan(300);
    expect(waarde.endsWith('...')).toBe(true);
  });

  it('geeft de fout met de regel waar het misging', () => {
    const opname = neemOp('a = 1\nprint(b)\n');

    expect(opname.fout?.soort).toBe('NameError');
    expect(opname.fout?.regel).toBe(2);
    // De stappen tot aan de fout blijven bruikbaar.
    expect(opname.stappen.length).toBeGreaterThan(0);
  });

  it('meldt een syntaxfout zonder stappen', () => {
    const opname = neemOp('if True\n    print(1)\n');

    expect(opname.stappen).toEqual([]);
    expect(opname.fout?.soort).toBe('SyntaxError');
    expect(opname.fout?.regel).toBe(1);
  });

  it('laat een except Exception in de lescode de limiet niet opeten', () => {
    // _StapperGenoeg erft van BaseException; ving de lescode hem op, dan liep
    // de opname gewoon door en bevroor de pagina.
    const opname = neemOp(
      'x = 0\nwhile True:\n    try:\n        x += 1\n    except Exception:\n        pass\n',
    );

    expect(opname.afgekapt).toBe(true);
    expect(opname.stappen.length).toBe(MAX_STAPPEN);
  });
});

describe('de opnemer valt om als je hem sloopt', () => {
  // Mutatietests: een controle die niets controleert is erger dan geen
  // controle. Deze twee verminkingen moeten de suite hierboven laten falen.

  it('zonder het bestandsnaam-filter lopen bibliotheekframes mee', () => {
    const kapot = RECORDER.replace(
      'if frame.f_code.co_filename != _STAPPER_BESTAND:\n            return None',
      'pass',
    );
    expect(kapot, 'de mutatie greep niet aan').not.toBe(RECORDER);

    const bron = 'import json\n\ntekst = json.dumps({"a": 1})\n';
    expect(neemOp(bron).stappen.length).toBeLessThan(10);
    expect(neemOp(bron, kapot).stappen.length).toBeGreaterThan(10);
  });

  it('zonder de afkapping komt een enorme waarde ongefilterd door', () => {
    const kapot = RECORDER.replace('if len(tekst) > _STAPPER_MAX_TEKENS:', 'if False:');
    expect(kapot, 'de mutatie greep niet aan').not.toBe(RECORDER);

    const bron = 'lang = "a" * 5000\n';
    const gemuteerd = neemOp(bron, kapot);
    const waarde = gemuteerd.stappen[gemuteerd.stappen.length - 1].frames[0].variabelen[0].waarde;
    expect(waarde.length).toBeGreaterThan(1000);
  });
});

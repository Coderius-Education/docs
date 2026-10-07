import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { arduino } from '@leaphy-robotics/leaphy-blocks';
import * as B from 'blockly/core';
import 'blockly/blocks';
import * as nl from 'blockly/msg/nl';
import { describe, expect, it } from 'vitest';
import { PINNEN, registreer } from '../components/Blokken/leaphy';

// De oefenpagina van de Click Golfer sluit een tweede sensor aan op A1 en een
// tweede servo op D10. Wat de tekst over die pinnen en over de blokken zegt,
// kan een leerling van groep 7/8 niet nakijken, dus moet het kloppen: de pin
// moet in Easybloqs te kiezen zijn, het programma moet echt A1 lezen en
// servo 10 aansturen, en elke oefening voegt hooguit één nieuw blok toe, met
// de groep erbij waar het in Easybloqs staat.

const CLICK = fileURLToPath(new URL('../../click_golfer', import.meta.url));

registreer(B, nl as unknown as Record<string, string>);

type Blok = {
  type: string;
  extraState?: { hasElse?: boolean };
  inputs?: Record<string, { block?: Blok }>;
  next?: { block?: Blok };
};
type Programma = { blocks: { blocks: Blok[] } };

function tekst(bestand: string): string {
  return readFileSync(join(CLICK, bestand), 'utf8');
}

function programma(bestand: string): Programma {
  return JSON.parse(readFileSync(join(CLICK, 'blokken', bestand), 'utf8'));
}

// Het blok als … dan … anders is in Easybloqs een eigen blok in Denk stappen,
// ook al is het hetzelfde type als als … dan. Daarom telt het apart.
function soorten(blok: Blok | undefined, in_: Set<string> = new Set()): Set<string> {
  if (!blok) return in_;
  in_.add(blok.extraState?.hasElse ? `${blok.type}+anders` : blok.type);
  for (const invoer of Object.values(blok.inputs ?? {})) soorten(invoer.block, in_);
  soorten(blok.next?.block, in_);
  return in_;
}

function blokkenVan(inhoud: string): Set<string> {
  const alle = new Set<string>();
  for (const m of inhoud.matchAll(/from '\.\/blokken\/([^']+\.json)'/g)) {
    for (const blok of programma(m[1]).blocks.blocks) soorten(blok, alle);
  }
  return alle;
}

function code(bestand: string): string {
  const ws = new B.Workspace();
  try {
    B.serialization.workspaces.load(programma(bestand), ws);
    return arduino.workspaceToCode(ws);
  } finally {
    ws.dispose();
  }
}

const PAGINA = tekst('oefenen.md');

// De pagina heeft drie delen (##), en daarin de oefeningen (###).
const DELEN = ['## Een tweede sensor', '## Een tweede servo', "## Twee sensoren en twee servo's"];

// Per oefening: welk programma erbij hoort (op volgorde van de pagina).
function oefeningen(): { kop: string; inhoud: string }[] {
  return PAGINA.split(/^(?=#{2,3} )/m)
    .filter((stuk) => stuk.startsWith('### Oefening'))
    .map((stuk) => ({ kop: stuk.split('\n')[0], inhoud: stuk }));
}

// Een deel loopt van zijn kop tot de volgende ##-kop.
function deel(kop: string): string {
  const begin = PAGINA.indexOf(`${kop}\n`);
  if (begin === -1) return '';
  const rest = PAGINA.slice(begin + kop.length);
  const eind = rest.search(/^## /m);
  return kop + (eind === -1 ? rest : rest.slice(0, eind));
}

function aansluittabel(inhoud: string): string {
  return inhoud
    .split('\n')
    .filter((regel) => regel.startsWith('|'))
    .join('\n');
}

// Welke sensoren en servo's een programma echt gebruikt, uit de code die
// Easybloqs ervan maakt.
function pinnen(bestand: string): { sensoren: Set<string>; servos: Set<string> } {
  const c = code(bestand);
  return {
    sensoren: new Set([...c.matchAll(/analogRead\((A\d)\)/g)].map((m) => m[1])),
    servos: new Set([...c.matchAll(/myServo(\d+)\.attach/g)].map((m) => m[1])),
  };
}

function programmasIn(inhoud: string): string[] {
  return [...inhoud.matchAll(/programma=\{(\w+)\}/g)].map((m) => bestandVan(inhoud, m[1]));
}

function bestandVan(inhoud: string, naam: string): string {
  const m = PAGINA.match(new RegExp(`import ${naam} from '\\./blokken/([^']+)'`));
  if (!m || !inhoud.includes(`programma={${naam}}`)) throw new Error(naam);
  return m[1];
}

describe('de tweede sensor en de tweede servo', () => {
  it('A1 en pin 10 zijn in het blok te kiezen', () => {
    // Easybloqs geeft de Nano analoge pinnen A0 tot en met A7 en digitale
    // pinnen 2 tot en met 19 (leaphy-webbased-svelte, PinMapping.UNIFIED).
    expect(PINNEN).toContain('A1');
    expect(PINNEN).toContain('10');
  });

  it('de pagina zegt waar ze op het shield komen', () => {
    expect(PAGINA).toMatch(/het signaal van \*\*A1\*\*/);
    expect(PAGINA).toMatch(/het signaal van \*\*D10\*\*/);
    // Het pootje op de sensor heet A0, ook bij de tweede sensor. Wie dat
    // niet leest, zet de draad op A0 van het shield.
    expect(PAGINA).toMatch(/op de sensor zelf heet de pin nog steeds \*\*A0\*\*/);
  });

  it('een nieuw servo-blok begint op pin 2: de pagina zegt dat je 10 kiest', () => {
    expect(PAGINA).toMatch(/\*\*Servo 2 op 90\*\*/);
    expect(PAGINA).toMatch(/kies \*\*10\*\*/);
  });

  it('geen twee kaarten met hetzelfde symptoom', () => {
    // Zelfde regel als in click-golfer-doorloop.test.ts, voor deze pagina.
    const titels = [...PAGINA.matchAll(/<Probleem titel="([^"]+)">/g)].map((m) =>
      m[1].toLowerCase(),
    );
    for (const woord of [
      'trilt',
      'zoemt',
      'schokt',
      'warm',
      'leeg',
      'nooit',
      'niets',
      'twee keer',
    ]) {
      expect(titels.filter((t) => new RegExp(`\\b${woord}\\b`).test(t)).length, woord).toBeLessThan(
        2,
      );
    }
  });

  it("de programma's lezen A1 echt en sturen servo 10 echt aan", () => {
    const tweeSensoren = code('oefenen-twee-sensoren.json');
    expect(tweeSensoren).toContain('analogRead(A0)');
    expect(tweeSensoren).toContain('analogRead(A1)');

    // Twee servo's op 9 en 10 gaan samen: de Servo-bibliotheek van de Nano
    // stuurt ze allebei met dezelfde timer aan.
    const eigen = code('oefenen-eigen-servo.json');
    expect(eigen).toContain('myServo9.attach(9);');
    expect(eigen).toContain('myServo10.attach(10);');
    // Een slag zoals in bal-slaan: uithalen naar 0°, en terug naar 90°,
    // waar de servo ook na het opstarten staat.
    const slag = (sensor: string, grens: number, servo: number) =>
      new RegExp(
        `if \\(analogRead\\(${sensor}\\) < ${grens}\\) \\{\\s*myServo${servo}\\.write\\(0\\);\\s*delay\\(500\\);\\s*myServo${servo}\\.write\\(90\\);\\s*delay\\(2000\\);`,
      );
    expect(eigen).toMatch(slag('A0', 300, 9));
    expect(eigen).toMatch(slag('A1', 350, 10));

    const gekruist = code('oefenen-gekruist.json');
    expect(gekruist).toMatch(slag('A0', 300, 10));
    expect(gekruist).toMatch(slag('A1', 350, 9));

    expect(code('oefenen-allebei.json')).toContain(
      'if (analogRead(A0) < 300 && analogRead(A1) < 350) {',
    );

    // Een bal bij allebei: A0 komt eerst, dus 45°.
    expect(code('oefenen-stand-per-sensor.json')).toMatch(
      /if \(analogRead\(A0\) < 300\) \{\s*myServo9\.write\(45\);\s*\} else \{\s*if \(analogRead\(A1\) < 350\) \{\s*myServo9\.write\(135\);\s*\} else \{\s*myServo9\.write\(90\);/,
    );
  });

  it("gespiegeld betekent tegelijk: geen duurt tussen de twee servo's", () => {
    expect(code('oefenen-gespiegeld.json')).toMatch(
      /myServo9\.write\(45\);\s*myServo10\.write\(135\);\s*delay\(1000\);\s*myServo9\.write\(135\);\s*myServo10\.write\(45\);/,
    );
  });
});

describe('elke oefening voegt hooguit één nieuw blok toe', () => {
  // Wat de leerling al kent: de blokken uit de lessen vóór deze pagina.
  const VOORAF = ['easybloqs.md', 'ir-sensor.md', 'servo.md', 'bal-slaan.md'];
  // De nieuwe blokken op deze pagina, met hun groep in Easybloqs
  // (leaphy-webbased-svelte, packages/client/src/lib/domain/blockly/toolbox.ts)
  // en hoe de les ze noemt.
  const NIEUW: Record<string, [string, string]> = {
    leaphy_serial_print_value: ['Actuatoren', 'Toon op scherm'],
    logic_operation: ['Getal blokken', 'en'],
    'controls_if+anders': ['Denk stappen', 'als … dan … anders'],
  };

  it('vindt acht oefeningen, doorgenummerd', () => {
    expect(oefeningen().map((o) => o.kop.match(/^### Oefening (\d+):/)?.[1])).toEqual([
      '1',
      '2',
      '3',
      '4',
      '5',
      '6',
      '7',
      '8',
    ]);
  });

  it('en noemt bij het nieuwe blok de groep', () => {
    const bekend = new Set<string>();
    for (const les of VOORAF) for (const s of blokkenVan(tekst(les))) bekend.add(s);

    const fout: string[] = [];
    for (const { kop, inhoud } of oefeningen()) {
      const namen = [...inhoud.matchAll(/programma=\{(\w+)\}/g)].map((m) => m[1]);
      const hier = new Set<string>();
      for (const naam of namen) {
        for (const blok of programma(bestandVan(inhoud, naam)).blocks.blocks) soorten(blok, hier);
      }
      const nieuw = [...hier].filter((s) => !bekend.has(s));
      if (nieuw.length > 1) fout.push(`${kop}: ${nieuw.join(', ')}`);
      for (const s of nieuw) {
        const uitleg = NIEUW[s];
        if (!uitleg) fout.push(`${kop}: ${s} staat niet in NIEUW`);
        else {
          if (!inhoud.includes(`**${uitleg[0]}**`)) fout.push(`${kop}: ${s} zonder ${uitleg[0]}`);
          if (!inhoud.includes(`**${uitleg[1]}**`)) fout.push(`${kop}: ${s} zonder ${uitleg[1]}`);
        }
        bekend.add(s);
      }
    }
    expect(fout).toEqual([]);
    expect([...bekend]).toEqual(expect.arrayContaining(Object.keys(NIEUW)));
  });

  it('elke oefening heeft een tip en een antwoord met blokken, of een voorspelling bij het programma', () => {
    // De kleine eerste stap van een deel verandert één pin in een programma
    // dat de leerling al heeft. Daar is niets te puzzelen; de leerling
    // voorspelt wat er gebeurt, en kijkt dat na op zijn robot.
    const zonder = oefeningen()
      .filter(({ inhoud }) => {
        const tip = /<summary>Tip<\/summary>/.test(inhoud);
        const antwoord = /<summary>Antwoord<\/summary>\s*<Blokken programma=/.test(inhoud);
        const voorspel = /<Blokken programma=[\s\S]*<Voorspel vraag=/.test(inhoud);
        return !(tip && antwoord) && !voorspel;
      })
      .map((o) => o.kop);
    expect(zonder).toEqual([]);
  });
});

describe('de overstap vanuit bal-slaan is klein', () => {
  // De pagina liet de leerling eerst een tweede sensor én een tweede servo
  // aansluiten, en oefening 1 bracht meteen een tweede sensor en een nieuw
  // blok. Voor groep 7/8 was die stap te groot. Nu komt er eerst alleen een
  // sensor bij, dan alleen een servo, en pas in het laatste deel samen. Elk
  // deel begint met hetzelfde programma als in een eerdere les, met één
  // andere pin.

  it('de delen staan in deze volgorde: eerst de sensor, dan de servo, dan samen', () => {
    const plek = DELEN.map((kop) => PAGINA.search(new RegExp(`^${kop}$`, 'm')));
    expect(
      plek.every((p) => p !== -1),
      plek.join(', '),
    ).toBe(true);
    expect([...plek].sort((a, b) => a - b)).toEqual(plek);
  });

  it('elk deel sluit alleen zijn eigen onderdeel aan', () => {
    const sensor = aansluittabel(deel(DELEN[0]));
    const servo = aansluittabel(deel(DELEN[1]));
    expect(sensor).toMatch(/het signaal van \*\*A1\*\*/);
    expect(sensor).not.toMatch(/D10/);
    expect(servo).toMatch(/het signaal van \*\*D10\*\*/);
    expect(servo).not.toMatch(/A1/);
    // Wie iets aansluit, zet de robot eerst uit en daarna weer aan.
    for (const kop of DELEN.slice(0, 2)) {
      const inhoud = deel(kop);
      const uit = inhoud.indexOf('uit met de knop **ON/OFF**');
      expect(uit, kop).toBeGreaterThan(-1);
      expect(inhoud.slice(uit), kop).toMatch(/weer aan met \*\*ON\/OFF\*\*/);
    }
    // Het laatste deel sluit niets meer aan.
    expect(aansluittabel(deel(DELEN[2]))).toBe('');
  });

  it("vóór het laatste deel gebruikt geen voorbeeld twee sensoren én twee servo's", () => {
    const vooraf = DELEN.slice(0, 2).flatMap((kop) => programmasIn(deel(kop)));
    expect(vooraf.length).toBeGreaterThan(0);
    const samen = vooraf.filter((bestand) => {
      const { sensoren, servos } = pinnen(bestand);
      return sensoren.size > 1 && servos.size > 1;
    });
    expect(samen).toEqual([]);
    // In het deel van de sensor stuurt geen programma een tweede servo aan,
    // en in het deel van de servo leest geen programma een tweede sensor.
    for (const bestand of programmasIn(deel(DELEN[0])))
      expect([...pinnen(bestand).servos], bestand).not.toContain('10');
    for (const bestand of programmasIn(deel(DELEN[1])))
      expect([...pinnen(bestand).sensoren], bestand).not.toContain('A1');
  });

  it('elk deel begint met een programma dat de leerling al kent, met één andere pin', () => {
    const eerste = (kop: string) => programmasIn(deel(kop))[0];
    expect(code(eerste(DELEN[0]))).toBe(
      code('bal-slaan.json').replaceAll('analogRead(A0)', 'analogRead(A1)'),
    );
    expect(code(eerste(DELEN[1]))).toBe(
      code('servo-heen-en-weer.json').replace(/myServo9\b|attach\(9\)/g, (m) =>
        m.replace('9', '10'),
      ),
    );
    // En die eerste oefening laat de leerling voorspellen wat er gebeurt.
    for (const kop of DELEN.slice(0, 2)) {
      const eersteOefening = deel(kop).split(/^(?=### Oefening)/m)[1] ?? '';
      expect(eersteOefening, kop).toMatch(/<Voorspel vraag=/);
    }
  });

  it('de inleiding stuurt wie maar één onderdeel heeft naar het juiste deel', () => {
    const inleiding = PAGINA.slice(0, PAGINA.indexOf(`${DELEN[0]}\n`));
    expect(inleiding).toMatch(
      /alleen een tweede sensor\?[^.]*\[Een tweede sensor\]\(#een-tweede-sensor\)/,
    );
    expect(inleiding).toMatch(
      /alleen een tweede servo\?[^.]*\[Een tweede servo\]\(#een-tweede-servo\)/,
    );
  });
});

describe('de kaarten bij twee sensoren kloppen met wat de robot doet', () => {
  // De kaart "met een bal voor de tweede sensor gaan allebei de getallen
  // omlaag" gaf als oorzaak dat in het tweede Lees anapin nog A0 staat.
  // Dan lezen beide regels de eerste sensor: een bal voor de tweede doet
  // niets, en een bal voor de eerste laat allebei de getallen zakken. Hier
  // spelen we dat na met de code die Easybloqs ervan maakt.

  // Welke regel op het scherm (`A0 =`, `A1 =`) welke pin leest.
  function regels(prog: Programma): Map<string, string> {
    const ws = new B.Workspace();
    try {
      B.serialization.workspaces.load(prog, ws);
      const c = arduino.workspaceToCode(ws);
      return new Map(
        [...c.matchAll(/"(A\d)"[^;]*;[\s\S]*?analogRead\((A\d)\)/g)].map((m) => [m[1], m[2]]),
      );
    } finally {
      ws.dispose();
    }
  }

  // Welke regels omlaag gaan met een bal voor de sensor op `pin`.
  const omlaag = (r: Map<string, string>, pin: string) =>
    [...r].filter(([, gelezen]) => gelezen === pin).map(([regel]) => regel);

  function kaart(oorzaak: RegExp): { titel: string; inhoud: string } {
    const kaarten = [...PAGINA.matchAll(/<Probleem titel="([^"]+)">([\s\S]*?)<\/Probleem>/g)];
    const gevonden = kaarten.find(([, , inhoud]) =>
      oorzaak.test(inhoud.match(/\*\*Oorzaak:\*\*([^\n]*)/)?.[1] ?? ''),
    );
    expect(gevonden, String(oorzaak)).toBeDefined();
    return { titel: gevonden?.[1] ?? '', inhoud: gevonden?.[2] ?? '' };
  }

  it('het goede programma: elke sensor zijn eigen regel', () => {
    const r = regels(programma('oefenen-twee-sensoren.json'));
    expect(omlaag(r, 'A0')).toEqual(['A0']);
    expect(omlaag(r, 'A1')).toEqual(['A1']);
  });

  it('nog A0 in het tweede Lees anapin: de bal voor de eerste sensor laat allebei zakken', () => {
    const fout = programma('oefenen-twee-sensoren.json');
    const tekst = JSON.stringify(fout).replace('"PIN":"A1"', '"PIN":"A0"');
    const r = regels(JSON.parse(tekst));
    expect(omlaag(r, 'A0')).toEqual(['A0', 'A1']);
    expect(omlaag(r, 'A1')).toEqual([]);

    const { titel } = kaart(/Lees anapin\*\* staat nog A0/);
    expect(titel).toMatch(/eerste sensor/);
    expect(titel).toMatch(/allebei/);
    expect(titel).not.toMatch(/tweede sensor/);
  });

  it('de draad niet op A1: de kaart zegt hoe je hem onderscheidt van een fout in het programma', () => {
    // Ook met nog A0 in het programma verandert de regel A1 niet met een
    // bal voor de tweede sensor. Het verschil zie je met een bal voor de
    // eerste. En op A0 van het shield zit de eerste sensor al.
    const { inhoud } = kaart(/draad van de tweede sensor/);
    expect(inhoud).toMatch(/\*\*Zelf vinden:\*\*[^\n]*eerste sensor/);
    expect(inhoud).not.toMatch(/op A0 van het shield/);
  });
});

describe('elke oefening zegt waar je begint', () => {
  // Oefening 3 en 4 zeiden niet met welk programma je begint, en de tip bij
  // 3 ging uit van een leeg gat achter als, terwijl daar in het programma
  // van oefening 1 al een vergelijking zit.
  it('met een programma op de pagina, of met een programma dat je al hebt', () => {
    const zonder = oefeningen()
      .filter(({ inhoud }) => {
        // Blokken buiten een uitklapblok: die bouw je na.
        const buiten = inhoud.replace(/<details>[\s\S]*?<\/details>/g, '');
        if (/<Blokken programma=/.test(buiten)) return false;
        return !/\b(Begin|Pak) (met )?(je|het|een) [^.]*programma/i.test(inhoud);
      })
      .map((o) => o.kop);
    expect(zonder).toEqual([]);
  });

  it('oefening 3 haalt eerst de vergelijking uit het gat achter als', () => {
    const drie = oefeningen().find((o) => o.kop.startsWith('### Oefening 3'))?.inhoud ?? '';
    expect(drie).toMatch(/Begin met je programma van oefening 1/);
    expect(drie).toMatch(/uit het gat/);
  });

  it('de inleiding zegt welke oefening de puzzel is', () => {
    const inleiding = PAGINA.slice(0, PAGINA.indexOf(`${DELEN[0]}\n`));
    expect(inleiding).not.toMatch(/De laatste oefening is een puzzel/);
    expect(inleiding).toMatch(/Oefening \d+[^.]*puzzel/);
  });

  it('aan het eind haal je de tweede sensor en servo weer los', () => {
    // Bij de extra's komt groen op D10, en in de toren hoort de servo van D9.
    expect(PAGINA).toMatch(/haal de tweede sensor en de tweede servo weer los/);
    expect(tekst('bouwen.md')).toMatch(/tweede servo op D10, haal die dan los/);
    expect(tekst('extras.md')).toMatch(/tweede servo op D10\? Haal die dan los/);
  });
});

describe('elke voorspelvraag is een <Voorspel>', () => {
  // Oefening 2, Mikken en Een naam voor je blokken hadden hun voorspelvraag
  // nog als uitklapblok, de rest van de cursus als <Voorspel>: daar kiest
  // de leerling eerst, en pas dan ziet hij het antwoord.
  it('geen <summary>Voorspel in de Click Golfer', () => {
    const fout = readdirSync(CLICK)
      .filter((f) => f.endsWith('.md'))
      .filter((f) => /<summary>\s*Voorspel/i.test(tekst(f)));
    expect(fout).toEqual([]);
  });
});

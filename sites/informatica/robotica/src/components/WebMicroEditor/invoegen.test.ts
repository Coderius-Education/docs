import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import api from '../../lego-tests/leaphy-api.json';
import { BOUWSTENEN, type Bouwsteen, GROEPEN, STARTCODE, bouwsteenMetId } from './bouwstenen';
import { alsProgramma, bovenaan, leesbaar, pinMelding, verschil, voegIn } from './invoegen';

// Het palet links in de editor zet een bouwsteen in het programma. Waar de
// code, de import en de opzet terechtkomen, is het hele gedrag; deze test
// speelt de klikken van een leerling na. De gevallen onder "wat een review
// vond" gaven in de eerste versie kapotte code (PR #220).

const SITE = fileURLToPath(new URL('../../..', import.meta.url));

const steen = (id: string): Bouwsteen => {
  const b = bouwsteenMetId(id);
  if (!b) throw new Error(`geen bouwsteen ${id}`);
  return b;
};

const regelVan = (doc: string, positie: number) => doc.slice(0, positie).split('\n').length - 1;

/** Klik een rij bouwstenen achter elkaar, telkens op de regel van de cursor. */
function klik(begin: string, ...ids: string[]): { doc: string; selectie: string } {
  let doc = begin;
  let van = begin.length;
  let tot = begin.length;
  for (const id of ids) {
    const uit = voegIn(doc, regelVan(doc, tot), steen(id));
    ({ doc, van, tot } = uit);
  }
  return { doc, selectie: doc.slice(van, tot) };
}

/** De regel (vanaf 0) waarop `tekst` staat. */
const regelMet = (doc: string, tekst: string) => {
  const i = doc.split('\n').findIndex((r) => r.includes(tekst));
  if (i === -1) throw new Error(`geen regel met ${tekst}`);
  return i;
};

const KNIPPEREN = [
  'from machine import Pin',
  'from time import sleep',
  '',
  "lampje = Pin('LED', Pin.OUT)",
  '',
  'while True:',
  '    lampje.on()',
  '    sleep(1)',
  '',
].join('\n');

describe('een bouwsteen invoegen', () => {
  it('bouwt van buiten naar binnen: een lus, een sensor erin, een print eronder', () => {
    const { doc } = klik('', 'herhaal-altijd', 'afstand-tof', 'toon', 'wacht');
    expect(doc).toBe(
      [
        'from leaphymicropython.sensors.tof import TimeOfFlight',
        'from time import sleep',
        '',
        'tof = TimeOfFlight(',
        '    channel=0,',
        '    sda_gpio_pin="SDA", scl_gpio_pin="SCL",',
        ')',
        '',
        'while True:',
        '    afstand = tof.get_distance()',
        '    print("Hallo")',
        '    sleep(1)',
      ].join('\n'),
    );
  });

  it('zet de cursor in het gat van een lus, met de inspringing er al', () => {
    const uit = voegIn('', 0, steen('herhaal-altijd'));
    expect(uit.doc).toBe('while True:\n    ');
    expect(uit.van).toBe(uit.doc.length);
    expect(uit.tot).toBe(uit.doc.length);
  });

  it('selecteert wat de leerling nog invult: de voorwaarde, of de naam', () => {
    for (const id of ['herhaal-zolang', 'als', 'als-anders'])
      expect(klik('', id).selectie, id).toBe('voorwaarde');
    expect(klik('', 'onthoud')).toEqual({ doc: 'naam = 0', selectie: 'naam' });
  });

  it('zet het gat van Herhaal 3 keer vóór het ophogen van de teller', () => {
    const uit = voegIn('', 0, steen('herhaal-keer'));
    expect(uit.doc).toBe('teller = 0\nwhile teller < 3:\n    \n    teller = teller + 1\n');
    expect(uit.doc.slice(0, uit.van)).toBe('teller = 0\nwhile teller < 3:\n    ');
  });

  it('zet code op een regel die een blok opent in dat blok', () => {
    expect(klik('while True:', 'toon').doc).toBe('while True:\n    print("Hallo")');
  });

  it('zet code onder een gewone regel, even ver ingesprongen', () => {
    const doc = 'while True:\n    print(1)\nprint(2)';
    expect(voegIn(doc, 1, steen('toon')).doc).toBe(
      'while True:\n    print(1)\n    print("Hallo")\nprint(2)',
    );
  });

  it('een dubbele punt in commentaar of in tekst opent geen blok', () => {
    expect(voegIn('print("let op:")', 0, steen('toon')).doc).toBe(
      'print("let op:")\nprint("Hallo")',
    );
    expect(voegIn('x = 1  # let op:', 0, steen('toon')).doc).toBe(
      'x = 1  # let op:\nprint("Hallo")',
    );
  });

  it('een haakje of een hekje in tekst telt niet als haakje of commentaar', () => {
    // Zonder dat zou de regel "nog open" staan en kwam de code pas veel lager.
    expect(voegIn('print("(")\nprint(2)', 0, steen('toon')).doc).toBe(
      'print("(")\nprint("Hallo")\nprint(2)',
    );
    expect(voegIn('if x == "#":', 0, steen('toon')).doc).toBe('if x == "#":\n    print("Hallo")');
    expect(voegIn("print('it\\'s (')\nprint(2)", 0, steen('toon')).doc).toBe(
      "print('it\\'s (')\nprint(\"Hallo\")\nprint(2)",
    );
  });

  it('breekt een opdracht over meer regels niet open', () => {
    const doc = 'print(\n    1,\n    2,\n)\nprint(3)';
    for (const regel of [0, 1, 2, 3])
      expect(voegIn(doc, regel, steen('toon')).doc, `regel ${regel}`).toBe(
        'print(\n    1,\n    2,\n)\nprint("Hallo")\nprint(3)',
      );
    // De inspringing is die van het begin van de opdracht, niet van het haakje.
    const inLus = 'while True:\n    print(\n        1,\n)\n';
    expect(voegIn(inLus, 2, steen('toon')).doc).toBe(
      'while True:\n    print(\n        1,\n)\n    print("Hallo")\n',
    );
  });

  it('zet de opzet één keer, vóór de lus en niet erin', () => {
    const { doc } = klik('', 'herhaal-altijd', 'rijd-vooruit', 'wacht', 'motoren-stop');
    expect(doc.match(/motoren = DCMotors\(/g)).toHaveLength(1);
    expect(doc.match(/import DCMotors/g)).toHaveLength(1);
    const regels = doc.split('\n');
    expect(regels.indexOf('motor_b = motoren.motor_b')).toBeLessThan(regels.indexOf('while True:'));
    expect(doc.endsWith('    motor_a.forward(0)\n    motor_b.forward(0)')).toBe(true);
  });

  it('zet een tweede onderdeel onder het eerste, nog steeds vóór de lus', () => {
    const { doc } = klik('', 'herhaal-altijd', 'afstand-tof', 'lampje-aan');
    const regels = doc.split('\n');
    const tof = regels.indexOf('tof = TimeOfFlight(');
    const lampje = regels.indexOf("lampje = Pin('LED', Pin.OUT)");
    expect(tof).toBeGreaterThan(-1);
    expect(lampje).toBeGreaterThan(tof);
    expect(lampje).toBeLessThan(regels.indexOf('while True:'));
  });

  it('zet een witregel tussen twee onderdelen als er een over meer regels loopt', () => {
    const { doc } = klik('', 'herhaal-altijd', 'afstand-tof', 'rijd-vooruit', 'lampje-aan');
    const regels = doc.split('\n');
    const motoren = regels.indexOf('motoren = DCMotors(');
    expect(regels.slice(motoren - 2, motoren)).toEqual([')', '']);
    const lampje = regels.indexOf("lampje = Pin('LED', Pin.OUT)");
    // Het lampje is één regel en volgt op één regel: direct eronder.
    expect(regels.slice(lampje - 1, lampje + 3)).toEqual([
      'motor_b = motoren.motor_b',
      "lampje = Pin('LED', Pin.OUT)",
      '',
      'while True:',
    ]);
    // Nergens twee witregels achter elkaar.
    expect(doc).not.toMatch(/\n\n\n/);
  });

  it('zet een witregel onder een onderdeel over meer regels, ook als het tweede één regel is', () => {
    const { doc } = klik('', 'herhaal-altijd', 'afstand-tof', 'lampje-aan');
    const regels = doc.split('\n');
    const lampje = regels.indexOf("lampje = Pin('LED', Pin.OUT)");
    expect(regels.slice(lampje - 2, lampje)).toEqual([')', '']);
  });

  it('zet twee onderdelen van één regel direct onder elkaar', () => {
    const { doc } = klik('', 'lampje-aan', 'drukknop');
    expect(doc).toContain(
      'lampje = Pin(\'LED\', Pin.OUT)\nknop = Pin("D7", Pin.IN, Pin.PULL_UP)\n',
    );
  });

  it('vult een import aan in plaats van hem te herhalen', () => {
    const { doc } = klik('', 'lampje-aan', 'buzzer-aan', 'potmeter');
    expect(doc.split('\n')[0]).toBe('from machine import Pin, PWM, ADC');
    expect(doc.match(/from machine import/g)).toHaveLength(1);
  });

  it('kent een import met een ster, met een andere naam, of over meer regels', () => {
    expect(voegIn('from machine import *\n', 1, steen('potmeter')).doc).not.toMatch(/import .*ADC/);
    expect(voegIn('from machine import ADC as A\n', 1, steen('potmeter')).doc).toMatch(
      /^from machine import ADC as A\n/,
    );
    const haakjes = 'from machine import (\n    Pin,\n)\n\nprint(1)\n';
    const uit = voegIn(haakjes, 4, steen('wacht')).doc;
    // De nieuwe import komt onder de bestaande, niet erboven of ertussen.
    expect(uit).toBe(
      'from machine import (\n    Pin,\n)\nfrom time import sleep\n\nprint(1)\nsleep(1)\n',
    );
  });

  it('laat een import staan die het niet veilig kan aanvullen', () => {
    // Een puntkomma, een backslash of commentaar: een eigen regel erbij.
    for (const regel of [
      'from machine import Pin; from time import sleep',
      'from machine import Pin  # de pinnen',
    ]) {
      const uit = voegIn(`${regel}\n`, 1, steen('potmeter')).doc.split('\n');
      expect(uit[0], regel).toBe(regel);
      expect(uit, regel).toContain('from machine import ADC');
    }
    const backslash = 'from machine import Pin, \\\n    PWM\n';
    const uit = voegIn(backslash, 2, steen('potmeter')).doc;
    expect(uit.startsWith(backslash)).toBe(true);
    expect(uit).toContain('\nfrom machine import ADC\n');
  });

  it('begint bij de startcode een nieuw programma', () => {
    // De startcode is een voorbeeld; de eerste bouwsteen kwam er eerst tussen.
    expect(klik(STARTCODE, 'herhaal-altijd').doc).toBe('while True:\n    ');
    // Is de startcode aangepast, dan is het werk van de leerling.
    const eigen = `${STARTCODE}print(2)\n`;
    expect(voegIn(eigen, 2, steen('toon')).doc).toBe(`${STARTCODE}print(2)\nprint("Hallo")\n`);
  });

  it('laat commentaar bovenaan het bestand boven de imports staan', () => {
    const doc = "# Mijn robot\nprint('start')\n";
    expect(voegIn(doc, 1, steen('afstand-ultrasoon')).doc).toBe(
      [
        '# Mijn robot',
        'from leaphymicropython.sensors.sonar import read_distance',
        '',
        "print('start')",
        'afstand_cm = read_distance("D7", "D8")',
        '',
      ].join('\n'),
    );
  });

  it('verandert niets aan de rest van het programma', () => {
    const doc = 'from time import sleep\n\nwhile True:\n    sleep(1)\n';
    expect(voegIn(doc, 3, steen('toon')).doc).toBe(
      'from time import sleep\n\nwhile True:\n    sleep(1)\n    print("Hallo")\n',
    );
  });

  it('houdt een regel buiten het document binnen het document', () => {
    for (const regel of [-5, 99, Number.NaN])
      expect(() => voegIn('print(1)', regel, steen('toon'))).not.toThrow();
    expect(voegIn('print(1)\nprint(2)', -5, steen('toon')).doc).toBe(
      'print(1)\nprint("Hallo")\nprint(2)',
    );
    expect(voegIn('print(1)\nprint(2)', 99, steen('toon')).doc).toBe(
      'print(1)\nprint(2)\nprint("Hallo")',
    );
  });
});

describe('wat een review vond: de plek van de code', () => {
  it('zet code nooit boven de regel die zijn onderdeel aanmaakt', () => {
    // Na herladen of "Open in de editor" staat de cursor op regel 0.
    for (const regel of [0, 1, 2, 3]) {
      const uit = voegIn(KNIPPEREN, regel, steen('lampje-uit')).doc.split('\n');
      expect(uit.indexOf('lampje.off()'), `regel ${regel}`).toBeGreaterThan(
        uit.indexOf("lampje = Pin('LED', Pin.OUT)"),
      );
      expect(uit.indexOf('lampje.off()'), `regel ${regel}`).toBeLessThan(
        uit.indexOf('while True:'),
      );
    }
    expect(voegIn(KNIPPEREN, 0, steen('lampje-uit')).doc).toBe(
      [
        'from machine import Pin',
        'from time import sleep',
        '',
        "lampje = Pin('LED', Pin.OUT)",
        '',
        'lampje.off()',
        '',
        'while True:',
        '    lampje.on()',
        '    sleep(1)',
        '',
      ].join('\n'),
    );
  });

  it('zet code niet midden in de kop, ook niet tussen de regels van de motoren', () => {
    const begin = klik('', 'rijd-vooruit').doc;
    for (const tekst of ['pwm_pin_motor_a', 'motoren = DCMotors(', 'motor_a = motoren']) {
      const uit = voegIn(begin, regelMet(begin, tekst), steen('motoren-stop')).doc.split('\n');
      expect(uit.indexOf('motor_a.forward(0)'), tekst).toBeGreaterThan(
        uit.indexOf('motor_b = motoren.motor_b'),
      );
    }
  });

  it('zet code zonder eigen onderdeel ook onder de kop, niet tussen de imports', () => {
    const uit = voegIn(KNIPPEREN, 0, steen('toon')).doc.split('\n');
    expect(uit.indexOf('print("Hallo")')).toBeGreaterThan(
      uit.indexOf("lampje = Pin('LED', Pin.OUT)"),
    );
    expect(voegIn('from time import sleep\nfrom machine import Pin\n', 0, steen('toon')).doc).toBe(
      'from time import sleep\nfrom machine import Pin\n\nprint("Hallo")',
    );
  });

  it('een onderdeel dat pas na de cursor wordt aangemaakt, blijft boven zijn code', () => {
    const doc = "print('start')\n\nlampje = Pin('LED', Pin.OUT)\nprint('klaar')\n";
    const uit = voegIn(doc, 0, steen('lampje-aan')).doc.split('\n');
    expect(uit.indexOf('lampje.on()')).toBeGreaterThan(uit.indexOf("lampje = Pin('LED', Pin.OUT)"));
    expect(uit.filter((r) => r.startsWith('lampje = '))).toHaveLength(1);
  });

  it('een meting of een teller hoort niet bij de kop', () => {
    const doc = [
      'from time import sleep',
      '',
      'teller = 0',
      'while teller < 3:',
      '    sleep(1)',
      '',
    ].join('\n');
    const uit = voegIn(doc, 4, steen('lampje-aan')).doc.split('\n');
    expect(uit.indexOf("lampje = Pin('LED', Pin.OUT)")).toBeLessThan(uit.indexOf('teller = 0'));
    // Een meting op het hoogste niveau: de opzet van een tweede sensor komt
    // erboven, niet erachter.
    const { doc: twee } = klik('', 'lijn-links', 'drukknop');
    const regels = twee.split('\n');
    expect(regels.indexOf('knop = Pin("D7", Pin.IN, Pin.PULL_UP)')).toBeLessThan(
      regels.indexOf('kleur_links = links.black_or_white()'),
    );
  });

  it('een lege regel midden in een blok krijgt de inspringing van wat eronder staat', () => {
    // CodeMirror haalt de spaties van een lege regel weg; de lessen hebben
    // zulke regels in hun lus. Eerst kwam de code op kolom 0.
    const doc =
      'while True:\n    if x:\n        print(1)\n    else:\n        print(2)\n\n    sleep(1)\n';
    expect(voegIn(doc, 5, steen('toon')).doc).toBe(
      'while True:\n    if x:\n        print(1)\n    else:\n        print(2)\n    print("Hallo")\n    sleep(1)\n',
    );
    // Met eigen spaties, dieper dan wat eronder staat: in het blok erboven.
    const diep = doc.replace('print(2)\n\n', 'print(2)\n        \n');
    expect(voegIn(diep, 5, steen('toon')).doc).toContain(
      '        print(2)\n        print("Hallo")\n',
    );
  });

  it('een lege regel direct onder een blokopener hoort in het blok, ook zonder spaties', () => {
    expect(voegIn('if x:\n\nprint(2)', 1, steen('toon')).doc).toBe(
      'if x:\n    print("Hallo")\nprint(2)',
    );
    // Alleen de regel direct eronder is het gat; een regel verder staat de
    // code na het blok.
    expect(voegIn('if x:\n    \n\nprint(2)', 2, steen('toon')).doc).toBe(
      'if x:\n    \nprint("Hallo")\nprint(2)',
    );
  });

  it('op de laatste lege regel na een eindeloze lus komt de code in de lus', () => {
    // Op kolom 0 achter `while True:` draait hij nooit.
    const uit = voegIn(KNIPPEREN, 8, steen('toon')).doc;
    expect(uit.endsWith('    sleep(1)\n    print("Hallo")')).toBe(true);
    // Na een lus die wel ophoudt, mag het op kolom 0.
    const telt = 'teller = 0\nwhile teller < 3:\n    teller = teller + 1\n';
    expect(voegIn(telt, 3, steen('toon')).doc.endsWith('\nprint("Hallo")')).toBe(true);
  });

  it('volgt de inspringing van het programma: tabs of twee spaties', () => {
    const tabs = 'while True:\n\tif x:\n\t\tprint(1)\n';
    expect(voegIn(tabs, 1, steen('als')).doc).toBe(
      'while True:\n\tif x:\n\t\tif voorwaarde:\n\t\t\t\n\t\tprint(1)\n',
    );
    const twee = 'while True:\n  print(1)\n';
    expect(voegIn(twee, 1, steen('herhaal-keer')).doc).toBe(
      'while True:\n  print(1)\n  teller = 0\n  while teller < 3:\n    \n    teller = teller + 1\n  \n',
    );
  });

  it('zet geen code in een tekst tussen drie aanhalingstekens of na een backslash', () => {
    const tekst = 'uitleg = """\neen\ntwee\n"""\nprint(1)';
    expect(voegIn(tekst, 1, steen('toon')).doc).toBe(
      'uitleg = """\neen\ntwee\n"""\nprint("Hallo")\nprint(1)',
    );
    const som = 'x = 1 + \\\n    2\nprint(x)';
    expect(voegIn(som, 0, steen('toon')).doc).toBe('x = 1 + \\\n    2\nprint("Hallo")\nprint(x)');
  });
});

describe('wat een review vond: de opzet en de namen', () => {
  it('vult een opzet aan waarvan een deel er al staat', () => {
    // De DC-motorpagina heeft code met alleen motor_a.
    const doc = [
      'from leaphymicropython.actuators.dcmotor import DCMotors',
      '',
      'motoren = DCMotors(',
      '    dir_pin_motor_a="D2",',
      '    pwm_pin_motor_a="D3",',
      '    dir_pin_motor_b="D4",',
      '    pwm_pin_motor_b="D11",',
      ')',
      'motor_a = motoren.motor_a',
      'motor_a.test()',
      '',
    ].join('\n');
    const uit = voegIn(doc, 9, steen('rijd-vooruit')).doc.split('\n');
    expect(uit.slice(8, 13)).toEqual([
      'motor_a = motoren.motor_a',
      'motor_b = motoren.motor_b',
      '',
      'motor_a.test()',
      'motor_a.forward(255)',
    ]);
    expect(uit.filter((r) => r.startsWith('motoren = '))).toHaveLength(1);
  });

  it('elke bouwsteen met een opzet zet die bij twee klikken één keer', () => {
    for (const b of BOUWSTENEN) {
      if (!b.opzet) continue;
      const twee = klik('', b.id, b.id).doc;
      expect(twee.split(b.opzet).length - 1, b.id).toBe(1);
    }
  });

  it('laat een aangepaste pin in de opzet staan', () => {
    const doc = 'from machine import Pin\n\nknop = Pin("D5", Pin.IN, Pin.PULL_UP)\n\n';
    const uit = voegIn(doc, 4, steen('drukknop')).doc;
    expect(uit).not.toContain('"D7"');
    expect(uit).toContain('ingedrukt = knop.value() == 0');
  });

  it('geeft een tweede lus een eigen teller', () => {
    // Met twee keer `teller` liep een lus in een lus drie keer, niet negen.
    const { doc } = klik('', 'herhaal-keer', 'herhaal-keer');
    expect(doc).toBe(
      [
        'teller = 0',
        'while teller < 3:',
        '    teller_2 = 0',
        '    while teller_2 < 3:',
        '        ',
        '        teller_2 = teller_2 + 1',
        '    teller = teller + 1',
        '',
      ].join('\n'),
    );
    expect(klik('', 'herhaal-keer', 'herhaal-keer', 'herhaal-keer').doc).toContain('teller_3 = 0');
    // Een vergelijking is geen toekenning.
    expect(voegIn('if teller == 3:\n    ', 1, steen('herhaal-keer')).doc).toContain(
      '    teller = 0',
    );
  });

  it('twee onderdelen delen geen naam, anders slaat de tweede zijn opzet over', () => {
    const namen = new Map<string, string>();
    for (const b of BOUWSTENEN) {
      for (const regel of (b.opzet ?? '').split('\n')) {
        const naam = /^([a-z_]\w*) = /.exec(regel)?.[1];
        if (!naam) continue;
        const eerder = namen.get(naam);
        if (eerder !== undefined) expect(regel, `${b.id}: ${naam}`).toBe(eerder);
        namen.set(naam, regel);
      }
    }
  });
});

describe('wat een review vond: gaten en blokken', () => {
  it('vult het gat als de cursor nog op de regel van het blok staat', () => {
    // Na het typen van de voorwaarde staat de cursor op de regel met `if`;
    // eerst schoof het lege gat onder de nieuwe code door.
    const doc = 'if x > 3:\n    \n';
    expect(voegIn(doc, 0, steen('toon')).doc).toBe('if x > 3:\n    print("Hallo")\n');
    // Staat er al iets in het blok, dan komt de code erboven en blijft de rest.
    expect(voegIn('if x > 3:\n\n    print(1)\n', 0, steen('toon')).doc).toBe(
      'if x > 3:\n    print("Hallo")\n\n    print(1)\n',
    );
  });

  it('laat onder een blok een regel staan om na het blok verder te gaan', () => {
    // Zonder die regel kwam je met klikken het blok niet meer uit.
    const { doc } = klik('', 'herhaal-altijd', 'als');
    expect(doc).toBe('while True:\n    if voorwaarde:\n        \n    ');
    // De cursor naar die regel, en de volgende bouwsteen staat na het blok.
    const na = voegIn(doc, 3, steen('wacht')).doc;
    expect(na).toBe(
      'from time import sleep\n\nwhile True:\n    if voorwaarde:\n        \n    sleep(1)',
    );
    // Staat er al een regel op die hoogte, dan komt er geen bij.
    const { doc: twee } = klik('', 'herhaal-altijd', 'als', 'als');
    expect(twee.match(/\n {4}$/g)).toHaveLength(1);
    expect(twee).not.toMatch(/\n {4}\n {4}\n/);
  });

  it('een eindeloze lus krijgt die regel niet: erna draait niets meer', () => {
    expect(voegIn('', 0, steen('herhaal-altijd')).doc).toBe('while True:\n    ');
  });

  it('zet geselecteerde regels in het gat van een lus of een als', () => {
    const doc = 'from time import sleep\n\nprint(1)\nsleep(1)\nprint(2)\n';
    const uit = voegIn(doc, 3, steen('herhaal-altijd'), { van: 2, tot: 3 });
    expect(uit.doc).toBe(
      'from time import sleep\n\nwhile True:\n    print(1)\n    sleep(1)\nprint(2)\n',
    );
    // De cursor staat achter de inhoud.
    expect(uit.doc.slice(0, uit.van).endsWith('    sleep(1)')).toBe(true);

    const als = voegIn(doc, 2, steen('als-anders'), { van: 3, tot: 2 });
    expect(als.doc).toBe(
      'from time import sleep\n\nif voorwaarde:\n    print(1)\n    sleep(1)\nelse:\n    \nprint(2)\n',
    );
    expect(als.doc.slice(als.van, als.tot)).toBe('voorwaarde');
  });

  it('houdt bij het omvatten de inspringing van de regels onderling', () => {
    const doc = 'while True:\n    if x:\n        print(1)\n    print(2)\n';
    expect(voegIn(doc, 1, steen('herhaal-keer'), { van: 1, tot: 3 }).doc).toBe(
      [
        'while True:',
        '    teller = 0',
        '    while teller < 3:',
        '        if x:',
        '            print(1)',
        '        print(2)',
        '        teller = teller + 1',
        '    ',
        '',
      ].join('\n'),
    );
  });

  it('omvat geen imports of onderdelen, en een bouwsteen zonder gat omvat niets', () => {
    const inKop = voegIn(KNIPPEREN, 0, steen('herhaal-altijd'), { van: 0, tot: 3 }).doc;
    expect(
      inKop.startsWith(
        "from machine import Pin\nfrom time import sleep\n\nlampje = Pin('LED', Pin.OUT)\n",
      ),
    ).toBe(true);
    const geenGat = voegIn('print(1)\nprint(2)\n', 1, steen('toon'), { van: 0, tot: 1 }).doc;
    expect(geenGat).toBe('print(1)\nprint(2)\nprint("Hallo")\n');
  });
});

describe('pinnen die al bezet zijn', () => {
  it('meldt een pin die een ander onderdeel al gebruikt', () => {
    const uit = klik('', 'buzzer-aan');
    expect(voegIn(uit.doc, 4, steen('buzzer-uit')).melding).toBeNull();
    const servo = voegIn(uit.doc, 4, steen('servo'));
    expect(servo.melding).toBe(
      'Pin D6 staat al op regel 4. Sluit dit onderdeel op een andere pin aan en zet die pin in je code.',
    );
    // Twee keer de servo is hetzelfde onderdeel.
    expect(voegIn(servo.doc, 6, steen('servo')).melding).toMatch(/^Pin D6 staat al op regel 4\./);
    expect(klik('', 'servo', 'servo').doc.match(/set_servo_angle/g)).toHaveLength(3);
    expect(voegIn(klik('', 'servo').doc, 2, steen('servo')).melding).toBeNull();
  });

  it('kent D14 tot en met D21 als A0 tot en met A7', () => {
    const { doc } = klik('', 'lijn-links');
    expect(voegIn(doc, 4, steen('lijn-digitaal')).melding).toMatch(/^Pin D14 is A0 op regel 4\./);
    expect(voegIn(doc, 4, steen('potmeter')).melding).toMatch(/^Pin A0 staat al op regel/);
    expect(voegIn(doc, 4, steen('lijn-rechts')).melding).toBeNull();
  });

  it('meldt de knop en de ultrasone sensor op D7, en niets bij SDA, SCL of het lampje', () => {
    const { doc } = klik('', 'drukknop');
    expect(voegIn(doc, 4, steen('afstand-ultrasoon')).melding).toMatch(
      /^Pin D7 staat al op regel 4\./,
    );
    const scherm = klik('', 'oled').doc;
    expect(voegIn(scherm, 8, steen('afstand-tof')).melding).toBeNull();
    expect(klik('', 'lampje-aan', 'lampje-uit').doc).toContain('lampje.off()');
    expect(voegIn(klik('', 'lampje-aan').doc, 4, steen('lampje-uit')).melding).toBeNull();
  });

  it('een pin in commentaar telt niet', () => {
    expect(pinMelding('# de servo zat op "D6"\n', steen('servo'))).toBeNull();
  });

  it('de tabel met dubbele namen klopt met de pinnen van het bord', () => {
    const pinnen = api.pinnen as Record<string, string>;
    for (let n = 0; n <= 7; n++) expect(pinnen[`D${n + 14}`], `A${n}`).toBe(pinnen[`A${n}`]);
    // En daarbuiten deelt geen D-pin een aansluiting met een A-pin.
    for (const [naam, gpio] of Object.entries(pinnen)) {
      const d = /^D(\d+)$/.exec(naam);
      if (!d || Number(d[1]) >= 14) continue;
      expect(
        Object.entries(pinnen).filter(([n, g]) => g === gpio && /^A\d$/.test(n)),
        naam,
      ).toEqual([]);
    }
  });
});

describe('verschil: wat er naar de editor gaat', () => {
  it('geeft het ingevoegde stuk', () => {
    expect(verschil('a\nb\n', 'a\nx\nb\n')).toEqual({ van: 2, tot: 2, tekst: 'x\n' });
  });
  it('werkt ook als er niets of alles verandert', () => {
    expect(verschil('abc', 'abc')).toEqual({ van: 3, tot: 3, tekst: '' });
    expect(verschil('', 'abc')).toEqual({ van: 0, tot: 0, tekst: 'abc' });
  });
  it('telt herhaalde tekst niet dubbel', () => {
    expect(verschil('aaa', 'aaaa')).toEqual({ van: 3, tot: 3, tekst: 'a' });
    expect(verschil('abab', 'ab')).toEqual({ van: 2, tot: 4, tekst: '' });
  });
  it('geeft voor elke bouwsteen een wijziging die het nieuwe document oplevert', () => {
    for (const b of BOUWSTENEN) {
      for (let regel = 0; regel < KNIPPEREN.split('\n').length; regel++) {
        const { doc } = voegIn(KNIPPEREN, regel, b);
        const { van, tot, tekst } = verschil(KNIPPEREN, doc);
        expect(KNIPPEREN.slice(0, van) + tekst + KNIPPEREN.slice(tot), b.id).toBe(doc);
      }
    }
  });
});

describe('de bouwstenen zelf', () => {
  const lessen: string[] = [];
  const loop = (map: string) => {
    for (const naam of readdirSync(map)) {
      const pad = join(map, naam);
      if (statSync(pad).isDirectory()) loop(pad);
      else if (/\.mdx?$/.test(naam)) lessen.push(readFileSync(pad, 'utf8'));
    }
  };
  loop(join(SITE, 'docs', 'onderdelen'));
  loop(join(SITE, 'lego_auto'));
  const blokken = lessen.flatMap((tekst) =>
    [...tekst.matchAll(/```python[^\n]*\n([\s\S]*?)```/g)].map((m) => m[1]),
  );

  it('heeft de drie groepen van het palet', () => {
    expect(GROEPEN.map((g) => g.label)).toEqual(['Sensoren', 'Actuatoren', 'Python']);
  });

  it('heeft unieke ids en labels', () => {
    expect(new Set(BOUWSTENEN.map((b) => b.id)).size).toBe(BOUWSTENEN.length);
    expect(new Set(BOUWSTENEN.map((b) => b.label)).size).toBe(BOUWSTENEN.length);
  });

  it('een label zegt wat de bouwsteen doet, niet hoe het in Python heet', () => {
    const labels = BOUWSTENEN.map((b) => b.label).join('\n');
    expect(labels).not.toMatch(/variabele|functie|while|print|\bif\b/i);
    expect(steen('onthoud').label).toBe('Onthoud iets');
    // "Herhaal als" las als één keer.
    expect(steen('herhaal-zolang').label).toBe('Herhaal zolang');
  });

  it('elke opzet staat letterlijk in een les: dezelfde naam en dezelfde pin', () => {
    // Een pin die afwijkt van het aansluitschema ving eerst geen enkele test.
    for (const b of BOUWSTENEN) {
      if (!b.opzet) continue;
      for (const regel of b.opzet.split('\n')) {
        expect(
          blokken.some((blok) => blok.split('\n').includes(regel)),
          `${b.id}: ${regel}`,
        ).toBe(true);
      }
      // En de opzet als geheel in één blok, in deze volgorde.
      const eerste = b.opzet.split('\n').slice(0, 4).join('\n');
      expect(
        blokken.some((blok) => blok.includes(eerste)),
        `${b.id}: de opzet als geheel`,
      ).toBe(true);
    }
  });

  it('een pin in de code van een bouwsteen staat op zijn onderdeelpagina', () => {
    for (const b of BOUWSTENEN) {
      if (!b.les) continue;
      const pagina = readFileSync(join(SITE, 'docs', 'onderdelen', `${b.les}.mdx`), 'utf8');
      for (const m of `${b.opzet ?? ''}\n${b.code}`.matchAll(/["'](D\d+|A\d|LED)["']/g))
        expect(pagina, `${b.id}: ${m[1]}`).toMatch(new RegExp(`["']${m[1]}["']`));
    }
  });

  it('aan zet aan en uit zet uit', () => {
    expect(steen('lampje-aan').code).toBe('lampje.on()');
    expect(steen('lampje-uit').code).toBe('lampje.off()');
    expect(steen('buzzer-uit').code).toBe('buzzer.duty_u16(0)');
    expect(steen('buzzer-aan').code).not.toContain('duty_u16(0)');
    expect(steen('rijd-vooruit').code).toMatch(
      /^motor_a\.forward\(255\)\nmotor_b\.forward\(255\)$/,
    );
    expect(steen('rijd-achteruit').code).toMatch(
      /^motor_a\.backward\(255\)\nmotor_b\.backward\(255\)$/,
    );
    expect(steen('motoren-stop').code).toBe('motor_a.forward(0)\nmotor_b.forward(0)');
  });

  it('de twee afstandssensoren geven hun eenheid in het label en een eigen naam', () => {
    expect(steen('afstand-tof').label).toContain('mm');
    expect(steen('afstand-ultrasoon').label).toContain('cm');
    expect(steen('afstand-ultrasoon').code).toMatch(/^afstand_cm = /);
    // De TOF zit op de Lego-auto op kanaal 0 van de multiplexer.
    expect(steen('afstand-tof').opzet).toContain('channel=0');
  });

  it('elke les bij een bouwsteen bestaat, en elke sensor en actuator heeft er een', () => {
    for (const b of BOUWSTENEN) {
      if (b.les)
        expect(
          () => statSync(join(SITE, 'docs', 'onderdelen', `${b.les}.mdx`)),
          b.id,
        ).not.toThrow();
    }
    for (const g of GROEPEN.filter((x) => x.id !== 'python'))
      for (const b of g.bouwstenen) expect(b.les, b.id).toBeTruthy();
  });

  it('leesbaar laat de tekens voor de selectie weg en toont een gat als puntjes', () => {
    expect(leesbaar(steen('herhaal-altijd'))).toBe('while True:\n    ...');
    expect(leesbaar(steen('als'))).toBe('if voorwaarde:\n    ...');
    for (const b of BOUWSTENEN) expect(leesbaar(b), b.id).not.toMatch(/[⟦⟧]/);
  });

  it('bovenaan noemt de import en de opzet die een bouwsteen erbij zet', () => {
    expect(bovenaan(steen('lampje-aan'))).toBe(
      "from machine import Pin\nlampje = Pin('LED', Pin.OUT)",
    );
    expect(bovenaan(steen('als'))).toBe('');
  });

  it('alsProgramma geeft een programma zonder gaten', () => {
    expect(alsProgramma(steen('als-anders'))).toBe(
      'voorwaarde = False\nif voorwaarde:\n    pass\nelse:\n    pass\n',
    );
    for (const b of BOUWSTENEN) {
      const programma = alsProgramma(b);
      expect(programma, b.id).not.toMatch(/[⟦⟧]/);
      expect(programma, b.id).not.toMatch(/^[ \t]+$/m);
      expect(programma.endsWith('\n') && !programma.endsWith('\n\n'), b.id).toBe(true);
    }
  });
});

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { BOUWSTENEN, type Bouwsteen, GROEPEN, STARTCODE, bouwsteenMetId } from './bouwstenen';
import { alsProgramma, leesbaar, verschil, voegIn } from './invoegen';

// Het palet links in de editor zet een bouwsteen in het programma. Waar de
// code, de import en de opzet terechtkomen, is het hele gedrag; deze test
// speelt de klikken van een leerling na.

const steen = (id: string): Bouwsteen => {
  const b = bouwsteenMetId(id);
  if (!b) throw new Error(`geen bouwsteen ${id}`);
  return b;
};

/** Klik een rij bouwstenen achter elkaar, telkens op de regel van de cursor. */
function klik(begin: string, ...ids: string[]): { doc: string; selectie: string } {
  let doc = begin;
  let cursor = begin.length;
  let tot = cursor;
  for (const id of ids) {
    const regel = doc.slice(0, cursor).split('\n').length - 1;
    const uit = voegIn(doc, regel, steen(id));
    doc = uit.doc;
    cursor = uit.tot;
    tot = uit.van;
  }
  return { doc, selectie: doc.slice(Math.min(tot, cursor), Math.max(tot, cursor)) };
}

describe('een bouwsteen invoegen', () => {
  it('bouwt van buiten naar binnen: een lus, een sensor erin, een print eronder', () => {
    const { doc } = klik('', 'herhaal-altijd', 'afstand-tof', 'print', 'wacht');
    expect(doc).toBe(
      [
        'from leaphymicropython.sensors.tof import TimeOfFlight',
        'from time import sleep',
        '',
        'tof = TimeOfFlight(',
        '    sda_gpio_pin="SDA",',
        '    scl_gpio_pin="SCL",',
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

  it('selecteert de voorwaarde die de leerling nog invult', () => {
    for (const id of ['herhaal-als', 'als', 'als-anders']) {
      expect(klik('', id).selectie, id).toBe('voorwaarde');
    }
  });

  it('zet het gat van Herhaal 3 keer vóór het ophogen van de teller', () => {
    const uit = voegIn('', 0, steen('herhaal-keer'));
    expect(uit.doc).toBe('teller = 0\nwhile teller < 3:\n    \n    teller = teller + 1');
    expect(uit.doc.slice(0, uit.van)).toBe('teller = 0\nwhile teller < 3:\n    ');
  });

  it('zet code op een regel die een blok opent in dat blok', () => {
    const { doc } = klik('while True:', 'print');
    expect(doc).toBe('while True:\n    print("Hallo")');
  });

  it('zet code onder een gewone regel, even ver ingesprongen', () => {
    const doc = 'while True:\n    print(1)\nprint(2)';
    expect(voegIn(doc, 1, steen('print')).doc).toBe(
      'while True:\n    print(1)\n    print("Hallo")\nprint(2)',
    );
  });

  it('een lege regel direct onder een blokopener hoort in het blok, ook zonder spaties', () => {
    expect(voegIn('if x:\n\nprint(2)', 1, steen('print')).doc).toBe(
      'if x:\n    print("Hallo")\nprint(2)',
    );
  });

  it('een dubbele punt in commentaar of in tekst opent geen blok', () => {
    expect(voegIn('print("let op:")', 0, steen('print')).doc).toBe(
      'print("let op:")\nprint("Hallo")',
    );
    expect(voegIn('x = 1  # let op:', 0, steen('print')).doc).toBe(
      'x = 1  # let op:\nprint("Hallo")',
    );
  });

  it('breekt een opdracht over meer regels niet open', () => {
    const begin = klik('', 'rijd-vooruit').doc;
    // De cursor staat midden in DCMotors(…): de code komt eronder.
    const regel = begin.split('\n').findIndex((r) => r.includes('pwm_pin_motor_a'));
    const uit = voegIn(begin, regel, steen('print')).doc.split('\n');
    const sluit = uit.indexOf(')');
    expect(uit[sluit + 1]).toBe('print("Hallo")');
    expect(uit.slice(0, sluit + 1)).toEqual(begin.split('\n').slice(0, sluit + 1));
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

  it('laat commentaar bovenaan het bestand boven de imports staan', () => {
    const { doc } = klik(STARTCODE, 'afstand-ultrasoon');
    expect(doc).toBe(
      [
        '# Schrijf hier je code.',
        'from leaphymicropython.sensors.sonar import read_distance',
        '',
        "print('Hallo Lego-auto!')",
        'afstand = read_distance("D7", "D8")',
      ].join('\n'),
    );
  });

  it('zet code nooit boven de imports', () => {
    const doc = 'from time import sleep\n\nprint(1)';
    const uit = voegIn(doc, 0, steen('afstand-ultrasoon')).doc.split('\n');
    expect(uit.indexOf('afstand = read_distance("D7", "D8")')).toBeGreaterThan(
      uit.indexOf('from leaphymicropython.sensors.sonar import read_distance'),
    );
    expect(uit.indexOf('afstand = read_distance("D7", "D8")')).toBeGreaterThan(
      uit.indexOf('from time import sleep'),
    );
  });

  it('een teller hoort niet bij de kop: de opzet komt erboven', () => {
    const doc = 'from time import sleep\n\nteller = 0\nwhile teller < 3:\n    ';
    const uit = voegIn(doc, 4, steen('lampje-aan')).doc.split('\n');
    expect(uit.indexOf("lampje = Pin('LED', Pin.OUT)")).toBeLessThan(uit.indexOf('teller = 0'));
    expect(uit.at(-1)).toBe('    lampje.on()');
  });

  it('verandert niets aan de rest van het programma', () => {
    const doc = 'from time import sleep\n\nwhile True:\n    sleep(1)\n';
    const uit = voegIn(doc, 3, steen('print')).doc;
    expect(uit).toBe('from time import sleep\n\nwhile True:\n    sleep(1)\n    print("Hallo")\n');
  });
});

describe('verschil: alleen het stuk dat verandert gaat naar de editor', () => {
  it('geeft het ingevoegde stuk', () => {
    expect(verschil('a\nb\n', 'a\nx\nb\n')).toEqual({ van: 2, tot: 2, tekst: 'x\n' });
  });
  it('werkt ook als er niets of alles verandert', () => {
    expect(verschil('abc', 'abc')).toEqual({ van: 3, tot: 3, tekst: '' });
    expect(verschil('', 'abc')).toEqual({ van: 0, tot: 0, tekst: 'abc' });
  });
  it('geeft voor elke bouwsteen een wijziging die het nieuwe document oplevert', () => {
    const oud = 'from time import sleep\n\nwhile True:\n    sleep(1)\n';
    for (const b of BOUWSTENEN) {
      const { doc } = voegIn(oud, 3, b);
      const { van, tot, tekst } = verschil(oud, doc);
      expect(oud.slice(0, van) + tekst + oud.slice(tot), b.id).toBe(doc);
    }
  });
});

describe('de bouwstenen zelf', () => {
  it('heeft de drie groepen van het palet', () => {
    expect(GROEPEN.map((g) => g.label)).toEqual(['Sensoren', 'Actuatoren', 'Python']);
  });

  it('heeft unieke ids en labels', () => {
    expect(new Set(BOUWSTENEN.map((b) => b.id)).size).toBe(BOUWSTENEN.length);
    expect(new Set(BOUWSTENEN.map((b) => b.label)).size).toBe(BOUWSTENEN.length);
  });

  it('elke bouwsteen met een opzet maakt een naam waaraan die opzet te herkennen is', () => {
    for (const b of BOUWSTENEN) {
      if (!b.opzet) continue;
      expect(b.opzet, b.id).toMatch(/^[a-z_]+ = /);
      // Twee keer klikken geeft één opzet.
      const twee = klik('', b.id, b.id).doc;
      expect(twee.split(b.opzet).length - 1, b.id).toBe(1);
    }
  });

  it('twee onderdelen delen geen naam, anders slaat de tweede zijn opzet over', () => {
    const namen = new Map<string, string>();
    for (const b of BOUWSTENEN) {
      if (!b.opzet) continue;
      const naam = b.opzet.split(' = ')[0];
      const eerder = namen.get(naam);
      if (eerder !== undefined) expect(b.opzet, `${b.id}: ${naam}`).toBe(eerder);
      namen.set(naam, b.opzet);
    }
  });

  it('elke les bij een bouwsteen bestaat', () => {
    const docs = fileURLToPath(new URL('../../../docs/onderdelen', import.meta.url));
    for (const b of BOUWSTENEN) {
      if (b.les) expect(existsSync(join(docs, `${b.les}.mdx`)), `${b.id}: ${b.les}`).toBe(true);
    }
  });

  it('de sensoren en actuatoren wijzen naar hun les', () => {
    for (const g of GROEPEN.filter((x) => x.id !== 'python'))
      for (const b of g.bouwstenen) expect(b.les, b.id).toBeTruthy();
  });

  it('leesbaar laat de tekens voor de selectie weg en toont een gat als puntjes', () => {
    expect(leesbaar(steen('herhaal-altijd'))).toBe('while True:\n    ...');
    expect(leesbaar(steen('als'))).toBe('if voorwaarde:\n    ...');
    for (const b of BOUWSTENEN) expect(leesbaar(b), b.id).not.toMatch(/[⟦⟧]/);
  });

  it('alsProgramma geeft een programma zonder gaten', () => {
    expect(alsProgramma(steen('als-anders'))).toBe(
      'voorwaarde = False\nif voorwaarde:\n    pass\nelse:\n    pass\n',
    );
    for (const b of BOUWSTENEN) {
      const programma = alsProgramma(b);
      expect(programma, b.id).not.toMatch(/[⟦⟧]/);
      expect(programma, b.id).not.toMatch(/^[ \t]+$/m);
    }
  });
});

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import api from './leaphy-api.json';

// De codeblokken van robotica draaien op het bord met de leaphymicropython die
// de online editor installeert (main van leaphy-robotics/leaphy-micropython).
// CI compileert ze alleen, dus wat de bibliotheek niet meer kent, viel niet op:
// in november 2026 gaf de digitale IR-sensor een ImportError (read_line_sensor
// verdween in mei 2025), en sinds augustus 2025 is een pin een naam: een getal
// is het GPIO-nummer van de chip. set_buzzer(6, …) stuurde zo het ingebouwde
// lampje aan, RGBLed(9, 10, 11) pinnen van de wifi-chip, en read_distance(19,
// 18) D7 en D6 terwijl het schema D19 en D18 aansloot. Deze test toetst elk
// blok tegen leaphy-api.json, dat scripts/leaphy-api.py uit de bibliotheek en
// de pins.csv van MicroPython maakt.

const SITE = fileURLToPath(new URL('../..', import.meta.url));
const modules = api.modules as Record<string, string[]>;
const pinnen = api.pinnen as Record<string, string>;
type Klasse = {
  basis: string[];
  methoden: Record<string, string[]>;
  standaard?: Record<string, unknown>;
};
const klassen = new Map(
  Object.entries(api.klassen as Record<string, Klasse>).map(([pad, k]) => [
    pad.split('.').at(-1) as string,
    k,
  ]),
);

/**
 * De parameters van een methode, ook als hij van een basisklasse komt.
 * `null` als een basisklasse niet uit de bibliotheek komt (dan weten we het
 * niet), `undefined` als de methode niet bestaat.
 */
function parametersVan(klasse: string, methode: string): string[] | null | undefined {
  const k = klassen.get(klasse);
  if (!k) return null;
  if (k.methoden[methode]) return k.methoden[methode];
  for (const basis of k.basis) {
    const p = parametersVan(basis, methode);
    if (p !== undefined) return p;
  }
  return undefined;
}

/** Code zonder de inhoud van strings, zodat een komma of = in een tekst niet telt. */
const zonderStrings = (code: string) =>
  code.replace(/[fFrRbB]?(['"])(?:\\.|(?!\1)[^\\\n])*\1/g, '""');

/**
 * De argumenten van elke aanroep `voor(...)`, op het hoogste niveau gesplitst;
 * een komma in een string telt niet.
 */
function aanroepen(code: string, voor: RegExp): { naam: string; args: string[] }[] {
  const uit: { naam: string; args: string[] }[] = [];
  for (const m of code.matchAll(voor)) {
    let diepte = 0;
    let huidig = '';
    let quote = '';
    const args: string[] = [];
    for (const teken of code.slice((m.index ?? 0) + m[0].length)) {
      if (quote) {
        huidig += teken;
        if (teken === quote) quote = '';
        continue;
      }
      if (teken === "'" || teken === '"') quote = teken;
      if (teken === '(' || teken === '[' || teken === '{') diepte++;
      if (teken === ')' || teken === ']' || teken === '}') {
        if (diepte === 0) break;
        diepte--;
      }
      if (teken === ',' && diepte === 0) {
        args.push(huidig.trim());
        huidig = '';
      } else huidig += teken;
    }
    if (huidig.trim()) args.push(huidig.trim());
    uit.push({ naam: m[1], args });
  }
  return uit;
}

type Blok = { waar: string; code: string };
const blokken: Blok[] = [];
const loop = (map: string) => {
  for (const naam of readdirSync(map)) {
    const pad = join(map, naam);
    if (statSync(pad).isDirectory()) loop(pad);
    else if (/\.mdx?$/.test(naam)) {
      const tekst = readFileSync(pad, 'utf8');
      for (const m of tekst.matchAll(/```python[^\n]*\n([\s\S]*?)```/g)) {
        const regel = tekst.slice(0, m.index).split('\n').length;
        blokken.push({ waar: `${pad.slice(SITE.length)}:${regel}`, code: m[1] });
      }
    }
  }
};
for (const map of ['docs', 'lego_auto', 'src/pages']) loop(join(SITE, map));

// Hoeveel argumenten van een aanroep een pin zijn.
const PIN_ARGUMENTEN: Record<string, number> = {
  Pin: 1,
  ADC: 1,
  AnalogIR: 1,
  set_buzzer: 1,
  set_servo_angle: 1,
  read_distance: 2,
  RGBLed: 3,
};

const argumenten = (code: string, functie: string) =>
  [...code.matchAll(new RegExp(`\\b${functie}\\(([^)]*)\\)`, 'g'))].map((m) =>
    m[1].split(',').map((a) => a.trim()),
  );

describe('de codeblokken passen bij leaphymicropython', () => {
  it('er zijn blokken om te toetsen', () => {
    expect(blokken.length).toBeGreaterThan(50);
  });

  it('elke import uit leaphymicropython bestaat', () => {
    const fout: string[] = [];
    for (const { waar, code } of blokken)
      for (const [, module, namen] of code.matchAll(
        /^from (leaphymicropython[\w.]*) import (.+)$/gm,
      )) {
        if (!modules[module]) fout.push(`${waar}: module ${module} bestaat niet`);
        else
          for (const naam of namen.split(',').map((n) => n.trim()))
            if (!modules[module].includes(naam)) fout.push(`${waar}: ${module} heeft geen ${naam}`);
      }
    expect(fout).toEqual([]);
  });

  it('elke pin is een naam die het bord kent, geen getal', () => {
    const fout: string[] = [];
    for (const { waar, code } of blokken)
      for (const [functie, aantal] of Object.entries(PIN_ARGUMENTEN))
        for (const args of argumenten(code, functie))
          for (const arg of args.slice(0, aantal)) {
            if (/^\d+$/.test(arg))
              fout.push(`${waar}: ${functie}(${arg}) is GPIO${arg}, geen pinnaam`);
            const naam = arg.match(/^["'](.+)["']$/)?.[1];
            if (naam && !(naam in pinnen))
              fout.push(`${waar}: ${functie}("${naam}") bestaat niet op het bord`);
          }
    expect(fout).toEqual([]);
  });

  it('DCMotors en de I2C-klassen noemen hun pinnen, gelijk aan de standaard', () => {
    // DCMotors() koos zelf D2, D3, D4 en D11, en OLEDSH1106() en TimeOfFlight()
    // de pinnen van I2C, zonder dat de les ze noemde. Een leerling zag nergens
    // waarom die pinnen bezet waren en zette er een buzzer op. Daarom schrijft
    // elke les ze als keyword-argumenten voluit, als naam, en moeten ze naar
    // dezelfde GPIO wijzen als de standaard van de bibliotheek: 12 en 13 voor
    // I2C zijn "SDA" en "SCL", want "A4" en "A5" lopen via de wifi-chip.
    const PIN_PARAMETER = /^(dir_pin_motor_[ab]|pwm_pin_motor_[ab]|sda_gpio_pin|scl_gpio_pin)$/;
    const gpioVan = (w: unknown) => (typeof w === 'number' ? `GPIO${w}` : pinnen[String(w)]);
    const fout: string[] = [];
    let getoetst = 0;
    for (const { waar, code } of blokken)
      for (const { naam, args } of aanroepen(code, /\b([A-Z]\w*)\(/g)) {
        const standaard = klassen.get(naam)?.standaard ?? {};
        for (const [param, waarde] of Object.entries(standaard)) {
          if (!PIN_PARAMETER.test(param)) continue;
          getoetst++;
          const arg = args.find((a) => new RegExp(`^${param}\\s*=`).test(a));
          const tekst = arg?.replace(/^\w+\s*=\s*/, '').match(/^["'](.+)["']$/)?.[1];
          if (!arg) fout.push(`${waar}: ${naam}(…) noemt ${param} niet`);
          else if (!tekst) fout.push(`${waar}: ${arg} is geen pinnaam als tekst`);
          else if (pinnen[tekst] !== gpioVan(waarde))
            fout.push(
              `${waar}: ${param}="${tekst}" is ${pinnen[tekst] ?? 'geen pin'}, de bibliotheek gebruikt ${gpioVan(waarde)}`,
            );
        }
      }
    expect(fout).toEqual([]);
    expect(getoetst).toBeGreaterThan(40);
  });

  it('een regel met pinnen past in het codeblok', () => {
    // OLEDSH1106(width=128, height=64, channel=7, sda_gpio_pin=…, scl_gpio_pin=…)
    // was 88 tekens: bij 1280 × 800 is een codeblok 703 pixels breed en had
    // die regel er 869 nodig, dus juist de pinnen stonden achter de
    // schuifbalk. Ongeveer 70 tekens passen; een regel met pinnen blijft onder
    // de 60, en een langere aanroep zet de pinnen op een eigen regel.
    const fout: string[] = [];
    for (const { waar, code } of blokken)
      for (const regel of code.split('\n'))
        if (
          /\b(dir_pin_motor_[ab]|pwm_pin_motor_[ab]|sda_gpio_pin|scl_gpio_pin)\s*=/.test(regel) &&
          regel.length > 60
        )
          fout.push(`${waar}: ${regel.length} tekens: ${regel.trim()}`);
    expect(fout).toEqual([]);
  });

  it('de tabel met de motorpinnen klopt met de standaard van DCMotors', () => {
    // De tabel in de uitleg is met de hand geschreven; de code toetst de test
    // hierboven al tegen de bibliotheek.
    const tekst = readFileSync(join(SITE, 'docs/onderdelen/_delen/dc-motor/pinnen.md'), 'utf8');
    const standaard = klassen.get('DCMotors')?.standaard ?? {};
    const rijen = [...tekst.matchAll(/^\|\s*([AB])\s*\|\s*(D\d+)\s*\|\s*(D\d+)\s*\|$/gm)].map(
      ([, motor, richting, snelheid]) => [motor.toLowerCase(), richting, snelheid],
    );
    expect(rijen.map(([m]) => m)).toEqual(['a', 'b']);
    for (const [motor, richting, snelheid] of rijen) {
      expect(richting).toBe(standaard[`dir_pin_motor_${motor}`]);
      expect(snelheid).toBe(standaard[`pwm_pin_motor_${motor}`]);
    }
  });

  it('een ultrasone sensor zit op pinnen van de chip zelf', () => {
    // D18 tot en met D21 (A4 tot en met A7) lopen in MicroPython via de
    // wifi-chip (EXT_GPIO); daarmee time je geen echo.
    const fout: string[] = [];
    for (const { waar, code } of blokken)
      for (const args of argumenten(code, 'read_distance'))
        for (const arg of args.slice(0, 2)) {
          const naam = arg.match(/^["'](.+)["']$/)?.[1];
          if (naam && !pinnen[naam]?.startsWith('GPIO'))
            fout.push(`${waar}: read_distance op ${naam}`);
        }
    expect(fout).toEqual([]);
  });

  it('set_buzzer krijgt geen toonhoogte boven 255', () => {
    // De bibliotheek weigert met een ValueError alles boven 255 Hz.
    const fout: string[] = [];
    for (const { waar, code } of blokken)
      for (const args of argumenten(code, 'set_buzzer'))
        if (Number(args[2]) > 255) fout.push(`${waar}: set_buzzer met ${args[2]} Hz`);
    expect(fout).toEqual([]);
  });

  it('elke methode bestaat, met de keyword-argumenten die hij kent', () => {
    // De bibliotheek verandert onder de lessen door; een argument dat hij niet
    // meer kent, geeft op het bord een TypeError, en CI compileert alleen.
    const fout: string[] = [];
    let getoetst = 0;
    for (const { waar, code: bron } of blokken) {
      const code = zonderStrings(bron);
      const soort = new Map<string, string>();
      for (const [, naam, klasse] of code.matchAll(/^\s*(\w+)\s*=\s*(\w+)\(/gm))
        if (klassen.has(klasse)) soort.set(naam, klasse);
      const toets = (klasse: string, methode: string, args: string[], wat: string) => {
        const kent = parametersVan(klasse, methode);
        if (kent === null) return;
        if (kent === undefined) {
          fout.push(`${waar}: ${klasse} heeft geen ${methode}()`);
          return;
        }
        getoetst++;
        if (kent.includes('**')) return;
        for (const arg of args) {
          const sleutel = arg.match(/^(\w+)\s*=(?!=)/)?.[1];
          if (sleutel && !kent.includes(sleutel))
            fout.push(`${waar}: ${wat}(${sleutel}=…) kent ${klasse} niet`);
        }
      };
      for (const { naam, args } of aanroepen(code, /\b([A-Z]\w*)\(/g))
        if (klassen.has(naam)) toets(naam, '__init__', args, naam);
      for (const [variabele, klasse] of soort)
        for (const { naam, args } of aanroepen(
          code,
          new RegExp(`\\b${variabele}\\.(\\w+)\\(`, 'g'),
        ))
          toets(klasse, naam, args, `${variabele}.${naam}`);
    }
    expect(fout).toEqual([]);
    expect(getoetst).toBeGreaterThan(50);
  });

  it('de tekst op het OLED-scherm krijgt een scale van een heel getal, 1 of hoger', () => {
    // text() geeft anders een ValueError: "Use a whole number of 1 or higher".
    const fout: string[] = [];
    for (const { waar, code } of blokken)
      for (const { args } of aanroepen(zonderStrings(code), /\b\w+\.(text)\(/g)) {
        const scale =
          args.find((a) => /^scale\s*=/.test(a))?.replace(/^scale\s*=\s*/, '') ?? args[4];
        if (scale !== undefined && /^[\d.]+$/.test(scale) && !/^[1-9]\d*$/.test(scale))
          fout.push(`${waar}: text(…, scale=${scale})`);
      }
    expect(fout).toEqual([]);
  });

  it('vaste tekst op het OLED-scherm past op een regel', () => {
    // Een letter is 8 × scale pixels breed, het scherm 128, en text() gaat
    // niet verder op een nieuwe regel: wat niet past, valt weg.
    const fout: string[] = [];
    for (const { waar, code } of blokken)
      for (const { args } of aanroepen(code, /\b\w+\.(text)\(/g)) {
        const tekst = args[0]?.match(/^(['"])(.*)\1$/)?.[2];
        const getal = (sleutel: string, plek: number, standaard: number) => {
          const w =
            args.find((a) => new RegExp(`^${sleutel}\\s*=`).test(a))?.split('=')[1] ?? args[plek];
          return w !== undefined && /^\d+$/.test(w.trim())
            ? Number(w)
            : w === undefined
              ? standaard
              : Number.NaN;
        };
        const x = getal('x', 1, 0);
        const scale = getal('scale', 4, 1);
        if (tekst !== undefined && x + 8 * scale * tekst.length > 128)
          fout.push(`${waar}: '${tekst}' is ${x + 8 * scale * tekst.length} pixels breed`);
      }
    expect(fout).toEqual([]);
  });

  it('geen zwarte tekst op een zwart OLED-scherm', () => {
    // text() is standaard zwart: na fill("black") zie je tekst alleen met
    // color="white".
    const fout: string[] = [];
    for (const { waar, code } of blokken) {
      let zwart = false;
      for (const regel of code.split('\n')) {
        if (/\.fill\(\s*["']black["']\s*\)/.test(regel)) zwart = true;
        else if (/\.fill\(/.test(regel)) zwart = false;
        if (zwart && /\.text\(/.test(regel) && !/color\s*=\s*["']white["']/.test(regel))
          fout.push(`${waar}: ${regel.trim()}`);
      }
    }
    expect(fout).toEqual([]);
  });
});

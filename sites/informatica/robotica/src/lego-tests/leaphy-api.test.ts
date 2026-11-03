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

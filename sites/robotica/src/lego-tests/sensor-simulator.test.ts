import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  AFSTAND_MAX,
  AFSTAND_MIN,
  GRENS_MAX,
  GRENS_MIN,
  GRENS_STAP,
  GRENS_START,
  ZONDER_BAL,
  balGezien,
  leesA0,
} from '../components/SensorSimulator/logica';

// De sensor-simulator in de les over de IR-sensor moet zich gedragen zoals de
// echte sensor op het bord: een bal ervoor maakt het getal lager (nagemeten),
// en het programma van stap 2 vraagt `Lees anapin A0 < grens`. Een simulator
// die het andersom doet, leert de leerling precies de fout die de les wil
// voorkomen.

const LES = readFileSync(
  fileURLToPath(new URL('../../click_golfer/ir-sensor.md', import.meta.url)),
  'utf8',
);

const afstanden = Array.from({ length: AFSTAND_MAX - AFSTAND_MIN + 1 }, (_, i) => AFSTAND_MIN + i);

describe('het getal op A0', () => {
  it('is lager als de bal dichterbij ligt, bij elke stap van het schuifje', () => {
    for (const d of afstanden.slice(1)) {
      expect(leesA0(d - 1)).toBeLessThan(leesA0(d));
    }
  });

  it('is zonder bal hoger dan met de bal op de verste afstand', () => {
    expect(leesA0(null)).toBe(ZONDER_BAL);
    expect(leesA0(AFSTAND_MAX)).toBeLessThan(leesA0(null));
  });

  it('ligt in de buurt van wat een echte sensor geeft', () => {
    expect(leesA0(null)).toBeGreaterThanOrEqual(900);
    expect(leesA0(null)).toBeLessThanOrEqual(1000);
    expect(leesA0(AFSTAND_MIN)).toBeGreaterThanOrEqual(100);
    expect(leesA0(AFSTAND_MIN)).toBeLessThanOrEqual(300);
  });

  it('is een heel getal van 0 tot en met 1023, ook buiten het schuifje', () => {
    for (const d of [-5, 0, ...afstanden, 16, 100, null]) {
      const waarde = leesA0(d);
      expect(Number.isInteger(waarde)).toBe(true);
      expect(waarde).toBeGreaterThanOrEqual(0);
      expect(waarde).toBeLessThanOrEqual(1023);
    }
  });
});

describe('de grens', () => {
  it('ziet een bal als het getal kleiner is dan de grens, niet gelijk of groter', () => {
    expect(balGezien(299, 300)).toBe(true);
    expect(balGezien(300, 300)).toBe(false);
    expect(balGezien(301, 300)).toBe(false);
  });

  it('loopt ver genoeg om elke afstand te zien, en om te hoog te kiezen', () => {
    // Met de hoogste grens zie je ook de verste bal. Hij ligt bewust boven
    // het getal zonder bal: dan "ziet" de robot een bal die er niet ligt, en
    // dat is precies wat een te hoge grens op de echte robot doet.
    expect(balGezien(leesA0(AFSTAND_MAX), GRENS_MAX)).toBe(true);
    expect(balGezien(leesA0(null), GRENS_MAX)).toBe(true);
    expect(balGezien(leesA0(AFSTAND_MIN), GRENS_MIN)).toBe(false);
    expect(GRENS_START % GRENS_STAP).toBe(0);
  });
});

describe('de les', () => {
  it('gebruikt de simulator, vóór stap 2', () => {
    expect(LES).toMatch(
      /^import SensorSimulator from '@site\/src\/components\/SensorSimulator';$/m,
    );
    const plek = LES.indexOf('<SensorSimulator />');
    expect(plek).toBeGreaterThan(LES.indexOf('## Stap 1'));
    expect(plek).toBeLessThan(LES.indexOf('## Stap 2'));
  });

  it('zegt eerlijk dat de getallen een voorbeeld zijn', () => {
    const na = LES.slice(LES.indexOf('<SensorSimulator />'));
    expect(na.slice(0, 400)).toMatch(/Jouw sensor geeft andere getallen/);
  });

  it('noemt in het antwoord de getallen die de simulator echt geeft', () => {
    // De opdracht vraagt naar de grens op 300 en naar een bal op 3 cm. Wie
    // de curve aanpast, moet het antwoord meenemen.
    expect(GRENS_START).toBe(300);
    expect(balGezien(leesA0(2), 300)).toBe(true);
    expect(balGezien(leesA0(3), 300)).toBe(false);
    const sectie = LES.slice(LES.indexOf('## Een grens kiezen'), LES.indexOf('## Stap 2'));
    expect(sectie).toContain('Op 2 cm en dichterbij');
    expect(sectie).toContain(`Op 3 cm is het getal ${leesA0(3)}`);
    expect(sectie).toContain(`op 4 cm ${leesA0(4)}`);
    const laagste = Math.ceil((leesA0(3) + 1) / GRENS_STAP) * GRENS_STAP;
    const hoogste = Math.floor(leesA0(4) / GRENS_STAP) * GRENS_STAP;
    expect(sectie).toContain(`grens van ${laagste} tot en met ${hoogste}`);
  });
});

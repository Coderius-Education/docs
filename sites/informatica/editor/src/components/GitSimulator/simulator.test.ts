import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// De opmaak en de maten van de simulator. Of hij op het scherm past, meet
// scripts/meet-les-tabs.mjs; hier staat wat een test kan vastpinnen.

const css = readFileSync(new URL('./styles.module.css', import.meta.url), 'utf8');
const bron = readFileSync(new URL('./index.tsx', import.meta.url), 'utf8');
const getal = (naam: string) => Number(bron.match(new RegExp(`const ${naam} = (\\d+);`))?.[1]);

describe('de terminal naast de zones (vanaf 1280 pixels)', () => {
  const blok = css.slice(css.indexOf('@media (min-width: 1280px)'));

  it('staat na de gewone regels, anders winnen die', () => {
    // Het blok stond vóór `.terminal { font-size: 0.85rem }`. Met dezelfde
    // selector wint de latere regel, en het kleinere lettertype gold nooit:
    // de regel van git status van 77 tekens brak op 1280 pixels af.
    expect(blok).toMatch(/\.terminal,\s*\.terminalInputField \{\s*font-size: 0\.75rem;/);
    for (const selector of ['.terminal {', '.terminalInputField {', '.zone {', '.body {'])
      expect(css.indexOf(selector), selector).toBeLessThan(
        css.indexOf('@media (min-width: 1280px)'),
      );
  });

  it('de uitvoer heeft er minstens tien regels', () => {
    // git status schrijft er tien. Letters van 0,75rem (12 pixels), regels
    // van 1,4 keer, en 0,6rem rand boven en onder.
    const regel = 12 * 1.4;
    const rand = 2 * 0.6 * 16;
    expect((getal('LAAGSTE_NAAST') - rand) / regel).toBeGreaterThanOrEqual(10);
  });

  it('tussen 997 en 1280 pixels minstens zeven', () => {
    const regel = 0.85 * 16 * 1.4;
    const rand = 2 * 0.6 * 16;
    expect((getal('LAAGSTE_ONDER') - rand) / regel).toBeGreaterThanOrEqual(7);
  });
});

describe('een klik in de uitvoer', () => {
  it('zet de cursor alleen met een muis in de invoer, niet bij een tik', () => {
    // Op een telefoon sprong het toetsenbord open bij een tik om te lezen.
    // Of het in de browser werkt, ziet alleen een browser; nagelopen in
    // Chromium met en zonder hasTouch.
    expect(bron).toMatch(/const MUIS = '\(pointer: fine\)';/);
    expect(bron).toMatch(
      /const naarInvoer = \(\) => \{\s*if \(!window\.matchMedia\?\.\(MUIS\)\.matches\) return;/,
    );
  });
});

describe('het venster voor een bestand', () => {
  it('sluit met Escape en zegt wat er mis is met de naam', () => {
    expect(bron).toMatch(/if \(e\.key === 'Escape'\)/);
    expect(bron.match(/onKeyDown=\{editorToets\}/g)).toHaveLength(2);
    expect(bron).toMatch(/role="alert"/);
  });
});

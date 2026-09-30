import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { APPARATEN, schaal } from './apparaten';

// Issue #116: om CSS @media te testen wil een leerling zijn site zien zoals op
// een tablet of telefoon. Het iframe moet daarvoor echt die breedte hebben
// (anders slaat @media niet aan) en daarna in het paneel passen.

describe('apparaten in de voorbeeldweergave', () => {
  it('biedt desktop, tablet en telefoon', () => {
    expect(APPARATEN.map((a) => a.id)).toEqual(['desktop', 'tablet', 'telefoon']);
  });

  it('geeft tablet en telefoon een breedte die onder de gangbare @media-grenzen valt', () => {
    const breedte = (id: string) => APPARATEN.find((a) => a.id === id)?.maat?.breedte ?? 0;
    expect(breedte('telefoon')).toBeLessThan(600);
    expect(breedte('tablet')).toBeGreaterThanOrEqual(600);
    expect(breedte('tablet')).toBeLessThan(1024);
  });

  it('vergroot nooit boven de echte maat', () => {
    expect(schaal({ breedte: 375, hoogte: 667 }, { breedte: 2000, hoogte: 2000 })).toBe(1);
  });

  it('verkleint op de krapste kant', () => {
    expect(schaal({ breedte: 768, hoogte: 1024 }, { breedte: 384, hoogte: 2000 })).toBe(0.5);
    expect(schaal({ breedte: 768, hoogte: 1024 }, { breedte: 2000, hoogte: 256 })).toBe(0.25);
  });

  it('doet niets geks zolang het paneel nog geen maat heeft', () => {
    expect(schaal({ breedte: 375, hoogte: 667 }, { breedte: 0, hoogte: 0 })).toBe(1);
  });

  it('de volledige IDE toont de apparaatknoppen, de editor in een les niet', () => {
    const lees = (pad: string) =>
      readFileSync(fileURLToPath(new URL(pad, import.meta.url)), 'utf8');
    expect(lees('../../components/ProjectEditor/ProjectEditorImpl.tsx')).toMatch(
      /<Preview session=\{session\} apparaten \/>/,
    );
    expect(lees('../../components/InlineEditor/InlineEditorImpl.tsx')).not.toMatch(/apparaten/);
  });
});

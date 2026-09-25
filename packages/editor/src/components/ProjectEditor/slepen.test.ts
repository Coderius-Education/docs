import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// Bestanden slepen naar een map belandde in de hoofdmap. De rij van de map
// koos het doel en riep preventDefault aan, maar de zijbalk eronder las
// e.defaultPrevented: bij React's event blijft dat veld op de waarde van
// vóór de rij, dus de zijbalk zette het doel terug op de hoofdmap. En drop
// las het doel uit de state van de vorige render. In node is geen DOM om het
// na te spelen; dit legt vast hoe de code het nu goed doet. Met de hand
// gecontroleerd in Chromium: vis.png naar de map img slepen geeft img/vis.png.

const bron = readFileSync(
  fileURLToPath(new URL('./ProjectEditorImpl.tsx', import.meta.url)),
  'utf8',
);

describe('slepen naar een map', () => {
  it('ziet dat de rij het doel al koos', () => {
    expect(bron).toMatch(/e\.isDefaultPrevented\(\)/);
    expect(bron).not.toMatch(/if \(!e\.defaultPrevented\)/);
  });

  it('leest bij drop het doel uit de ref, niet uit de state van de vorige render', () => {
    expect(bron).toMatch(/const map = sleepDoelRef\.current/);
  });
});

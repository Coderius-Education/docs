import { describe, expect, it } from 'vitest';
import { knipPunten } from './exportPdf';

describe('knipPunten', () => {
  it('knipt op een lege rij boven de volle hoogte, niet door een regel', () => {
    // Rijen 90 tot en met 110 zijn tekst; 85 is leeg.
    const leeg = (y: number) => y < 90 || y > 110;
    expect(knipPunten(250, 100, leeg)).toEqual([0, 89, 189]);
  });

  it('knipt op de volle hoogte als er geen lege rij in de buurt is', () => {
    expect(knipPunten(250, 100, () => false)).toEqual([0, 100, 200]);
  });

  it('heeft één pagina als alles past', () => {
    expect(knipPunten(80, 100, () => true)).toEqual([0]);
  });
});

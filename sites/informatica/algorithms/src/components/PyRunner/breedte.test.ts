import { describe, expect, it } from 'vitest';
import { KLEINSTE_SCHAAL, codeBreedte, codeSchaal } from './breedte';

// In een les-tabblad staat de uitvoer naast de code. Op een vaste zestig
// procent brak in 184 schermen van algoritmes een regel code af; een regel
// code breekt niet af (schrijfgids §2).
describe('de breedte van de code naast de uitvoer', () => {
  const veld = 900;

  it('korte code krijgt de helft, niet minder', () => {
    expect(codeBreedte('x = 1\nprint(x)', veld)).toBe(veld * 0.5);
  });

  it('een langere regel krijgt zijn eigen breedte', () => {
    const regel = 'a'.repeat(50);
    const breedte = codeBreedte(regel, veld);
    expect(breedte).not.toBeNull();
    expect(breedte as number).toBeGreaterThan(veld * 0.5);
    expect(breedte as number).toBeGreaterThanOrEqual(50 * 9.1);
  });

  it('past de langste regel niet naast de uitvoer, dan staat de uitvoer eronder', () => {
    expect(codeBreedte(`kort\n${'a'.repeat(100)}`, veld)).toBeNull();
  });
});

describe('de letters in de editor', () => {
  it('blijven gewoon als de langste regel past', () => {
    expect(codeSchaal('x = 1', 900)).toBe(1);
  });

  it('worden kleiner tot de langste regel heel op één regel staat', () => {
    // Een regel van 95 tekens brak in de route machine learning af.
    const schaal = codeSchaal('a'.repeat(95), 946);
    expect(schaal).toBeLessThan(1);
    expect(95 * 9.1 * schaal).toBeLessThanOrEqual(946 - 89);
  });

  it('nooit kleiner dan 80%', () => {
    expect(codeSchaal('a'.repeat(200), 946)).toBe(KLEINSTE_SCHAAL);
  });
});

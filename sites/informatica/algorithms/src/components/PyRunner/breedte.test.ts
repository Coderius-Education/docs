import { describe, expect, it } from 'vitest';
import { codeBreedte } from './breedte';

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

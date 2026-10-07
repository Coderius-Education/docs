import { describe, expect, it } from 'vitest';
import { minimumZetten, opgelostMelding } from './melding';

describe('de melding van HanoiGame bij een opgeloste toren', () => {
  it('kent het minimum: 2ⁿ − 1', () => {
    expect([1, 2, 3, 4, 5].map(minimumZetten)).toEqual([1, 3, 7, 15, 31]);
  });

  it('vraagt niet om minder als het al het minimum is', () => {
    expect(opgelostMelding(7, 3)).toBe('Opgelost in 7 zetten. Sneller kan niet.');
    expect(opgelostMelding(1, 1)).toBe('Opgelost in 1 zet. Sneller kan niet.');
  });

  it('zegt dat het in minder kan, maar niet in hoeveel', () => {
    const melding = opgelostMelding(9, 3);
    expect(melding).toBe('Opgelost in 9 zetten. Het kan in minder.');
    expect(melding).not.toContain('7');
  });

  it('schrijft zonder uitroepteken of gedachtestreepje (schrijfgids §1)', () => {
    for (const [zetten, aantal] of [
      [7, 3],
      [9, 3],
      [1, 1],
    ]) {
      expect(opgelostMelding(zetten, aantal)).not.toMatch(/[!—]/);
    }
  });
});

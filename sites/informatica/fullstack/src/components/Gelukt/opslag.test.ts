import { describe, expect, it } from 'vitest';
import { isGelukt, sleutel, zetGelukt } from './opslag';

const geheugen = () => {
  const m = new Map<string, string>();
  return {
    getItem: (k: string) => m.get(k) ?? null,
    setItem: (k: string, v: string) => void m.set(k, v),
    removeItem: (k: string) => void m.delete(k),
  };
};

describe('wat het Gelukt-blok onthoudt', () => {
  it('één sleutel per pagina, met of zonder slash aan het eind', () => {
    expect(sleutel('/fullstack/docs/online/project/run/')).toBe(
      sleutel('/fullstack/docs/online/project/run'),
    );
  });

  it('aanvinken en weer uitzetten', () => {
    const bron = geheugen();
    expect(isGelukt('/a', bron)).toBe(false);
    zetGelukt('/a', true, bron);
    expect(isGelukt('/a/', bron)).toBe(true);
    zetGelukt('/a', false, bron);
    expect(isGelukt('/a', bron)).toBe(false);
  });

  it('een opslag die een fout gooit, breekt niets', () => {
    const kapot = {
      getItem: () => {
        throw new Error('SecurityError');
      },
      setItem: () => {
        throw new Error('QuotaExceededError');
      },
      removeItem: () => {
        throw new Error('SecurityError');
      },
    };
    expect(isGelukt('/a', kapot)).toBe(false);
    expect(() => zetGelukt('/a', true, kapot)).not.toThrow();
    expect(isGelukt('/a', null)).toBe(false);
  });
});

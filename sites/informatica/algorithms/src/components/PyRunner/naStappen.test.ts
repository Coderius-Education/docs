import type { Opname } from '@coderius/python-runner/PyodideProvider';
import { describe, expect, it } from 'vitest';
import { naStappen } from './naStappen';

// Na het sluiten van Stap voor stap stond er alleen "Klaar" in het uitvoervak,
// zonder de uitvoer van de opname: dat las als "het programma printte niets".

const opname = (extra: Partial<Opname>): Opname => ({
  stappen: [],
  uitvoer: 'a\nb\n',
  afgekapt: false,
  fout: null,
  ...extra,
});

describe('de uitvoer na Stap voor stap', () => {
  it('toont wat de opname printte', () => {
    expect(naStappen(opname({}))).toEqual({ stdout: 'a\nb\n', errorMsg: '', statusMsg: 'Klaar' });
  });

  it('toont de fout met zijn regel', () => {
    const r = naStappen(opname({ fout: { soort: 'NameError', bericht: "name 'x'", regel: 3 } }));
    expect(r.errorMsg).toBe("Fout op regel 3\nNameError: name 'x'");
    expect(r.statusMsg).toBe('Er ging iets mis');
  });

  it('zegt dat een afgekapte opname niet af is', () => {
    expect(naStappen(opname({ afgekapt: true })).statusMsg).not.toBe('Klaar');
  });
});

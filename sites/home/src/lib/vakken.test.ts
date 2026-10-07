import { SUBJECTS } from '@coderius/shared/sites';
import { describe, expect, it } from 'vitest';
import { inleiding, vakVanHost } from './vakken';

describe('vakVanHost', () => {
  it('herkent de host van elk vak uit de registry', () => {
    for (const vak of SUBJECTS) expect(vakVanHost(new URL(vak.url).hostname)).toBe(vak.id);
  });

  it('herkent de lokale testhosts en de previews', () => {
    expect(vakVanHost('wo.localtest.me')).toBe('wo');
    expect(vakVanHost('informatica.localtest.me')).toBe('informatica');
    expect(vakVanHost('feat-vakken--wo.preview.coderius.nl')).toBe('wo');
    expect(vakVanHost('WO.Coderius.nl.')).toBe('wo');
  });

  it('kiest geen vak op coderius.nl, localhost of een onbekende host', () => {
    for (const host of [
      'coderius.nl',
      'www.coderius.nl',
      'localhost',
      '127.0.0.1',
      'python.coderius.nl',
    ]) {
      expect(vakVanHost(host)).toBeNull();
    }
  });
});

describe('inleiding', () => {
  it('heeft per vak een eigen tekst, en een algemene zonder vak', () => {
    const algemeen = inleiding([], 13);
    expect(algemeen).toMatch(/^13 cursussen /);
    for (const vak of SUBJECTS) expect(inleiding([vak.id], 3)).not.toBe(inleiding([], 3));
    expect(inleiding(['informatica', 'wo'], 13)).toBe(algemeen);
  });

  it('schrijft één cursus als "Eén cursus"', () => {
    expect(inleiding(['wo'], 1)).toMatch(/^Eén cursus /);
  });
});

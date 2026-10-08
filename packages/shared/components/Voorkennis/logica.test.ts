import { describe, expect, it } from 'vitest';
import { opsomming } from './logica';

describe('opsomming voor de kop van Voorkennis', () => {
  it('zet de onderwerpen op een rij zoals je het zegt', () => {
    expect(opsomming([])).toBe('');
    expect(opsomming(['Dictionaries'])).toBe('Dictionaries');
    expect(opsomming(['Dictionaries', 'Lijsten'])).toBe('Dictionaries en Lijsten');
    expect(opsomming(['HTML', 'CSS', 'Formulieren'])).toBe('HTML, CSS en Formulieren');
  });

  it('slaat lege labels over', () => {
    expect(opsomming(['HTML', ' ', 'CSS'])).toBe('HTML en CSS');
  });
});

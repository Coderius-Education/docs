import { describe, expect, it } from 'vitest';
import { lessen } from '../data/lessen';
import { omleidingen } from '../data/omleidingen';

// Een verhuisde les houdt zijn oude adres via een omleiding. Wijst een
// omleiding naar een les die er niet meer is, of staat er op het oude adres
// weer een les, dan klopt de lijst niet meer.

describe('omleidingen van de python-cursus', () => {
  const paden = new Set(lessen.map((l) => l.pad));

  it('elk doel is een les die bestaat', () => {
    for (const { van, naar } of omleidingen)
      expect(paden.has(naar), `${van} -> ${naar}`).toBe(true);
  });

  it('op geen enkel oud adres staat nog een les', () => {
    for (const { van } of omleidingen) expect(paden.has(van), van).toBe(false);
  });

  it('de verhuizing van Modules, Bestanden, Klassen en Fouten afvangen zit erin', () => {
    const van = omleidingen.map((o) => o.van);
    expect(van).toContain('/docs/functies/09d-modules');
    expect(van).toContain('/docs/data/11d-json');
    expect(van.filter((v) => v.startsWith('/docs/klassen/14'))).toHaveLength(11);
    expect(van.filter((v) => v.startsWith('/docs/fouten/15'))).toHaveLength(6);
  });
});

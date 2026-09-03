import { describe, expect, it } from 'vitest';
import {
  buildCardChips,
  examDomainByCode,
  examDomainCodes,
  examDomains,
  formatExamDomainTooltip,
  formatKeuzeDomainTooltip,
  keuzeDomainGroups,
} from './ExamProgram';

// Bewaakt de overgetypte lijst eindtermen uit het examenprogramma. De codes
// zijn de sleutels waar Curriculum.ts op verwijst en waar de kaart-chips op
// groeperen: een typefout (twee keer 'C3', een 'H1' met parent 'G') geeft geen
// build-fout, maar laat een chip stil verdwijnen of onder de verkeerde
// hoofdletter belanden.

const KERN = ['B', 'C', 'D', 'E', 'F'];

describe('examenprogramma-data', () => {
  it('elke code komt maar één keer voor', () => {
    expect(new Set(examDomainCodes).size).toBe(examDomainCodes.length);
    expect(examDomainByCode.size).toBe(examDomains.length);
  });

  it('elke code is de hoofdletter van zijn parent plus een volgnummer', () => {
    const kapot = examDomains
      .filter((d) => !d.parent || !new RegExp(`^${d.parent}\\d+$`).test(d.code))
      .map((d) => `${d.code} (parent '${d.parent}')`);
    expect(kapot).toEqual([]);
  });

  it('elke parent is een kerndomein of een bekend keuzedomein', () => {
    const keuze = new Set(keuzeDomainGroups.map((g) => g.letter));
    const onbekend = examDomains
      .filter((d) => !KERN.includes(d.parent ?? '') && !keuze.has(d.parent ?? ''))
      .map((d) => `${d.code} -> '${d.parent}'`);
    expect(onbekend).toEqual([]);
  });

  it('elk keuzedomein heeft minstens één subdomein en komt maar één keer voor', () => {
    const letters = keuzeDomainGroups.map((g) => g.letter);
    expect(new Set(letters).size).toBe(letters.length);
    expect(letters.filter((l) => KERN.includes(l))).toEqual([]);

    const leeg = letters.filter((l) => !examDomains.some((d) => d.parent === l));
    expect(leeg).toEqual([]);
  });

  it('naam en eindtermbeschrijving zijn nergens leeg', () => {
    const leeg = examDomains
      .filter((d) => d.name.trim() === '' || d.description.trim() === '')
      .map((d) => d.code);
    expect(leeg).toEqual([]);
  });
});

describe('tooltips en kaart-chips', () => {
  it('een onbekende code valt terug op de code zelf', () => {
    expect(formatExamDomainTooltip('Z9')).toBe('Z9');
    expect(formatKeuzeDomainTooltip('Z')).toBe('Z');
  });

  it('een bekende code noemt naam en beschrijving', () => {
    const tekst = formatExamDomainTooltip('B1');
    expect(tekst).toContain('B1');
    expect(tekst).toContain(examDomainByCode.get('B1')?.name);
    expect(tekst).toContain(examDomainByCode.get('B1')?.description);
  });

  it('kerndomeinen worden losse chips, keuzedomeinen groeperen per hoofdletter', () => {
    const chips = buildCardChips([
      { code: 'B1', strength: 'strong' },
      { code: 'D1', strength: 'weak' },
      { code: 'N1', strength: 'weak' },
      { code: 'N2', strength: 'strong' },
    ]);
    expect(chips.map((c) => c.display)).toEqual(['B1', 'D1', 'N']);
    // De groep is 'sterk' zodra één subdomein dat is.
    expect(chips.find((c) => c.display === 'N')?.strength).toBe('strong');
    expect(chips.find((c) => c.display === 'D1')?.strength).toBe('weak');
  });

  it('laat een code die niet in het programma staat stil vallen', () => {
    // Dit is het gedrag dat Curriculum.test.ts moet afvangen: hier zie je
    // waarom een onbekende code daar een harde fout hoort te zijn.
    expect(buildCardChips([{ code: 'Z9', strength: 'strong' }])).toEqual([]);
    expect(buildCardChips(undefined)).toEqual([]);
    expect(buildCardChips([])).toEqual([]);
  });
});

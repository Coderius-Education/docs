import { describe, expect, it } from 'vitest';
import { heeftRegelnummers, wilRegelnummers } from './metastring';

// De swizzle van CodeBlock zet regelnummers aan voor elk python-blok. Wat
// hier stil kan misgaan: een blok dat al `showLineNumbers=5` draagt (dan zou
// de swizzle het startnummer overschrijven), een blok zonder taal dat ineens
// nummers krijgt, of een opt-out die niet werkt.

describe('wilRegelnummers', () => {
  it('geeft een kaal python-blok regelnummers', () => {
    expect(wilRegelnummers('language-python', undefined)).toBe(true);
    expect(wilRegelnummers('language-python', '')).toBe(true);
  });

  it('laat een blok met rust dat al nummers heeft, ook met startnummer of titel', () => {
    expect(wilRegelnummers('language-python', 'showLineNumbers')).toBe(false);
    expect(wilRegelnummers('language-python', 'showLineNumbers=3')).toBe(false);
    expect(wilRegelnummers('language-python', 'title="zoek.py" showLineNumbers')).toBe(false);
  });

  it('houdt een regelbereik zoals {1,3} en geeft dan wel nummers', () => {
    expect(wilRegelnummers('language-python', '{1,3}')).toBe(true);
  });

  it('nummert geen blokken zonder taal of in een andere taal', () => {
    expect(wilRegelnummers(undefined, undefined)).toBe(false);
    expect(wilRegelnummers('language-text', undefined)).toBe(false);
    expect(wilRegelnummers('language-bash', 'showLineNumbers')).toBe(false);
  });

  it('respecteert de opt-out geen-regelnummers', () => {
    expect(wilRegelnummers('language-python', 'geen-regelnummers')).toBe(false);
    expect(wilRegelnummers('language-python', 'title="x" geen-regelnummers')).toBe(false);
  });
});

describe('heeftRegelnummers', () => {
  it('herkent alleen een los token, niet een woord dat er toevallig op lijkt', () => {
    expect(heeftRegelnummers('showLineNumbers')).toBe(true);
    expect(heeftRegelnummers('showLineNumbers=7')).toBe(true);
    expect(heeftRegelnummers('title="showLineNumbers"')).toBe(false);
    expect(heeftRegelnummers(undefined)).toBe(false);
  });
});

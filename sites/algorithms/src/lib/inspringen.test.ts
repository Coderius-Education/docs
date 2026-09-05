import { describe, expect, it } from 'vitest';
import { tabInvoegen, tabWeghalen } from './inspringen';

// In het testveld van de bouwen-lessen sprong Tab uit het veld: de editor
// had geen eigen afhandeling. Deze helper is nu de enige plek; PyRunner had
// een eigen kopie zonder Shift+Tab.

describe('tabInvoegen', () => {
  it('voegt vier spaties in op de cursor en zet de cursor erachter', () => {
    expect(tabInvoegen('ab', 1, 1)).toEqual({ code: 'a    b', start: 5, end: 5 });
  });

  it('vervangt een selectie door de inspringing', () => {
    expect(tabInvoegen('abcdef', 1, 4)).toEqual({ code: 'a    ef', start: 5, end: 5 });
  });
});

describe('tabWeghalen', () => {
  it('haalt vier spaties van het begin van de regel en schuift de cursor mee', () => {
    expect(tabWeghalen('x\n    print(1)', 10, 10)).toEqual({
      code: 'x\nprint(1)',
      start: 6,
      end: 6,
    });
  });

  it('haalt bij twee spaties alleen die twee weg', () => {
    expect(tabWeghalen('  a', 3, 3)).toEqual({ code: 'a', start: 1, end: 1 });
  });

  it('haalt bij zes spaties er precies vier weg', () => {
    expect(tabWeghalen('      a', 7, 7)).toEqual({ code: '  a', start: 3, end: 3 });
  });

  it('doet niets op een regel zonder inspringing', () => {
    expect(tabWeghalen('a\nb', 3, 3)).toEqual({ code: 'a\nb', start: 3, end: 3 });
  });

  it('zet de cursor nooit voor het begin van de regel', () => {
    // Cursor midden in de leidende spaties: na weghalen staat hij op regelbegin.
    expect(tabWeghalen('x\n    y', 3, 3)).toEqual({ code: 'x\ny', start: 2, end: 2 });
  });

  it('werkt op de regel van de cursor, niet op een eerdere regel', () => {
    expect(tabWeghalen('    a\nb', 7, 7)).toEqual({ code: '    a\nb', start: 7, end: 7 });
  });
});

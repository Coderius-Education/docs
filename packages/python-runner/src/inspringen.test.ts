import { describe, expect, it } from 'vitest';
import { enterInvoegen, tabInvoegen, tabWeghalen } from './inspringen';

// In het testveld van de bouwen-lessen op de algoritmes-site sprong Tab uit
// het veld, en PyRunner, PythonPlayground en CodeExercise hadden elk een eigen
// Tab-kopie zonder Shift+Tab of Enter. Deze helper is nu de enige plek.

describe('tabInvoegen', () => {
  it('voegt vier spaties in op de cursor en zet de cursor erachter', () => {
    expect(tabInvoegen('ab', 1, 1)).toMatchObject({ code: 'a    b', start: 5, end: 5 });
  });

  // Tab verving eerst élke selectie door vier spaties. Dat wiste niet alleen
  // een blok van drie regels, maar ook één geselecteerde regel: Home,
  // Shift+End, Tab, en `    a = 1` was `    `. Elke selectie springt nu in.
  it('springt de regel in bij een selectie binnen die regel, zonder tekst te wissen', () => {
    expect(tabInvoegen('abcdef', 1, 4)).toMatchObject({ code: '    abcdef' });
  });

  it('wist een regel niet als je hem helemaal selecteert', () => {
    const code = 'def f():\n    a = 1\n    b = 2';
    const van = code.indexOf('    a = 1');
    expect(tabInvoegen(code, van, van + '    a = 1'.length).code).toBe(
      'def f():\n        a = 1\n    b = 2',
    );
  });

  // Hiervóór verving Tab een selectie van meerdere regels door vier spaties:
  // `def f():\n    a = 1\n    b = 2` werd `def f():\n    `. De code van de
  // leerling was met één toets weg, zonder waarschuwing.
  it('springt elke regel van een selectie over meerdere regels in', () => {
    const code = 'a = 1\nb = 2\nc = 3';
    expect(tabInvoegen(code, 0, code.length).code).toBe('    a = 1\n    b = 2\n    c = 3');
  });

  it('laat lege regels leeg, zodat er geen spaties aan het eind blijven staan', () => {
    const code = 'a = 1\n\nc = 3';
    expect(tabInvoegen(code, 0, code.length).code).toBe('    a = 1\n\n    c = 3');
  });

  it('selecteert na afloop het hele blok dat verschoven is', () => {
    const code = 'a\nb';
    expect(tabInvoegen(code, 0, code.length)).toMatchObject({
      start: 0,
      end: '    a\n    b'.length,
    });
  });

  it('neemt de regel erna niet mee als de selectie op de regelovergang eindigt', () => {
    const code = 'a\nb\nc';
    // tot en met de nieuwe regel achter `b`, dus regel `c` blijft staan.
    expect(tabInvoegen(code, 0, 4).code).toBe('    a\n    b\nc');
  });
});

describe('tabWeghalen', () => {
  it('haalt de inspringing weg bij een selectie binnen één regel', () => {
    const code = 'def f():\n        a = 1';
    const van = code.indexOf('        a = 1');
    expect(tabWeghalen(code, van, van + 8).code).toBe('def f():\n    a = 1');
  });

  it('haalt vier spaties van het begin van de regel en schuift de cursor mee', () => {
    expect(tabWeghalen('x\n    print(1)', 10, 10)).toMatchObject({
      code: 'x\nprint(1)',
      start: 6,
      end: 6,
    });
  });

  it('haalt bij twee spaties alleen die twee weg', () => {
    expect(tabWeghalen('  a', 3, 3)).toMatchObject({ code: 'a', start: 1, end: 1 });
  });

  it('haalt bij zes spaties er precies vier weg', () => {
    expect(tabWeghalen('      a', 7, 7)).toMatchObject({ code: '  a', start: 3, end: 3 });
  });

  it('doet niets op een regel zonder inspringing', () => {
    expect(tabWeghalen('a\nb', 3, 3)).toMatchObject({ code: 'a\nb', start: 3, end: 3 });
  });

  it('zet de cursor nooit voor het begin van de regel', () => {
    // Cursor midden in de leidende spaties: na weghalen staat hij op regelbegin.
    expect(tabWeghalen('x\n    y', 3, 3)).toMatchObject({ code: 'x\ny', start: 2, end: 2 });
  });

  // Dit was de melding: van een blok van drie regels verschoof alleen de
  // eerste, omdat de functie enkel naar de regel keek waar de selectie begon.
  it('haalt de inspringing van elke regel van een selectie over meerdere regels', () => {
    const code = '    a = 1\n    b = 2\n    c = 3';
    expect(tabWeghalen(code, 0, code.length).code).toBe('a = 1\nb = 2\nc = 3');
  });

  it('haalt per regel weg wat er staat, niet overal evenveel', () => {
    const code = '  a = 1\n      b = 2\nc = 3';
    expect(tabWeghalen(code, 0, code.length).code).toBe('a = 1\n  b = 2\nc = 3');
  });

  it('neemt de regel erna niet mee als de selectie op de regelovergang eindigt', () => {
    const code = '    a\n    b\n    c';
    // (0, 6) dekt regel 1 plus de regelovergang; regel 2 begint pas op 6.
    expect(tabWeghalen(code, 0, 6).code).toBe('a\n    b\n    c');
  });

  it('werkt op de regel van de cursor, niet op een eerdere regel', () => {
    expect(tabWeghalen('    a\nb', 7, 7)).toMatchObject({ code: '    a\nb', start: 7, end: 7 });
  });
});

describe('enterInvoegen', () => {
  it('houdt de inspringing van de huidige regel vast', () => {
    expect(enterInvoegen('    x = 1', 9, 9)).toMatchObject({
      code: '    x = 1\n    ',
      start: 14,
      end: 14,
    });
  });

  it('springt een niveau dieper na een dubbele punt', () => {
    expect(enterInvoegen('if x:', 5, 5)).toMatchObject({ code: 'if x:\n    ', start: 10, end: 10 });
    expect(enterInvoegen('    for i in lijst:', 19, 19)).toMatchObject({
      code: '    for i in lijst:\n        ',
      start: 28,
      end: 28,
    });
  });

  it('kijkt naar de regel van de cursor, niet naar een eerdere regel', () => {
    expect(enterInvoegen('if x:\n    y = 1', 15, 15)).toMatchObject({
      code: 'if x:\n    y = 1\n    ',
      start: 20,
      end: 20,
    });
  });

  it('neemt tekst achter de cursor mee naar de nieuwe regel, op de nieuwe inspringing', () => {
    expect(enterInvoegen('    a = 1; b = 2', 10, 10)).toMatchObject({
      code: '    a = 1;\n    b = 2',
      start: 15,
      end: 15,
    });
  });

  it('vervangt een selectie', () => {
    expect(enterInvoegen('abc', 1, 2)).toMatchObject({ code: 'a\nc', start: 2, end: 2 });
  });

  it('springt niet dieper als de dubbele punt achter de cursor staat', () => {
    expect(enterInvoegen('if x:', 2, 2)).toMatchObject({ code: 'if\nx:', start: 3, end: 3 });
  });

  it('schuift een ingesprongen regel intact naar beneden als de cursor op kolom 0 staat', () => {
    // Home, Enter: een lege regel erboven maken. De regel hield eerst zijn
    // inspringing niet en gaf een IndentationError.
    expect(enterInvoegen('if x:\n    y = 1', 6, 6)).toMatchObject({
      code: 'if x:\n\n    y = 1',
      start: 11,
      end: 11,
    });
  });

  it('houdt de inspringing ook als de cursor midden in de leidende spaties staat', () => {
    expect(enterInvoegen('    y = 1', 2, 2)).toMatchObject({
      code: '  \n    y = 1',
      start: 7,
      end: 7,
    });
  });
});

describe('het editbereik van een bewerking', () => {
  // De editor voert de bewerking uit met execCommand op precies dit bereik,
  // zodat Ctrl+Z blijft werken. Het moet dus dezelfde code opleveren.
  it.each([
    ['tab', () => tabInvoegen('ab', 1, 1), 'ab'],
    ['tab over selectie', () => tabInvoegen('abcdef', 1, 4), 'abcdef'],
    ['shift+tab', () => tabWeghalen('x\n    print(1)', 10, 10), 'x\n    print(1)'],
    ['shift+tab zonder spaties', () => tabWeghalen('a\nb', 3, 3), 'a\nb'],
    ['enter', () => enterInvoegen('    a = 1; b = 2', 10, 10), '    a = 1; b = 2'],
    ['enter na dubbele punt', () => enterInvoegen('if x:', 5, 5), 'if x:'],
    ['enter op kolom 0', () => enterInvoegen('if x:\n    y = 1', 6, 6), 'if x:\n    y = 1'],
  ])('%s: van/tot/tekst beschrijft precies de verandering', (_naam, maak, oud) => {
    const b = maak();
    expect(`${oud.slice(0, b.van)}${b.tekst}${oud.slice(b.tot)}`).toBe(b.code);
  });
});

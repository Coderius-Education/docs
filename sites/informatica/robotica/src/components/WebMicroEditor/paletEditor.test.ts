// @vitest-environment jsdom
import { history, undo } from '@codemirror/commands';
import { EditorState } from '@codemirror/state';
import { EditorView, runScopeHandlers } from '@codemirror/view';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { BOUWSTENEN, SLEEP_TYPE, bouwsteenMetId } from './bouwstenen';
import { paletUitbreiding, sleepLos, sleepOver, zetBouwsteen } from './paletEditor';

// De kant van CodeMirror, met een echte EditorView. jsdom heeft geen opmaak:
// welke regel onder de muis ligt (posAtCoords) en hoe een gat eruitziet, zijn
// in Chromium nagespeeld. Hier: wat er in het document komt, wat één Ctrl+Z
// terugneemt, wat de toetsen doen en welke regels een klasse krijgen.

const steen = (id: string) => {
  const b = bouwsteenMetId(id);
  if (!b) throw new Error(`geen bouwsteen ${id}`);
  return b;
};

const views: EditorView[] = [];
function editor(doc: string, cursor = doc.length, tot = cursor, opInvoeging = vi.fn()) {
  const view = new EditorView({
    parent: document.body,
    state: EditorState.create({
      doc,
      selection: { anchor: cursor, head: tot },
      extensions: [history(), paletUitbreiding(opInvoeging)],
    }),
  });
  views.push(view);
  return view;
}
afterEach(() => {
  for (const v of views.splice(0)) v.destroy();
});

const tekst = (view: EditorView) => view.state.doc.toString();
const selectie = (view: EditorView) => {
  const { from, to } = view.state.selection.main;
  return view.state.sliceDoc(from, to);
};
const toets = (view: EditorView, key: string) =>
  runScopeHandlers(view, new KeyboardEvent('keydown', { key }), 'editor');

describe('zetBouwsteen', () => {
  it('zet de bouwsteen op de regel van de cursor en selecteert wat nog ingevuld moet', () => {
    const view = editor('while True:\n    ');
    zetBouwsteen(view, steen('als'));
    expect(tekst(view)).toBe('while True:\n    if voorwaarde:\n        \n    ');
    expect(selectie(view)).toBe('voorwaarde');
  });

  it('haalt met één Ctrl+Z de code, de import en de opzet weer weg', () => {
    const begin = 'while True:\n    ';
    const view = editor(begin);
    zetBouwsteen(view, steen('lampje-aan'));
    expect(tekst(view)).toContain('from machine import Pin');
    undo(view);
    expect(tekst(view)).toBe(begin);
  });

  it('zet een selectie over hele regels in het gat van een lus', () => {
    const doc = 'print(1)\nprint(2)\nprint(3)\n';
    // Van het begin van regel 1 tot het begin van regel 3: regel 3 hoort er niet bij.
    const view = editor(doc, 0, doc.indexOf('print(3)'));
    zetBouwsteen(view, steen('herhaal-altijd'));
    expect(tekst(view)).toBe('while True:\n    print(1)\n    print(2)\nprint(3)\n');
  });

  it('een losgelaten bouwsteen gebruikt de regel, niet de selectie', () => {
    const doc = 'print(1)\nprint(2)\n';
    const view = editor(doc, 0, doc.length);
    zetBouwsteen(view, steen('herhaal-altijd'), { regel: 1 });
    expect(tekst(view)).toBe('print(1)\nprint(2)\nwhile True:\n    \n');
  });

  it('geeft de melding over een bezette pin terug', () => {
    const view = editor('');
    expect(zetBouwsteen(view, steen('buzzer-aan')).melding).toBeNull();
    expect(zetBouwsteen(view, steen('servo')).melding).toMatch(/^Pin D6 staat al op regel/);
  });

  it('elke bouwsteen op elke regel geeft het document van voegIn, en één undo herstelt', () => {
    const doc = 'from time import sleep\n\nwhile True:\n    sleep(1)\n\n    print(1)\n';
    const regels = doc.split('\n').length;
    for (const b of BOUWSTENEN) {
      for (let regel = 0; regel < regels; regel++) {
        const view = editor(doc);
        const uit = zetBouwsteen(view, b, { regel });
        expect(tekst(view), `${b.id} op ${regel}`).toBe(uit.doc);
        expect(view.state.selection.main.from).toBe(uit.van);
        expect(view.state.selection.main.to).toBe(uit.tot);
        undo(view);
        expect(tekst(view), `${b.id} op ${regel}`).toBe(doc);
        view.destroy();
        views.pop();
      }
    }
  });
});

describe('Enter en Tab na het invullen', () => {
  it('Enter na de voorwaarde gaat naar het gat, en breekt de regel niet', () => {
    const view = editor('');
    zetBouwsteen(view, steen('als'));
    view.dispatch(view.state.replaceSelection('teller > 3'));
    expect(toets(view, 'Enter')).toBe(true);
    expect(tekst(view)).toBe('if teller > 3:\n    \n');
    expect(view.state.selection.main.head).toBe('if teller > 3:\n    '.length);
  });

  it('Tab doet hetzelfde, en springt anders gewoon in', () => {
    const view = editor('');
    zetBouwsteen(view, steen('herhaal-zolang'));
    view.dispatch(view.state.replaceSelection('x < 5'));
    expect(toets(view, 'Tab')).toBe(true);
    expect(tekst(view)).toBe('while x < 5:\n    \n');
    expect(view.state.selection.main.head).toBe('while x < 5:\n    '.length);

    const gewoon = editor('print(1)', 0);
    toets(gewoon, 'Tab');
    expect(tekst(gewoon)).toMatch(/^\s+print\(1\)$/);
  });

  it('Enter na de naam van Onthoud iets begint een nieuwe regel eronder', () => {
    const view = editor('');
    zetBouwsteen(view, steen('onthoud'));
    view.dispatch(view.state.replaceSelection('lijnen'));
    expect(toets(view, 'Enter')).toBe(true);
    expect(tekst(view)).toBe('lijnen = 0\n');
  });

  it('Enter op een andere plek doet wat hij altijd doet', () => {
    const view = editor('print(1)', 3);
    expect(toets(view, 'Enter')).toBe(false);
    expect(tekst(view)).toBe('print(1)');
  });
});

describe('wat de editor tekent', () => {
  const klassen = (view: EditorView) =>
    Array.from(view.contentDOM.querySelectorAll('.cm-line')).map((el) => el.className);

  it('een leeg gat krijgt een klasse, en verliest hem als er code in staat', () => {
    const view = editor('');
    zetBouwsteen(view, steen('als-anders'));
    expect(klassen(view).map((k) => k.includes('cm-gat'))).toEqual([
      false,
      true,
      false,
      true,
      false,
    ]);
    view.dispatch({ changes: { from: view.state.doc.line(2).to, insert: 'print(1)' } });
    expect(klassen(view).map((k) => k.includes('cm-gat'))).toEqual([
      false,
      false,
      false,
      true,
      false,
    ]);
  });

  it('een woord dat nog ingevuld moet worden, is gemarkeerd tot het is overgetypt', () => {
    const view = editor('');
    zetBouwsteen(view, steen('als'));
    expect(view.contentDOM.querySelector('.cm-invul')?.textContent).toBe('voorwaarde');
    view.dispatch(view.state.replaceSelection('x > 3'));
    expect(view.contentDOM.querySelector('.cm-invul')).toBeNull();
  });
});

describe('slepen', () => {
  const sleep = (id: string | null) => ({
    dataTransfer: {
      types: id === null ? ['text/plain'] : [SLEEP_TYPE],
      getData: (soort: string) => (soort === SLEEP_TYPE && id ? id : ''),
      dropEffect: 'none',
    } as unknown as DataTransfer,
    clientX: 5,
    clientY: 5,
    preventDefault: vi.fn(),
  });

  it('pakt alleen een bouwsteen op, geen gesleepte tekst', () => {
    const view = editor('print(1)');
    const los = sleep(null);
    expect(sleepOver(view, los)).toBe(false);
    expect(sleepLos(view, los)).toBeNull();
    expect(los.preventDefault).not.toHaveBeenCalled();
    expect(tekst(view)).toBe('print(1)');
  });

  it('zet een losgelaten bouwsteen in de code en meldt het resultaat', () => {
    const view = editor('');
    const gebeurtenis = sleep('lampje-aan');
    expect(sleepOver(view, gebeurtenis)).toBe(true);
    expect(gebeurtenis.dataTransfer.dropEffect).toBe('copy');
    const uit = sleepLos(view, gebeurtenis);
    expect(uit?.doc).toContain('lampje.on()');
    expect(tekst(view)).toBe(uit?.doc);
    expect(gebeurtenis.preventDefault).toHaveBeenCalled();
  });

  it('een onbekende bouwsteen doet niets', () => {
    const view = editor('print(1)');
    expect(sleepLos(view, sleep('bestaat-niet'))).toBeNull();
    expect(tekst(view)).toBe('print(1)');
  });
});

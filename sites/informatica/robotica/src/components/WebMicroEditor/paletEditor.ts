// De kant van CodeMirror van het palet: een bouwsteen in de code zetten, het
// slepen opvangen, de gaten en de invulplekken tekenen, en Enter en Tab naar
// het gat laten springen. De regels zelf staan in invoegen.ts en gaten.ts.

import { acceptCompletion, completionStatus } from '@codemirror/autocomplete';
import { indentMore, insertNewlineAndIndent } from '@codemirror/commands';
import { type Extension, Prec, StateEffect, StateField } from '@codemirror/state';
import { Decoration, EditorView, keymap } from '@codemirror/view';
import { type Bouwsteen, SLEEP_TYPE, bouwsteenMetId } from './bouwstenen';
import { gatRegels, invulPlekken, sprong } from './gaten';
import { type Invoeging, type Selectie, verschil, voegIn } from './invoegen';

type Opties = {
  /** De regel (vanaf 0); zonder: de regel van de cursor, of de selectie. */
  regel?: number;
  /** Na afloop de cursor in de code zetten. */
  focus?: boolean;
};

/**
 * Zet een bouwsteen uit het palet in de code. Eén wijziging, zodat Ctrl+Z de
 * hele bouwsteen weer weghaalt: de code, de import en de opzet.
 */
export function zetBouwsteen(
  view: EditorView,
  bouwsteen: Bouwsteen,
  { regel, focus = true }: Opties = {},
): Invoeging {
  const { doc, selection } = view.state;
  const oud = doc.toString();
  const { from, to, head } = selection.main;
  let selectie: Selectie | undefined;
  if (regel === undefined && from !== to) {
    const eind = doc.lineAt(to);
    // Een selectie tot het begin van een regel omvat die regel niet.
    const tot =
      eind.from === to && eind.number > doc.lineAt(from).number ? eind.number - 2 : eind.number - 1;
    selectie = { van: doc.lineAt(from).number - 1, tot };
  }
  const uit = voegIn(oud, regel ?? doc.lineAt(head).number - 1, bouwsteen, selectie);
  const { van, tot, tekst } = verschil(oud, uit.doc);
  view.dispatch({
    changes: { from: van, to: tot, insert: tekst },
    selection: { anchor: uit.van, head: uit.tot },
    scrollIntoView: true,
    userEvent: 'input.bouwsteen',
  });
  if (focus) view.focus();
  return uit;
}

// --- Slepen -----------------------------------------------------------------

const zetSleepRegel = StateEffect.define<number | null>();

/** De regel (vanaf 1) waar een gesleepte bouwsteen nu boven hangt. */
const sleepRegel = StateField.define<number | null>({
  create: () => null,
  update(waarde, tr) {
    for (const e of tr.effects) if (e.is(zetSleepRegel)) return e.value;
    return tr.docChanged ? null : waarde;
  },
});

const sleepAanwijzing = EditorView.decorations.compute([sleepRegel, 'doc'], (state) => {
  const nummer = state.field(sleepRegel);
  if (nummer === null || nummer > state.doc.lines) return Decoration.none;
  const regel = state.doc.line(nummer);
  // Op een lege regel komt de code op die regel, anders eronder.
  const klasse = regel.text.trim() === '' ? 'cm-sleep-op' : 'cm-sleep-onder';
  return Decoration.set([Decoration.line({ class: klasse }).range(regel.from)]);
});

type Sleep = { dataTransfer: DataTransfer | null; clientX: number; clientY: number };

const isBouwsteen = (event: Sleep) => Boolean(event.dataTransfer?.types.includes(SLEEP_TYPE));

/** De regel (vanaf 1) onder de muis; ook boven de regelnummers of onder de code. */
function regelBij(view: EditorView, event: Sleep): number {
  const vak = view.contentDOM.getBoundingClientRect();
  const x = Math.min(Math.max(event.clientX, vak.left + 1), vak.right - 1);
  return view.state.doc.lineAt(view.posAtCoords({ x, y: event.clientY }, false)).number;
}

/** Een bouwsteen hangt boven de editor: laat zien op welke regel hij komt. */
export function sleepOver(view: EditorView, event: Sleep & { preventDefault(): void }): boolean {
  if (!isBouwsteen(event)) return false;
  event.preventDefault();
  if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy';
  const regel = regelBij(view, event);
  if (view.state.field(sleepRegel) !== regel) view.dispatch({ effects: zetSleepRegel.of(regel) });
  return true;
}

/** De bouwsteen is weg of losgelaten: de regel niet meer aanwijzen. */
export function sleepWeg(view: EditorView): void {
  if (view.state.field(sleepRegel) !== null) view.dispatch({ effects: zetSleepRegel.of(null) });
}

/** Een bouwsteen is losgelaten: zet hem op de regel onder de muis. */
export function sleepLos(
  view: EditorView,
  event: Sleep & { preventDefault(): void },
): Invoeging | null {
  const bouwsteen = bouwsteenMetId(event.dataTransfer?.getData(SLEEP_TYPE) ?? '');
  if (!bouwsteen) return null;
  event.preventDefault();
  const regel = regelBij(view, event) - 1;
  sleepWeg(view);
  return zetBouwsteen(view, bouwsteen, { regel });
}

// --- Gaten en invulplekken --------------------------------------------------

const gat = Decoration.line({ class: 'cm-gat' });
const invul = Decoration.mark({ class: 'cm-invul' });

const openPlekken = EditorView.decorations.compute(['doc'], (state) => {
  const regels = state.doc.toString().split('\n');
  const bereiken = [
    ...gatRegels(regels).map((i) => gat.range(state.doc.line(i + 1).from)),
    ...invulPlekken(regels).map((p) => {
      const begin = state.doc.line(p.regel + 1).from;
      return invul.range(begin + p.van, begin + p.tot);
    }),
  ];
  return Decoration.set(bereiken, true);
});

/** Enter of Tab vlak voor het eind van een regel uit een bouwsteen: naar het gat. */
function naarGat(view: EditorView): boolean {
  const { main } = view.state.selection;
  if (!main.empty) return false;
  const regel = view.state.doc.lineAt(main.head);
  const regels = view.state.doc.toString().split('\n');
  const doel = sprong(regels, regel.number - 1, main.head - regel.from);
  if (!doel) return false;
  if (doel.soort === 'gat') {
    view.dispatch({
      selection: { anchor: view.state.doc.line(doel.regel + 1).to },
      scrollIntoView: true,
    });
    return true;
  }
  view.dispatch({ selection: { anchor: regel.to } });
  return insertNewlineAndIndent(view);
}

const opmaak = EditorView.baseTheme({
  // Een leeg blok: een regel met alleen spaties zie je niet.
  '.cm-gat': {
    // Twee stippellijnen, grijs in licht en donker.
    backgroundImage: [
      'repeating-linear-gradient(90deg, rgba(128,128,128,.7) 0 6px, transparent 6px 12px)',
      'repeating-linear-gradient(90deg, rgba(128,128,128,.7) 0 6px, transparent 6px 12px)',
    ].join(', '),
    backgroundSize: '100% 1px, 100% 1px',
    backgroundPosition: '0 2px, 0 calc(100% - 2px)',
    backgroundRepeat: 'no-repeat',
  },
  '.cm-gat::after': {
    content: '"hier komt je code"',
    fontStyle: 'italic',
    opacity: '0.55',
    pointerEvents: 'none',
  },
  '.cm-invul': {
    borderBottom: '2px dashed currentColor',
    borderRadius: '2px',
  },
  '&light .cm-invul': { backgroundColor: '#fde9b0' },
  '&dark .cm-invul': { backgroundColor: '#5c4a12' },
  '.cm-sleep-onder': { boxShadow: 'inset 0 -3px 0 var(--ifm-color-primary, #2e8555)' },
  '.cm-sleep-op': { boxShadow: 'inset 0 0 0 2px var(--ifm-color-primary, #2e8555)' },
});

/**
 * Alles wat de editor voor het palet nodig heeft. `opInvoeging` krijgt wat een
 * losgelaten bouwsteen opleverde, voor de melding over een bezette pin.
 */
export function paletUitbreiding(opInvoeging: (uit: Invoeging) => void = () => {}): Extension {
  return [
    sleepRegel,
    sleepAanwijzing,
    openPlekken,
    opmaak,
    EditorView.domEventHandlers({
      dragover: (event, view) => sleepOver(view, event),
      dragleave(event, view) {
        const naar = event.relatedTarget;
        if (!(naar instanceof Node) || !view.dom.contains(naar)) sleepWeg(view);
        return false;
      },
      drop(event, view) {
        const uit = sleepLos(view, event);
        if (uit) opInvoeging(uit);
        return uit !== null;
      },
    }),
    Prec.highest(
      keymap.of([
        {
          key: 'Enter',
          // Staat het aanvullijstje open, dan kiest Enter daaruit.
          run: (view) => completionStatus(view.state) !== 'active' && naarGat(view),
        },
        {
          key: 'Tab',
          run(view) {
            if (completionStatus(view.state) === 'active') return acceptCompletion(view);
            return naarGat(view) || indentMore(view);
          },
        },
      ]),
    ),
  ];
}

import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { Prec } from '@codemirror/state';
// Eén toegangspunt voor alle CodeMirror-onderdelen. CodeEditor laadt dit met één
// dynamische import, zodat webpack alles in één async chunk stopt. Zeven losse
// `import('@codemirror/...')`-aanroepen lieten de dev-bundler @codemirror/state
// over meerdere chunks dupliceren → "multiple instances of @codemirror/state
// ... breaking instanceof checks". Met één chunk bestaat er precies één kopie.
import { tags } from '@lezer/highlight';

export {
  EditorView,
  keymap,
  lineNumbers,
  highlightActiveLine,
  highlightActiveLineGutter,
} from '@codemirror/view';
export { EditorState } from '@codemirror/state';
export { python } from '@codemirror/lang-python';
export { oneDark } from '@codemirror/theme-one-dark';
export {
  defaultKeymap,
  history,
  historyKeymap,
  indentWithTab,
} from '@codemirror/commands';
export {
  indentOnInput,
  indentUnit,
  bracketMatching,
  syntaxHighlighting,
  defaultHighlightStyle,
} from '@codemirror/language';
export { closeBrackets } from '@codemirror/autocomplete';

// oneDark kleurt getallen oranje, terwijl ze in licht groen zijn (#164 van
// defaultHighlightStyle): een leerling zag zijn getallen van kleur verspringen
// (issue #158). In donker krijgen ze hetzelfde groen, lichter gemaakt zodat het
// op de donkere achtergrond leesbaar is. Prec.highest gaat voor oneDark.
export const GETAL_DONKER = '#3ecf8e';
export const getallenStijl = HighlightStyle.define([{ tag: tags.number, color: GETAL_DONKER }]);
export const getallenDonker = Prec.highest(syntaxHighlighting(getallenStijl));

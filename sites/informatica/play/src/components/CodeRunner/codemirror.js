import { HighlightStyle } from '@codemirror/language';
import { CODEMIRROR, codeMirrorStijlen } from '@coderius/shared/prism-thema';
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
export { oneDarkTheme } from '@codemirror/theme-one-dark';
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
} from '@codemirror/language';
export { closeBrackets } from '@codemirror/autocomplete';

// De kleuren van de code, in licht en donker uit één lijst (CODEMIRROR in
// packages/shared/prism-thema.js): een soort code heeft in beide standen een
// kleur of in geen van beide. oneDark kleurde getallen oranje terwijl ze in
// licht groen zijn (issue #158), en `range(`, `print(` en elke variabele
// blauw en rood terwijl ze in licht zwart waren (#223). In donker komt van
// oneDark alleen nog het uiterlijk van de editor (oneDarkTheme).
export const kleuren = codeMirrorStijlen({ HighlightStyle, tags });
export const GETAL_DONKER = CODEMIRROR.find((r) => r.soorten.some((s) => s[0] === 'number')).donker;

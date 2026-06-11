// Eén toegangspunt voor alle CodeMirror-onderdelen. CodeEditor laadt dit met één
// dynamische import, zodat webpack alles in één async chunk stopt. Zeven losse
// `import('@codemirror/...')`-aanroepen lieten de dev-bundler @codemirror/state
// over meerdere chunks dupliceren → "multiple instances of @codemirror/state
// ... breaking instanceof checks". Met één chunk bestaat er precies één kopie.
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
  bracketMatching,
  syntaxHighlighting,
  defaultHighlightStyle,
} from '@codemirror/language';
export { closeBrackets } from '@codemirror/autocomplete';

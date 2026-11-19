import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import type { Extension } from '@codemirror/state';
import { codeMirrorStijlen } from '@coderius/shared/prism-thema';
import { tags } from '@lezer/highlight';
import { defaultLightThemeOption, oneDarkTheme } from '@uiw/react-codemirror';

// De kleuren van de code in de editor en in het voorbeeld, in licht en donker
// uit één lijst (CODEMIRROR in packages/shared/prism-thema.js). Met de thema's
// 'light' en 'dark' van @uiw kleurde oneDark in donker `range(`, `print(` en
// elke variabele, en de lichte stijl in licht niet (issue #223). Van oneDark
// komt nu alleen het uiterlijk van de editor (oneDarkTheme), zoals in play.
const stijlen = codeMirrorStijlen({ HighlightStyle, tags });

export const LICHT: Extension = [defaultLightThemeOption, syntaxHighlighting(stijlen.licht)];
export const DONKER: Extension = [oneDarkTheme, syntaxHighlighting(stijlen.donker)];

/** Het thema van een CodeMirror in robotica, in licht of donker. */
export const editorThema = (donker: boolean): Extension => (donker ? DONKER : LICHT);

import type * as monacoNs from 'monaco-editor';

// Eigen thema's die aansluiten op de Infima-kleuren van de Docusaurus-sites
// (licht: wit met GitHub-achtige accenten, donker: #1b1b1d zoals
// --ifm-background-color in dark mode).
export function defineCoderiusThemes(monaco: typeof monacoNs): void {
  monaco.editor.defineTheme('coderius-light', {
    base: 'vs',
    inherit: true,
    rules: [],
    colors: {
      'editor.background': '#ffffff',
      'editor.lineHighlightBackground': '#f6f8fa',
      'editorLineNumber.foreground': '#8d949e',
      'editorGutter.background': '#ffffff',
    },
  });
  monaco.editor.defineTheme('coderius-dark', {
    base: 'vs-dark',
    inherit: true,
    rules: [],
    colors: {
      'editor.background': '#1b1b1d',
      'editor.lineHighlightBackground': '#26272b',
      'editorLineNumber.foreground': '#6e7681',
      'editorGutter.background': '#1b1b1d',
    },
  });
}

export function themeForColorMode(colorMode: 'light' | 'dark'): string {
  return colorMode === 'dark' ? 'coderius-dark' : 'coderius-light';
}

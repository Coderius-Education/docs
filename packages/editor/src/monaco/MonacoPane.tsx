import Editor, { type BeforeMount, type OnMount } from '@monaco-editor/react';
import type * as monacoNs from 'monaco-editor';
import { type ReactNode, useCallback, useEffect, useState } from 'react';
import { configureMonacoLoader } from './loader';
import { defineCoderiusThemes, themeForColorMode } from './themes';

// Lees de kleurmodus van het `data-theme`-attribuut op <html> i.p.v. via
// useColorMode uit @docusaurus/theme-common. Dat vermijdt een import van
// theme-common in dit gedeelde package: met pnpm krijgt het anders een eigen
// fysieke kopie van theme-common, wat in de sites een tweede React-context
// oplevert ("Hook ... outside Provider", ReactContextError tijdens SSG).
function useColorMode(): { colorMode: 'light' | 'dark' } {
  const [colorMode, setColorMode] = useState<'light' | 'dark'>(() =>
    typeof document !== 'undefined' &&
    document.documentElement.getAttribute('data-theme') === 'dark'
      ? 'dark'
      : 'light',
  );
  useEffect(() => {
    const read = () =>
      setColorMode(
        document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light',
      );
    read();
    const observer = new MutationObserver(read);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });
    return () => observer.disconnect();
  }, []);
  return { colorMode };
}

export interface MonacoPaneProps {
  value: string;
  onChange?: (value: string) => void;
  language?: string;
  // Bestandspad als model-identiteit: tabs die van pad wisselen behouden zo
  // hun eigen undo-historie (één Monaco-model per pad).
  path?: string;
  height?: number | string;
  readOnly?: boolean;
  options?: monacoNs.editor.IStandaloneEditorConstructionOptions;
  onMount?: OnMount;
}

const BASE_OPTIONS: monacoNs.editor.IStandaloneEditorConstructionOptions = {
  minimap: { enabled: false },
  fontSize: 14,
  tabSize: 4,
  insertSpaces: true,
  scrollBeyondLastLine: false,
  automaticLayout: true,
  padding: { top: 8, bottom: 8 },
  scrollbar: { verticalScrollbarSize: 10, horizontalScrollbarSize: 10 },
  // Suggestie-popups mogen buiten de editor-rand vallen (editors staan vaak
  // in een kleine container midden op een lespagina).
  fixedOverflowWidgets: true,
  renderLineHighlight: 'line',
  contextmenu: false,
};

export default function MonacoPane({
  value,
  onChange,
  language,
  path,
  height = 260,
  readOnly = false,
  options,
  onMount,
}: MonacoPaneProps): ReactNode {
  configureMonacoLoader();
  const { colorMode } = useColorMode();

  const handleBeforeMount: BeforeMount = useCallback((monaco) => {
    defineCoderiusThemes(monaco);
  }, []);

  const handleChange = useCallback(
    (next: string | undefined) => {
      onChange?.(next ?? '');
    },
    [onChange],
  );

  return (
    <Editor
      value={value}
      onChange={handleChange}
      language={language}
      path={path}
      height={height}
      theme={themeForColorMode(colorMode)}
      beforeMount={handleBeforeMount}
      onMount={onMount}
      loading={<div style={{ padding: '1rem', fontSize: 14 }}>Editor laden…</div>}
      options={{ ...BASE_OPTIONS, readOnly, ...options }}
    />
  );
}

import React, { useEffect, useRef, useState } from 'react';
import BrowserOnly from '@docusaurus/BrowserOnly';
import styles from './CodeEditor.module.css';

/**
 * Safely detect color mode without depending on ColorModeProvider context.
 * Falls back to reading the `data-theme` attribute on <html>.
 */
function useColorModeSafe() {
  const [colorMode, setColorMode] = useState(() => {
    if (typeof document !== 'undefined') {
      return document.documentElement.getAttribute('data-theme') || 'light';
    }
    return 'light';
  });

  useEffect(() => {
    const observer = new MutationObserver(() => {
      const theme = document.documentElement.getAttribute('data-theme') || 'light';
      setColorMode(theme);
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });
    return () => observer.disconnect();
  }, []);

  return colorMode;
}

function CodeEditorInner({ value, onChange, readOnly = false, height = '300px' }) {
  const containerRef = useRef(null);
  const viewRef = useRef(null);
  const colorMode = useColorModeSafe();

  useEffect(() => {
    let destroyed = false;

    async function init() {
      const {
        EditorView, keymap, lineNumbers, highlightActiveLine, highlightActiveLineGutter,
        EditorState,
        python,
        oneDark,
        defaultKeymap, history, historyKeymap, indentWithTab,
        indentOnInput, bracketMatching, syntaxHighlighting, defaultHighlightStyle,
        closeBrackets,
      } = await import('./codemirror');

      if (destroyed || !containerRef.current) return;

      // Clear any previous editor
      if (viewRef.current) {
        viewRef.current.destroy();
      }

      const extensions = [
        lineNumbers(),
        highlightActiveLine(),
        highlightActiveLineGutter(),
        history(),
        indentOnInput(),
        bracketMatching(),
        closeBrackets(),
        python(),
        keymap.of([...defaultKeymap, ...historyKeymap, indentWithTab]),
        EditorView.lineWrapping,
      ];

      if (colorMode === 'dark') {
        extensions.push(oneDark);
      } else {
        extensions.push(syntaxHighlighting(defaultHighlightStyle));
        extensions.push(EditorView.theme({
          '&': { backgroundColor: '#fafafa' },
          '.cm-gutters': { backgroundColor: '#f0f0f0', borderRight: '1px solid #ddd' },
          '.cm-activeLineGutter': { backgroundColor: '#e8e8e8' },
          '.cm-activeLine': { backgroundColor: '#f0f4ff' },
        }));
      }

      if (readOnly) {
        extensions.push(EditorState.readOnly.of(true));
        extensions.push(EditorView.editable.of(false));
      }

      if (onChange) {
        extensions.push(EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            onChange(update.state.doc.toString());
          }
        }));
      }

      const state = EditorState.create({
        doc: value || '',
        extensions,
      });

      viewRef.current = new EditorView({
        state,
        parent: containerRef.current,
      });
    }

    init();

    return () => {
      destroyed = true;
      if (viewRef.current) {
        viewRef.current.destroy();
        viewRef.current = null;
      }
    };
  }, [colorMode, readOnly]); // Recreate on theme or readOnly change

  // Update content when value prop changes externally
  useEffect(() => {
    if (viewRef.current && value !== undefined) {
      const currentContent = viewRef.current.state.doc.toString();
      if (currentContent !== value) {
        viewRef.current.dispatch({
          changes: {
            from: 0,
            to: currentContent.length,
            insert: value,
          },
        });
      }
    }
  }, [value]);

  return (
    <div
      ref={containerRef}
      className={styles.editor}
      style={{ height }}
    />
  );
}

export default function CodeEditor(props) {
  return (
    <BrowserOnly fallback={<div className={styles.fallback}>Editor laden...</div>}>
      {() => <CodeEditorInner {...props} />}
    </BrowserOnly>
  );
}

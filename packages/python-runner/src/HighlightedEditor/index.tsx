// De editor: een transparante textarea boven een Prism-gekleurde <pre>. Staat
// los van PythonPlayground omdat ook CodeExercise en de Stapper hem gebruiken —
// en met de Stapper erbij zou een import uit PythonPlayground een cirkel maken.
//
// De CSS blijft in PythonPlayground/styles.module.css: die classes horen bij
// elkaar (gutter, highlight-laag en textarea moeten exact dezelfde
// font-metrics houden) en staan daar met de uitleg waarom er !important bij moet.
import { Highlight, themes } from 'prism-react-renderer';
import type React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import styles from '../PythonPlayground/styles.module.css';
import { enterInvoegen, tabInvoegen, tabWeghalen } from '../inspringen';

// Lees de kleurmodus rechtstreeks van het `data-theme`-attribuut op <html> i.p.v.
// via useColorMode uit @docusaurus/theme-common. Dat vermijdt een import van
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

export function HighlightedEditor({
  code,
  onChange,
  onKeyDown,
  disabled,
  minHeight = 250,
  highlightLine,
  readOnly,
}: {
  code: string;
  onChange: (value: string) => void;
  /** Eigen toetsen (Ctrl+Enter); gaat voor op Tab/Enter en kan die overnemen met preventDefault. */
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  disabled: boolean;
  minHeight?: number;
  /** 1-gebaseerd regelnummer om te markeren; gebruikt door de stapper. */
  highlightLine?: number;
  readOnly?: boolean;
}) {
  const { colorMode } = useColorMode();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Tab springt in, Shift+Tab haalt de inspringing weg en Enter houdt de
  // inspringing vast (een niveau dieper na een dubbele punt). Een eigen
  // onKeyDown gaat voor en kan die toetsen overnemen met preventDefault.
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      onKeyDown?.(e);
      if (e.defaultPrevented || readOnly || disabled) return;
      const isTab = e.key === 'Tab';
      const isEnter = e.key === 'Enter' && !e.ctrlKey && !e.metaKey && !e.altKey;
      if (!isTab && !isEnter) return;
      e.preventDefault();
      const target = e.currentTarget;
      const { selectionStart, selectionEnd } = target;
      const bewerking = isEnter
        ? enterInvoegen(code, selectionStart, selectionEnd)
        : e.shiftKey
          ? tabWeghalen(code, selectionStart, selectionEnd)
          : tabInvoegen(code, selectionStart, selectionEnd);
      if (bewerking.code === code) return;
      onChange(bewerking.code);
      requestAnimationFrame(() => {
        target.selectionStart = bewerking.start;
        target.selectionEnd = bewerking.end;
      });
    },
    [code, onChange, onKeyDown, readOnly, disabled],
  );
  const preRef = useRef<HTMLPreElement>(null);

  const gutterRef = useRef<HTMLDivElement>(null);

  const handleScroll = () => {
    if (textareaRef.current && preRef.current) {
      preRef.current.scrollTop = textareaRef.current.scrollTop;
      preRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
    if (textareaRef.current && gutterRef.current) {
      gutterRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  const lineCount = code.split('\n').length;
  const theme = colorMode === 'dark' ? themes.dracula : themes.github;

  return (
    <div className={styles.editorWrapper} style={{ minHeight }}>
      <div ref={gutterRef} className={styles.gutter} aria-hidden="true">
        {Array.from({ length: lineCount }, (_, i) => (
          <div
            // biome-ignore lint/suspicious/noArrayIndexKey: index is de regelnummer-identiteit zelf.
            key={i}
            className={
              i + 1 === highlightLine
                ? `${styles.gutterLine} ${styles.gutterLineActief}`
                : styles.gutterLine
            }
          >
            {i + 1}
          </div>
        ))}
      </div>
      <Highlight theme={theme} code={code} language="python">
        {({ tokens, getLineProps, getTokenProps, style }) => (
          <pre
            ref={preRef}
            className={styles.highlightPre}
            style={{ ...style, minHeight }}
            aria-hidden="true"
          >
            {tokens.map((line, i) => {
              const lineProps = getLineProps({ line });
              // De eigen class erbij in plaats van eroverheen: getLineProps
              // levert zelf al `token-line`.
              const className = [lineProps.className, i + 1 === highlightLine && styles.regelActief]
                .filter(Boolean)
                .join(' ');
              return (
                // biome-ignore lint/suspicious/noArrayIndexKey: index is de regelnummer-identiteit zelf.
                <div key={i} {...lineProps} className={className}>
                  {line.map((token, key) => (
                    // biome-ignore lint/suspicious/noArrayIndexKey: index is de token-positie in de regel.
                    <span key={key} {...getTokenProps({ token })} />
                  ))}
                </div>
              );
            })}
            <br />
          </pre>
        )}
      </Highlight>
      <textarea
        ref={textareaRef}
        className={styles.editorTextarea}
        value={code}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onScroll={handleScroll}
        spellCheck={false}
        placeholder="Schrijf hier je Python code..."
        disabled={disabled}
        readOnly={readOnly}
      />
    </div>
  );
}

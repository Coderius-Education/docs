import React, {useCallback, useRef} from 'react';
import {Highlight, Prism, themes} from 'prism-react-renderer';
import {useColorMode} from '@docusaurus/theme-common';
import styles from './styles.module.css';

// Tijdens server-side generatie (SSG) kan de ColorMode-context ontbreken — in de
// monorepo o.a. doordat er meerdere @docusaurus/theme-common kopieën bestaan.
// useColorMode roept onder water useContext aan (de hook draait dus altijd) en
// gooit pas daarna als de provider ontbreekt; dat vangen we hier af.
function useSafeColorMode(): {colorMode: 'light' | 'dark'} {
  try {
    return useColorMode();
  } catch {
    return {colorMode: 'light'};
  }
}

// prism-react-renderer's bundled Prism omits Python. Register it once on the
// shared Prism instance so <Highlight language="python"> actually tokenises.
// The (window as any).Prism = Prism dance is the documented integration path.
if (typeof globalThis !== 'undefined') {
  (globalThis as any).Prism = Prism;
}
// eslint-disable-next-line @typescript-eslint/no-require-imports
require('prismjs/components/prism-python');

export type HighlightedEditorProps = {
  code: string;
  onChange: (next: string) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  disabled?: boolean;
  readOnly?: boolean;
  minHeight?: number;
  ariaLabel?: string;
};

export function HighlightedEditor({
  code,
  onChange,
  onKeyDown,
  disabled = false,
  readOnly = false,
  minHeight = 120,
  ariaLabel = 'Python code',
}: HighlightedEditorProps): React.ReactElement {
  const {colorMode} = useSafeColorMode();
  const prismTheme = colorMode === 'dark' ? themes.vsDark : themes.github;
  const highlightRef = useRef<HTMLPreElement>(null);

  // Trailing newline keeps the highlight layer height in sync with the textarea
  // as the user types past the last visible line.
  const displayCode = code.endsWith('\n') ? code + ' ' : code;

  // Keep the highlight <pre>'s scroll position glued to the textarea's so the
  // painted tokens follow when the student scrolls a long code block.
  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLTextAreaElement>) => {
      const pre = highlightRef.current;
      if (pre) {
        pre.scrollTop = e.currentTarget.scrollTop;
        pre.scrollLeft = e.currentTarget.scrollLeft;
      }
    },
    [],
  );

  return (
    <div className={styles.wrapper} style={{minHeight}}>
      <Highlight code={displayCode} language="python" theme={prismTheme}>
        {({className, style, tokens, getLineProps, getTokenProps}) => (
          <pre
            ref={highlightRef}
            className={`${styles.highlight} ${className}`}
            style={{...style, background: 'transparent'}}
            aria-hidden="true">
            {tokens.map((line, i) => {
              const {key: _lineKey, ...lineProps} = getLineProps({line});
              return (
                <div key={i} {...lineProps}>
                  {line.map((token, j) => {
                    const {key: _tokKey, ...tokenProps} = getTokenProps({token});
                    return <span key={j} {...tokenProps} />;
                  })}
                </div>
              );
            })}
          </pre>
        )}
      </Highlight>
      <textarea
        className={styles.textarea}
        value={code}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        onScroll={handleScroll}
        disabled={disabled}
        readOnly={readOnly}
        spellCheck={false}
        autoCapitalize="off"
        autoCorrect="off"
        autoComplete="off"
        aria-label={ariaLabel}
      />
    </div>
  );
}

export default HighlightedEditor;

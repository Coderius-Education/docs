import { Highlight, Prism, themes } from 'prism-react-renderer';
import type React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { tabInvoegen, tabWeghalen } from '../../lib/inspringen';
import styles from './styles.module.css';

// Lees de kleurmodus rechtstreeks van het `data-theme`-attribuut op <html> i.p.v.
// via useColorMode uit @docusaurus/theme-common. Met pnpm krijgt theme-common
// anders een tweede fysieke kopie, wat een tweede React-context oplevert
// ("Hook ... outside the <ColorModeProvider>") en de pagina tijdens SSG laat
// crashen. Een try/catch om de hook heen was geen oplossing: een hook die soms
// wél en soms niet doorloopt breekt de hook-volgorde van React. Zelfde patroon
// als de HighlightedEditor in @coderius/python-runner en WebMicroEditor.
function useColorMode(): { colorMode: 'light' | 'dark' } {
  // Bewust altijd 'light' als beginwaarde, ook in de browser: de server
  // rendert light, en als de client met 'dark' begint komt de eerste render
  // overeen met de state, zodat de effect-read hieronder niets verandert en
  // de editor light blijft tot de volgende toetsaanslag. Zo flipt hij meteen.
  const [colorMode, setColorMode] = useState<'light' | 'dark'>('light');
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

// prism-react-renderer's bundled Prism omits Python. Register it once on the
// shared Prism instance so <Highlight language="python"> actually tokenises.
// The (window as GlobalThisWithPrism).Prism = Prism dance is the documented
// integration path (prismjs' language plugins mutate the global Prism).
interface GlobalThisWithPrism {
  Prism: typeof Prism;
}
if (typeof globalThis !== 'undefined') {
  (globalThis as unknown as GlobalThisWithPrism).Prism = Prism;
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
  const { colorMode } = useColorMode();
  const prismTheme = colorMode === 'dark' ? themes.vsDark : themes.github;
  const highlightRef = useRef<HTMLPreElement>(null);

  // Trailing newline keeps the highlight layer height in sync with the textarea
  // as the user types past the last visible line.
  const displayCode = code.endsWith('\n') ? `${code} ` : code;

  // Keep the highlight <pre>'s scroll position glued to the textarea's so the
  // painted tokens follow when the student scrolls a long code block.
  // Tab springt in en Shift+Tab haalt de inspringing weg, in elke editor die
  // dit component gebruikt. Een eigen onKeyDown (Ctrl+Enter in PyRunner) gaat
  // voor en kan Tab overnemen door preventDefault aan te roepen.
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      onKeyDown?.(e);
      if (e.defaultPrevented || e.key !== 'Tab' || readOnly || disabled) return;
      e.preventDefault();
      const target = e.currentTarget;
      const bewerking = e.shiftKey
        ? tabWeghalen(code, target.selectionStart, target.selectionEnd)
        : tabInvoegen(code, target.selectionStart, target.selectionEnd);
      if (bewerking.code === code) return;
      onChange(bewerking.code);
      requestAnimationFrame(() => {
        target.selectionStart = bewerking.start;
        target.selectionEnd = bewerking.end;
      });
    },
    [code, onChange, onKeyDown, readOnly, disabled],
  );

  const handleScroll = useCallback((e: React.UIEvent<HTMLTextAreaElement>) => {
    const pre = highlightRef.current;
    if (pre) {
      pre.scrollTop = e.currentTarget.scrollTop;
      pre.scrollLeft = e.currentTarget.scrollLeft;
    }
  }, []);

  return (
    <div className={styles.wrapper} style={{ minHeight }}>
      <Highlight code={displayCode} language="python" theme={prismTheme}>
        {({ className, style, tokens, getLineProps, getTokenProps }) => (
          <pre
            ref={highlightRef}
            className={`${styles.highlight} ${className}`}
            style={{ ...style, background: 'transparent' }}
            aria-hidden="true"
          >
            {tokens.map((line, i) => {
              const { key: _lineKey, ...lineProps } = getLineProps({ line });
              return (
                // biome-ignore lint/suspicious/noArrayIndexKey: index is de regelnummer-identiteit zelf.
                <div key={i} {...lineProps}>
                  {line.map((token, j) => {
                    const { key: _tokKey, ...tokenProps } = getTokenProps({ token });
                    // biome-ignore lint/suspicious/noArrayIndexKey: index is de token-positie in de regel.
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
        onKeyDown={handleKeyDown}
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

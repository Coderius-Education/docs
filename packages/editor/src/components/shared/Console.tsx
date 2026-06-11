import { Fragment, type ReactNode, useEffect, useRef } from 'react';
import type { OutputEvent } from '../../runners/types';
import styles from './styles.module.css';

export interface ConsoleProps {
  events: OutputEvent[];
  // Placeholder zolang er nog geen output is.
  placeholder?: string;
}

export default function Console({
  events,
  placeholder = 'Hier komt de uitvoer van je programma.',
}: ConsoleProps): ReactNode {
  const scrollRef = useRef<HTMLDivElement>(null);
  const stickToBottomRef = useRef(true);

  // Automatisch meescrollen, behalve als de gebruiker zelf omhoog gescrold heeft.
  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    stickToBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 8;
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: events is bewust de trigger — bij elke nieuwe output meescrollen.
  useEffect(() => {
    const el = scrollRef.current;
    if (el && stickToBottomRef.current) {
      el.scrollTop = el.scrollHeight;
    }
  }, [events]);

  return (
    <div className={styles.console} ref={scrollRef} onScroll={handleScroll} aria-live="polite">
      {events.length === 0 && <span className={styles.consolePlaceholder}>{placeholder}</span>}
      {events.map((ev, i) => {
        // Index als key is hier veilig: events zijn append-only tot een clear.
        const key = i;
        switch (ev.kind) {
          case 'stdout':
            return <Fragment key={key}>{ev.text}</Fragment>;
          case 'stderr':
            return (
              <span key={key} className={styles.consoleStderr}>
                {ev.text}
              </span>
            );
          case 'system':
            return (
              <span key={key} className={styles.consoleSystem}>
                {ev.text}
              </span>
            );
          case 'rich':
            return <Fragment key={key}>{ev.node}</Fragment>;
          default:
            return null;
        }
      })}
    </div>
  );
}

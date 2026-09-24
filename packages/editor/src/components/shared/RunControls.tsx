import { Play, Square } from 'lucide-react';
import type { ReactNode } from 'react';
import type { RunSessionApi } from '../../runners/types';
import styles from './styles.module.css';

export interface RunControlsProps {
  session: RunSessionApi;
  onRun: () => void;
  onReset?: () => void;
  // Toont de sneltoets op de knop, zodat leerlingen hem leren zonder de
  // tooltip te hoeven vinden.
  sneltoets?: string;
}

export default function RunControls({
  session,
  onRun,
  onReset,
  sneltoets,
}: RunControlsProps): ReactNode {
  const { runner, runnerState, stateDetail, running } = session;
  const busy = runnerState === 'loading' || running;

  return (
    <div className={styles.runControls}>
      <button
        type="button"
        className={`${styles.button} ${styles.buttonRun}`}
        onClick={onRun}
        disabled={busy}
        title="Uitvoeren (Ctrl+Enter)"
      >
        <Play aria-hidden="true" size={15} fill="currentColor" strokeWidth={1.5} />
        {running ? 'Bezig…' : 'Uitvoeren'}
        {sneltoets && <kbd className={styles.sneltoets}>{sneltoets}</kbd>}
      </button>
      {runner?.capabilities.stop && running && (
        <button
          type="button"
          className={`${styles.button} ${styles.buttonStop}`}
          onClick={() => session.stop()}
        >
          <Square aria-hidden="true" size={13} fill="currentColor" strokeWidth={1.5} />
          Stop
        </button>
      )}
      {onReset && (
        <button type="button" className={styles.button} onClick={onReset} disabled={running}>
          Reset
        </button>
      )}
      {runner?.ControlsComponent && <runner.ControlsComponent session={session} />}
      <output className={styles.status}>
        {runnerState === 'loading' && (stateDetail ?? 'Laden…')}
        {runnerState === 'error' && (
          <span className={styles.statusError}>{stateDetail ?? 'Er ging iets mis.'}</span>
        )}
      </output>
    </div>
  );
}

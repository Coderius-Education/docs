import type { ReactNode } from 'react';
import type { RunSessionApi } from '../../runners/types';
import styles from './styles.module.css';

export interface RunControlsProps {
  session: RunSessionApi;
  onRun: () => void;
  onReset?: () => void;
}

export default function RunControls({ session, onRun, onReset }: RunControlsProps): ReactNode {
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
        {running ? 'Bezig…' : 'Uitvoeren'}
      </button>
      {runner?.capabilities.stop && running && (
        <button
          type="button"
          className={`${styles.button} ${styles.buttonStop}`}
          onClick={() => session.stop()}
        >
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

import { useLesDoel } from '@coderius/shared/components/LesTabs/paneel';
import BrowserOnly from '@docusaurus/BrowserOnly';
import type { ReactNode } from 'react';
import type { PyRunnerProps } from './PyRunnerImpl';
import styles from './styles.module.css';

export default function PyRunner(props: PyRunnerProps): ReactNode {
  return (
    <BrowserOnly fallback={<PyRunnerFallback />}>
      {() => {
        const Impl = require('./PyRunnerImpl').default;
        return <Impl {...props} />;
      }}
    </BrowserOnly>
  );
}

function PyRunnerFallback() {
  // Het doel van de opdracht staat ook in de HTML van de build.
  const doel = useLesDoel();
  return (
    <div className={styles.runner}>
      <div className={styles.toolbar}>
        <span className={styles.label}>Python</span>
      </div>
      <div className={styles.status}>Code-omgeving wordt voorbereid…</div>
      {doel && <div className={styles.doel}>{doel}</div>}
    </div>
  );
}

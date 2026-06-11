import type {ReactNode} from 'react';
import BrowserOnly from '@docusaurus/BrowserOnly';
import type {PyRunnerProps} from './PyRunnerImpl';
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
  return (
    <div className={styles.runner}>
      <div className={styles.toolbar}>
        <span className={styles.label}>Python</span>
      </div>
      <div className={styles.status}>Code-omgeving wordt voorbereid…</div>
    </div>
  );
}

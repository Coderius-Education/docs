import BrowserOnly from '@docusaurus/BrowserOnly';
import type { ReactNode } from 'react';
import type { CheckerConfig } from '../types';
import type { CheckerVariant } from './CheckerInner';
import styles from './styles.module.css';

export interface CheckerProps {
  config: CheckerConfig;
  variant?: CheckerVariant;
}

export function Checker({ config, variant = 'leerling' }: CheckerProps): ReactNode {
  return (
    <BrowserOnly fallback={<div className={styles.loading}>Checker laden...</div>}>
      {() => {
        const { CheckerInner } = require('./CheckerInner');
        return <CheckerInner config={config} variant={variant} />;
      }}
    </BrowserOnly>
  );
}

export default Checker;

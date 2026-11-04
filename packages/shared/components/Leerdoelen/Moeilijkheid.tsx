import type { ReactNode } from 'react';
import { moeilijkheid } from '../../leerdoelen';
import styles from './styles.module.css';

/** Basis, gevorderd of expert als label. */
export default function Moeilijkheid({
  id,
  className,
}: {
  id: string;
  className?: string;
}): ReactNode {
  const extra = id === 'gevorderd' ? styles.gevorderd : id === 'expert' ? styles.expert : '';
  return (
    <span className={[styles.badge, extra, className].filter(Boolean).join(' ')}>
      {moeilijkheid(id).label}
    </span>
  );
}

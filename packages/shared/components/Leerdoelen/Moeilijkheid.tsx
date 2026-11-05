import type { ReactNode } from 'react';
import { moeilijkheid } from '../../leerdoelen';
import styles from './styles.module.css';

/** Basis, gevorderd of expert als label. */
export default function Moeilijkheid({
  id,
  className,
}: {
  id: string | null;
  className?: string;
}): ReactNode {
  // Een concept dat niet bij dit niveau hoort. Een aria-label op een kale
  // span leest een schermlezer niet voor, dus de tekst staat verborgen ernaast.
  if (id === null) {
    return (
      <span className={className}>
        <span aria-hidden="true">–</span>
        <span className={styles.verborgen}>hoort niet bij dit niveau</span>
      </span>
    );
  }
  const extra = id === 'gevorderd' ? styles.gevorderd : id === 'expert' ? styles.expert : '';
  return (
    <span className={[styles.badge, extra, className].filter(Boolean).join(' ')}>
      {moeilijkheid(id).label}
    </span>
  );
}

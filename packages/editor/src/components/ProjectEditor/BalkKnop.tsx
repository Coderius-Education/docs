import clsx from 'clsx';
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import styles from './styles.module.css';

interface BalkKnopProps {
  icoon: LucideIcon;
  label: string;
  onClick: () => void;
  // Uitleg bij het aanwijzen; zonder valt hij terug op het label.
  title?: string;
  // Het label blijft altijd de naam voor schermlezers; zichtbaar is het
  // alleen op een breed scherm, tenzij `alleenIcoon`.
  alleenIcoon?: boolean;
  gevaarlijk?: boolean;
  ingedrukt?: boolean;
}

// Een knop in de balken van de editor: icoon, met het label ernaast zolang
// er ruimte is. Op een laptop van 1366px passen de labels; smaller verdwijnen
// ze en zegt de tooltip wat de knop doet.
export default function BalkKnop({
  icoon: Icoon,
  label,
  onClick,
  title,
  alleenIcoon,
  gevaarlijk,
  ingedrukt,
}: BalkKnopProps): ReactNode {
  return (
    <button
      type="button"
      className={clsx(styles.balkKnop, gevaarlijk && styles.balkKnopGevaarlijk)}
      onClick={onClick}
      aria-label={label}
      aria-pressed={ingedrukt}
      title={title ?? label}
    >
      <Icoon aria-hidden="true" size={16} strokeWidth={2} />
      {!alleenIcoon && <span className={styles.balkLabel}>{label}</span>}
    </button>
  );
}

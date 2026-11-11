import type { ReactNode } from 'react';
// werkvormen/index.js is CommonJS; named imports werken via de bundler-interop.
import { werkvorm } from '../../werkvormen';
import styles from './styles.module.css';

// Het icoon van een werkvorm (zie ../../werkvormen): een lijntekening in de
// kleur van de tekst eromheen, geen emoji (stijlgids §1). Een eigen bestand,
// zonder links of gegevens van de site: de les-tabbladen laden alleen dit.

type Props = { id: string; className?: string };

/** Het icoon van een werkvorm. Zonder betekenis voor een schermlezer: het
 *  label van het tabblad of de tekst ernaast zegt al wat er staat. */
export function WerkvormIcoon({ id, className }: Props): ReactNode {
  const vorm = werkvorm(id);
  if (!vorm) return null;
  return (
    <svg
      className={`${styles.icoon}${className ? ` ${className}` : ''}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      data-werkvorm={id}
    >
      {vorm.icoon.map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}

export default WerkvormIcoon;

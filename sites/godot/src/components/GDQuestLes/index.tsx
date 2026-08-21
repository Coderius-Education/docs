import { GDQUEST_URL, gdquestLes } from '@site/src/data/gdquest';
import type { ReactNode } from 'react';
import styles from './styles.module.css';

/**
 * Verwijzing naar de GDQuest-les waar het zojuist geschreven concept los
 * geoefend wordt. Gebruik: `<GDQuestLes nummer={5} />`.
 *
 * De titel komt uit src/data/gdquest.ts en niet uit de aanroep, zodat een
 * lesnummer nooit met een verkeerde titel op de pagina kan belanden. Een
 * onbekend nummer rendert niets in plaats van een halve zin — src/data/
 * gdquest.test.ts vangt dat geval af voordat het live gaat.
 */
export default function GDQuestLes({ nummer }: { nummer: number }): ReactNode {
  const les = gdquestLes(nummer);
  if (!les) return null;

  return (
    <p className={styles.blok}>
      <span className={styles.label}>GDQuest</span>
      Dit oefen je los in{' '}
      <a href={GDQUEST_URL} target="_blank" rel="noopener noreferrer">
        les {les.nummer}: {les.titel}
      </a>
      .
    </p>
  );
}

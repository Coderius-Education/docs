import Link from '@docusaurus/Link';
import type { ReactNode } from 'react';
import type { LeerdoelConcept } from '../../leerdoelen';
import styles from './styles.module.css';

/** "Leer het in: Koppen en lijsten", met een link per les van het concept. */
export default function Lessen({ concept }: { concept: LeerdoelConcept }): ReactNode {
  const lessen = (concept.lessen ?? []).filter((l) => l.pad && l.titel);
  if (lessen.length === 0) return null;
  return (
    <span className={styles.toelichting}>
      Leer het in:{' '}
      {lessen.map((l, i) => (
        <span key={l.id}>
          {i > 0 && (i === lessen.length - 1 ? ' en ' : ', ')}
          {/* Het pad heeft de baseUrl al (permalink van de docs-plugin). */}
          {l.extern ? (
            // Een andere cursus opent in een nieuw tabblad, net als een site:-link.
            <Link to={l.pad} target="_blank" rel="noopener noreferrer">
              {l.titel}
            </Link>
          ) : (
            <Link to={l.pad} autoAddBaseUrl={false}>
              {l.titel}
            </Link>
          )}
        </span>
      ))}
    </span>
  );
}

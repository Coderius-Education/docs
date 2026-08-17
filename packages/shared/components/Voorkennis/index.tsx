import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import type { ReactNode } from 'react';
// sites.js is CommonJS; named imports werken via de bundler-interop.
import { SITES_BY_ID, normalizeUrl, siteByUrl } from '../../sites';
import styles from './styles.module.css';

export type VoorkennisItem = {
  /** Registry-id van de cursus (bv. 'python'). Weglaten = huidige cursus. */
  site?: string;
  /** Pad binnen die cursus, bv. '/docs/basis/variabelen'. */
  to: string;
  /** Linktekst. */
  label: string;
};

/**
 * Inklapbaar "Hier bouw je op verder"-blok (standaard dicht) met voorkennis-
 * links. Verwijst naar een andere cursus? Dan bouwt het component de absolute
 * URL uit de gedeelde site-registry en toont een klein cursus-badge. Binnen
 * dezelfde cursus wordt het een gewone interne link.
 *
 * De titel is bewust een geruststelling en geen eis: het blok is een vangnet
 * voor wie iets wil terugzoeken, geen toelatingstoets ("Wat moet je al
 * kennen?" bleek in de praktijk te scherp te klinken).
 */
export default function Voorkennis({
  items = [],
  title = 'Hier bouw je op verder',
}: {
  items?: VoorkennisItem[];
  title?: string;
}): ReactNode {
  const { siteConfig } = useDocusaurusContext();
  const current = siteByUrl(siteConfig.url);

  if (items.length === 0) return null;

  return (
    <details className={styles.voorkennis}>
      <summary>{title}</summary>
      <ul>
        {items.map((item) => {
          const target = item.site ? SITES_BY_ID[item.site] : current;
          const isExternal = !!target && (!current || target.id !== current.id);
          const key = `${item.site ?? ''}:${item.to}`;

          if (isExternal && target) {
            const href = normalizeUrl(target.url) + item.to;
            return (
              <li key={key}>
                <span className={styles.badge} title={target.label}>
                  {target.label}
                </span>{' '}
                <a href={href} target="_blank" rel="noopener noreferrer">
                  {item.label}
                </a>
              </li>
            );
          }

          return (
            <li key={key}>
              <Link to={item.to}>{item.label}</Link>
            </li>
          );
        })}
      </ul>
    </details>
  );
}

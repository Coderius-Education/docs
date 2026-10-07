import Link from '@docusaurus/Link';
import { useDoc, useDocsSidebar } from '@docusaurus/plugin-content-docs/client';
import clsx from 'clsx';
import type { ReactElement } from 'react';
import { type SidebarItem, etappes } from './logica';
import styles from './styles.module.css';
import { MIJLPALEN, ZINNEN } from './zinnen';

// De route van de huidige sidebar als genummerde kaart: per categorie een
// zin (zinnen.ts) en de lessen als gewone links. De startpagina zelf staat er
// niet op. Gewone kopjes en lijsten, zodat een schermlezer de route kan
// doorlopen en een toetsenbordgebruiker van link naar link tabt.

export default function Routekaart({
  kop = 'De route door deze cursus',
}: {
  /** Naam van de kaart voor schermlezers. */
  kop?: string;
}): ReactElement | null {
  const sidebar = useDocsSidebar();
  const { metadata } = useDoc();
  if (!sidebar) return null;
  const route = etappes(sidebar.items as unknown as SidebarItem[], {
    huidig: metadata.permalink,
    zinnen: ZINNEN,
    mijlpalen: MIJLPALEN,
  });

  return (
    <nav className={styles.kaart} aria-label={kop}>
      <ol className={styles.route}>
        {route.map((etappe, i) => (
          <li
            key={etappe.sidebarLabel}
            className={clsx(styles.etappe, etappe.uitbreiding && styles.uitbreiding)}
          >
            <span className={styles.nummer} aria-hidden="true">
              {i + 1}
            </span>
            <div className={styles.inhoud}>
              <h3 className={styles.titel}>
                <Link to={etappe.href}>{etappe.label}</Link>
                {etappe.uitbreiding && <span className={styles.label}>uitbreiding</span>}
              </h3>
              {etappe.zin && <p className={styles.zin}>{etappe.zin}</p>}
              {etappe.lessen.length > 0 && (
                <ol className={styles.lessen}>
                  {etappe.lessen.map((les) => (
                    <li key={les.href}>
                      <Link to={les.href}>{les.label}</Link>
                    </li>
                  ))}
                </ol>
              )}
              {etappe.mijlpaal && <p className={styles.mijlpaal}>{etappe.mijlpaal}</p>}
            </div>
          </li>
        ))}
      </ol>
    </nav>
  );
}

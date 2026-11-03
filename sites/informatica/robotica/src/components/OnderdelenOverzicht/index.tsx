import Link from '@docusaurus/Link';
import type { PropSidebarItem } from '@docusaurus/plugin-content-docs';
import { useDocById, useDocsSidebar } from '@docusaurus/plugin-content-docs/client';
import Heading from '@theme/Heading';
import type { ReactElement } from 'react';
import styles from './styles.module.css';

// De overzichtspagina van Onderdelen: per groep uit de sidebar (Aan de slag,
// Sensoren, Actuatoren, Op de robot) een kop en een kaart per onderdeel, met
// de titel en de `description` uit de frontmatter van die pagina. De lijst
// staat dus maar op één plek, in sidebars.ts; een nieuw onderdeel verschijnt
// hier vanzelf. Eigen kaarten, geen DocCardList: die zet een emoji voor elke
// titel, en emoji horen nergens in de cursus.

function Kaart({ item }: { item: PropSidebarItem }): ReactElement | null {
  const doc = useDocById(item.type === 'link' ? (item.docId ?? undefined) : undefined);
  if (item.type !== 'link') return null;
  return (
    <Link to={item.href} className={styles.kaart}>
      <Heading as="h3" className={styles.titel}>
        {item.label}
      </Heading>
      <p className={styles.uitleg}>{doc?.description}</p>
    </Link>
  );
}

export default function OnderdelenOverzicht(): ReactElement | null {
  const sidebar = useDocsSidebar();
  if (!sidebar) return null;
  return (
    <>
      {sidebar.items.map((groep) =>
        groep.type === 'category' ? (
          <section key={groep.label}>
            <Heading as="h2" id={groep.label.toLowerCase().replace(/\s+/g, '-')}>
              {groep.label}
            </Heading>
            <div className={styles.raster}>
              {groep.items.map((item) => (
                <Kaart
                  key={
                    item.type === 'link'
                      ? item.href
                      : String(item.type === 'category' ? item.label : item.value)
                  }
                  item={item}
                />
              ))}
            </div>
          </section>
        ) : null,
      )}
    </>
  );
}

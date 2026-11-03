import { useDocsSidebar } from '@docusaurus/plugin-content-docs/client';
import Heading from '@theme/Heading';
import DocCardList from '@theme/DocCardList';
import type { ReactElement } from 'react';

// De overzichtspagina van Onderdelen: per groep uit de sidebar (Aan de slag,
// Sensoren, Actuatoren, Op de robot) een kop en een kaart per onderdeel, met
// de titel en de `description` uit de frontmatter van die pagina. De lijst
// staat dus maar op één plek, in sidebars.ts; een nieuw onderdeel verschijnt
// hier vanzelf.
export default function OnderdelenOverzicht(): ReactElement | null {
  const sidebar = useDocsSidebar();
  if (!sidebar) return null;
  return (
    <>
      {sidebar.items
        .filter((item) => item.type === 'category')
        .map((groep) => (
          <section key={groep.label}>
            <Heading as="h2" id={groep.label.toLowerCase().replace(/\s+/g, '-')}>
              {groep.label}
            </Heading>
            <DocCardList items={groep.type === 'category' ? groep.items : []} />
          </section>
        ))}
    </>
  );
}

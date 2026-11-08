import Link from '@docusaurus/Link';
import type { PropSidebarItem, PropSidebarItemLink } from '@docusaurus/plugin-content-docs';
import { useDocsSidebar } from '@docusaurus/plugin-content-docs/client';
import Heading from '@theme/Heading';
import type { ReactElement } from 'react';
import { fotoUrl } from '../onderdeelFoto';
import styles from './styles.module.css';
import { verdeel } from './verdeel';

// De overzichtspagina van Onderdelen. De groepen en hun volgorde komen uit de
// sidebar (sidebars.ts), de tekst van een regel uit `sidebar_custom_props` in
// de frontmatter van de pagina zelf:
//   kort         één regel onder de titel (de description is te lang)
//   foto         pad onder docs/onderdelen/img/, zodat je het onderdeel herkent
//   aansluiting  waar het op aangesloten wordt (digitale pin, I2C, …)
//   hulp         in een groep met stappen een losse regel in plaats van een stap
// Een groep met `customProps: { weergave: 'stappen' }` wordt een genummerde rij.
// Eigen regels, geen DocCardList: die zet een emoji voor elke titel.
// onderdelen.test.ts eist kort bij elke pagina en een foto die bestaat bij elke
// pagina in een groep zonder stappen.
//
// De hele pagina past op één scherm vanaf 1280 × 720: de groepen staan in
// drie kolommen (verdeel.ts), en elk onderdeel is één smalle regel met een
// kleine foto. Eerst waren het kaarten met een foto van 6,5rem, en was de
// pagina 1800 pixels hoog. Op een smal scherm staan de groepen onder elkaar,
// in de volgorde van de sidebar.

const KOLOMMEN = 3;

type Props = { kort?: string; foto?: string; aansluiting?: string; hulp?: boolean };

const props = (item: PropSidebarItemLink): Props => (item.customProps ?? {}) as Props;
const links = (items: PropSidebarItem[]): PropSidebarItemLink[] =>
  items.filter((item): item is PropSidebarItemLink => item.type === 'link');
const anker = (label: string) => label.toLowerCase().replace(/\s+/g, '-');

function Regel({ item, nummer }: { item: PropSidebarItemLink; nummer?: number }): ReactElement {
  const { kort, foto, aansluiting } = props(item);
  const src = fotoUrl(foto);
  return (
    <Link to={item.href} className={styles.regel}>
      {nummer !== undefined ? (
        <span className={styles.nummer} aria-hidden="true">
          {nummer}
        </span>
      ) : (
        src && (
          <span className={styles.foto}>
            <img src={src} alt="" loading="lazy" />
          </span>
        )
      )}
      <span className={styles.tekst}>
        <span className={styles.kop}>
          <span className={styles.titel}>{item.label}</span>
          {aansluiting && <span className={styles.aansluiting}>{aansluiting}</span>}
        </span>
        {kort && <span className={styles.kort}>{kort}</span>}
      </span>
    </Link>
  );
}

function Groep({
  label,
  items,
  stappen,
  volgorde,
}: {
  label: string;
  items: PropSidebarItemLink[];
  stappen: boolean;
  volgorde: number;
}): ReactElement {
  const gewoon = items.filter((item) => !(stappen && props(item).hulp));
  const hulp = stappen ? items.filter((item) => props(item).hulp) : [];
  const Lijst = stappen ? 'ol' : 'ul';
  return (
    <section className={styles.groep} style={{ order: volgorde }}>
      <Heading as="h2" id={anker(label)}>
        {label}
      </Heading>
      <Lijst className={styles.lijst}>
        {gewoon.map((item, i) => (
          <li key={item.href}>
            <Regel item={item} nummer={stappen ? i + 1 : undefined} />
          </li>
        ))}
      </Lijst>
      {hulp.map((item) => (
        <p key={item.href} className={styles.hulp}>
          Werkt iets niet? <Link to={item.href}>{item.label}</Link>:{' '}
          {props(item).kort?.toLowerCase()}.
        </p>
      ))}
    </section>
  );
}

export default function OnderdelenOverzicht(): ReactElement | null {
  const sidebar = useDocsSidebar();
  if (!sidebar) return null;
  const groepen = sidebar.items.flatMap((groep) =>
    groep.type === 'category'
      ? [
          {
            label: groep.label,
            items: links(groep.items),
            stappen: groep.customProps?.weergave === 'stappen',
          },
        ]
      : [],
  );
  const kolommen = verdeel(
    groepen.map((g) => g.items.length + 1),
    KOLOMMEN,
  );
  return (
    <div
      className={styles.overzicht}
      style={{ gridTemplateColumns: `repeat(${kolommen.length}, minmax(0, 1fr))` }}
    >
      {kolommen.map((kolom) => (
        <div key={kolom.join('-')} className={styles.kolom}>
          {kolom.map((i) => (
            <Groep key={groepen[i].label} {...groepen[i]} volgorde={i} />
          ))}
        </div>
      ))}
    </div>
  );
}

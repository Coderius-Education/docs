import Link from '@docusaurus/Link';
import type { PropSidebarItem, PropSidebarItemLink } from '@docusaurus/plugin-content-docs';
import { useDocsSidebar } from '@docusaurus/plugin-content-docs/client';
import Heading from '@theme/Heading';
import type { ReactElement } from 'react';
import styles from './styles.module.css';

// De overzichtspagina van Onderdelen. De groepen en hun volgorde komen uit de
// sidebar (sidebars.ts), de tekst van een kaart uit `sidebar_custom_props` in
// de frontmatter van de pagina zelf:
//   kort         één regel onder de titel (de description is te lang voor een kaart)
//   foto         pad onder docs/onderdelen/img/, zodat je het onderdeel herkent
//   aansluiting  waar het op aangesloten wordt (digitale pin, I2C, …)
//   hulp         in een groep met stappen een losse regel in plaats van een stap
// Een groep met `customProps: { weergave: 'stappen' }` wordt een genummerde rij.
// Eigen kaarten, geen DocCardList: die zet een emoji voor elke titel.
// onderdelen.test.ts eist kort bij elke pagina en een foto die bestaat bij elke
// pagina in een groep met kaarten.

type Props = { kort?: string; foto?: string; aansluiting?: string; hulp?: boolean };

// require.context is van de bundler (Rspack), niet van node: elke foto in de
// map komt als adres in de build, en een kaart pakt de zijne op naam.
type Context = (pad: string) => string | { default: string };
const fotoContext = (
  require as unknown as { context: (map: string, diep: boolean, filter: RegExp) => Context }
).context('@site/docs/onderdelen/img', true, /\.(png|jpe?g|svg)$/i);

function fotoUrl(pad: string | undefined): string | undefined {
  if (!pad) return undefined;
  const bron = fotoContext(`./${pad}`);
  return typeof bron === 'string' ? bron : bron.default;
}

const props = (item: PropSidebarItemLink): Props => (item.customProps ?? {}) as Props;
const links = (items: PropSidebarItem[]): PropSidebarItemLink[] =>
  items.filter((item): item is PropSidebarItemLink => item.type === 'link');
const anker = (label: string) => label.toLowerCase().replace(/\s+/g, '-');

function Kaart({ item }: { item: PropSidebarItemLink }): ReactElement {
  const { kort, foto, aansluiting } = props(item);
  const src = fotoUrl(foto);
  return (
    <Link to={item.href} className={styles.kaart}>
      {src && (
        <span className={styles.foto}>
          <img src={src} alt="" loading="lazy" />
        </span>
      )}
      <span className={styles.tekst}>
        <span className={styles.titel}>{item.label}</span>
        {kort && <span className={styles.kort}>{kort}</span>}
        {aansluiting && <span className={styles.aansluiting}>{aansluiting}</span>}
      </span>
    </Link>
  );
}

function Stappen({ items }: { items: PropSidebarItemLink[] }): ReactElement {
  const stappen = items.filter((item) => !props(item).hulp);
  const hulp = items.filter((item) => props(item).hulp);
  return (
    <>
      <ol className={styles.stappen}>
        {stappen.map((item, i) => (
          <li key={item.href}>
            <Link to={item.href} className={styles.stap}>
              <span className={styles.nummer} aria-hidden="true">
                {i + 1}
              </span>
              <span className={styles.tekst}>
                <span className={styles.titel}>{item.label}</span>
                <span className={styles.kort}>{props(item).kort}</span>
              </span>
            </Link>
          </li>
        ))}
      </ol>
      {hulp.map((item) => (
        <p key={item.href} className={styles.hulp}>
          Werkt iets niet? <Link to={item.href}>{item.label}</Link>:{' '}
          {props(item).kort?.toLowerCase()}.
        </p>
      ))}
    </>
  );
}

export default function OnderdelenOverzicht(): ReactElement | null {
  const sidebar = useDocsSidebar();
  if (!sidebar) return null;
  return (
    <>
      {sidebar.items.map((groep) => {
        if (groep.type !== 'category') return null;
        const items = links(groep.items);
        const stappen = groep.customProps?.weergave === 'stappen';
        return (
          <section key={groep.label} className={styles.groep}>
            <Heading as="h2" id={anker(groep.label)}>
              {groep.label}
            </Heading>
            {stappen ? (
              <Stappen items={items} />
            ) : (
              <div className={styles.raster}>
                {items.map((item) => (
                  <Kaart key={item.href} item={item} />
                ))}
              </div>
            )}
          </section>
        );
      })}
    </>
  );
}

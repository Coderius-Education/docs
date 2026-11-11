import { useLocation } from '@docusaurus/router';
import {
  Children,
  type KeyboardEvent,
  type ReactElement,
  type ReactNode,
  createContext,
  isValidElement,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import styles from './styles.module.css';

// Les-tabbladen (proef): elke `##`-sectie van een les is een tabblad bovenaan
// de pagina. De remark-stap plugins/les-tabs.js zet de secties bij het bouwen
// in <LesTab>; in de bron van een les staat dit onderdeel nooit.
//
// Twee dingen liggen vast, en LesTabs.test.tsx bewaakt ze:
//  - Elk paneel blijft gemount en staat in de HTML van de build; een paneel
//    dat niet aan de beurt is, is alleen `hidden`. Een oefenveld dat opnieuw
//    mount, raakt zijn werk kwijt, en een link naar een kop moet zijn doel in
//    de HTML vinden.
//  - Docusaurus scrolt niet naar een kop in een verborgen paneel. Dit
//    onderdeel volgt daarom zelf het adres: het opent het paneel waarin het
//    doel staat en scrolt er dan naartoe.

type TabProps = { id: string; titel: string; label: string; children?: ReactNode };

const Actief = createContext<{ actief: string; volgende: (id: string) => void } | null>(null);

/** Het stuk na de # in het adres, of een lege tekst. */
function doelUitHash(hash: string): string {
  try {
    return decodeURIComponent(hash.replace(/^#/, ''));
  } catch {
    return hash.replace(/^#/, '');
  }
}

export default function LesTabs({ children }: { children?: ReactNode }): ReactNode {
  const tabs = Children.toArray(children).filter(
    (c): c is ReactElement<TabProps> =>
      isValidElement(c) && typeof (c.props as TabProps).id === 'string',
  );
  const ids = tabs.map((t) => t.props.id);
  const [actief, setActief] = useState(ids[0] ?? '');
  // Waar na het openen van een paneel naartoe gescrold wordt: een kop binnen
  // het paneel, of null.
  const [scrolNaar, setScrolNaar] = useState<{ id: string } | null>(null);
  const wortel = useRef<HTMLDivElement>(null);
  const locatie = useLocation();

  // Het adres volgen. Het locatie-object is de afhankelijkheid, niet alleen
  // de hash: een tweede klik op dezelfde link moet ook werken.
  useEffect(() => {
    const doel = doelUitHash(locatie.hash);
    if (!doel) return;
    // Het doel is een kop in een paneel, of het paneel zelf: het tabblad
    // Uitleg heeft geen kop.
    const paneel =
      document.getElementById(doel)?.closest<HTMLElement>('[data-les-tab]') ??
      wortel.current?.querySelector<HTMLElement>(`[data-les-tab="${CSS.escape(doel)}"]`);
    const id = paneel?.dataset.lesTab;
    if (!id || !paneel || !wortel.current?.contains(paneel)) return;
    setActief(id);
    // De kop van de sectie zelf is het tabblad: daar hoeft niet naartoe
    // gescrold te worden. Een kop verderop in het paneel wel.
    setScrolNaar(doel === id ? null : { id: doel });
  }, [locatie]);

  // Pas scrollen als het paneel zichtbaar is.
  useEffect(() => {
    if (!scrolNaar) return;
    document.getElementById(scrolNaar.id)?.scrollIntoView();
  }, [scrolNaar]);

  const kies = useCallback((id: string, focus = false) => {
    setActief(id);
    setScrolNaar(null);
    // Het adres van het tabblad, zonder de router: via de router scrolt
    // Docusaurus naar de kop en schuift de rij tabbladen onder de navbar.
    window.history.replaceState(window.history.state, '', `#${encodeURIComponent(id)}`);
    const el = wortel.current;
    if (!el) return;
    // Stond de lezer verderop in een lang paneel, dan begint het nieuwe
    // paneel weer bovenaan.
    if (el.getBoundingClientRect().top < 0) el.scrollIntoView();
    const tab = el.querySelector<HTMLElement>(`[data-tab="${CSS.escape(id)}"]`);
    tab?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    if (focus) tab?.focus();
  }, []);

  const opToets = (e: KeyboardEvent<HTMLDivElement>) => {
    const i = ids.indexOf(actief);
    const naar =
      e.key === 'ArrowRight'
        ? ids[(i + 1) % ids.length]
        : e.key === 'ArrowLeft'
          ? ids[(i - 1 + ids.length) % ids.length]
          : e.key === 'Home'
            ? ids[0]
            : e.key === 'End'
              ? ids[ids.length - 1]
              : null;
    if (!naar) return;
    e.preventDefault();
    kies(naar, true);
  };

  return (
    <div ref={wortel} className={styles.wortel} data-les-tabs>
      <div
        role="tablist"
        aria-label="Onderdelen van deze les"
        className={styles.tablist}
        onKeyDown={opToets}
      >
        {tabs.map(({ props: t }) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            id={`tab-${t.id}`}
            data-tab={t.id}
            aria-selected={t.id === actief}
            aria-controls={`paneel-${t.id}`}
            tabIndex={t.id === actief ? 0 : -1}
            className={styles.tab}
            title={t.label === t.titel ? undefined : t.titel}
            onClick={() => kies(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>
      <Actief.Provider
        value={{
          actief,
          volgende: (id) => {
            const na = ids[ids.indexOf(id) + 1];
            if (na) kies(na, true);
          },
        }}
      >
        {tabs.map((t, i) => (
          <LesTab key={t.props.id} {...t.props} volgendLabel={tabs[i + 1]?.props.label} />
        ))}
      </Actief.Provider>
    </div>
  );
}

/**
 * Eén sectie van de les. Buiten <LesTabs> (dat gebeurt niet in een les, wel
 * in een test of een afdruk zonder tabbladen) staat hij gewoon open.
 */
export function LesTab({
  id,
  titel,
  label,
  volgendLabel,
  children,
}: TabProps & { volgendLabel?: string }): ReactNode {
  const tabs = useContext(Actief);
  const open = !tabs || tabs.actief === id;
  return (
    <section
      role="tabpanel"
      id={`paneel-${id}`}
      data-les-tab={id}
      aria-labelledby={`tab-${id}`}
      // De klasse markdown: Infima maakt koppen en alinea's op met
      // `.markdown > …`, en in een paneel zijn ze geen kind meer van de les.
      // Staat het label voluit op het tabblad, dan is de kop in het paneel
      // dubbel; hij blijft staan voor wie de pagina laat voorlezen en als
      // doel van een link.
      className={`markdown ${styles.paneel}${label === titel ? ` ${styles.kopOpTab}` : ''}`}
      hidden={!open}
    >
      {children}
      {tabs && volgendLabel && (
        <p className={styles.verder}>
          <button
            type="button"
            className="button button--primary"
            onClick={() => tabs.volgende(id)}
          >
            Volgende: {volgendLabel}
          </button>
        </p>
      )}
    </section>
  );
}

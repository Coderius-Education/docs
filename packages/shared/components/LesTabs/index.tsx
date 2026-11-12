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
import { WerkvormIcoon } from '../Werkvorm/Icoon';
import { DoelContext, PaneelContext, type Stap, useInLesTab } from './paneel';
import styles from './styles.module.css';

// Les-tabbladen: elke `##`-sectie van een les is een tabblad bovenaan
// de pagina, en in een sectie met meer `###`-koppen is elke `###` een stap.
// De remark-stap plugins/les-tabs.js zet de secties bij het bouwen in
// <LesTab> en <LesStap>; in de bron van een les staat dit onderdeel nooit.
//
// Twee dingen liggen vast, en LesTabs.test.tsx bewaakt ze:
//  - Elk paneel blijft gemount en staat in de HTML van de build; een paneel
//    dat niet aan de beurt is, is alleen `hidden`. Een oefenveld dat opnieuw
//    mount, raakt zijn werk kwijt, en een link naar een kop moet zijn doel in
//    de HTML vinden.
//  - Docusaurus scrolt niet naar een kop in een verborgen paneel. Dit
//    onderdeel volgt daarom zelf het adres: het opent het paneel waarin het
//    doel staat en scrolt er dan naartoe.

type Props = {
  id: string;
  titel: string;
  label: string;
  /** Wat er op het tabblad staat als het label daar te lang is: in een lange
   *  rij opdrachten alleen het nummer ("5.7.b"). Een schermlezer en de knop
   *  Volgende houden het label. */
  kort?: string;
  /** Wat de leerling in dit tabblad doet (werkvormen.json): het icoon op het
   *  tabblad. De docentenhandleiding legt de iconen uit. */
  werkvorm?: string;
  children?: ReactNode;
};

/** Tabbladen (per `##`) of stappen binnen een tabblad (per `###`). */
type Niveau = 'tab' | 'stap';
const DATA = {
  tab: { paneel: 'data-les-tab', knop: 'data-tab', sleutel: 'lesTab' },
  stap: { paneel: 'data-les-stap', knop: 'data-stap', sleutel: 'lesStap' },
} as const;

type Rij = { actief: string; niveau: Niveau; volgende: (id: string) => string | undefined };
const RijContext = createContext<Rij | null>(null);

// Wat een tabblad van zijn stappen moet weten: is er nog een volgende stap,
// dan gaat de knop Volgende daarheen, en pas daarna naar het volgende tabblad
// (PaneelContext, in paneel.ts).
export { useInLesTab };

/** Het stuk na de # in het adres, of een lege tekst. */
function doelUitHash(hash: string): string {
  try {
    return decodeURIComponent(hash.replace(/^#/, ''));
  } catch {
    return hash.replace(/^#/, '');
  }
}

function Rij({ niveau, children }: { niveau: Niveau; children?: ReactNode }): ReactNode {
  const data = DATA[niveau];
  const isTab = (c: unknown): c is ReactElement<Props> =>
    isValidElement(c) && typeof (c.props as Props).id === 'string';
  const kinderen = Children.toArray(children);
  const tabs = kinderen.filter(isTab);
  // Wat in een rij stappen geen stap is: het leerdoel van de les. Het staat
  // boven de rij, en alleen bij de eerste stap.
  const boven = niveau === 'stap' ? kinderen.filter((c) => isValidElement(c) && !isTab(c)) : [];
  const ids = tabs.map((t) => t.props.id);
  const [actief, setActief] = useState(ids[0] ?? '');
  // Waar na het openen van een paneel naartoe gescrold wordt: een kop binnen
  // het paneel, of null.
  const [scrolNaar, setScrolNaar] = useState<{ id: string } | null>(null);
  const wortel = useRef<HTMLDivElement>(null);
  const locatie = useLocation();
  const meldStap = useContext(PaneelContext);

  // Het adres volgen. Het locatie-object is de afhankelijkheid, niet alleen
  // de hash: een tweede klik op dezelfde link moet ook werken.
  useEffect(() => {
    const doel = doelUitHash(locatie.hash);
    if (!doel) return;
    // Het doel is een kop in een paneel, of een paneel zelf: het tabblad
    // Uitleg en de stap De basis hebben geen kop.
    const naam = CSS.escape(doel);
    const el =
      document.getElementById(doel) ??
      wortel.current?.querySelector<HTMLElement>(
        `[${DATA.tab.paneel}="${naam}"], [${DATA.stap.paneel}="${naam}"]`,
      );
    const paneel = el?.closest<HTMLElement>(`[${data.paneel}]`);
    const id = paneel?.dataset[data.sleutel];
    if (!el || !id || !paneel || !wortel.current?.contains(paneel)) return;
    setActief(id);
    // De kop van een tabblad of van een stap is het tabblad zelf: daar hoeft
    // niet naartoe gescrold te worden. Een kop verderop in het paneel wel,
    // en dat doen de tabbladen, niet de stappen erin.
    const stap = el.closest<HTMLElement>(`[${DATA.stap.paneel}]`);
    const isKop = doel === id || el === stap || stap?.dataset.lesStap === doel;
    setScrolNaar(niveau === 'tab' && !isKop ? { id: doel } : null);
  }, [locatie, data, niveau]);

  // Pas scrollen als het paneel zichtbaar is.
  useEffect(() => {
    if (!scrolNaar) return;
    document.getElementById(scrolNaar.id)?.scrollIntoView();
  }, [scrolNaar]);

  const kies = useCallback(
    (id: string, focus = false) => {
      setActief(id);
      setScrolNaar(null);
      // Het adres van het tabblad, zonder de router: via de router scrolt
      // Docusaurus naar de kop en schuift de rij tabbladen onder de navbar.
      window.history.replaceState(window.history.state, '', `#${encodeURIComponent(id)}`);
      const el = wortel.current;
      if (!el) return;
      // Stond de lezer verderop in een lang paneel, dan begint het nieuwe
      // paneel weer bovenaan.
      const boven = el.closest<HTMLElement>('[data-les-tabs]') ?? el;
      if (boven.getBoundingClientRect().top < 0) boven.scrollIntoView();
      const tab = el.querySelector<HTMLElement>(`[${data.knop}="${CSS.escape(id)}"]`);
      tab?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
      if (focus) tab?.focus();
    },
    [data],
  );

  // Een tabblad met stappen: zeg het tabblad welke stap de volgende is.
  const na = tabs[ids.indexOf(actief) + 1]?.props;
  const naId = na?.id;
  const naLabel = na?.label;
  useEffect(() => {
    if (niveau !== 'stap' || !meldStap) return;
    meldStap(naId && naLabel ? { label: naLabel, ga: () => kies(naId, true) } : null);
    return () => meldStap(null);
  }, [niveau, meldStap, naId, naLabel, kies]);

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
    // De pijltjes van de stappen horen niet ook de tabbladen te verzetten.
    e.stopPropagation();
    kies(naar, true);
  };

  return (
    <div
      ref={wortel}
      className={niveau === 'tab' ? styles.wortel : styles.stappen}
      {...{ [niveau === 'tab' ? 'data-les-tabs' : 'data-les-stappen']: '' }}
    >
      {boven.length > 0 && (
        // Verborgen, niet weg: de kop van het leerdoel is het doel van een link.
        <div className={styles.bovenStappen} hidden={actief !== ids[0]}>
          {boven}
        </div>
      )}
      <div
        role="tablist"
        aria-label={niveau === 'tab' ? 'Onderdelen van deze les' : 'Stappen in dit onderdeel'}
        className={niveau === 'tab' ? styles.tablist : styles.staplist}
        onKeyDown={opToets}
      >
        {tabs.map(({ props: t }, i) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            id={`tab-${t.id}`}
            {...{ [data.knop]: t.id }}
            aria-selected={t.id === actief}
            aria-controls={`paneel-${t.id}`}
            tabIndex={t.id === actief ? 0 : -1}
            className={niveau === 'tab' ? styles.tab : styles.stap}
            title={t.label === t.titel ? undefined : t.titel}
            aria-label={t.kort ? t.label : undefined}
            onClick={() => kies(t.id)}
          >
            {niveau === 'stap' && <span className={styles.stapNummer}>{i + 1}</span>}
            {niveau === 'tab' && t.werkvorm && (
              <WerkvormIcoon id={t.werkvorm} className={styles.tabIcoon} />
            )}
            {t.kort ?? t.label}
          </button>
        ))}
      </div>
      <RijContext.Provider
        value={{
          actief,
          niveau,
          volgende: (id) => {
            const volgend = ids[ids.indexOf(id) + 1];
            if (volgend) kies(volgend, true);
            return volgend;
          },
        }}
      >
        {tabs.map((t, i) =>
          niveau === 'tab' ? (
            <LesTab key={t.props.id} {...t.props} volgendLabel={tabs[i + 1]?.props.label} />
          ) : (
            <LesStap key={t.props.id} {...t.props} />
          ),
        )}
      </RijContext.Provider>
    </div>
  );
}

export default function LesTabs({ children }: { children?: ReactNode }): ReactNode {
  return <Rij niveau="tab">{children}</Rij>;
}

/** De stappen binnen één tabblad: elke `###` van een lange sectie. */
export function LesStappen({ children }: { children?: ReactNode }): ReactNode {
  return <Rij niveau="stap">{children}</Rij>;
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
}: Props & { volgendLabel?: string }): ReactNode {
  const rij = useContext(RijContext);
  const open = !rij || rij.actief === id;
  const [stap, setStap] = useState<Stap>(null);
  const volgende = stap?.label ?? volgendLabel;
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
      <PaneelContext.Provider value={setStap}>{children}</PaneelContext.Provider>
      {rij && volgende && (
        <p className={styles.verder}>
          <button
            type="button"
            className="button button--primary button--sm"
            onClick={() => (stap ? stap.ga() : rij.volgende(id))}
          >
            Volgende: {volgende}
          </button>
        </p>
      )}
    </section>
  );
}

/**
 * Het leerdoel van de les ("Wat ga je leren?"): een zin of twee bovenaan het
 * eerste tabblad, met het icoon van de werkvorm. Als eigen tabblad was het
 * een scherm met één zin. De kop staat er nog, voor een schermlezer en als
 * doel van een link; de opmaak verbergt hem.
 */
export function LesLeerdoel({ children }: { children?: ReactNode }): ReactNode {
  return (
    <div className={styles.leerdoel} data-les-leerdoel="">
      <WerkvormIcoon id="leerdoel" className={styles.leerdoelIcoon} />
      <div className={styles.leerdoelTekst}>{children}</div>
    </div>
  );
}

/**
 * Een voorbeeld met zijn uitvoer: de code links, de uitvoer rechts. De
 * remark-stap zet er elk codeblok in dat direct door "Uitvoer:" en een
 * uitvoerblok wordt gevolgd. Onder elkaar kostte zo'n voorbeeld honderd
 * pixels meer, en de Python-cursus heeft er 225. Op een smal scherm staan ze
 * weer onder elkaar.
 */
export function LesVoorbeeld({
  children,
  vraag,
  bestanden,
  beeld,
  toelichting,
}: {
  children?: ReactNode;
  /** Rechts staat geen uitvoer maar een voorspelvraag: die krijgt de helft. */
  vraag?: string;
  /** Twee of meer bestanden naast elkaar, elk in een eigen kolom. */
  bestanden?: string;
  /** Rechts staat geen uitvoer maar de lijst die de code uitlegt. Met "vraag"
   *  staat er een vraag over de code, met de tip en de oplossing. */
  toelichting?: string;
  /** Links staat geen code maar een plaatje, rechts de tekst die erbij hoort.
   *  Met "breed" is het een onderdeel om mee te oefenen, met de vragen ernaast. */
  beeld?: string;
}): ReactNode {
  const klasse = bestanden
    ? styles.bestanden
    : `${styles.voorbeeld}${vraag ? ` ${styles.metVraag}` : ''}${beeld ? ` ${beeld === 'breed' ? styles.metBreedBeeld : styles.metBeeld}` : ''}${toelichting ? ` ${styles.metToelichting}` : ''}${toelichting === 'vraag' ? ` ${styles.metCodeVraag}` : ''}`;
  return (
    <div className={klasse} data-les-voorbeeld="">
      {children}
    </div>
  );
}

/**
 * Een oefenveld met het doel van zijn opdracht: de verwachte uitvoer of een
 * doelplaatje (de remark-stap zet ze erin, het doel vooraan in een
 * <LesDoel>). Het doel staat niet boven het veld maar erin: het veld vraagt
 * het op met useLesDoel en toont het in zijn uitvoerkolom. Zelf zet dit
 * onderdeel niets neer, zodat het veld een direct kind van het paneel blijft.
 */
export function LesVeld({ children }: { children?: ReactNode }): ReactNode {
  const [doel, ...veld] = Children.toArray(children);
  return <DoelContext.Provider value={doel}>{veld}</DoelContext.Provider>;
}

/** Het doel van een opdracht, binnen <LesVeld>. */
export function LesDoel({ children }: { children?: ReactNode }): ReactNode {
  return <>{children}</>;
}

/**
 * Een reeks plaatjes, één tegelijk in beeld: de bouwstappen van de Golfbot.
 * De remark-stap zet er elke rij van drie of meer `<figure>`s in. Elk plaatje
 * blijft in de HTML staan (een plaatje dat niet aan de beurt is, is
 * `hidden`), en op papier staan ze onder elkaar.
 */
export function LesReeks({ children }: { children?: ReactNode }): ReactNode {
  const items = Children.toArray(children);
  const [nu, setNu] = useState(0);
  const laatste = items.length - 1;
  return (
    <div className={styles.reeks} data-les-reeks="">
      {items.map((item, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: de plaatjes staan vast in de les, in deze volgorde.
        <div key={i} className={styles.reeksItem} hidden={i !== nu}>
          {item}
        </div>
      ))}
      <div className={styles.reeksKnoppen}>
        <button
          type="button"
          className={styles.reeksKnop}
          onClick={() => setNu((n) => Math.max(0, n - 1))}
          disabled={nu === 0}
        >
          Vorige
        </button>
        <span className={styles.reeksTeller} aria-live="polite">
          {nu + 1} van {items.length}
        </span>
        <button
          type="button"
          className={styles.reeksKnop}
          onClick={() => setNu((n) => Math.min(laatste, n + 1))}
          disabled={nu === laatste}
        >
          Volgende
        </button>
      </div>
    </div>
  );
}

/** Eén stap in een tabblad. Buiten <LesStappen> staat hij gewoon open. */
export function LesStap({ id, titel, label, children }: Props): ReactNode {
  const rij = useContext(RijContext);
  const open = !rij || rij.niveau !== 'stap' || rij.actief === id;
  return (
    <section
      role="tabpanel"
      id={`paneel-${id}`}
      data-les-stap={id}
      aria-labelledby={`tab-${id}`}
      className={`markdown ${styles.paneel}${label === titel ? ` ${styles.kopOpStap}` : ''}`}
      hidden={!open}
    >
      {children}
    </section>
  );
}

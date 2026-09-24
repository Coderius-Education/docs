import clsx from 'clsx';
import {
  type KeyboardEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { type KeuzeOptie, type Stap, groepeer, volgendeIndex, zoekOpLetters } from './logica';
import styles from './styles.module.css';

export type { KeuzeOptie } from './logica';

// Een eigen keuzelijst in plaats van <select>. De uitgeklapte lijst van een
// <select> tekent de browser zelf, in systeemgrijs, en die is niet op te
// maken; deze ziet er in elke browser hetzelfde uit, in de huisstijl.
//
// Het gedrag volgt het "select-only combobox"-patroon van de WAI-ARIA
// Authoring Practices: de focus blijft op de knop, aria-activedescendant wijst
// de optie aan, en het toetsenbord werkt zoals bij een <select> (pijltjes,
// Home/End, Enter, Escape, typen om te zoeken).
//
// De lijst staat met de Popover API in de bovenste laag van de browser. Zo
// knipt geen `overflow: hidden` van een ouder hem af, en blijft hij zichtbaar
// als de editor op volledig scherm staat.

export interface KeuzelijstProps<T extends string | number> {
  waarde: T | null;
  opties: KeuzeOptie<T>[];
  onKies: (waarde: T) => void;
  // Naam voor schermlezers, als er geen <label htmlFor={id}> bij staat.
  label?: string;
  id?: string;
  // Tekst op de knop zolang er niets gekozen is.
  placeholder?: string;
  // Klasse voor de knop, om hem in een balk te laten passen.
  className?: string;
  // Iets vóór de tekst op de knop, zoals een icoon.
  voor?: ReactNode;
  // Iets ná de tekst op de knop, zoals een label met de taal.
  na?: ReactNode;
  title?: string;
}

const MARGE = 4;
const ZOEK_PAUZE_MS = 600;

const kanPopover = typeof HTMLElement !== 'undefined' && 'showPopover' in HTMLElement.prototype;

export default function Keuzelijst<T extends string | number>({
  waarde,
  opties,
  onKies,
  label,
  id,
  placeholder = 'Kies…',
  className,
  voor,
  na,
  title,
}: KeuzelijstProps<T>): ReactNode {
  const basisId = useId();
  const knopId = id ?? `${basisId}-knop`;
  const lijstId = `${basisId}-lijst`;
  const optieId = (index: number) => `${basisId}-optie-${index}`;

  const knopRef = useRef<HTMLButtonElement>(null);
  const lijstRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [actief, setActief] = useState(-1);
  const zoekRef = useRef({ letters: '', tijd: 0 });

  const gekozen = opties.findIndex((o) => o.waarde === waarde);
  const groepen = groepeer(opties);

  const openen = useCallback(
    (stap?: Stap) => {
      const start = gekozen >= 0 && !opties[gekozen].uitgeschakeld ? gekozen : -1;
      setActief(
        stap
          ? volgendeIndex(opties, start, stap)
          : start >= 0
            ? start
            : volgendeIndex(opties, -1, 'begin'),
      );
      setOpen(true);
    },
    [gekozen, opties],
  );

  const sluiten = useCallback(() => setOpen(false), []);

  const kies = useCallback(
    (index: number) => {
      const optie = opties[index];
      if (!optie || optie.uitgeschakeld) return;
      setOpen(false);
      if (optie.waarde !== waarde) onKies(optie.waarde);
    },
    [opties, onKies, waarde],
  );

  // Plaats de lijst onder de knop, of erboven als daar meer ruimte is. De
  // lijst staat `position: fixed`, dus rekenen in schermcoördinaten.
  const plaats = useCallback(() => {
    const knop = knopRef.current;
    const lijst = lijstRef.current;
    if (!knop || !lijst) return;
    const k = knop.getBoundingClientRect();
    lijst.style.minWidth = `${k.width}px`;
    lijst.style.maxHeight = '';
    const hoogte = lijst.offsetHeight;
    const onder = window.innerHeight - k.bottom - MARGE * 2;
    const boven = k.top - MARGE * 2;
    const naarBoven = hoogte > onder && boven > onder;
    const ruimte = naarBoven ? boven : onder;
    if (hoogte > ruimte) lijst.style.maxHeight = `${Math.max(ruimte, 120)}px`;
    const echteHoogte = Math.min(hoogte, Math.max(ruimte, 120));
    lijst.style.top = `${naarBoven ? k.top - MARGE - echteHoogte : k.bottom + MARGE}px`;
    const breedte = lijst.offsetWidth;
    lijst.style.left = `${Math.max(MARGE, Math.min(k.left, window.innerWidth - breedte - MARGE))}px`;
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    const lijst = lijstRef.current;
    if (kanPopover && lijst && !lijst.matches(':popover-open')) lijst.showPopover();
    plaats();
  }, [open, plaats]);

  // Terwijl de lijst open is: meebewegen met scrollen en een ander formaat,
  // en dicht bij een klik ergens anders.
  useEffect(() => {
    if (!open) return;
    const bijKlik = (e: PointerEvent) => {
      const doel = e.target as Node;
      if (knopRef.current?.contains(doel) || lijstRef.current?.contains(doel)) return;
      setOpen(false);
    };
    window.addEventListener('scroll', plaats, true);
    window.addEventListener('resize', plaats);
    document.addEventListener('pointerdown', bijKlik, true);
    return () => {
      window.removeEventListener('scroll', plaats, true);
      window.removeEventListener('resize', plaats);
      document.removeEventListener('pointerdown', bijKlik, true);
    };
  }, [open, plaats]);

  // De aangewezen optie in beeld houden bij bladeren met de pijltjes.
  useEffect(() => {
    if (!open || actief < 0) return;
    document.getElementById(optieId(actief))?.scrollIntoView({ block: 'nearest' });
  });

  const zoek = (letter: string) => {
    const nu = Date.now();
    const z = zoekRef.current;
    z.letters = nu - z.tijd > ZOEK_PAUZE_MS ? letter : z.letters + letter;
    z.tijd = nu;
    const vanaf = open ? actief : gekozen;
    const gevonden = zoekOpLetters(opties, vanaf, z.letters);
    if (gevonden < 0) return;
    if (open) setActief(gevonden);
    // Dicht kiest typen meteen, zoals bij een gewone <select>.
    else kies(gevonden);
  };

  const opToets = (e: KeyboardEvent<HTMLButtonElement>) => {
    const stappen: Record<string, Stap> = {
      ArrowDown: 'volgende',
      ArrowUp: 'vorige',
      Home: 'begin',
      End: 'eind',
    };
    if (!open) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openen();
        return;
      }
      if (e.key === 'Home' || e.key === 'End') {
        e.preventDefault();
        openen(stappen[e.key]);
        return;
      }
    } else {
      if (stappen[e.key]) {
        e.preventDefault();
        setActief((i) => volgendeIndex(opties, i, stappen[e.key]));
        return;
      }
      if (
        e.key === 'Enter' ||
        (e.key === ' ' && Date.now() - zoekRef.current.tijd > ZOEK_PAUZE_MS)
      ) {
        e.preventDefault();
        kies(actief);
        return;
      }
      if (e.key === 'Escape') {
        // Alleen de lijst dicht, niet ook een dialoog of volledig scherm.
        e.preventDefault();
        e.stopPropagation();
        sluiten();
        return;
      }
      if (e.key === 'Tab') {
        kies(actief);
        return;
      }
    }
    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault();
      zoek(e.key);
    }
  };

  const tekst = gekozen >= 0 ? opties[gekozen].label : placeholder;

  return (
    <>
      <button
        ref={knopRef}
        id={knopId}
        type="button"
        // biome-ignore lint/a11y/useSemanticElements: dit vervangt <select> juist, zie boven.
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={lijstId}
        aria-activedescendant={open && actief >= 0 ? optieId(actief) : undefined}
        aria-label={label}
        title={title}
        className={clsx(styles.knop, className)}
        onClick={() => (open ? sluiten() : openen())}
        onKeyDown={opToets}
      >
        {voor}
        <span className={clsx(styles.tekst, gekozen < 0 && styles.placeholder)}>{tekst}</span>
        {na}
        <svg
          className={clsx(styles.pijl, open && styles.pijlOpen)}
          viewBox="0 0 16 16"
          width="14"
          height="14"
          aria-hidden="true"
        >
          <path
            d="M4 6l4 4 4-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      {open && (
        <div
          ref={lijstRef}
          id={lijstId}
          // biome-ignore lint/a11y/useSemanticElements: een <select> is hier precies wat we vervangen.
          role="listbox"
          // De focus blijft op de knop (aria-activedescendant); -1 houdt de lijst
          // buiten de tabvolgorde.
          tabIndex={-1}
          aria-labelledby={label ? undefined : knopId}
          aria-label={label}
          popover={kanPopover ? 'manual' : undefined}
          className={clsx(styles.lijst, !kanPopover && styles.lijstZonderPopover)}
        >
          {groepen.map((groep) => (
            <div
              key={groep.naam ?? ''}
              role={groep.naam ? 'group' : undefined}
              aria-labelledby={groep.naam ? `${basisId}-groep-${groep.naam}` : undefined}
              className={styles.groep}
            >
              {groep.naam && (
                <div id={`${basisId}-groep-${groep.naam}`} className={styles.groepKop}>
                  {groep.naam}
                </div>
              )}
              {groep.opties.map(({ optie, index }) => (
                // biome-ignore lint/a11y/useKeyWithClickEvents lint/a11y/useFocusableInteractive: combobox-patroon; het toetsenbord loopt via de knop (aria-activedescendant).
                <div
                  key={String(optie.waarde)}
                  id={optieId(index)}
                  // biome-ignore lint/a11y/useSemanticElements: zie de listbox hierboven.
                  role="option"
                  aria-selected={index === gekozen}
                  aria-disabled={optie.uitgeschakeld || undefined}
                  className={clsx(
                    styles.optie,
                    index === actief && styles.optieActief,
                    index === gekozen && styles.optieGekozen,
                    optie.uitgeschakeld && styles.optieUit,
                  )}
                  // mousedown zou de focus van de knop halen.
                  onMouseDown={(e) => e.preventDefault()}
                  onMouseMove={() => !optie.uitgeschakeld && actief !== index && setActief(index)}
                  onClick={() => {
                    kies(index);
                    knopRef.current?.focus();
                  }}
                >
                  <span className={styles.optieLabel}>{optie.label}</span>
                  {index === gekozen && (
                    <svg
                      viewBox="0 0 16 16"
                      width="14"
                      height="14"
                      aria-hidden="true"
                      className={styles.vink}
                    >
                      <path
                        d="M3.5 8.5l3 3 6-7"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.9"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </>
  );
}

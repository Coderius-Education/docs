import Link from '@docusaurus/Link';
import { usePluginData } from '@docusaurus/useGlobalData';
import {
  type ReactNode,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import type { BegrippenData } from '../../begrippen';
import styles from './styles.module.css';

// Een moeilijk woord in de lestekst, met een kadertje met de uitleg. De
// remark-stap van plugins/begrippen.js zet het eerste voorkomen van elk begrip
// op een pagina in <Begrip id="…">; de uitleg komt uit de globale data van die
// plugin.
//
// Een klik of tik opent het kadertje, en het blijft open tot je ernaast klikt
// of Escape drukt. Een les met een oefenterminal verliest zijn werk als je de
// pagina verlaat; daarom is het woord geen link, en gaan de links in het
// kadertje pas weg als je ze zelf kiest. Met een muis opent het ook als je
// erboven hangt. Er staat er steeds één open.

const OPEN = 'coderius-begrip-open';

// Op de server bestaat useLayoutEffect niet; het kadertje opent daar ook nooit.
const useLayout = typeof window === 'undefined' ? useEffect : useLayoutEffect;

type Stand = 'dicht' | 'zweven' | 'vast';

/** Tekst met `code` tussen backticks, zoals in begrippen.json. */
export function MetCode({ tekst }: { tekst: string }): ReactNode {
  return tekst
    .split(/`([^`]+)`/)
    .map((deel, i) => (i % 2 ? <code key={`${i}-${deel}`}>{deel}</code> : deel));
}

export default function Begrip({ id, children }: { id: string; children: ReactNode }): ReactNode {
  const data = usePluginData('coderius-begrippen') as BegrippenData | undefined;
  const begrip = data?.begrippen.find((b) => b.id === id);
  const [stand, setStand] = useState<Stand>('dicht');
  const [schuif, setSchuif] = useState(0);
  const kaderId = useId();
  const wrapper = useRef<HTMLSpanElement>(null);
  const knop = useRef<HTMLButtonElement>(null);
  const kader = useRef<HTMLSpanElement>(null);
  const weg = useRef<ReturnType<typeof setTimeout> | null>(null);
  const open = stand !== 'dicht';

  const zet = useCallback(
    (nieuw: Stand) => {
      if (weg.current) clearTimeout(weg.current);
      weg.current = null;
      if (nieuw !== 'dicht') window.dispatchEvent(new CustomEvent(OPEN, { detail: kaderId }));
      setStand(nieuw);
    },
    [kaderId],
  );

  // Een ander begrip ging open: dit gaat dicht.
  useEffect(() => {
    const ander = (e: Event) => {
      if ((e as CustomEvent).detail !== kaderId) setStand('dicht');
    };
    window.addEventListener(OPEN, ander);
    return () => window.removeEventListener(OPEN, ander);
  }, [kaderId]);

  // Klik ernaast of Escape: dicht.
  useEffect(() => {
    if (!open) return;
    const ernaast = (e: PointerEvent) => {
      if (!wrapper.current?.contains(e.target as Node)) setStand('dicht');
    };
    const toets = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      setStand('dicht');
      knop.current?.focus();
    };
    document.addEventListener('pointerdown', ernaast);
    document.addEventListener('keydown', toets);
    return () => {
      document.removeEventListener('pointerdown', ernaast);
      document.removeEventListener('keydown', toets);
    };
  }, [open]);

  useEffect(() => () => void (weg.current && clearTimeout(weg.current)), []);

  // Binnen het scherm houden: een woord rechts op een telefoon gaf anders een
  // kadertje dat buiten beeld viel, en een pagina die opzij kon schuiven.
  useLayout(() => {
    if (!open || !kader.current) return;
    const marge = 8;
    const rand = kader.current.getBoundingClientRect();
    const links = rand.left - schuif;
    const breed = document.documentElement.clientWidth;
    let nodig = 0;
    if (links + rand.width > breed - marge) nodig = breed - marge - (links + rand.width);
    if (links + nodig < marge) nodig = marge - links;
    if (nodig !== schuif) setSchuif(nodig);
  }, [open]);

  if (!begrip) return children;

  const muis = (e: React.PointerEvent) => e.pointerType === 'mouse';
  return (
    <span
      ref={wrapper}
      className={styles.begrip}
      onPointerEnter={(e) => {
        if (!muis(e)) return;
        if (weg.current) clearTimeout(weg.current);
        weg.current = null;
        if (stand === 'dicht') zet('zweven');
      }}
      // Met Tab verder naar iets buiten het kadertje: dicht, anders bleef het
      // over de tekst eronder hangen. Een klik op de tekst in het kadertje
      // geeft geen nieuw doel (relatedTarget is null) en laat het open.
      onBlur={(e) => {
        const naar = e.relatedTarget as Node | null;
        if (naar && !wrapper.current?.contains(naar)) setStand('dicht');
      }}
      onPointerLeave={(e) => {
        if (!muis(e) || stand !== 'zweven') return;
        weg.current = setTimeout(() => setStand('dicht'), 200);
      }}
    >
      <button
        ref={knop}
        type="button"
        className={styles.woord}
        aria-expanded={open}
        aria-controls={kaderId}
        onClick={() => zet(stand === 'vast' ? 'dicht' : 'vast')}
      >
        {children}
      </button>
      <span
        ref={kader}
        id={kaderId}
        className={styles.kader}
        hidden={!open}
        style={schuif ? { transform: `translateX(${schuif}px)` } : undefined}
      >
        <span className={styles.term}>{begrip.term}</span> <MetCode tekst={begrip.kort} />
        {(begrip.les || data?.woordenlijst) && (
          <span className={styles.links}>
            {begrip.les && <Link to={begrip.les.pad}>Uitgelegd in {begrip.les.titel}</Link>}
            {data?.woordenlijst && (
              <Link to={`${data.woordenlijst}#${begrip.id}`}>Alle begrippen</Link>
            )}
          </span>
        )}
      </span>
    </span>
  );
}

import { donker, licht } from '@coderius/shared/prism-thema';
import clsx from 'clsx';
import { Highlight } from 'prism-react-renderer';
import {
  type ReactNode,
  type PointerEvent as ReactPointerEvent,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  type Regel,
  goedOp,
  hussel,
  isStrikt,
  oordeel,
  plekBij,
  regelsVan,
  verplaats,
  zaadVan,
} from './logica';
import styles from './styles.module.css';

// Een Parsons-puzzel: de regels van een werkend programma staan door elkaar,
// en de leerling zet ze in de goede volgorde. Hij typt niets, dus een
// vergeten haakje kan niet; wat overblijft is de opbouw. Zie vakdidactiek,
// Eerst ordenen, dan schrijven met Parsons-puzzels (Parsons en Haden, 2006).
//
//   export const puzzel = `<ul>
//     <li>Appels</li>
//     <li>Peren</li>
//   </ul>`;
//
//   <Puzzel code={puzzel} taal="html">
//     De lijst begint met `<ul>`; elk item staat ertussen.
//   </Puzzel>
//
// Een regel verplaats je door hem te slepen, of met de knoppen omhoog en
// omlaag: die werken ook met het toetsenbord en op een telefoon. Controleer
// zegt per regel of hij goed staat, met een teken en een woord en niet
// alleen met een kleur. De uitleg (de kinderen) komt pas als alles klopt.
//
// De regels staan door elkaar in de HTML van de build, in dezelfde volgorde
// als in de browser: het husselen hangt alleen van de code af.

// Zie HighlightedEditor in python-runner: de kleurmodus van <html> lezen in
// plaats van useColorMode, dat in een gedeeld pakket een tweede context geeft.
function useDonker(): boolean {
  const [isDonker, setDonker] = useState(false);
  useEffect(() => {
    const lees = () => setDonker(document.documentElement.getAttribute('data-theme') === 'dark');
    lees();
    const kijker = new MutationObserver(lees);
    kijker.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => kijker.disconnect();
  }, []);
  return isDonker;
}

// De namen die een auteur schrijft, en hoe Prism de taal noemt.
const TALEN: Record<string, string> = { html: 'markup', js: 'javascript' };

export interface PuzzelProps {
  /** Het werkende programma, in de goede volgorde. */
  code: string;
  /** De taal voor de kleuren: html, css, js of python. */
  taal?: string;
  /** De uitleg die verschijnt als alles op zijn plek staat. */
  children?: ReactNode;
}

interface Controle {
  /** De plek waarop de regel stond toen er gecontroleerd werd. */
  plek: number;
  goed: boolean;
}

export default function Puzzel({ code, taal = 'html', children }: PuzzelProps): ReactNode {
  const oplossing = useMemo(() => regelsVan(code), [code]);
  // In Python telt de inspringing mee: daar is hij de opbouw.
  const strikt = isStrikt(taal);
  const begin = useMemo(() => hussel(oplossing, zaadVan(code), strikt), [oplossing, code, strikt]);
  const [volgorde, setVolgorde] = useState(begin);
  // Wat de laatste controle van een regel zei. Een regel die daarna is
  // verschoven, verliest zijn teken: het ging over de plek van toen.
  const [controle, setControle] = useState<Map<number, Controle>>(new Map());
  const [melding, setMelding] = useState('');
  const [klaar, setKlaar] = useState(false);
  const [slepend, setSlepend] = useState<number | null>(null);
  const lijst = useRef<HTMLOListElement>(null);
  const uitkomst = useRef<HTMLOutputElement>(null);
  const focusNa = useRef<{ id: number; knop: 'op' | 'neer' } | null>(null);
  const thema = useDonker() ? donker : licht;
  const meldingId = useId();

  // Een andere code (de les wisselt) is een nieuwe puzzel.
  useEffect(() => {
    setVolgorde(begin);
    setControle(new Map());
    setMelding('');
    setKlaar(false);
  }, [begin]);

  // Na een klik op omhoog of omlaag blijft de focus bij de regel die bewoog.
  // Staat hij bovenaan of onderaan, dan is die knop uit en krijgt de andere
  // de focus.
  useEffect(() => {
    const na = focusNa.current;
    if (!na) return;
    focusNa.current = null;
    const rij = lijst.current?.querySelector<HTMLElement>(`[data-regel="${na.id}"]`);
    const knoppen = rij?.querySelectorAll<HTMLButtonElement>('button');
    if (!knoppen || knoppen.length < 2) return;
    const op = knoppen[0];
    const neer = knoppen[1];
    const eerst = na.knop === 'op' ? op : neer;
    (eerst.disabled ? (eerst === op ? neer : op) : eerst).focus();
  });

  const zet = (nieuw: Regel[]) => {
    if (nieuw === volgorde) return;
    setVolgorde(nieuw);
    setMelding('');
  };

  const stap = (index: number, richting: -1 | 1) => {
    focusNa.current = { id: volgorde[index].id, knop: richting === -1 ? 'op' : 'neer' };
    zet(verplaats(volgorde, index, index + richting));
  };

  const controleer = () => {
    const goed = goedOp(volgorde, oplossing, strikt);
    const alles = goed.every(Boolean);
    // Klaar: de regels van de oplossing zelf, zodat twee regels die alleen in
    // inspringing verschillen (en verwisseld mochten staan) goed inspringen.
    const lijst = alles ? oplossing : volgorde;
    setControle(new Map(lijst.map((r, i) => [r.id, { plek: i, goed: goed[i] }])));
    setMelding(oordeel(goed));
    setKlaar(alles);
    // De focus naar de uitkomst: op de plek van Controleer staat nu Opnieuw,
    // en een tweede Enter gooide de opgeloste puzzel anders meteen weer weg.
    if (alles) uitkomst.current?.focus();
  };

  const opnieuw = () => {
    setVolgorde(begin);
    setControle(new Map());
    setMelding('');
    setKlaar(false);
  };

  // Slepen. De lijst vangt de aanwijzer, niet de regel: een regel die React
  // in de lijst verplaatst, raakt de aanwijzer kwijt.
  const pak = (e: ReactPointerEvent<HTMLLIElement>, id: number) => {
    if (klaar || e.button !== 0) return;
    const doel = e.target as HTMLElement;
    if (doel.closest('button')) return;
    // Met een vinger alleen aan de greep: de rest van de regel scrolt de pagina.
    const vinger = e.pointerType === 'touch' || e.pointerType === 'pen';
    if (vinger && !doel.closest('[data-greep]')) return;
    e.preventDefault();
    lijst.current?.setPointerCapture?.(e.pointerId);
    setSlepend(id);
  };
  const sleep = (e: ReactPointerEvent<HTMLOListElement>) => {
    if (slepend === null || !lijst.current) return;
    const rijen = Array.from(lijst.current.querySelectorAll<HTMLElement>('[data-regel]'));
    const van = volgorde.findIndex((r) => r.id === slepend);
    const middens = rijen.map((rij) => {
      const vak = rij.getBoundingClientRect();
      return (vak.top + vak.bottom) / 2;
    });
    const naar = plekBij(e.clientY, middens, van);
    zet(verplaats(volgorde, van, naar));
  };
  const laatLos = (e: ReactPointerEvent<HTMLOListElement>) => {
    if (slepend === null) return;
    lijst.current?.releasePointerCapture?.(e.pointerId);
    setSlepend(null);
  };

  return (
    <div className={styles.puzzel} data-puzzel data-klaar={klaar || undefined}>
      <div className={styles.kop}>
        <span className={styles.label}>Puzzel</span>
        <span className={styles.hint}>
          {klaar
            ? 'Zo staat de code in de goede volgorde.'
            : 'Zet de regels in de goede volgorde: sleep een regel, of gebruik de pijlen.'}
        </span>
      </div>
      <ol
        ref={lijst}
        className={clsx(styles.regels, slepend !== null && styles.bezig)}
        onPointerMove={sleep}
        onPointerUp={laatLos}
        onPointerCancel={laatLos}
      >
        {(klaar ? oplossing : volgorde).map((regel, i) => {
          const c = controle.get(regel.id);
          const teken = c && c.plek === i ? c.goed : undefined;
          return (
            <li
              key={regel.id}
              data-regel={regel.id}
              className={clsx(
                styles.regel,
                slepend === regel.id && styles.vast,
                teken === true && styles.goed,
                teken === false && styles.fout,
              )}
              onPointerDown={(e) => pak(e, regel.id)}
            >
              {!klaar && (
                <span className={styles.greep} data-greep aria-hidden="true">
                  <svg viewBox="0 0 10 16" width="10" height="16" role="presentation">
                    <path
                      d="M2 3h.01M8 3h.01M2 8h.01M8 8h.01M2 13h.01M8 13h.01"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
              )}
              <Highlight theme={thema} code={regel.tekst} language={TALEN[taal] ?? taal}>
                {({ tokens, getTokenProps }) => (
                  <code className={styles.code}>
                    {(tokens[0] ?? []).map((token, k) => (
                      // biome-ignore lint/suspicious/noArrayIndexKey: de plek van het teken in de regel.
                      <span key={k} {...getTokenProps({ token })} />
                    ))}
                  </code>
                )}
              </Highlight>
              {teken !== undefined && (
                <span className={styles.teken}>
                  <span aria-hidden="true">{teken ? '✓' : '✗'}</span>
                  <span className={styles.woord}>{teken ? 'goed' : 'niet hier'}</span>
                </span>
              )}
              {!klaar && (
                <span className={styles.knoppen}>
                  <button
                    type="button"
                    className={styles.pijl}
                    onClick={() => stap(i, -1)}
                    disabled={i === 0}
                    aria-label={`Regel ${i + 1} omhoog: ${regel.tekst.trim()}`}
                    title="Omhoog"
                  >
                    <span aria-hidden="true">↑</span>
                  </button>
                  <button
                    type="button"
                    className={styles.pijl}
                    onClick={() => stap(i, 1)}
                    disabled={i === volgorde.length - 1}
                    aria-label={`Regel ${i + 1} omlaag: ${regel.tekst.trim()}`}
                    title="Omlaag"
                  >
                    <span aria-hidden="true">↓</span>
                  </button>
                </span>
              )}
            </li>
          );
        })}
      </ol>
      <div className={styles.onder}>
        {klaar ? (
          <button key="opnieuw" type="button" className={styles.knop} onClick={opnieuw}>
            Opnieuw
          </button>
        ) : (
          <button
            key="controleer"
            type="button"
            className={clsx(styles.knop, styles.hoofd)}
            onClick={controleer}
            aria-describedby={meldingId}
          >
            Controleer
          </button>
        )}
        <output
          ref={uitkomst}
          id={meldingId}
          className={styles.melding}
          aria-live="polite"
          tabIndex={-1}
        >
          {melding}
        </output>
      </div>
      {/* Altijd in de HTML, dicht tot alles klopt: `cross-links` en de
          linkcontrole van Docusaurus zoeken een link in de uitleg daar. */}
      {children && (
        <div className={styles.uitleg} hidden={!klaar} data-puzzel-uitleg>
          {children}
        </div>
      )}
    </div>
  );
}

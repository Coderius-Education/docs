import { type ReactNode, type RefObject, useEffect, useRef, useState } from 'react';
import styles from './styles.module.css';

// Een plaatje in een paneel is klein: hooguit een derde van het scherm, of
// zo hoog als het scherm toelaat naast zijn tekst. Voor een foto is dat
// genoeg. Op een aansluitschema of de pinout van de Nano moet de leerling de
// namen van de pinnen kunnen lezen, en die waren op 128 pixels breed niet te
// lezen. Een klik op zo'n plaatje (of Enter, het plaatje krijgt de focus)
// toont het groot in een <dialog>; Escape, de knop of een klik ernaast sluit.
//
// Alleen een plaatje dat kleiner staat dan het is, en geen plaatje in een
// knop of een link: dat heeft al iets dat een klik doet (de foto's van de
// materiaallijst van robotica hebben hun eigen venster).

/** Zoveel groter dan zijn weergave moet een plaatje zijn om te vergroten. */
const FACTOR = 1.2;

/** De rand en de ruimte van het venster om het grote plaatje (styles.groot). */
const RAND = 26;

/** Hoe breed het plaatje in het venster hooguit wordt (styles.groot: 96vw, 1200px). */
export const breedsteGroot = (scherm: number) => Math.min(scherm * 0.96, 1200) - RAND;

/**
 * Waar het plaatje in zijn vak getekend staat. Naast zijn tekst staat een
 * plaatje passend in een vak (object-fit: contain), en dan is het vak breder
 * of hoger dan het plaatje zelf.
 */
export function getekend(
  vak: { breedte: number; hoogte: number },
  plaatje: { breedte: number; hoogte: number },
): { x: number; y: number; breedte: number; hoogte: number } {
  if (plaatje.breedte <= 0 || plaatje.hoogte <= 0) return { x: 0, y: 0, ...vak };
  const schaal = Math.min(vak.breedte / plaatje.breedte, vak.hoogte / plaatje.hoogte);
  const breedte = plaatje.breedte * schaal;
  const hoogte = plaatje.hoogte * schaal;
  return { x: (vak.breedte - breedte) / 2, y: (vak.hoogte - hoogte) / 2, breedte, hoogte };
}

const getekendVan = (img: HTMLImageElement) =>
  getekend(
    { breedte: img.clientWidth, hoogte: img.clientHeight },
    { breedte: img.naturalWidth, hoogte: img.naturalHeight },
  );

// Groter dan het staat, en ook in het venster groter dan het staat: op een
// telefoon is het venster smaller dan het plaatje in de les (348 tegen 358
// pixels bij de joystick), en dan belooft het label iets dat niet gebeurt.
const kanGroter = (img: HTMLImageElement) =>
  !img.closest('a, button, dialog') &&
  img.closest('[data-les-tab]') !== null &&
  img.naturalWidth > 0 &&
  Math.min(img.naturalWidth, breedsteGroot(window.innerWidth)) > getekendVan(img).breedte * FACTOR;

/**
 * Zet op elk plaatje dat groter kan dat het aan te klikken is, en op het
 * element eromheen waar het label moet staan: op de linkerbovenhoek van het
 * plaatje zelf. Het label hing eerst aan de alinea om het plaatje; een
 * bouwstap in een <figure> of een foto in een reeks had er dan geen, en in
 * een breed vak stond het naast het plaatje.
 */
function markeer(wortel: HTMLElement) {
  for (const img of Array.from(wortel.querySelectorAll('img'))) {
    const vak = img.parentElement;
    if (kanGroter(img)) {
      img.setAttribute('data-vergroot', '');
      img.tabIndex = 0;
      img.setAttribute('role', 'button');
      img.setAttribute('aria-label', `Vergroot: ${img.alt}`);
      if (vak) {
        const om = vak.getBoundingClientRect();
        const eigen = img.getBoundingClientRect();
        const { x, y } = getekendVan(img);
        vak.setAttribute('data-vergroot-vak', '');
        vak.style.setProperty('--vergroot-x', `${Math.round(eigen.left - om.left + x)}px`);
        vak.style.setProperty('--vergroot-y', `${Math.round(eigen.top - om.top + y)}px`);
      }
    } else if (img.hasAttribute('data-vergroot')) {
      img.removeAttribute('data-vergroot');
      img.removeAttribute('tabindex');
      img.removeAttribute('role');
      img.removeAttribute('aria-label');
      if (vak && !vak.querySelector(':scope > img[data-vergroot]')) {
        vak.removeAttribute('data-vergroot-vak');
        vak.style.removeProperty('--vergroot-x');
        vak.style.removeProperty('--vergroot-y');
      }
    }
  }
}

/**
 * Het venster met het grote plaatje, voor alle plaatjes in `wortel`.
 *
 * @param opnieuw verandert als er een ander paneel open staat: dan staan er
 *   andere plaatjes in beeld, met andere maten.
 */
export function Vergroot({
  wortel,
  opnieuw,
}: {
  wortel: RefObject<HTMLElement | null>;
  opnieuw: unknown;
}): ReactNode {
  const venster = useRef<HTMLDialogElement>(null);
  // `x` en `y`: waar in het plaatje geklikt is, als deel van de breedte en de
  // hoogte. Het venster opent daar. Een staand schema is vergroot hoger dan
  // het scherm (de joystick: 2197 pixels in een venster van 677), en bovenaan
  // staat het shield, niet de draden waar de leerling op klikte.
  const [plaatje, setPlaatje] = useState<{
    src: string;
    alt: string;
    x: number;
    y: number;
  } | null>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: `opnieuw` zegt alleen dat er opnieuw gekeken moet worden.
  useEffect(() => {
    const el = wortel.current;
    if (!el) return;
    const kijk = () => markeer(el);
    // Op het moment van de klik gemeten: een plaatje in een paneel dat dicht
    // was, had toen nog geen maten.
    const open = (doel: EventTarget | null, punt?: { x: number; y: number }) => {
      if (!(doel instanceof HTMLImageElement) || !kanGroter(doel)) return false;
      let x = 0.5;
      let y = 0.5;
      if (punt) {
        const vak = doel.getBoundingClientRect();
        const beeld = getekendVan(doel);
        const deel = (n: number) => Math.min(1, Math.max(0, n));
        if (beeld.breedte > 0) x = deel((punt.x - vak.left - beeld.x) / beeld.breedte);
        if (beeld.hoogte > 0) y = deel((punt.y - vak.top - beeld.y) / beeld.hoogte);
      }
      setPlaatje({ src: doel.currentSrc || doel.src, alt: doel.alt, x, y });
      return true;
    };
    const opKlik = (e: MouseEvent) => {
      open(e.target, { x: e.clientX, y: e.clientY });
      // Een klik kan een ander tabblad of een andere stap openen.
      window.requestAnimationFrame(kijk);
    };
    const opToets = (e: KeyboardEvent) => {
      if ((e.key === 'Enter' || e.key === ' ') && open(e.target)) e.preventDefault();
    };
    kijk();
    // De vrije hoogte van het scherm gaat pas na deze ronde naar het plaatje
    // (speling.ts), en dan verschuift de hoek waar het label hoort.
    const kijker = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(() => kijk());
    for (const img of Array.from(el.querySelectorAll('img'))) kijker?.observe(img);
    // Een plaatje heeft zijn maten pas als het geladen is; `load` borrelt
    // niet, dus luisteren we in de vangfase.
    el.addEventListener('load', kijk, true);
    el.addEventListener('click', opKlik);
    el.addEventListener('keydown', opToets);
    window.addEventListener('resize', kijk);
    return () => {
      el.removeEventListener('load', kijk, true);
      el.removeEventListener('click', opKlik);
      el.removeEventListener('keydown', opToets);
      window.removeEventListener('resize', kijk);
      kijker?.disconnect();
    };
  }, [wortel, opnieuw]);

  useEffect(() => {
    const el = venster.current;
    if (!plaatje || !el) return;
    el.showModal?.();
    const img = el.querySelector('img');
    if (!img) return;
    const schuif = () => {
      el.scrollTop = Math.max(0, plaatje.y * img.offsetHeight - el.clientHeight / 2);
      el.scrollLeft = Math.max(0, plaatje.x * img.offsetWidth - el.clientWidth / 2);
    };
    schuif();
    img.addEventListener('load', schuif);
    return () => img.removeEventListener('load', schuif);
  }, [plaatje]);

  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: Escape sluit een dialog al; de klik naast het plaatje is een extra voor de muis.
    <dialog
      ref={venster}
      className={styles.groot}
      aria-label={plaatje?.alt}
      onClose={() => setPlaatje(null)}
      onClick={(e) => {
        if (e.target === e.currentTarget) venster.current?.close();
      }}
    >
      {plaatje && <img src={plaatje.src} alt={plaatje.alt} />}
      <form method="dialog" className={styles.grootSluiten}>
        <button type="submit">Sluiten</button>
      </form>
    </dialog>
  );
}

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

const kanGroter = (img: HTMLImageElement) =>
  !img.closest('a, button, dialog') &&
  img.closest('[data-les-tab]') !== null &&
  // Breedte of hoogte: naast zijn tekst staat een plaatje passend in een vak
  // (object-fit: contain), en dan is het vak breder dan het plaatje.
  (img.naturalWidth > img.clientWidth * FACTOR || img.naturalHeight > img.clientHeight * FACTOR);

/** Zet op elk plaatje dat groter kan dat het aan te klikken is. */
function markeer(wortel: HTMLElement) {
  for (const img of Array.from(wortel.querySelectorAll('img'))) {
    if (kanGroter(img)) {
      img.setAttribute('data-vergroot', '');
      img.tabIndex = 0;
      img.setAttribute('role', 'button');
      img.setAttribute('aria-label', `Vergroot: ${img.alt}`);
    } else if (img.hasAttribute('data-vergroot')) {
      img.removeAttribute('data-vergroot');
      img.removeAttribute('tabindex');
      img.removeAttribute('role');
      img.removeAttribute('aria-label');
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
  const [plaatje, setPlaatje] = useState<{ src: string; alt: string } | null>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: `opnieuw` zegt alleen dat er opnieuw gekeken moet worden.
  useEffect(() => {
    const el = wortel.current;
    if (!el) return;
    const kijk = () => markeer(el);
    // Op het moment van de klik gemeten: een plaatje in een paneel dat dicht
    // was, had toen nog geen maten.
    const open = (doel: EventTarget | null) => {
      if (!(doel instanceof HTMLImageElement) || !kanGroter(doel)) return false;
      setPlaatje({ src: doel.currentSrc || doel.src, alt: doel.alt });
      return true;
    };
    const opKlik = (e: MouseEvent) => {
      open(e.target);
      // Een klik kan een ander tabblad of een andere stap openen.
      window.requestAnimationFrame(kijk);
    };
    const opToets = (e: KeyboardEvent) => {
      if ((e.key === 'Enter' || e.key === ' ') && open(e.target)) e.preventDefault();
    };
    kijk();
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
    };
  }, [wortel, opnieuw]);

  useEffect(() => {
    if (plaatje) venster.current?.showModal?.();
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

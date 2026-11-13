/// <reference path="./react-dom.d.ts" />
import { type ReactNode, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useInBeeld, useInLesTab } from './paneel';

// Een oefenveld naast de les. In de Linux-cursus typt de leerling de hele les
// mee in één oefenterminal: bij de uitleg, bij de voorspelvraag en bij Er
// gaat iets mis. In tabbladen stond die terminal alleen op het scherm waar
// de bron hem had, en op elk ander scherm viel er niets te typen. <LesNaast>
// zet zo'n veld daarom in de kolom naast de tabbladen (`data-les-naast` op de
// wortel van <LesTabs>), waar het bij elk scherm staat.
//
//  - `heleLes`: het veld hoort bij de hele les. Het staat naast elk tabblad,
//    behalve naast een tabblad met een eigen veld (een opdracht met een
//    eigen terminal); op een smal scherm staat het onder het tabblad.
//  - Zonder `heleLes` hoort het veld bij zijn eigen scherm: op een breed
//    scherm staat het in de kolom zolang dat scherm open is, op een smal
//    scherm op zijn plek in de tekst.
//
// Het veld verhuist zonder opnieuw te mounten: het staat in een eigen element
// (de gast) dat van plek wisselt, en React rendert er met een portal in. Een
// veld dat opnieuw mount, raakt zijn werk kwijt.
//
// Alleen voor een veld dat pas in de browser bestaat (binnen <BrowserOnly>):
// een portal staat niet in de HTML van de build. Buiten een tabblad, en op
// de server, staat het veld gewoon op zijn plek.

/** Vanaf deze breedte past er een kolom naast de les. Tussen 997 en 1200
 *  pixels staat de lessenlijst er al, en is de les maar 690 pixels breed:
 *  daar staat het veld onder de tekst, zoals op een telefoon. De opmaak
 *  (styles.module.css) gebruikt dezelfde grens. */
export const BREED = '(min-width: 1200px)';

/** Of het venster breed genoeg is voor een kolom naast de les. */
export function useBreed(): boolean {
  const [breed, setBreed] = useState(
    () => typeof window !== 'undefined' && !!window.matchMedia?.(BREED).matches,
  );
  useLayoutEffect(() => {
    const mq = window.matchMedia?.(BREED);
    if (!mq) return;
    const op = () => setBreed(mq.matches);
    op();
    mq.addEventListener('change', op);
    return () => mq.removeEventListener('change', op);
  }, []);
  return breed;
}

/** De kolom naast de tabbladen van de les waar dit element in staat. */
export function naastVan(el: Element | null): HTMLElement | null {
  const wortel = el?.closest('[data-les-tabs]');
  if (!wortel) return null;
  const naast = Array.from(wortel.children).find((kind) => kind.hasAttribute('data-les-naast'));
  return (naast as HTMLElement | undefined) ?? null;
}

export function LesNaast({
  heleLes = false,
  children,
}: {
  heleLes?: boolean;
  children?: ReactNode;
}): ReactNode {
  const inTab = useInLesTab();
  const inBeeld = useInBeeld();
  const breed = useBreed();
  const anker = useRef<HTMLDivElement>(null);
  const [gast] = useState(() =>
    inTab && typeof document !== 'undefined' ? document.createElement('div') : null,
  );

  useLayoutEffect(() => {
    if (!gast || !anker.current) return;
    gast.setAttribute('data-les-naast-gast', heleLes ? 'les' : 'veld');
    const naast = naastVan(anker.current);
    const plek = naast && (heleLes || (breed && inBeeld)) ? naast : anker.current;
    if (gast.parentNode !== plek) plek.appendChild(gast);
  }, [gast, heleLes, breed, inBeeld]);
  useLayoutEffect(() => () => gast?.remove(), [gast]);

  if (!gast) return children;
  return (
    <>
      <div ref={anker} data-les-naast-anker={heleLes ? 'les' : 'veld'} />
      {createPortal(children, gast)}
    </>
  );
}

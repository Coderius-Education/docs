/// <reference path="./react-dom.d.ts" />
import { type ReactNode, useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react';
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
//    scherm staat het in de kolom en is het alleen te zien zolang dat scherm
//    open is, op een smal scherm staat het op zijn plek in de tekst.
//
// Het veld verhuist zonder opnieuw te mounten: het staat in een eigen element
// (de gast) dat van plek wisselt, en React rendert er met een portal in. Een
// veld dat opnieuw mount, raakt zijn werk kwijt.
//
// De gast verhuist alleen als het venster over de grens van `BREED` gaat,
// niet bij een wissel van tabblad: dan is hij `hidden`. Een element dat uit
// het document gaat en er weer in komt, is zijn schuifpositie kwijt, en de
// terminal van een opdracht stond na elke wissel bovenaan zonder dat je nog
// terug kon schuiven. Met `hidden` bewaart de browser die positie.
//
// Een portal staat niet in de HTML van de build. Een veld dat daar wel in
// staat, staat bij het hydrateren dus eerst op zijn plek in de tekst, en
// gaat daarna pas naar de kolom (het mount dan één keer opnieuw). Een veld
// binnen <BrowserOnly> bestaat pas na het hydrateren en staat meteen in de
// kolom; zet in de `fallback` dan <LesNaastPlek>, zodat de opmaak de kolom
// al vrijhoudt en de tekst niet verspringt als het veld er komt. Buiten een
// tabblad staat het veld gewoon op zijn plek.

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

const nooit = () => () => {};

/** Of dit een render in de browser is die niet hydrateert: dan mag de uitvoer
 *  afwijken van de HTML van de build. */
function useNaHydratatie(): boolean {
  return useSyncExternalStore(
    nooit,
    () => true,
    () => false,
  );
}

/**
 * De plek van een veld dat nog moet komen: voor de `fallback` van een
 * <BrowserOnly> om een veld met <LesNaast heleLes>. De opmaak ziet het anker
 * en zet de les al in twee kolommen. Zonder stond de tekst eerst over de
 * volle breedte en versprong hij als de terminal er kwam.
 */
export function LesNaastPlek({ heleLes = false }: { heleLes?: boolean }): ReactNode {
  if (!useInLesTab()) return null;
  return <div data-les-naast-anker={heleLes ? 'les' : 'veld'} />;
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
  const naHydratatie = useNaHydratatie();
  const anker = useRef<HTMLDivElement>(null);
  const [gast] = useState(() =>
    inTab && typeof document !== 'undefined' ? document.createElement('div') : null,
  );
  const verhuisd = gast && naHydratatie;

  useLayoutEffect(() => {
    if (!verhuisd || !anker.current) return;
    gast.setAttribute('data-les-naast-gast', heleLes ? 'les' : 'veld');
    const naast = naastVan(anker.current);
    const plek = naast && (heleLes || breed) ? naast : anker.current;
    if (gast.parentNode !== plek) {
      // Wie in het veld aan het typen was, typt na het verhuizen door.
      const focus = gast.contains(document.activeElement)
        ? (document.activeElement as HTMLElement)
        : null;
      plek.appendChild(gast);
      focus?.focus({ preventScroll: true });
    }
    // In de kolom is het veld van één scherm alleen te zien zolang dat
    // scherm open is. Op zijn plek in de tekst verbergt het paneel het.
    gast.hidden = plek === naast && !heleLes && !inBeeld;
  }, [verhuisd, gast, heleLes, breed, inBeeld]);
  useLayoutEffect(() => () => gast?.remove(), [gast]);

  if (!verhuisd) return children;
  return (
    <>
      <div
        ref={anker}
        data-les-naast-anker={heleLes ? 'les' : 'veld'}
        data-les-naast-open={inBeeld ? '' : undefined}
      />
      {createPortal(children, gast)}
    </>
  );
}

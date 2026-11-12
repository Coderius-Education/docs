// Wat er op het scherm over is, gaat naar het plaatje of het codevak.
//
// Een paneel past op het scherm doordat een plaatje hooguit 240 pixels hoog
// is en een lang programma in zijn eigen vak schuift. Vaak is er daarna nog
// ruimte over: bij de joystick van robotica stond het aansluitschema op 128
// bij 240 pixels, met 150 pixels leeg eronder, en van een script van 46
// regels waren er twaalf te zien. Die ruimte gaat naar één onderdeel van het
// paneel: het codevak dat schuift, of anders het plaatje naast zijn tekst.
//
// Alleen op een breed scherm (op een telefoon scrolt de leerling), en niet in
// een paneel met een oefenveld: dat neemt de ruimte zelf (pasHoogte.ts).

import { MARGE } from './pasHoogte';

/** Vanaf deze breedte staat de lessenlijst links en past een paneel op het scherm. */
export const BREED = 997;

/** Minder dan dit is het verschuiven niet waard. */
const MINSTE = 8;

export interface Maten {
  /** De hoogte van het scherm (`window.innerHeight`). */
  scherm: number;
  /** Van de bovenkant van de pagina tot de onderkant van het paneel. */
  onderkant: number;
}

/** Hoeveel pixels er onder het paneel nog vrij zijn, of 0. */
export function speling({ scherm, onderkant }: Maten): number {
  const vrij = Math.floor(scherm - onderkant - MARGE);
  return vrij >= MINSTE ? vrij : 0;
}

/**
 * De hoogte van het vak van een plaatje als het `vrij` pixels erbij krijgt.
 * Nooit hoger dan het plaatje op de breedte van het vak wordt, en nooit hoger
 * dan het plaatje zelf: een plaatje wordt niet opgeblazen.
 */
export function plaatjeHoogte(
  vak: { breedte: number; hoogte: number },
  plaatje: { breedte: number; hoogte: number },
  vrij: number,
): number {
  if (plaatje.breedte <= 0 || plaatje.hoogte <= 0) return vak.hoogte;
  const opBreedte = (plaatje.hoogte * vak.breedte) / plaatje.breedte;
  const hoogste = Math.min(opBreedte, plaatje.hoogte);
  return Math.round(Math.max(vak.hoogte, Math.min(vak.hoogte + vrij, hoogste)));
}

const zichtbaar = (el: Element) => !el.closest('[hidden], details:not([open])');

/** Wat de vorige keer is aangepast, per wortel: dat gaat eerst terug. */
const aangepast = new WeakMap<HTMLElement, HTMLElement[]>();

/**
 * Geef de vrije ruimte van het open paneel aan zijn codevak of zijn plaatje.
 * Roep dit aan na elke wissel van tabblad of stap, na het laden van een
 * plaatje en na een andere maat van het venster.
 */
export function verdeelSpeling(wortel: HTMLElement): void {
  const paneel = wortel.querySelector<HTMLElement>(':scope > [data-les-tab]:not([hidden])');
  if (!paneel) return;
  // Staat er een tip of antwoord open, dan is het paneel langer dan het
  // scherm, wat we ook doen. Opnieuw meten liet het plaatje krimpen op het
  // moment dat de leerling een antwoord opende.
  if (paneel.querySelector('details[open]')) return;
  for (const el of aangepast.get(wortel) ?? []) {
    el.style.removeProperty('max-height');
    el.style.removeProperty('min-height');
  }
  aangepast.delete(wortel);
  const metVeld = [
    paneel,
    ...Array.from(paneel.querySelectorAll<HTMLElement>('[data-les-stap]')),
  ].some((p) => zichtbaar(p) && p.hasAttribute('data-heeft-veld'));
  if (window.innerWidth < BREED || metVeld) return;
  const vrij = speling({
    scherm: window.innerHeight,
    onderkant: paneel.getBoundingClientRect().bottom + window.scrollY,
  });
  if (!vrij) return;

  // Eerst een codevak dat schuift: daar is nu iets niet te zien.
  const vak = Array.from(paneel.querySelectorAll<HTMLElement>('pre')).find(
    (pre) => zichtbaar(pre) && pre.scrollHeight > pre.clientHeight + 4,
  );
  if (vak) {
    const erbij = Math.min(vrij, vak.scrollHeight - vak.clientHeight);
    // De rand telt mee in max-height (box-sizing: border-box bij Infima).
    vak.style.maxHeight = `${vak.offsetHeight + erbij}px`;
    aangepast.set(wortel, [vak]);
    return;
  }
  // Anders het plaatje naast zijn tekst.
  const beeld = Array.from(
    paneel.querySelectorAll<HTMLElement>('[data-les-beeld] > p:first-child'),
  ).find(zichtbaar);
  const img = beeld?.querySelector('img');
  if (!beeld || !img) return;
  const hoogte = plaatjeHoogte(
    { breedte: beeld.clientWidth, hoogte: beeld.clientHeight },
    { breedte: img.naturalWidth, hoogte: img.naturalHeight },
    vrij,
  );
  if (hoogte <= beeld.clientHeight) return;
  beeld.style.minHeight = `${hoogte}px`;
  aangepast.set(wortel, [beeld]);
}

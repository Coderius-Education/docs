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

/** Lager dan dit wordt een codevak niet: acht regels code. */
export const KLEINSTE_VAK = 190;

/**
 * Zoveel pixels mag een codeblok dat helemaal te zien is, inleveren als het
 * scherm anders niet past: een regel of vier. Daarboven is het aan de auteur
 * om de stap te splitsen.
 */
export const NOODGREEP = 80;

/** Zo hoog blijft het vak met de terugkoppeling van een vraag minstens. */
export const KLEINSTE_NA = 90;

/**
 * De hoogte van een codevak dat al schuift, als het paneel `tekort` pixels
 * te lang is voor het scherm. Het vak geeft toe tot het paneel past, maar
 * niet verder dan KLEINSTE_VAK.
 */
export function vakHoogte(hoogte: number, tekort: number): number {
  if (tekort <= 0 || hoogte <= KLEINSTE_VAK) return hoogte;
  return Math.max(KLEINSTE_VAK, hoogte - tekort);
}

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
  const onderkant = paneel.getBoundingClientRect().bottom + window.scrollY;
  const vrij = speling({ scherm: window.innerHeight, onderkant });
  if (!vrij) {
    // Het paneel is te lang. Een codevak dat al schuift, geeft toe: de
    // leerling schuift daar toch al, en de pagina hoeft dan niet ook nog te
    // schuiven. In fullstack staat een endpoint van dertig regels met zijn
    // uitleg ernaast en een alinea eronder: veertig pixels te lang.
    let tekort = Math.ceil(onderkant + MARGE - window.innerHeight);
    if (tekort <= 0) return;
    const schuift = (el: HTMLElement) => el.scrollHeight > el.clientHeight + 4;
    const gezet: HTMLElement[] = [];
    const zet = (el: HTMLElement, hoogte: number) => {
      if (hoogte >= el.offsetHeight) return;
      el.style.maxHeight = `${hoogte}px`;
      gezet.push(el);
    };
    // Een vraag die beantwoord is: de terugkoppeling en de uitleg schuiven
    // in hun eigen vak (Voorspel zet `data-voorspel-na`). Bij twintig van de
    // dertig vragen in fullstack paste het scherm tot je antwoordde. Daarna
    // opnieuw meten: naast code wordt het paneel er niet altijd korter van.
    const na = Array.from(paneel.querySelectorAll<HTMLElement>('[data-voorspel-na]')).filter(
      (el) => zichtbaar(el) && el.offsetHeight > KLEINSTE_NA,
    );
    for (const el of na) {
      if (tekort <= 0) break;
      zet(el, Math.max(KLEINSTE_NA, el.offsetHeight - tekort));
      tekort = Math.ceil(
        paneel.getBoundingClientRect().bottom + window.scrollY + MARGE - window.innerHeight,
      );
    }
    // Code met de uitleg ernaast (CodeUitleg) is één rij: zo hoog als het
    // hoogste van de twee. De rij krimpt, maar niet tot onder code die nu
    // helemaal te zien is.
    const rijen = Array.from(paneel.querySelectorAll<HTMLElement>('[data-code-uitleg]')).filter(
      zichtbaar,
    );
    for (const rij of rijen) {
      if (tekort <= 0) break;
      const code = rij.querySelector<HTMLElement>('pre');
      const delen = [code, rij.querySelector<HTMLElement>(':scope > ol')].filter(
        (el): el is HTMLElement => el !== null,
      );
      if (!delen.some(schuift)) continue;
      const nu = Math.max(...delen.map((el) => el.offsetHeight));
      // Code die helemaal te zien is, blijft heel; de uitleg ernaast mag
      // schuiven (dat doet hij al boven 45vh).
      const vast = code && !schuift(code) ? code.offsetHeight : 0;
      const doel = Math.max(vast, vakHoogte(nu, tekort));
      if (doel >= nu) continue;
      for (const el of delen) zet(el, doel);
      tekort -= nu - doel;
    }
    const vakken = Array.from(paneel.querySelectorAll<HTMLElement>('pre'))
      .filter((pre) => zichtbaar(pre) && schuift(pre) && !pre.closest('[data-code-uitleg]'))
      .sort((a, b) => b.offsetHeight - a.offsetHeight);
    for (const pre of vakken) {
      if (tekort <= 0) break;
      const hoogte = vakHoogte(pre.offsetHeight, tekort);
      if (hoogte >= pre.offsetHeight) continue;
      tekort -= pre.offsetHeight - hoogte;
      zet(pre, hoogte);
    }
    // Past het dan nog net niet, dan levert het hoogste codeblok dat nu heel
    // te zien is een paar regels in: het schuift in zijn eigen vak, zodat de
    // pagina het niet hoeft. Een foutmelding met elf regels code eronder was
    // in fullstack veertig pixels te lang voor het scherm.
    if (tekort > 0 && tekort <= NOODGREEP) {
      const heel = Array.from(paneel.querySelectorAll<HTMLElement>('pre'))
        .filter(
          (pre) =>
            zichtbaar(pre) &&
            !gezet.includes(pre) &&
            !pre.closest('details') &&
            pre.offsetHeight - tekort >= KLEINSTE_VAK,
        )
        .sort((a, b) => b.offsetHeight - a.offsetHeight)[0];
      if (heel) {
        const hoogte = heel.offsetHeight - tekort;
        zet(heel, hoogte);
        const uitleg = heel
          .closest('[data-code-uitleg]')
          ?.querySelector<HTMLElement>(':scope > ol');
        if (uitleg) zet(uitleg, hoogte);
      }
    }
    if (gezet.length) aangepast.set(wortel, gezet);
    return;
  }

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
  // Staat er naast het plaatje meer tekst dan het plaatje hoog is, dan is de
  // rij al hoger dan het vak: tot die hoogte groeit het plaatje zonder dat
  // het paneel langer wordt. Zonder dit bleef bij de joystick 140 pixels
  // ongebruikt: het vak werd 368 hoog, naast 370 pixels tekst.
  const rij = beeld.parentElement?.clientHeight ?? beeld.clientHeight;
  const naastTekst = Math.max(0, rij - beeld.clientHeight);
  const hoogte = plaatjeHoogte(
    { breedte: beeld.clientWidth, hoogte: beeld.clientHeight },
    { breedte: img.naturalWidth, hoogte: img.naturalHeight },
    vrij + naastTekst,
  );
  if (hoogte <= beeld.clientHeight) return;
  beeld.style.minHeight = `${hoogte}px`;
  aangepast.set(wortel, [beeld]);
}

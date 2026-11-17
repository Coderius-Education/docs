// De maten van het spel in een les-tabblad (zie index.js). Los van React,
// zodat een test ze kan narekenen.

/** Het venster van play is 800 bij 600. */
export const VERHOUDING = 0.75;

/** Kleiner dan dit is een spel niet meer te spelen: 240 bij 180. */
export const KLEINSTE_SPEL = 180;

/**
 * De hoogte van het spel in een kolom van deze breedte: wat de les vraagt
 * (`height`), maar niet hoger dan het venster van play in die kolom wordt.
 * Daarboven staat er alleen een donkere rand onder het spel.
 */
export function spelHoogte(kolomBreedte, gevraagd) {
  return Math.min(gevraagd, Math.round(kolomBreedte * VERHOUDING));
}

/**
 * Tussen welke hoogtes het hele veld zich aan het scherm aanpast. `rond` is
 * wat er in het veld om het spel heen staat: de kop en de console.
 */
export function veldGrenzen(kolomBreedte, rond) {
  return {
    min: rond + KLEINSTE_SPEL,
    max: rond + Math.round(kolomBreedte * VERHOUDING),
  };
}

/** De breedte van een teken in de editor, bij 0,875rem monospace. */
const TEKEN = 8.43;
/** Wat er in de kolom naast de code staat: de regelnummers, de ruimte
 *  eromheen en de schuifbalk van Windows. */
const NAAST_CODE = 62;
/** De code krijgt minstens dit deel van het veld, en hoogstens dat. Met
 *  minder dan een derde voor het spel is het venster van play te klein. */
export const CODE_MIN = 0.55;
export const CODE_MAX = 0.68;
/** Kleiner dan dit worden de letters van de code niet (zoals pasCode in LesTabs). */
export const KLEINSTE_LETTER = 0.8;

/**
 * Hoe breed de kolom met de code is, en hoe groot haar letters. De langste
 * regel van de code van de les past dan op één regel: in een vaste kolom van
 * 55 procent brak in een op de drie voorbeelden een regel af. Het volgt de
 * code van de les, niet wat de leerling typt: het veld verspringt niet onder
 * het typen.
 *
 * @param {number} tekens de langste regel, in tekens
 * @param {number} breedte de breedte van het veld, in pixels
 */
export function codeKolom(tekens, breedte) {
  if (!breedte) return { deel: CODE_MIN, schaal: 1 };
  const nodig = NAAST_CODE + tekens * TEKEN;
  if (nodig <= breedte * CODE_MIN) return { deel: CODE_MIN, schaal: 1 };
  if (nodig <= breedte * CODE_MAX)
    return { deel: Math.ceil((nodig / breedte) * 1000) / 1000, schaal: 1 };
  const schaal = (breedte * CODE_MAX - NAAST_CODE) / (tekens * TEKEN);
  return { deel: CODE_MAX, schaal: Math.max(KLEINSTE_LETTER, Math.floor(schaal * 100) / 100) };
}

/** Wat er onder het paneel vrij blijft (MARGE in LesTabs/pasHoogte.ts). */
const MARGE = 12;

/**
 * De hoogte van het spel in een open oplossing: wat er op het scherm over is
 * als de rest van het paneel staat, tussen een speelbaar spel en wat de les
 * vraagt. `zonderVeld` is de onderkant van het paneel zonder dit veld.
 */
export function spelInBlok({ scherm, zonderVeld, rond, eigen }) {
  const vrij = scherm - MARGE - zonderVeld - rond;
  return Math.round(Math.max(Math.min(KLEINSTE_SPEL, eigen), Math.min(vrij, eigen)));
}

/**
 * De hoogte van een veld dat het enige op zijn scherm is: wat er over is als
 * de rest van het paneel staat, tussen `min` en `max`. `nodigVoorAnderen` is
 * wat een veld in een open oplossing op dat scherm minstens nodig heeft.
 */
export function veldInScherm({ scherm, zonderVeld, nodigVoorAnderen = 0, min, max }) {
  const vrij = scherm - MARGE - zonderVeld - nodigVoorAnderen;
  return Math.round(Math.max(min, Math.min(vrij, max)));
}

/**
 * Welk deel van het spelvenster te zien is. Het venster zweeft los boven de
 * pagina (SharedRunner): schuift zijn vak in een uitklapblok of onder de
 * navbar uit beeld, dan stond het spel er nog overheen. `vakken` zijn de
 * rechthoeken waar het vak binnen moet blijven; het antwoord is hoeveel er
 * aan elke kant af moet, voor `clip-path: inset(...)`.
 */
export function knip(vak, vakken) {
  let boven = vak.top;
  let onder = vak.bottom;
  let links = vak.left;
  let rechts = vak.right;
  for (const v of vakken) {
    boven = Math.max(boven, v.top);
    onder = Math.min(onder, v.bottom);
    links = Math.max(links, v.left);
    rechts = Math.min(rechts, v.right);
  }
  const weg = onder <= boven || rechts <= links;
  return {
    weg,
    boven: weg ? 0 : Math.round(boven - vak.top),
    rechts: weg ? 0 : Math.round(vak.right - rechts),
    onder: weg ? 0 : Math.round(vak.bottom - onder),
    links: weg ? 0 : Math.round(links - vak.left),
  };
}

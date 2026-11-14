// De opmaak van een PyRunner in een les-tabblad (PyRunnerImpl.tsx): code naast
// of onder de uitvoer, hoe groot de letters zijn en hoe hoog de editor en de
// uitvoer worden. Los van React, zodat het te testen is (opmaak.test.ts).

import { KLEINSTE_SCHAAL, TEKEN_PX, codeBreedte, codeSchaal } from './breedte';

/**
 * Zoveel regels code laat de editor in een tabblad minstens zien. Eerst had
 * alleen het hele veld een ondergrens (180 pixels), en daar gingen de werkbalk,
 * de klaargezette code en het uitvoervak nog af: op 18 schermen waren er
 * hooguit drie regels te zien, en in "Goed per soort" anderhalve van de 19.
 * Met acht regels pasten 117 schermen van de route machine learning niet meer
 * op 1280×720: de stappen, het veld, de tip en het antwoord staan daar op één
 * scherm. Zes is een regel meer dan het meetscript met --streng eist. Een
 * scherm dat met deze ondergrens niet past, splits je in de les.
 */
export const MIN_REGELS = 6;
/** Een regel in de editor: 0,9rem met regelhoogte 1,5. */
export const REGEL_PX = 21.6;
/** De ruimte boven en onder de code in de editor. */
const EDITOR_RAND_PX = 28;
/**
 * Het vak voor de uitvoer onder de code: altijd even hoog, voor en na Voer uit,
 * zodat het scherm niet langer wordt als er uitvoer komt.
 */
export const UITVOER_ONDER = 100;
/**
 * Met een grafiek krijgt de uitvoer minstens dit deel van de breedte. Op drie
 * kwart voor de code stond de k-NN-plot op 208 bij 129 pixels.
 */
const CODE_DEEL_MET_PLAATJE = 0.55;

export type Opmaak = {
  /** De breedte van de codekolom naast de uitvoer, of null: uitvoer onder de code. */
  naast: number | null;
  /** De uitvoer staat onder de code (alleen in een tabblad, met een gemeten breedte). */
  onder: boolean;
  /** Hoeveel kleiner de letters in de editor zijn (1 of minder, nooit onder 0,8). */
  schaal: number;
  /** Zo hoog mag de editor worden; undefined zolang er niets gemeten is. */
  editorMax?: number;
  /** Zo hoog is de editor minstens. */
  editorMin: number;
  /** De hoogte van het uitvoervak onder de code. */
  uitvoerOnder: number;
};

/** Zo hoog is een editor die `regels` regels laat zien, bij letters op `schaal`. */
export function editorHoogte(regels: number, schaal = 1): number {
  return Math.ceil(regels * REGEL_PX * schaal + EDITOR_RAND_PX);
}

/**
 * De opmaak van een veld.
 *
 * `code` is de startcode, niet wat de leerling typt: naast of onder en de
 * grootte van de letters liggen vast bij het openen. Eerst rekende het veld
 * met de getypte code, en sprong het bij een regel van 70 tekens van naast
 * naar onder (de editor van 375 naar 274 pixels) en bij Backspace terug.
 *
 * `breedte` is de breedte van het veld, `ruimte` de hoogte die er voor de
 * editor en de uitvoer onder de code is (het veld min de werkbalk, de
 * klaargezette code en de rand); null zolang er niets gemeten is.
 * `plaatjes`: de code tekent met matplotlib.
 */
export function veldOpmaak({
  code,
  breedte,
  ruimte,
  plaatjes = false,
}: {
  code: string;
  breedte: number | null;
  ruimte: number | null;
  plaatjes?: boolean;
}): Opmaak {
  if (breedte === null)
    return {
      naast: null,
      onder: false,
      schaal: 1,
      editorMin: editorHoogte(MIN_REGELS),
      uitvoerOnder: UITVOER_ONDER,
    };
  const maxDeel = plaatjes ? CODE_DEEL_MET_PLAATJE : undefined;
  // Naast de uitvoer met gewone letters, en anders met kleinere: de uitvoer
  // onder de code liet maar een paar regels code over.
  let naast = codeBreedte(code, breedte, TEKEN_PX, maxDeel);
  if (naast === null) {
    const klein = codeBreedte(code, breedte, TEKEN_PX * KLEINSTE_SCHAAL, maxDeel);
    if (klein !== null) naast = klein;
  }
  const onder = naast === null;
  const schaal = codeSchaal(code, naast ?? breedte);
  const editorMin = editorHoogte(MIN_REGELS, schaal);
  if (ruimte === null) return { naast, onder, schaal, editorMin, uitvoerOnder: UITVOER_ONDER };
  if (!onder)
    return {
      naast,
      onder,
      schaal,
      editorMin,
      editorMax: Math.max(editorMin, ruimte),
      uitvoerOnder: UITVOER_ONDER,
    };
  // Onder de code: een vak van vaste hoogte, met een grafiek de helft van de
  // ruimte (in een vak van 100 pixels was de grafiek van Big-O niet te zien),
  // en nooit zoveel dat de editor onder zijn minimum komt.
  const lijn = 1;
  const uitvoerOnder = plaatjes
    ? Math.max(UITVOER_ONDER, Math.min(Math.floor((ruimte - lijn) / 2), ruimte - lijn - editorMin))
    : UITVOER_ONDER;
  const editorMax = Math.max(editorMin, ruimte - lijn - uitvoerOnder);
  return { naast, onder, schaal, editorMin, editorMax, uitvoerOnder };
}

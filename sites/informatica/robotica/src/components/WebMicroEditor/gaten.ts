// Wat een bouwsteen openlaat, en hoe de leerling er komt. Pure functies op
// de regels van het programma; paletEditor.ts tekent ermee en hangt ze aan
// Enter en Tab.
//
// - Een gat is de lege regel direct onder een regel die een blok opent, als
//   dat blok nog niets bevat. Zonder iets erin geeft Python een fout, en een
//   regel met alleen spaties zie je niet: de editor tekent het gat.
// - Een invulplek is het woord dat een bouwsteen selecteert en dat de
//   leerling overtypt: `voorwaarde` in `if voorwaarde:`, `naam` in
//   `naam = 0`. Staat het er nog, dan is het niet ingevuld.

import { BOUWSTENEN } from './bouwstenen';
import { opentBlok } from './invoegen';

const isLeeg = (regel: string) => regel.trim() === '';
const inspringing = (regel: string) => /^[ \t]*/.exec(regel)?.[0].length ?? 0;

/** De regels (vanaf 0) met een leeg gat. */
export function gatRegels(regels: string[]): number[] {
  const uit: number[] = [];
  for (let i = 1; i < regels.length; i++) {
    if (!isLeeg(regels[i]) || isLeeg(regels[i - 1]) || !opentBlok(regels[i - 1])) continue;
    const daarna = regels.slice(i + 1).find((r) => !isLeeg(r));
    if (daarna === undefined || inspringing(daarna) <= inspringing(regels[i - 1])) uit.push(i);
  }
  return uit;
}

// De regels van de bouwstenen met een woord om in te vullen, als
// [tekst voor het woord, het woord, tekst erna].
const INVULREGELS: [string, string, string][] = BOUWSTENEN.flatMap((b) =>
  b.code.split('\n').flatMap((regel) => {
    const m = /^(.*)⟦(.+)⟧(.*)$/.exec(regel);
    return m ? [[m[1], m[2], m[3]] as [string, string, string]] : [];
  }),
);

/** Wat er achter een invulplek op de regel staat: `:` en ` = 0`. */
const STAARTEN = [...new Set(INVULREGELS.map(([, , na]) => na))];

export type Plek = { regel: number; van: number; tot: number };

/** De woorden die nog ingevuld moeten worden, met hun kolommen op de regel. */
export function invulPlekken(regels: string[]): Plek[] {
  const uit: Plek[] = [];
  regels.forEach((regel, i) => {
    const kaal = regel.trim();
    const voor = regel.length - regel.trimStart().length;
    for (const [begin, woord, eind] of INVULREGELS) {
      if (kaal !== begin + woord + eind) continue;
      uit.push({ regel: i, van: voor + begin.length, tot: voor + begin.length + woord.length });
      break;
    }
  });
  return uit;
}

/**
 * Waar Enter of Tab de cursor brengt als hij vlak voor het eind van een
 * regel uit een bouwsteen staat (`if teller > 3|:`). Een gewone Enter brak
 * de regel daar vóór de dubbele punt.
 *
 * - `gat`: naar het eind van het gat op de volgende regel;
 * - `eind`: naar het eind van deze regel, en daar een nieuwe regel;
 * - null: de toets doet wat hij altijd doet.
 */
export function sprong(
  regels: string[],
  regel: number,
  kolom: number,
): { soort: 'gat'; regel: number } | { soort: 'eind' } | null {
  const tekst = regels[regel] ?? '';
  const rest = tekst.slice(kolom).trimEnd();
  if (rest === '' || !STAARTEN.includes(rest) || isLeeg(tekst.slice(0, kolom))) return null;
  if (opentBlok(tekst) && gatRegels(regels).includes(regel + 1))
    return { soort: 'gat', regel: regel + 1 };
  return { soort: 'eind' };
}

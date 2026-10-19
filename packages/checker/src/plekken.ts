import type { Plek } from './types';

// Waar in een bestand iets staat, als regelnummer. Het rapport toont per
// concept en per vondst buiten de lesstof de plekken, zodat de docent in het
// mondeling naar de regel kan wijzen ("regel 14: wat doet dit?").

/** Hoeveel plekken een concept of vondst hooguit onthoudt; de telling loopt door. */
export const MAX_PLEKKEN = 50;

/** De beginpositie van elke regel. */
export function regelBegins(tekst: string): number[] {
  const begins = [0];
  for (let i = 0; i < tekst.length; i++) if (tekst[i] === '\n') begins.push(i + 1);
  return begins;
}

/** Het regelnummer (vanaf 1) van een positie in de tekst. */
export function regelVan(begins: number[], positie: number): number {
  let laag = 0;
  let hoog = begins.length - 1;
  while (laag < hoog) {
    const midden = (laag + hoog + 1) >> 1;
    if (begins[midden] <= positie) laag = midden;
    else hoog = midden - 1;
  }
  return laag + 1;
}

/**
 * Zet posities in een bestand om naar plekken: één per regel, op volgorde,
 * en hooguit `ruimte` stuks (wat er al in de lijst zit telt mee).
 */
export function plekkenIn(
  bestand: string,
  tekst: string,
  posities: number[],
  ruimte: number,
): Plek[] {
  if (ruimte <= 0 || posities.length === 0) return [];
  const begins = regelBegins(tekst);
  const regels = Array.from(new Set(posities.map((p) => regelVan(begins, p)))).sort(
    (a, b) => a - b,
  );
  return regels.slice(0, ruimte).map((regel) => ({ bestand, regel }));
}

/**
 * Vervangt tekens door spaties, behalve regeleinden. Zo kun je commentaar of
 * tekst tussen aanhalingstekens wegpoetsen zonder dat een positie of
 * regelnummer erna verschuift.
 */
export function blanco(tekst: string): string {
  return tekst.replace(/[^\n]/g, ' ');
}

import { standaardDocument } from './standaard';
import type { Vakpagina } from './types';
import { valideerVakpagina } from './valideer';

// Alle vakpagina's zitten in de build (één build dient elke host). Een
// ongeldig bestand breekt de build: liever geen publicatie dan een kapotte
// startpagina.
const bestanden = import.meta.glob<Vakpagina>('../vakpaginas/*.json', {
  eager: true,
  import: 'default',
});

export const VAKPAGINAS: Record<string, Vakpagina> = Object.fromEntries(
  Object.entries(bestanden).map(([pad, doc]) => {
    const vak = pad.replace(/^.*\/([^/]+)\.json$/, '$1');
    const fouten = valideerVakpagina(doc, vak);
    if (fouten.length > 0) {
      throw new Error(`Vakpagina ${vak} is ongeldig:\n- ${fouten.join('\n- ')}`);
    }
    return [vak, doc];
  }),
);

export function vakpaginaVoor(vak: string | null): Vakpagina {
  return (vak && VAKPAGINAS[vak]) || standaardDocument(vak);
}

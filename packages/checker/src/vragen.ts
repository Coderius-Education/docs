import type { ProjectFiles } from './types';

// Vragen voor het mondeling: een fragment uit het project (een bestand en een
// reeks regels) met de vraag die de docent erover wil stellen. Vooraf
// gemarkeerd, tijdens het gesprek beoordeeld, en zo in de PDF: het verslag
// van het mondeling.

export type Oordeel = 'goed' | 'deels' | 'niet';

export const OORDELEN: { id: Oordeel; label: string }[] = [
  { id: 'goed', label: 'Goed' },
  { id: 'deels', label: 'Deels' },
  { id: 'niet', label: 'Niet' },
];

export interface Vraag {
  id: string;
  bestand: string;
  /** Eerste en laatste regel van het fragment (vanaf 1, tot en met). */
  van: number;
  tot: number;
  vraag: string;
  oordeel: Oordeel | null;
  notitie: string;
}

/** Een nieuwe vraag over regels van..tot (in welke volgorde ook aangeklikt). */
export function nieuweVraag(
  id: string,
  bestand: string,
  a: number,
  b: number,
  vraag: string,
): Vraag {
  return {
    id,
    bestand,
    van: Math.min(a, b),
    tot: Math.max(a, b),
    vraag: vraag.trim(),
    oordeel: null,
    notitie: '',
  };
}

export function wijzigVraag(vragen: Vraag[], id: string, wijziging: Partial<Vraag>): Vraag[] {
  return vragen.map((v) => (v.id === id ? { ...v, ...wijziging, id } : v));
}

export function verwijderVraag(vragen: Vraag[], id: string): Vraag[] {
  return vragen.filter((v) => v.id !== id);
}

/** Schuift een vraag een plek omhoog (-1) of omlaag (+1); aan de rand niets. */
export function verplaatsVraag(vragen: Vraag[], id: string, richting: -1 | 1): Vraag[] {
  const i = vragen.findIndex((v) => v.id === id);
  const j = i + richting;
  if (i === -1 || j < 0 || j >= vragen.length) return vragen;
  const nieuw = vragen.slice();
  [nieuw[i], nieuw[j]] = [nieuw[j], nieuw[i]];
  return nieuw;
}

/** "index.html, regel 12" of "index.html, regels 12–14". */
export function plekLabel(v: Pick<Vraag, 'bestand' | 'van' | 'tot'>): string {
  return v.van === v.tot
    ? `${v.bestand}, regel ${v.van}`
    : `${v.bestand}, regels ${v.van}–${v.tot}`;
}

export interface Fragment {
  regels: { nr: number; tekst: string }[];
  /** Hoeveel regels er na de getoonde nog in het fragment zitten. */
  meer: number;
  /** Het bestand of de regels bestaan niet (meer) in dit project. */
  ontbreekt: boolean;
}

/** De regels van een vraag uit het project, hooguit `max` stuks. */
export function fragment(
  files: ProjectFiles,
  v: Pick<Vraag, 'bestand' | 'van' | 'tot'>,
  max = 12,
): Fragment {
  const inhoud = files[v.bestand]?.content;
  if (inhoud == null) return { regels: [], meer: 0, ontbreekt: true };
  const alle = inhoud.split('\n');
  if (v.van > alle.length) return { regels: [], meer: 0, ontbreekt: true };
  const tot = Math.min(v.tot, alle.length);
  const regels = [];
  for (let nr = v.van; nr <= Math.min(tot, v.van + max - 1); nr++) {
    regels.push({ nr, tekst: alle[nr - 1].replace(/\r$/, '') });
  }
  return { regels, meer: tot - v.van + 1 - regels.length, ontbreekt: false };
}

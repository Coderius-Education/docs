// De logica van de keuzelijst, los van React en de DOM, zodat hij in node te
// testen is: groeperen, met de pijltjes door de lijst, en typen om te zoeken.

export interface KeuzeOptie<T extends string | number = string> {
  waarde: T;
  label: string;
  // Opties met dezelfde groep staan onder één kopje (zoals <optgroup>).
  groep?: string;
  uitgeschakeld?: boolean;
}

export interface Groep<T extends string | number> {
  naam: string | null;
  opties: { optie: KeuzeOptie<T>; index: number }[];
}

// Groepen in de volgorde waarin ze voor het eerst voorkomen; opties zonder
// groep samen in een groep zonder naam. `index` is de plek in de platte lijst,
// waarmee de toetsenbordnavigatie rekent.
export function groepeer<T extends string | number>(opties: KeuzeOptie<T>[]): Groep<T>[] {
  const groepen = new Map<string | null, Groep<T>>();
  opties.forEach((optie, index) => {
    const naam = optie.groep ?? null;
    let groep = groepen.get(naam);
    if (!groep) {
      groep = { naam, opties: [] };
      groepen.set(naam, groep);
    }
    groep.opties.push({ optie, index });
  });
  // Array.from, geen [...groepen.values()]: met spread over een Map gingen de
  // tests in node groen, maar crashte de editor in de browser (de code zoals
  // Docusaurus hem bouwt kreeg geen lijst terug).
  return Array.from(groepen.values());
}

// Groepen tonen de opties in groepsvolgorde; de pijltjes moeten die volgorde
// volgen, niet die van de platte lijst.
export function zichtbareVolgorde<T extends string | number>(opties: KeuzeOptie<T>[]): number[] {
  return groepeer(opties).flatMap((g) => g.opties.map((o) => o.index));
}

export type Stap = 'volgende' | 'vorige' | 'begin' | 'eind';

// De volgende optie die te kiezen is, in zichtbare volgorde. Uitgeschakelde
// opties worden overgeslagen; aan de randen blijf je staan (niet rondlopen,
// zoals een gewone <select>).
export function volgendeIndex<T extends string | number>(
  opties: KeuzeOptie<T>[],
  huidige: number,
  stap: Stap,
): number {
  const volgorde = zichtbareVolgorde(opties).filter((i) => !opties[i].uitgeschakeld);
  if (volgorde.length === 0) return -1;
  if (stap === 'begin') return volgorde[0];
  if (stap === 'eind') return volgorde[volgorde.length - 1];
  const plek = volgorde.indexOf(huidige);
  if (plek === -1) return stap === 'volgende' ? volgorde[0] : volgorde[volgorde.length - 1];
  const nieuw = stap === 'volgende' ? plek + 1 : plek - 1;
  return volgorde[Math.min(Math.max(nieuw, 0), volgorde.length - 1)];
}

function normaliseer(tekst: string): string {
  // Accenten los van hun letter (NFD) en dan weg (\p{M}).
  return tekst.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
}

// Typen om te zoeken: de eerste te kiezen optie ná `start` waarvan het label
// begint met wat er getypt is, rondlopend. Hoofdletters en accenten tellen
// niet ("e" vindt "École"). Typ je één letter herhaald ("ppp"), dan loop je
// door de opties met die letter, zoals in een gewone <select>.
export function zoekOpLetters<T extends string | number>(
  opties: KeuzeOptie<T>[],
  start: number,
  letters: string,
): number {
  const volgorde = zichtbareVolgorde(opties).filter((i) => !opties[i].uitgeschakeld);
  if (volgorde.length === 0 || letters === '') return -1;
  const zelfdeLetter = letters.length > 1 && [...letters].every((l) => l === letters[0]);
  const zoek = normaliseer(zelfdeLetter ? letters[0] : letters);
  // Bij een nieuwe zoekopdracht mag de huidige optie zelf ook passen; bij
  // één herhaalde letter begin je bij de volgende.
  const plek = volgorde.indexOf(start);
  const vanaf = letters.length === 1 || zelfdeLetter ? plek + 1 : Math.max(plek, 0);
  for (let i = 0; i < volgorde.length; i++) {
    const index = volgorde[(vanaf + i) % volgorde.length];
    if (normaliseer(opties[index].label).startsWith(zoek)) return index;
  }
  return -1;
}

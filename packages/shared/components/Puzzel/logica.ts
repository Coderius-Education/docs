// De logica van een Parsons-puzzel, los van React: de regels van een werkend
// programma staan door elkaar, en de leerling zet ze in de goede volgorde.
// Zie vakdidactiek, Eerst ordenen, dan schrijven met Parsons-puzzels (Parsons
// en Haden, 2006).

export interface Regel {
  /** De plek van de regel in de oplossing; ook zijn sleutel in de lijst. */
  id: number;
  /** De regel zoals hij in de code staat, met zijn inspringing. */
  tekst: string;
}

/** De regels van de code, zonder lege regels: die zijn geen stukje van de puzzel. */
export function regelsVan(code: string): Regel[] {
  return code
    .replaceAll('\r', '')
    .split('\n')
    .map((r) => r.trimEnd())
    .filter((r) => r.trim() !== '')
    .map((tekst, id) => ({ id, tekst }));
}

// Twee regels met dezelfde tekst (twee keer `}` of `</li>`) zijn onderling
// te verwisselen: de leerling kan niet weten welke de eerste was. Ook als
// ze alleen in hun inspringing verschillen: de `}` van een `else` en die van
// de functie zijn voor hem dezelfde regel.
const zelfde = (a: Regel | undefined, b: Regel | undefined) =>
  a !== undefined && b !== undefined && a.tekst.trim() === b.tekst.trim();
const zelfdeVolgorde = (a: Regel[], b: Regel[]) => a.every((r, i) => zelfde(r, b[i]));

/** Een getal uit de code: dezelfde puzzel staat voor iedereen hetzelfde door elkaar. */
export function zaadVan(code: string): number {
  let h = 2166136261;
  for (let i = 0; i < code.length; i++) {
    h ^= code.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * De regels door elkaar. Met hetzelfde zaad altijd hetzelfde, zodat de server
 * en de browser dezelfde lijst tekenen. Nooit de oplossing zelf: komt die
 * eruit, dan schuift alles één plek op.
 */
export function hussel(regels: Regel[], zaad: number): Regel[] {
  const uit = [...regels];
  let s = zaad >>> 0;
  const willekeurig = () => {
    // mulberry32: klein, en overal hetzelfde.
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  for (let i = uit.length - 1; i > 0; i--) {
    const j = Math.floor(willekeurig() * (i + 1));
    [uit[i], uit[j]] = [uit[j], uit[i]];
  }
  for (let poging = 0; poging < uit.length && zelfdeVolgorde(uit, regels); poging++) {
    uit.push(uit.shift() as Regel);
  }
  return uit;
}

/** De lijst met de regel op `van` verplaatst naar `naar`. */
export function verplaats(volgorde: Regel[], van: number, naar: number): Regel[] {
  if (van === naar || van < 0 || naar < 0 || van >= volgorde.length || naar >= volgorde.length)
    return volgorde;
  const uit = [...volgorde];
  const [regel] = uit.splice(van, 1);
  uit.splice(naar, 0, regel);
  return uit;
}

/** Per plek: staat hier de regel die er hoort? */
export function goedOp(volgorde: Regel[], oplossing: Regel[]): boolean[] {
  return volgorde.map((r, i) => zelfde(r, oplossing[i]));
}

/** De zin na Controleer. */
export function oordeel(goed: boolean[]): string {
  const n = goed.filter(Boolean).length;
  if (n === goed.length) return `Goed: alle ${goed.length} regels staan op hun plek.`;
  const staan =
    n === 0
      ? 'Nog geen regel staat op zijn plek'
      : n === 1
        ? `1 regel staat op zijn plek, van de ${goed.length}`
        : `${n} regels staan op hun plek, van de ${goed.length}`;
  return `${staan}. Verplaats de regels met een kruisje en controleer opnieuw.`;
}

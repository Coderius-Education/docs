// Een parse-boom als tekening: het rekenwerk, los van de component, zodat
// het te testen is. De parser-motor van de cfg-track levert een boom als
// geneste lijsten: een blad is [woordsoort, woord], een knoop is
// [symbool, kind, kind, …]. Elk blad krijgt een eigen kolom, breed genoeg
// voor zijn woord; een knoop hangt midden boven zijn eerste en laatste kind.

export type Boom = [string, ...(Boom | string)[]];

export interface Knoop {
  id: number;
  label: string;
  /** Het woord onder een blad; null bij een knoop met kinderen. */
  woord: string | null;
  x: number;
  y: number;
  ouder: number | null;
}

export interface Tekening {
  knopen: Knoop[];
  breedte: number;
  hoogte: number;
}

/** Afstand tussen de lagen van de boom, in px. */
export const LAAG = 52;
/** Een kolom is minstens zo breed, en anders zo breed als het woord vraagt. */
export const MIN_KOLOM = 56;
const PX_PER_TEKEN = 7.5;
const KOLOM_MARGE = 14;
/** Ruimte onder de onderste laag voor de woorden. */
const WOORD_RUIMTE = 26;

export function isBlad(boom: Boom): boolean {
  return boom.length === 2 && typeof boom[1] === 'string';
}

export function kolomBreedte(woord: string): number {
  return Math.max(MIN_KOLOM, Math.ceil(woord.length * PX_PER_TEKEN) + KOLOM_MARGE);
}

export interface Getiteld {
  titel: string | null;
  boom: Boom;
}

/**
 * Leest wat de runner uit Python krijgt (json.dumps van _coderius_bomen):
 * per element een kale boom, of {"titel": …, "boom": …} met de zin of het
 * volgnummer erbij. Alles wat niet de vorm van een boom heeft valt af;
 * iets vreemds in die variabele mag de uitvoer nooit laten omvallen.
 */
export function leesBomen(data: unknown): Getiteld[] {
  if (!Array.isArray(data)) return [];
  const uit: Getiteld[] = [];
  for (const x of data) {
    if (isBoom(x)) uit.push({ titel: null, boom: x });
    else if (x && typeof x === 'object' && isBoom((x as { boom?: unknown }).boom)) {
      const titel = (x as { titel?: unknown }).titel;
      uit.push({
        titel: typeof titel === 'string' ? titel : null,
        boom: (x as { boom: Boom }).boom,
      });
    }
  }
  return uit;
}

export function isBoom(x: unknown): x is Boom {
  if (!Array.isArray(x) || x.length < 2 || typeof x[0] !== 'string') return false;
  if (x.length === 2 && typeof x[1] === 'string') return true;
  return x.slice(1).every(isBoom);
}

export function tekenBoom(boom: Boom): Tekening {
  const knopen: Knoop[] = [];
  let rand = 0;
  let diepste = 0;

  function plaats(b: Boom, diepte: number, ouder: number | null): number {
    const id = knopen.length;
    const knoop: Knoop = { id, label: b[0], woord: null, x: 0, y: diepte * LAAG, ouder };
    knopen.push(knoop);
    diepste = Math.max(diepste, diepte);
    if (isBlad(b)) {
      const woord = b[1] as string;
      const breed = kolomBreedte(woord);
      knoop.woord = woord;
      knoop.x = rand + breed / 2;
      rand += breed;
      return knoop.x;
    }
    const xs = (b.slice(1) as Boom[]).map((kind) => plaats(kind, diepte + 1, id));
    knoop.x = (xs[0] + xs[xs.length - 1]) / 2;
    return knoop.x;
  }

  plaats(boom, 0, null);
  return { knopen, breedte: rand, hoogte: (diepste + 1) * LAAG + WOORD_RUIMTE };
}

/** De woorden van de zin, van links naar rechts: de bladeren op volgorde. */
export function bladeren(boom: Boom): string[] {
  if (isBlad(boom)) return [boom[1] as string];
  return (boom.slice(1) as Boom[]).flatMap(bladeren);
}

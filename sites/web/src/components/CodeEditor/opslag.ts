import { createStore, del, get, set } from 'idb-keyval';

// Het werk in een oefenveld was weg zodra je de pagina ververste of de
// browser sloot. Nu bewaart elk veld zijn code in de IndexedDB van deze
// browser, net als de projecten in de Online Editor (packages/editor). Niet
// in localStorage: dat is synchroon, gedeeld met alles op het domein en
// begrensd op ~5 MB; IndexedDB krijgt een deel van de vrije schijfruimte.
//
// Het blijft opslag op dit apparaat, in deze browser. Wissen van de
// sitegegevens, een privévenster of een Chromebook die bij afmelden leeg
// wordt gemaakt, en het werk is weg; zie de docentenhandleiding.

export interface Code {
  html: string;
  css: string;
  js: string;
}

interface Bewaard extends Code {
  versie: typeof VERSIE;
  zaad: string;
  // Voor als er ooit opgeruimd moet worden; een veld is een paar kB, dus
  // honderd velden blijven ruim onder een MB en dat is nu niet nodig.
  opgeslagenOp: number;
}

export const VERSIE = 1;

type IdbStore = ReturnType<typeof createStore>;
let store: IdbStore | undefined;
// Pas bij het eerste gebruik: createStore opent de database meteen, en dat
// hoort niet te gebeuren bij het importeren (tests, server-render).
function getStore(): IdbStore {
  store ??= createStore('coderius-oefenvelden', 'velden');
  return store;
}

// cyrb53: kort, snel en goed genoeg verspreid om startcode te herkennen. Geen
// beveiliging, alleen een naam.
function cyrb53(tekst: string): string {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < tekst.length; i++) {
    const c = tekst.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 2654435761);
    h2 = Math.imul(h2 ^ c, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16);
}

// Het zaad is de vingerafdruk van de startcode. Past een docent de startcode
// aan, dan hoort het veld opnieuw te beginnen: oud werk op nieuwe startcode
// zou de opdracht niet meer passen. Het oude werk blijft dan wel in de
// database staan, alleen vindt het veld het niet meer.
export function zaadVan(code: Code): string {
  // Een scheidingsteken dat in code niet voorkomt, anders geven ('ab', 'c')
  // en ('a', 'bc') dezelfde afdruk.
  return cyrb53(`${code.html}\u0000${code.css}\u0000${code.js}`);
}

// Een veld heeft geen eigen id in de MDX. Pad plus zaad onderscheidt de
// velden meestal, maar de opdrachten in js-basics hergebruiken vaak dezelfde
// start*-code (loops heeft er drie van). Daarom telt `n` welk veld met dit
// zaad het is, van boven naar beneden. Komt er een veld met dezelfde
// startcode tussen, dan schuift het werk één veld op.
export function veldSleutel(pad: string, zaad: string, n: number): string {
  const schoon = pad.replace(/\/+$/, '') || '/';
  return `${schoon}|${zaad}|${n}`;
}

function isBewaard(waarde: unknown, zaad: string): waarde is Bewaard {
  if (typeof waarde !== 'object' || waarde === null) return false;
  const w = waarde as Partial<Bewaard>;
  return (
    w.versie === VERSIE &&
    w.zaad === zaad &&
    typeof w.html === 'string' &&
    typeof w.css === 'string' &&
    typeof w.js === 'string'
  );
}

export async function laadVeld(sleutel: string, zaad: string): Promise<Code | undefined> {
  const waarde = await get<unknown>(sleutel, getStore());
  if (!isBewaard(waarde, zaad)) return undefined;
  return { html: waarde.html, css: waarde.css, js: waarde.js };
}

export function gelijkeCode(a: Code, b: Code): boolean {
  return a.html === b.html && a.css === b.css && a.js === b.js;
}

// Is de code weer gelijk aan de start (Reset, of alles teruggetypt), dan is
// er niets te bewaren en ruimt het veld zijn regel op. Een veld dat je alleen
// bekeek, laat zo niets achter.
export async function bewaarVeld(
  sleutel: string,
  code: Code,
  start: Code,
  zaad: string,
  nu: number = Date.now(),
): Promise<void> {
  if (gelijkeCode(code, start)) {
    await del(sleutel, getStore());
    return;
  }
  const waarde: Bewaard = { versie: VERSIE, zaad, ...code, opgeslagenOp: nu };
  await set(sleutel, waarde, getStore());
}

export function wisVeld(sleutel: string): Promise<void> {
  return del(sleutel, getStore());
}

// 'vol': de browser heeft geen ruimte meer voor deze site. 'geweigerd': er
// mag niets bewaard worden, bijvoorbeeld in een privévenster van een oudere
// Firefox of met geblokkeerde sitegegevens.
export type Fout = 'vol' | 'geweigerd';

export function soortFout(fout: unknown): Fout {
  const naam = (fout as { name?: unknown } | null)?.name;
  return naam === 'QuotaExceededError' ? 'vol' : 'geweigerd';
}

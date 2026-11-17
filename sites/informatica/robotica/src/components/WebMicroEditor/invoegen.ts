// Zet een bouwsteen uit het palet in het programma. Pure functies op tekst:
// de component geeft de code en de regel van de cursor, en krijgt de nieuwe
// code met de plek van de cursor terug.
//
// - De code komt op de regel van de cursor: op een lege regel op die regel
//   zelf, anders eronder. Staat de cursor op een regel die een blok opent
//   (`while True:`), dan komt de code in dat blok. Zo bouw je met klikken van
//   buiten naar binnen, zoals je blokken in elkaar schuift.
// - De import komt bij de imports bovenaan, één keer.
// - De opzet (het onderdeel aanmaken) komt na de imports en vóór de regel van
//   de cursor, één keer: in een lus zou het bord het onderdeel bij elke ronde
//   opnieuw aanmaken.

import type { Bouwsteen, Import } from './bouwstenen';

export type Invoeging = {
  doc: string;
  /** Begin en eind van de selectie in `doc`; gelijk voor een kale cursor. */
  van: number;
  tot: number;
};

const OPEN = '⟦';
const DICHT = '⟧';
const STAP = '    ';

const isLeeg = (regel: string) => regel.trim() === '';
const inspringingVan = (regel: string) => /^[ \t]*/.exec(regel)?.[0] ?? '';
const isImport = (regel: string) => /^(from\s+\S+\s+import\s|import\s)/.test(regel);
/** De regel opent een blok: hij eindigt op een dubbele punt, commentaar niet meegeteld. */
const opentBlok = (regel: string) => /:\s*$/.test(zonderCommentaar(regel));

/** Een regel zonder de inhoud van strings en zonder commentaar. */
function zonderCommentaar(regel: string): string {
  let uit = '';
  let quote = '';
  for (let i = 0; i < regel.length; i++) {
    const teken = regel[i];
    if (quote) {
      if (teken === '\\') i++;
      else if (teken === quote) quote = '';
      continue;
    }
    if (teken === '#') break;
    if (teken === '"' || teken === "'") {
      quote = teken;
      continue;
    }
    uit += teken;
  }
  return uit;
}

/**
 * Per regel hoeveel haakjes er na die regel nog open staan. Meer dan nul: de
 * volgende regel hoort nog bij dezelfde opdracht (`DCMotors(` over zes regels).
 */
function haakjesNa(regels: string[]): number[] {
  let diepte = 0;
  return regels.map((regel) => {
    for (const teken of zonderCommentaar(regel)) {
      if ('([{'.includes(teken)) diepte++;
      else if (')]}'.includes(teken)) diepte = Math.max(0, diepte - 1);
    }
    return diepte;
  });
}

/**
 * Waar de kop van het programma ophoudt: de imports en het aanmaken van de
 * onderdelen (`naam = Klasse(…)`, `motor_a = motoren.motor_a`). Een getal of
 * tekst (`teller = 0`) hoort bij wat erna komt, niet bij de kop.
 */
function kopVan(regels: string[]): { imports: number; kop: number } {
  const diepte = haakjesNa(regels);
  let imports = 0;
  let kop = 0;
  let begonnen = false;
  for (let i = 0; i < regels.length; i++) {
    const regel = regels[i];
    const vervolg = i > 0 && diepte[i - 1] > 0;
    if (vervolg) {
      if (diepte[i] === 0) kop = i + 1;
      continue;
    }
    if (isLeeg(regel)) continue;
    if (regel.startsWith('#')) {
      // Commentaar bovenaan het bestand blijft boven de imports staan.
      if (!begonnen) {
        imports = i + 1;
        kop = i + 1;
      }
      continue;
    }
    begonnen = true;
    if (isImport(regel)) {
      if (diepte[i] === 0) {
        imports = i + 1;
        kop = i + 1;
      }
      continue;
    }
    if (/^[A-Za-z_]\w*\s*=\s*[A-Za-z_][\w.]*\s*(\(|$)/.test(zonderCommentaar(regel).trimEnd())) {
      if (diepte[i] === 0) kop = i + 1;
      continue;
    }
    break;
  }
  return { imports, kop };
}

/** De eerste naam die de opzet maakt: staat die al in het programma, dan is de opzet er al. */
function naamVanOpzet(opzet: string): string | null {
  return /^([A-Za-z_]\w*)\s*=/.exec(opzet)?.[1] ?? null;
}

function heeftOpzet(regels: string[], opzet: string): boolean {
  const naam = naamVanOpzet(opzet);
  if (!naam) return false;
  const maakt = new RegExp(`^${naam}\\s*=(?!=)`);
  return regels.some((regel) => maakt.test(regel));
}

/**
 * Zet de imports erbij. Een regel `from machine import Pin` krijgt een naam
 * die ontbreekt erachter; een module die er nog niet staat, krijgt een eigen
 * regel na de laatste import. Geeft het aantal regels dat erbij kwam.
 */
function zetImports(regels: string[], imports: Import[], plek: number): number {
  let erbij = 0;
  for (const { uit, namen } of imports) {
    const van = new RegExp(`^from\\s+${uit.replace(/\./g, '\\.')}\\s+import\\s+([^#(]+)$`);
    let gevonden = -1;
    const bekend = new Set<string>();
    regels.forEach((regel, i) => {
      const m = van.exec(regel);
      if (!m) return;
      gevonden = i;
      for (const naam of m[1].split(',')) bekend.add(naam.trim().split(/\s+as\s+/)[0]);
    });
    const mist = namen.filter((naam) => !bekend.has(naam) && !bekend.has('*'));
    if (mist.length === 0) continue;
    if (gevonden !== -1) {
      regels[gevonden] = `${regels[gevonden].trimEnd()}, ${mist.join(', ')}`;
      continue;
    }
    regels.splice(plek + erbij, 0, `from ${uit} import ${mist.join(', ')}`);
    erbij++;
  }
  return erbij;
}

/**
 * Zet `bouwsteen` in `doc`, bij de regel `regel` (vanaf 0).
 */
export function voegIn(doc: string, regel: number, bouwsteen: Bouwsteen): Invoeging {
  const regels = doc.split('\n');
  const diepte = haakjesNa(regels);
  let op = Math.min(Math.max(regel, 0), regels.length - 1);

  // Midden in een opdracht over meer regels: eronder, niet ertussen.
  let eerste = op;
  while (eerste > 0 && diepte[eerste - 1] > 0) eerste--;
  while (diepte[op] > 0 && op < regels.length - 1) op++;

  let inspringing: string;
  let vervang = false;
  if (isLeeg(regels[op]) && eerste === op) {
    // Een lege regel: daar komt de code. Staat hij direct onder een regel die
    // een blok opent, dan hoort hij in dat blok, ook als de spaties ontbreken.
    vervang = true;
    inspringing = regels[op];
    let boven = op - 1;
    while (boven >= 0 && isLeeg(regels[boven])) boven--;
    if (boven >= 0 && opentBlok(regels[boven])) {
      const nodig = inspringingVan(regels[boven]) + STAP;
      if (inspringing.length < nodig.length) inspringing = nodig;
    }
  } else {
    inspringing = inspringingVan(regels[eerste]) + (opentBlok(regels[op]) ? STAP : '');
    op++;
  }

  const { imports: naImports, kop } = kopVan(regels);
  const opzet = bouwsteen.opzet && !heeftOpzet(regels, bouwsteen.opzet) ? bouwsteen.opzet : null;
  const imports = bouwsteen.imports ?? [];

  // De code staat nooit boven de imports: daar kent Python de namen nog niet.
  let verplaatst = false;
  if (op < naImports) {
    op = naImports;
    vervang = false;
    inspringing = '';
    verplaatst = true;
  }

  // 1. De code, met de inspringing van de plek.
  const code = bouwsteen.code.includes(OPEN) ? bouwsteen.code : `${bouwsteen.code}${OPEN}${DICHT}`;
  const codeRegels = code.split('\n').map((r) => inspringing + r);
  regels.splice(op, vervang ? 1 : 0, ...codeRegels);
  let codeBegin = op;

  // 2. De opzet: na de kop, maar vóór de code.
  if (opzet) {
    const plek = Math.min(kop, op);
    const nieuw = opzet.split('\n');
    if (!isLeeg(regels[plek] ?? '')) nieuw.push('');
    regels.splice(plek, 0, ...nieuw);
    codeBegin += nieuw.length;
  }

  // 3. De imports, met een witregel tussen de imports en wat eronder staat.
  const erbij = zetImports(regels, imports, naImports);
  codeBegin += erbij;
  if (erbij > 0 || opzet || verplaatst) {
    const na = kopVan(regels).imports;
    if (na > 0 && isImport(regels[na - 1]) && !isLeeg(regels[na] ?? '')) {
      regels.splice(na, 0, '');
      if (na <= codeBegin) codeBegin++;
    }
  }

  // De tekens voor de selectie eruit, en hun plek onthouden.
  let van = -1;
  let tot = -1;
  let positie = 0;
  for (let i = 0; i < regels.length; i++) {
    if (i >= codeBegin && i < codeBegin + codeRegels.length) {
      const open = regels[i].indexOf(OPEN);
      if (open !== -1 && van === -1) {
        const dicht = regels[i].indexOf(DICHT, open);
        const tekst = regels[i].slice(open + 1, dicht === -1 ? undefined : dicht);
        regels[i] =
          regels[i].slice(0, open) + tekst + (dicht === -1 ? '' : regels[i].slice(dicht + 1));
        van = positie + open;
        tot = van + tekst.length;
      }
    }
    positie += regels[i].length + 1;
  }
  const uit = regels.join('\n');
  if (van === -1) {
    van = uit.length;
    tot = uit.length;
  }
  return { doc: uit, van, tot };
}

/**
 * Het kleinste stuk van `oud` dat moet veranderen om `nieuw` te krijgen, voor
 * de editor: zo blijft de rest van het document staan zoals het stond.
 */
export function verschil(oud: string, nieuw: string): { van: number; tot: number; tekst: string } {
  let begin = 0;
  const grens = Math.min(oud.length, nieuw.length);
  while (begin < grens && oud[begin] === nieuw[begin]) begin++;
  let eind = 0;
  while (eind < grens - begin && oud[oud.length - 1 - eind] === nieuw[nieuw.length - 1 - eind])
    eind++;
  return { van: begin, tot: oud.length - eind, tekst: nieuw.slice(begin, nieuw.length - eind) };
}

/** De code van een bouwsteen zoals hij in het palet te lezen is, zonder de tekens voor de selectie. */
export function leesbaar(bouwsteen: Bouwsteen): string {
  return bouwsteen.code
    .replace(new RegExp(`[${OPEN}${DICHT}]`, 'g'), '')
    .split('\n')
    .map((r) => (isLeeg(r) ? `${r}...` : r))
    .join('\n');
}

/**
 * Een bouwsteen als heel programma, voor de controles in CI (compileren,
 * draaien tegen de bibliotheek, leaphy-api.test.ts): in een leeg bestand
 * gezet, met `pass` in elk gat en een waarde voor de voorwaarde die de
 * leerling nog invult.
 */
export function alsProgramma(bouwsteen: Bouwsteen): string {
  const { doc } = voegIn('', 0, bouwsteen);
  const regels = doc.split('\n').map((r) => (/^\s+$/.test(r) ? `${r}pass` : r));
  const vooraf = /\bvoorwaarde\b/.test(doc) ? ['voorwaarde = False'] : [];
  return `${[...vooraf, ...regels].join('\n')}\n`;
}

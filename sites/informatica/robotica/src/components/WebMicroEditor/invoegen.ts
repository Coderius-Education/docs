// Zet een bouwsteen uit het palet in het programma. Pure functies op tekst:
// de component geeft de code en de regel van de cursor, en krijgt de nieuwe
// code met de plek van de cursor terug.
//
// - De code komt op de regel van de cursor: op een lege regel op die regel
//   zelf, anders eronder. Staat de cursor op een regel die een blok opent
//   (`while True:`), dan komt de code in dat blok. Zo bouw je met klikken van
//   buiten naar binnen, zoals je blokken in elkaar schuift.
// - De import komt bij de imports bovenaan, één keer.
// - De opzet (het onderdeel aanmaken) komt in de kop, na de imports, één
//   keer: in een lus zou het bord het onderdeel bij elke ronde opnieuw
//   aanmaken.
// - De code komt nooit in de kop en nooit boven de regel die zijn eigen
//   onderdeel aanmaakt: daar bestaat de naam nog niet.

import { type Bouwsteen, type Import, STARTCODE } from './bouwstenen';

export type Invoeging = {
  doc: string;
  /** Begin en eind van de selectie in `doc`; gelijk voor een kale cursor. */
  van: number;
  tot: number;
  /** Een pin die al in het programma staat, als zin voor de leerling. */
  melding: string | null;
};

/** De regels van een selectie over meer dan één plek, vanaf 0. */
export type Selectie = { van: number; tot: number };

const OPEN = '⟦';
const DICHT = '⟧';
const TEKENS = new RegExp(`[${OPEN}${DICHT}]`, 'g');
/** Zo springen de bouwstenen in bouwstenen.ts in; `eenheidVan` zet het om. */
const STAP = '    ';

const isLeeg = (regel: string) => regel.trim() === '';
const inspringingVan = (regel: string) => /^[ \t]*/.exec(regel)?.[0] ?? '';
const isImport = (regel: string) => /^(from\s+\S+\s+import\s|import\s)/.test(regel);
/** De regel opent een blok: hij eindigt op een dubbele punt, commentaar niet meegeteld. */
export const opentBlok = (regel: string) => /:\s*$/.test(zonderCommentaar(regel));

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
 * Per regel of de opdracht op de volgende regel doorloopt: er staat nog een
 * haakje open (`DCMotors(` over zes regels), een tekst tussen drie
 * aanhalingstekens is nog niet dicht, of de regel eindigt op een backslash.
 */
function looptDoor(regels: string[]): boolean[] {
  let diepte = 0;
  let drie = '';
  return regels.map((regel) => {
    let i = 0;
    let commentaar = false;
    while (i < regel.length) {
      if (drie) {
        const eind = regel.indexOf(drie, i);
        if (eind === -1) break;
        i = eind + 3;
        drie = '';
        continue;
      }
      const teken = regel[i];
      if (teken === '#') {
        commentaar = true;
        break;
      }
      if (teken === '"' || teken === "'") {
        if (regel.startsWith(teken.repeat(3), i)) {
          drie = teken.repeat(3);
          i += 3;
          continue;
        }
        i++;
        while (i < regel.length && regel[i] !== teken) i += regel[i] === '\\' ? 2 : 1;
        i++;
        continue;
      }
      if ('([{'.includes(teken)) diepte++;
      else if (')]}'.includes(teken)) diepte = Math.max(0, diepte - 1);
      i++;
    }
    const backslash = !drie && !commentaar && /\\\s*$/.test(regel);
    return diepte > 0 || drie !== '' || backslash;
  });
}

/**
 * Waarmee dit programma een blok inspringt: het verschil tussen een regel die
 * een blok opent en de regel eronder. Vier spaties als er nog geen blok is.
 */
function eenheidVan(regels: string[], door: boolean[]): string {
  for (let i = 0; i < regels.length - 1; i++) {
    if (isLeeg(regels[i]) || door[i] || !opentBlok(regels[i])) continue;
    const volgende = regels.slice(i + 1).find((r) => !isLeeg(r));
    if (volgende === undefined) break;
    const buiten = inspringingVan(regels[i]);
    const binnen = inspringingVan(volgende);
    if (binnen.length > buiten.length && binnen.startsWith(buiten))
      return binnen.slice(buiten.length);
  }
  return STAP;
}

/**
 * Waar de kop van het programma ophoudt: de imports en het aanmaken van de
 * onderdelen (`naam = Klasse(…)`, `motor_a = motoren.motor_a`). Een getal of
 * tekst (`teller = 0`) en een meting (`afstand = tof.get_distance()`) horen
 * bij wat erna komt, niet bij de kop.
 */
function kopVan(regels: string[], door: boolean[]): { imports: number; kop: number } {
  let imports = 0;
  let kop = 0;
  let begonnen = false;
  let inImport = false;
  for (let i = 0; i < regels.length; i++) {
    const regel = regels[i];
    if (i > 0 && door[i - 1]) {
      if (!door[i]) {
        kop = i + 1;
        if (inImport) imports = i + 1;
      }
      continue;
    }
    inImport = false;
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
      inImport = true;
      if (!door[i]) {
        imports = i + 1;
        kop = i + 1;
      }
      continue;
    }
    const kaal = zonderCommentaar(regel).trimEnd();
    const maaktOnderdeel =
      /^[A-Za-z_]\w*\s*=\s*[A-Z]\w*\(/.test(kaal) ||
      /^[A-Za-z_]\w*\s*=\s*[a-z_]\w*\.[a-z_]\w*$/.test(kaal);
    if (!maaktOnderdeel) break;
    if (!door[i]) kop = i + 1;
  }
  return { imports, kop };
}

/** De opdrachten van een opzet, elk met de naam die hij maakt. */
function opdrachtenVan(opzet: string): { naam: string; regels: string[] }[] {
  const regels = opzet.split('\n');
  const door = looptDoor(regels);
  const uit: { naam: string; regels: string[] }[] = [];
  let huidig: string[] = [];
  regels.forEach((regel, i) => {
    huidig.push(regel);
    if (door[i]) return;
    uit.push({ naam: /^([A-Za-z_]\w*)\s*=/.exec(huidig[0])?.[1] ?? '', regels: huidig });
    huidig = [];
  });
  return uit;
}

/** De regel (op het hoogste niveau) die `naam` maakt, of -1. */
function maakt(regels: string[], naam: string): number {
  const patroon = new RegExp(`^${naam}\\s*=(?!=)`);
  return regels.findIndex((regel) => patroon.test(regel));
}

/** Het eind van de opdracht die op `regel` begint: de regel na het laatste haakje. */
function eindVan(door: boolean[], regel: number): number {
  let i = regel;
  while (door[i] && i < door.length - 1) i++;
  return i + 1;
}

/**
 * Zet de imports erbij. Een regel `from machine import Pin` krijgt een naam
 * die ontbreekt erachter; een module die er nog niet staat, krijgt een eigen
 * regel na de laatste import. Geeft het aantal regels dat erbij kwam.
 */
function zetImports(regels: string[], imports: Import[], plek: number): number {
  let erbij = 0;
  for (const { uit, namen } of imports) {
    const van = new RegExp(`^from\\s+${uit.replace(/\./g, '\\.')}\\s+import\\s+([^#(;\\\\]+)$`);
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
 * De inspringing die een blok hier minstens heeft: een regel onder een
 * `while True:` die niet in die lus staat, draait nooit.
 */
function vloer(regels: string[], op: number, eenheid: string): string {
  let grens = Number.POSITIVE_INFINITY;
  for (let i = op - 1; i >= 0 && grens > 0; i--) {
    if (isLeeg(regels[i])) continue;
    const in_ = inspringingVan(regels[i]);
    if (in_.length >= grens) continue;
    grens = in_.length;
    if (/^\s*while\s+True\s*:/.test(regels[i])) return in_ + eenheid;
  }
  return '';
}

/** De inspringing van code op een lege regel: tussen wat erboven en eronder staat. */
function inspringingOpLeeg(regels: string[], door: boolean[], op: number, eenheid: string): string {
  let boven = op - 1;
  while (boven >= 0 && isLeeg(regels[boven])) boven--;
  if (boven < 0) return '';
  // Direct onder een regel die een blok opent, hoort de code in dat blok: dat
  // is het gat. Een lege regel verder is de regel ná het blok.
  if (boven === op - 1 && opentBlok(regels[boven]) && !door[boven])
    return inspringingVan(regels[boven]) + eenheid;
  let begin = boven;
  while (begin > 0 && door[begin - 1]) begin--;
  const hoogstens = inspringingVan(regels[begin]);
  const onder = regels.slice(op + 1).find((r) => !isLeeg(r));
  const minstens = onder === undefined ? vloer(regels, op, eenheid) : inspringingVan(onder);
  const eigen = regels[op];
  if (eigen.length < minstens.length) return minstens;
  if (eigen.length > hoogstens.length)
    return hoogstens.length < minstens.length ? minstens : hoogstens;
  return eigen;
}

/** De eerste lege regel in de code van een bouwsteen: het gat waar zijn inhoud komt. */
function gatIn(codeRegels: string[]): number {
  return codeRegels.findIndex((r) => /^\s+/.test(r) && r.replace(TEKENS, '').trim() === '');
}

/** Geef de namen die een bouwsteen zelf maakt (`teller`) een eigen naam als ze al bestaan. */
function metEigenNamen(code: string, namen: string[], regels: string[]): string {
  let uit = code;
  for (const naam of namen) {
    const bezet = (n: string) => regels.some((r) => new RegExp(`^\\s*${n}\\s*=(?!=)`).test(r));
    if (!bezet(naam)) continue;
    let nummer = 2;
    while (bezet(`${naam}_${nummer}`)) nummer++;
    uit = uit.replace(new RegExp(`\\b${naam}\\b`, 'g'), `${naam}_${nummer}`);
  }
  return uit;
}

// D14 tot en met D21 zijn dezelfde pinnen als A0 tot en met A7.
const zelfdePin = (pin: string) => {
  const d = /^D(1[4-9]|2[01])$/.exec(pin);
  return d ? `A${Number(d[1]) - 14}` : pin;
};
const PIN = /(["'])(D\d{1,2}|A[0-7])\1/g;

/**
 * De pinnen van `bouwsteen` die al op een andere regel van het programma
 * staan, bij een ander onderdeel. Als zin voor de leerling, of null.
 */
export function pinMelding(doc: string, bouwsteen: Bouwsteen): string | null {
  const eigen = `${bouwsteen.opzet ?? ''}\n${bouwsteen.code}`;
  const pinnen = [...new Set([...eigen.matchAll(PIN)].map((m) => m[2]))];
  if (pinnen.length === 0) return null;
  const namen = opdrachtenVan(bouwsteen.opzet ?? '')
    .map((o) => o.naam)
    .filter(Boolean);
  // Zonder opzet (de servo, de ultrasone sensor): de functie die de pin krijgt.
  const functie = bouwsteen.opzet
    ? null
    : (/([A-Za-z_]\w*)\(\s*["']/.exec(bouwsteen.code)?.[1] ?? null);
  const vanDitOnderdeel = (regel: string) =>
    namen.some((naam) => new RegExp(`^\\s*${naam}\\s*=`).test(regel)) ||
    (functie !== null && regel.includes(`${functie}(`));

  const bezet: string[] = [];
  doc.split('\n').forEach((regel, i) => {
    if (vanDitOnderdeel(regel)) return;
    const zonder = regel.replace(/#.*$/, '');
    for (const m of zonder.matchAll(PIN)) {
      const pin = pinnen.find((p) => zelfdePin(p) === zelfdePin(m[2]));
      if (!pin || bezet.some((b) => b.startsWith(`${pin} `))) continue;
      bezet.push(
        pin === m[2] ? `${pin} staat al op regel ${i + 1}` : `${pin} is ${m[2]} op regel ${i + 1}`,
      );
    }
  });
  if (bezet.length === 0) return null;
  return `Pin ${bezet.join(', en pin ')}. Sluit dit onderdeel op een andere pin aan en zet die pin in je code.`;
}

/**
 * Zet `bouwsteen` in `doc`, bij de regel `regel` (vanaf 0). Met een selectie
 * over hele regels en een bouwsteen met een gat (een lus, een als) komen die
 * regels in het gat.
 */
export function voegIn(
  doc: string,
  regel: number,
  bouwsteen: Bouwsteen,
  selectie?: Selectie,
): Invoeging {
  // De startcode is een voorbeeld, geen werk van de leerling: de eerste
  // bouwsteen begint een nieuw programma.
  const begin = doc === STARTCODE ? '' : doc;
  const regels = begin.split('\n');
  const door = looptDoor(regels);
  const eenheid = eenheidVan(regels, door);
  const laatste = regels.length - 1;
  const binnen = (n: number) => (Number.isFinite(n) ? Math.min(Math.max(n, 0), laatste) : laatste);
  const { imports: naImports, kop } = kopVan(regels, door);

  const opdrachten = bouwsteen.opzet ? opdrachtenVan(bouwsteen.opzet) : [];
  const ontbreekt = opdrachten.filter((o) => o.naam === '' || maakt(regels, o.naam) === -1);
  // Na de laatste regel die een naam van dit onderdeel maakt.
  const naEigen = opdrachten.reduce((na, o) => {
    const plek = o.naam === '' ? -1 : maakt(regels, o.naam);
    return plek === -1 ? na : Math.max(na, eindVan(door, plek));
  }, 0);
  const ondergrens = Math.max(kop, naEigen);

  const eigenNamen = metEigenNamen(bouwsteen.code, bouwsteen.namen ?? [], regels);
  const metTeken = eigenNamen.includes(OPEN) ? eigenNamen : `${eigenNamen}${OPEN}${DICHT}`;
  const inEenheid = (r: string) =>
    r.replace(/^( {4})+/, (spaties) => eenheid.repeat(spaties.length / STAP.length));
  let codeRegels = metTeken.split('\n').map(inEenheid);
  const gat = gatIn(codeRegels);

  let op = binnen(regel);
  let inspringing = '';
  let weg = 0;
  let alsAlinea = false;

  // De selectie in het gat: alleen hele opdrachten onder de kop.
  let omvat: { van: number; tot: number } | null = null;
  if (selectie && gat !== -1) {
    let van = binnen(Math.min(selectie.van, selectie.tot));
    let tot = binnen(Math.max(selectie.van, selectie.tot));
    while (van > 0 && door[van - 1]) van--;
    while (door[tot] && tot < laatste) tot++;
    while (van < tot && isLeeg(regels[van])) van++;
    while (tot > van && isLeeg(regels[tot])) tot--;
    if (!isLeeg(regels[van]) && van >= ondergrens) omvat = { van, tot };
  }

  if (omvat) {
    const stuk = regels.slice(omvat.van, omvat.tot + 1);
    inspringing = stuk
      .filter((r) => !isLeeg(r))
      .map(inspringingVan)
      .reduce((kort, i) => (i.length < kort.length ? i : kort));
    const inhoud = stuk.map((r) => (isLeeg(r) ? '' : eenheid + r.slice(inspringing.length)));
    // De cursor achter de inhoud, tenzij de bouwsteen zelf iets selecteert.
    const zelf = codeRegels.some((r, i) => i !== gat && r.includes(OPEN));
    if (!zelf) inhoud[inhoud.length - 1] += `${OPEN}${DICHT}`;
    codeRegels = [...codeRegels.slice(0, gat), ...inhoud, ...codeRegels.slice(gat + 1)];
    op = omvat.van;
    weg = stuk.length;
  } else {
    // Midden in een opdracht over meer regels: eronder, niet ertussen.
    let eerste = op;
    while (eerste > 0 && door[eerste - 1]) eerste--;
    while (door[op] && op < laatste) op++;

    if (op < ondergrens) {
      // In de kop, of boven de regel die het onderdeel aanmaakt: eronder,
      // als eigen alinea.
      op = ondergrens;
      alsAlinea = true;
    } else if (isLeeg(regels[op]) && eerste === op) {
      inspringing = inspringingOpLeeg(regels, door, op, eenheid);
      weg = 1;
    } else {
      const blok = opentBlok(regels[op]);
      inspringing = inspringingVan(regels[eerste]) + (blok ? eenheid : '');
      // Staat onder de regel die het blok opent nog het lege gat, dan komt
      // de code daarin, en schuift het gat niet mee naar beneden.
      const onder = regels[op + 1];
      const daarna = regels.slice(op + 2).find((r) => !isLeeg(r));
      const leegBlok =
        daarna === undefined ||
        inspringingVan(daarna).length <= inspringingVan(regels[eerste]).length;
      op++;
      if (blok && onder !== undefined && isLeeg(onder) && leegBlok) weg = 1;
    }
  }

  // 1. De code, met de inspringing van de plek.
  const nieuw = codeRegels.map((r) => inspringing + r);
  let voor = 0;
  if (alsAlinea) {
    if (regels[op] !== undefined && isLeeg(regels[op])) op++;
    else if (op > 0 && !isLeeg(regels[op - 1])) voor = 1;
    const erna = regels[op];
    regels.splice(op, 0, ...(voor ? [''] : []), ...nieuw, ...(erna && !isLeeg(erna) ? [''] : []));
  } else {
    regels.splice(op, weg, ...nieuw);
  }
  let codeBegin = op + voor;

  // Onder een blok dat ergens op kan volgen, staat een regel om verder te
  // gaan: zonder die regel kom je met klikken het blok niet meer uit.
  const isBlok = gat !== -1 && !/^\s*while\s+True\s*:/.test(codeRegels[0]);
  if (isBlok) {
    const naBlok = codeBegin + nieuw.length;
    const direct = regels[naBlok];
    const volgende = regels.slice(naBlok).find((r) => !isLeeg(r));
    const dieper = volgende !== undefined && inspringingVan(volgende).length >= inspringing.length;
    if (!dieper && direct !== inspringing) regels.splice(naBlok, 0, inspringing);
  }

  // 2. Wat er van de opzet nog ontbreekt: in de kop, na wat er al van staat.
  if (ontbreekt.length > 0) {
    const plek = Math.max(kop, naEigen);
    const erbij = ontbreekt.flatMap((o) => o.regels);
    // Twee onderdelen van één regel staan onder elkaar, zoals in de lessen.
    // Loopt een van de twee over meer regels (`DCMotors(` tot `)`), dan komt
    // er een witregel tussen: anders lees je ze als één blok.
    const ervoor = regels[plek - 1] ?? '';
    const overMeerRegels = erbij.length > 1 || (plek >= 2 && door[plek - 2]);
    const hoortErbij = naEigen === plek && naEigen > 0;
    if (
      overMeerRegels &&
      !hoortErbij &&
      !isLeeg(ervoor) &&
      !isImport(ervoor) &&
      !ervoor.startsWith('#')
    )
      erbij.unshift('');
    if (!isLeeg(regels[plek] ?? '')) erbij.push('');
    regels.splice(plek, 0, ...erbij);
    codeBegin += erbij.length;
  }

  // 3. De imports, met een witregel tussen de imports en wat eronder staat.
  const meer = zetImports(regels, bouwsteen.imports ?? [], naImports);
  codeBegin += meer;
  if (meer > 0 || ontbreekt.length > 0 || alsAlinea) {
    const na = kopVan(regels, looptDoor(regels)).imports;
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
    if (i >= codeBegin && i < codeBegin + nieuw.length) {
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
  return { doc: uit, van, tot, melding: pinMelding(uit, bouwsteen) };
}

/**
 * Een stuk van `oud` dat vervangen moet worden om `nieuw` te krijgen: van de
 * eerste tot de laatste wijziging. Wat ervoor en erna staat, raakt de editor
 * niet aan.
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
    .replace(TEKENS, '')
    .split('\n')
    .map((r) => (isLeeg(r) ? `${r}...` : r))
    .join('\n');
}

/** Wat een bouwsteen bovenaan het programma zet: zijn imports en zijn opzet. */
export function bovenaan(bouwsteen: Bouwsteen): string {
  return [
    ...(bouwsteen.imports ?? []).map((i) => `from ${i.uit} import ${i.namen.join(', ')}`),
    ...(bouwsteen.opzet ? [bouwsteen.opzet] : []),
  ].join('\n');
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
  return `${[...vooraf, ...regels].join('\n').replace(/\n+$/, '')}\n`;
}

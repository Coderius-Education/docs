// De tekening van de turtle uit de speeltuin (zie turtle/module.ts), als pure
// functies: welke vormen er na de eerste `tot` gebeurtenissen op het doek
// staan, waar elke schildpad dan is, en welk stuk van het vlak je moet tonen.
// De component Tekening zet dat alleen nog om in SVG.

export type Gebeurtenis =
  | { t: 'nieuw'; id: number; vorm: string; zichtbaar: boolean }
  | { t: 'ga'; id: number; x: number; y: number; pen: boolean; kleur: string; dikte: number }
  | { t: 'draai'; id: number; hoek: number }
  | {
      t: 'vul';
      id: number;
      punten: [number, number][];
      kleur?: string;
      zichtbaarVanaf?: number;
    }
  | { t: 'stip'; id: number; x: number; y: number; grootte: number; kleur: string }
  | {
      t: 'tekst';
      id: number;
      x: number;
      y: number;
      tekst: string;
      uitlijning: string;
      grootte: number;
      kleur: string;
    }
  | { t: 'zichtbaar'; id: number; aan: boolean }
  | { t: 'vorm'; id: number; vorm: string }
  | { t: 'achtergrond'; kleur: string }
  | { t: 'wis'; id?: number };

export interface Tekening {
  gebeurtenissen: Gebeurtenis[];
  /** True als de code speed(0) of tracer(0) gebruikte: dan meteen het eindbeeld. */
  direct: boolean;
}

export type Vorm =
  | {
      soort: 'lijn';
      id: number;
      x1: number;
      y1: number;
      x2: number;
      y2: number;
      kleur: string;
      dikte: number;
    }
  | { soort: 'vul'; id: number; punten: [number, number][]; kleur: string }
  | { soort: 'stip'; id: number; x: number; y: number; grootte: number; kleur: string }
  | {
      soort: 'tekst';
      id: number;
      x: number;
      y: number;
      tekst: string;
      uitlijning: string;
      grootte: number;
      kleur: string;
    };

export interface Schildpad {
  id: number;
  x: number;
  y: number;
  hoek: number;
  zichtbaar: boolean;
  vorm: string;
  kleur: string;
}

export interface Stand {
  vormen: Vorm[];
  schildpadden: Schildpad[];
  achtergrond: string;
}

/** Wat er op het doek staat na de eerste `tot` gebeurtenissen. */
export function speelAf(gebeurtenissen: Gebeurtenis[], tot = gebeurtenissen.length): Stand {
  let vormen: Vorm[] = [];
  const schildpadden = new Map<number, Schildpad>();
  let achtergrond = 'white';
  const grens = Math.min(tot, gebeurtenissen.length);

  for (let i = 0; i < grens; i++) {
    const g = gebeurtenissen[i];
    switch (g.t) {
      case 'nieuw':
        schildpadden.set(g.id, {
          id: g.id,
          x: 0,
          y: 0,
          hoek: 0,
          zichtbaar: g.zichtbaar,
          vorm: g.vorm,
          kleur: 'black',
        });
        break;
      case 'ga': {
        const s = schildpadden.get(g.id);
        if (!s) break;
        if (g.pen) {
          vormen.push({
            soort: 'lijn',
            id: g.id,
            x1: s.x,
            y1: s.y,
            x2: g.x,
            y2: g.y,
            kleur: g.kleur,
            dikte: g.dikte,
          });
        }
        s.x = g.x;
        s.y = g.y;
        s.kleur = g.kleur;
        break;
      }
      case 'draai': {
        const s = schildpadden.get(g.id);
        if (s) s.hoek = g.hoek;
        break;
      }
      case 'vul':
        // Een vulling staat op de plek van begin_fill, onder de lijnen die
        // daarna komen, maar verschijnt pas zodra end_fill geweest is.
        if (g.kleur !== undefined && g.zichtbaarVanaf !== undefined && g.zichtbaarVanaf <= tot) {
          vormen.push({ soort: 'vul', id: g.id, punten: g.punten, kleur: g.kleur });
        }
        break;
      case 'stip':
        vormen.push({
          soort: 'stip',
          id: g.id,
          x: g.x,
          y: g.y,
          grootte: g.grootte,
          kleur: g.kleur,
        });
        break;
      case 'tekst':
        vormen.push({
          soort: 'tekst',
          id: g.id,
          x: g.x,
          y: g.y,
          tekst: g.tekst,
          uitlijning: g.uitlijning,
          grootte: g.grootte,
          kleur: g.kleur,
        });
        break;
      case 'zichtbaar': {
        const s = schildpadden.get(g.id);
        if (s) s.zichtbaar = g.aan;
        break;
      }
      case 'vorm': {
        const s = schildpadden.get(g.id);
        if (s) s.vorm = g.vorm;
        break;
      }
      case 'achtergrond':
        achtergrond = g.kleur;
        break;
      case 'wis':
        vormen = g.id === undefined ? [] : vormen.filter((v) => v.id !== g.id);
        break;
    }
  }

  // Array.from, geen spread van de iterator: de Babel van Docusaurus maakt
  // daar [].concat(iterator) van, en dan was er geen enkele schildpad.
  return { vormen, schildpadden: Array.from(schildpadden.values()), achtergrond };
}

export interface Kader {
  x: number;
  y: number;
  breedte: number;
  hoogte: number;
}

// Zo groot is het doek minstens, net als het venster van de echte turtle
// ongeveer: een klein vierkantje staat dan niet opgeblazen in beeld.
const MIN_HALVE_BREEDTE = 250;
const MIN_HALVE_HOOGTE = 200;
const MARGE = 20;

/**
 * Het stuk van het vlak dat je toont, in SVG-coördinaten (y naar beneden).
 * Gemeten over de hele tekening, niet over een stand: zo blijft het beeld
 * stilstaan terwijl de tekening groeit.
 */
export function kader(gebeurtenissen: Gebeurtenis[]): Kader {
  let links = -MIN_HALVE_BREEDTE;
  let rechts = MIN_HALVE_BREEDTE;
  let onder = -MIN_HALVE_HOOGTE;
  let boven = MIN_HALVE_HOOGTE;
  const neem = (x: number, y: number, rand = MARGE) => {
    links = Math.min(links, x - rand);
    rechts = Math.max(rechts, x + rand);
    onder = Math.min(onder, y - rand);
    boven = Math.max(boven, y + rand);
  };
  for (const g of gebeurtenissen) {
    if (g.t === 'ga' || g.t === 'tekst') neem(g.x, g.y);
    else if (g.t === 'stip') neem(g.x, g.y, g.grootte / 2 + MARGE);
    else if (g.t === 'vul') for (const [x, y] of g.punten) neem(x, y);
  }
  return { x: links, y: -boven, breedte: rechts - links, hoogte: boven - onder };
}

/**
 * Hoe lang het afspelen duurt: kort genoeg om niet te wachten, lang genoeg om
 * de schildpad te zien lopen. Met speed(0) of tracer(0) meteen het eindbeeld.
 */
export function afspeelduur(tekening: Tekening): number {
  if (tekening.direct) return 0;
  const bewegingen = tekening.gebeurtenissen.filter((g) => g.t === 'ga' || g.t === 'draai').length;
  return Math.min(4000, bewegingen * 25);
}

// De vormen van de schildpad, met de punt naar rechts (richting 0). De
// "turtle" is die van CPython, een kwartslag gedraaid.
const PIJL: [number, number][] = [
  [0, 0],
  [-9, 5],
  [-7, 0],
  [-9, -5],
];
const SCHILDPAD: [number, number][] = [
  [16, 0],
  [14, 2],
  [10, 1],
  [7, 4],
  [9, 7],
  [8, 9],
  [5, 6],
  [1, 7],
  [-3, 5],
  [-6, 8],
  [-8, 6],
  [-5, 4],
  [-7, 0],
  [-5, -4],
  [-8, -6],
  [-6, -8],
  [-3, -5],
  [1, -7],
  [5, -6],
  [8, -9],
  [9, -7],
  [7, -4],
  [10, -1],
  [14, -2],
];

/** De omtrek van een schildpad in SVG-coördinaten, als "x,y x,y …". */
export function schildpadPunten(s: Schildpad): string {
  const vorm = s.vorm === 'turtle' ? SCHILDPAD : PIJL;
  const r = (s.hoek * Math.PI) / 180;
  const c = Math.cos(r);
  const z = Math.sin(r);
  return vorm
    .map(([x, y]) => {
      const wx = s.x + x * c - y * z;
      const wy = s.y + x * z + y * c;
      return `${round(wx)},${round(-wy)}`;
    })
    .join(' ');
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}

const ANKER: Record<string, string> = { left: 'start', center: 'middle', right: 'end' };

function attr(waarde: string | number): string {
  return String(waarde)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * De stand als SVG-tekst. De speeltuin toont dit, en de doelplaatjes in de
 * projecten zijn er ook mee gemaakt: zo ziet een leerling in de les precies
 * wat de speeltuin straks tekent. Kleuren en tekst komen uit de code van de
 * leerling en worden dus ontsnapt.
 */
export function naarSvg(
  tekening: Tekening,
  tot = tekening.gebeurtenissen.length,
  titel = 'Tekening van de turtle',
): string {
  const stand = speelAf(tekening.gebeurtenissen, tot);
  const k = kader(tekening.gebeurtenissen);
  const delen: string[] = [
    `<rect x="${k.x}" y="${k.y}" width="${k.breedte}" height="${k.hoogte}" fill="${attr(stand.achtergrond)}"/>`,
  ];
  for (const v of stand.vormen) {
    if (v.soort === 'lijn') {
      delen.push(
        `<line x1="${v.x1}" y1="${round(-v.y1)}" x2="${v.x2}" y2="${round(-v.y2)}" stroke="${attr(v.kleur)}" stroke-width="${v.dikte}" stroke-linecap="round"/>`,
      );
    } else if (v.soort === 'vul') {
      const punten = v.punten.map(([x, y]) => `${x},${round(-y)}`).join(' ');
      delen.push(`<polygon points="${punten}" fill="${attr(v.kleur)}" fill-rule="evenodd"/>`);
    } else if (v.soort === 'stip') {
      delen.push(
        `<circle cx="${v.x}" cy="${round(-v.y)}" r="${v.grootte / 2}" fill="${attr(v.kleur)}"/>`,
      );
    } else {
      delen.push(
        `<text x="${v.x}" y="${round(-v.y)}" fill="${attr(v.kleur)}" font-size="${round(v.grootte * 1.33)}" font-family="Arial, sans-serif" text-anchor="${ANKER[v.uitlijning] ?? 'start'}">${attr(v.tekst)}</text>`,
      );
    }
  }
  for (const s of stand.schildpadden) {
    if (!s.zichtbaar) continue;
    delen.push(
      `<polygon points="${schildpadPunten(s)}" fill="${attr(s.kleur)}" stroke="${attr(s.kleur)}" stroke-width="1"/>`,
    );
  }
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${k.x} ${k.y} ${k.breedte} ${k.hoogte}" role="img">`,
    `<title>${attr(titel)}</title>`,
    ...delen,
    '</svg>',
    '',
  ].join('\n');
}

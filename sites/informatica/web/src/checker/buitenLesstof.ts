import { MAX_PLEKKEN, blanco, plekkenIn, regelBegins } from '@coderius/checker/plekken';
import type { ProjectFiles, Vondst } from '@coderius/checker/types';

// Wat een project gebruikt dat de lessen niet behandelen. De nakijker scoort
// alleen de concepten uit curriculum.ts; een <canvas>, een @keyframes of een
// fetch() valt daar buiten en bleef dus onzichtbaar. Voor het mondeling is dat
// juist de interessantste groep: wie het zelf heeft uitgezocht kan het
// uitleggen, en wie het heeft overgenomen merkt dat bij de eerste vraag.
//
// Werkwijze: constructiesIn() herkent een vaste woordenschat (alle HTML-tags
// en -attributen, CSS-eigenschappen, -selectoren, -at-regels en -waarden, en
// een lijst JavaScript-constructies). lesstof.json is precies wat daarvan in
// de code van de lessen en de cheatsheet staat; lesstof.test.ts rekent dat
// na. Alles wat een project gebruikt en niet in lesstof.json staat, is een
// vondst. Een nieuwe les die iets introduceert, haalt het zo vanzelf van de
// lijst.

export type Soort = 'html' | 'css' | 'js';

export interface Stuk {
  soort: Soort;
  tekst: string;
  /** Waar het stuk in het bestand begint, voor de regelnummers (standaard 0). */
  begin?: number;
}

export const GROEPEN = [
  'HTML-elementen',
  'HTML-attributen',
  'CSS-eigenschappen',
  'CSS-selectoren',
  'CSS-at-regels',
  'CSS-waarden',
  'JavaScript',
] as const;

export type Groep = (typeof GROEPEN)[number];

/** Sleutel van een constructie: groep en label, zoals in lesstof.json. */
export const sleutel = (groep: string, label: string) => `${groep}|${label}`;

/** Per constructie hoe vaak hij voorkomt, en waar (posities in het bestand). */
export type Telling = Map<string, { n: number; posities: number[] }>;

function tel(t: Telling, groep: Groep, label: string, positie: number): void {
  const k = sleutel(groep, label);
  const huidig = t.get(k);
  if (huidig) {
    huidig.n++;
    huidig.posities.push(positie);
  } else {
    t.set(k, { n: 1, posities: [positie] });
  }
}

// Alles wat we wegpoetsen (commentaar, tekst tussen aanhalingstekens) wordt
// spaties van dezelfde lengte, met de regeleinden erin. Zo blijft elke
// positie gelijk aan die in het bestand, en klopt het regelnummer.
const tussenQuotes = (m: string) => `${m[0]}${blanco(m.slice(1, -1))}${m[m.length - 1]}`;

// --- HTML ------------------------------------------------------------------

// Een attribuutwaarde tussen aanhalingstekens mag < en > bevatten
// (onclick="lijst.forEach(x => tel(x))"); die sluit de tag niet af.
const TAG = /<([a-zA-Z][a-zA-Z0-9-]*)((?:\s+(?:"[^"]*"|'[^']*'|[^\s"'<>/]|\/(?!>))+)*)\s*\/?>/g;
const ATTRIBUUT = /([^\s"'=<>/]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|[^\s"'>]+))?/g;

function attribuutLabel(naam: string): string {
  const n = naam.toLowerCase();
  if (n.startsWith('data-')) return 'data-*';
  if (n.startsWith('aria-')) return 'aria-*';
  return n;
}

/**
 * Splitst een HTML-bestand in stukken: de opmaak zelf, de inhoud van elk
 * `<style>` en `style="…"` als CSS, en die van elk `<script>` en elk
 * `on…="…"` als JavaScript. Zo telt CSS in een `<style>`-blok net zo goed mee
 * als CSS in een los bestand.
 */
export function splitsHtml(html: string, begin = 0): Stuk[] {
  const stukken: Stuk[] = [];
  let rest = html.replace(/<!--[\s\S]*?-->/g, blanco);
  rest = rest.replace(
    /(<style\b[^>]*>)([\s\S]*?)(<\/style\s*>)/gi,
    (_m, open: string, css: string, dicht: string, plek: number) => {
      stukken.push({ soort: 'css', tekst: css, begin: begin + plek + open.length });
      return open + blanco(css) + dicht;
    },
  );
  rest = rest.replace(
    /(<script\b[^>]*>)([\s\S]*?)(<\/script\s*>)/gi,
    (_m, open: string, js: string, dicht: string, plek: number) => {
      stukken.push({ soort: 'js', tekst: js, begin: begin + plek + open.length });
      return open + blanco(js) + dicht;
    },
  );
  for (const tag of rest.matchAll(TAG)) {
    const attrBegin = (tag.index ?? 0) + 1 + tag[1].length;
    for (const a of (tag[2] ?? '').matchAll(ATTRIBUUT)) {
      const naam = a[1].toLowerCase();
      const waarde = a[2] ?? a[3];
      if (waarde === undefined) continue;
      const waardeBegin = begin + attrBegin + (a.index ?? 0) + a[0].search(/["']/) + 1;
      if (naam === 'style') {
        // Een declaratieblok zonder selector; de 'x{' ervoor valt precies
        // vóór de waarde, zodat de posities kloppen.
        stukken.push({ soort: 'css', tekst: `x{${waarde}}`, begin: waardeBegin - 2 });
      } else if (naam.startsWith('on')) {
        stukken.push({ soort: 'js', tekst: waarde, begin: waardeBegin });
      }
    }
  }
  stukken.push({ soort: 'html', tekst: rest, begin });
  return stukken;
}

function htmlConstructies(html: string, begin: number, t: Telling): void {
  for (const tag of html.matchAll(TAG)) {
    const plek = begin + (tag.index ?? 0);
    tel(t, 'HTML-elementen', `<${tag[1].toLowerCase()}>`, plek);
    for (const a of (tag[2] ?? '').matchAll(ATTRIBUUT)) {
      // Kapotte HTML (aanhalingstekens door elkaar) levert brokken op die
      // geen attribuutnaam zijn; die tellen niet.
      if (/^[a-zA-Z][\w:-]*$/.test(a[1])) tel(t, 'HTML-attributen', attribuutLabel(a[1]), plek);
    }
  }
}

// --- CSS -------------------------------------------------------------------

function selectorConstructies(selector: string, begin: number, t: Telling): void {
  let s = selector.replace(/"[^"]*"|'[^']*'/g, tussenQuotes);
  for (const m of s.matchAll(/\[[^\]]*\]/g))
    tel(t, 'CSS-selectoren', '[attribuut]', begin + (m.index ?? 0));
  s = s.replace(/\[[^\]]*\]/g, blanco);
  for (const p of s.matchAll(/(::?)([a-zA-Z-]+)(\()?/g)) {
    tel(
      t,
      'CSS-selectoren',
      `${p[1]}${p[2].toLowerCase()}${p[3] ? '()' : ''}`,
      begin + (p.index ?? 0),
    );
  }
  // Haakjes van :nth-child(2n + 1) zijn geen combinators.
  s = s.replace(/\([^)]*\)/g, blanco);
  const combinators: [RegExp, string][] = [
    [/>/g, 'a > b'],
    [/\+/g, 'a + b'],
    [/~/g, 'a ~ b'],
    [/\*/g, '*'],
    [/&/g, '&'],
  ];
  for (const [re, label] of combinators) {
    for (const m of s.matchAll(re)) tel(t, 'CSS-selectoren', label, begin + (m.index ?? 0));
  }
}

function waardeConstructies(waarde: string, begin: number, t: Telling): void {
  const v = waarde
    .replace(/"[^"]*"|'[^']*'/g, tussenQuotes)
    .replace(/#[0-9a-fA-F]{3,8}\b/g, blanco);
  for (const f of v.matchAll(/(?<![\w-])([a-zA-Z-]+)\(/g)) {
    tel(t, 'CSS-waarden', `${f[1].toLowerCase()}()`, begin + (f.index ?? 0));
  }
  for (const e of v.matchAll(/(?<![\w.-])-?(?:\d+\.?\d*|\.\d+)([a-zA-Z]+|%)/g)) {
    tel(t, 'CSS-waarden', e[1].toLowerCase(), begin + (e.index ?? 0));
  }
  const belangrijk = /!\s*important/i.exec(v);
  if (belangrijk) tel(t, 'CSS-waarden', '!important', begin + belangrijk.index);
}

/** Een stuk tekst zonder witruimte eromheen, met de positie waar het begint. */
function getrimd(tekst: string, begin: number): [string, number] {
  const voor = tekst.length - tekst.trimStart().length;
  return [tekst.trim(), begin + voor];
}

function declaratie(tekst: string, begin: number, t: Telling): void {
  const [d, plek] = getrimd(tekst, begin);
  if (d === '') return;
  if (d.startsWith('@')) {
    // Een at-regel zonder blok, zoals @import url(…);
    tel(t, 'CSS-at-regels', `@${(/^@([\w-]+)/.exec(d)?.[1] ?? '').toLowerCase()}`, plek);
    return;
  }
  const dubbelepunt = d.indexOf(':');
  if (dubbelepunt <= 0) return;
  const eigenschap = d.slice(0, dubbelepunt).trim().toLowerCase();
  if (!/^-{0,2}[a-z][a-z0-9-]*$/.test(eigenschap)) return;
  tel(t, 'CSS-eigenschappen', eigenschap.startsWith('--') ? '--*' : eigenschap, plek);
  waardeConstructies(d.slice(dubbelepunt + 1), plek + dubbelepunt + 1, t);
}

function cssConstructies(css: string, begin: number, t: Telling): void {
  const bron = css.replace(/\/\*[\s\S]*?\*\//g, blanco);
  let vanaf = 0;
  for (let i = 0; i < bron.length; i++) {
    const teken = bron[i];
    if (teken === '{') {
      const [kop, plek] = getrimd(bron.slice(vanaf, i), begin + vanaf);
      if (kop.startsWith('@')) {
        tel(t, 'CSS-at-regels', `@${(/^@([\w-]+)/.exec(kop)?.[1] ?? '').toLowerCase()}`, plek);
      } else if (kop !== '') {
        selectorConstructies(kop, plek, t);
      }
      vanaf = i + 1;
    } else if (teken === ';' || teken === '}') {
      declaratie(bron.slice(vanaf, i), begin + vanaf, t);
      vanaf = i + 1;
    }
  }
  declaratie(bron.slice(vanaf), begin + vanaf, t);
}

// --- JavaScript ------------------------------------------------------------

// JavaScript heeft geen gesloten woordenschat zoals HTML en CSS: een eigen
// functie of een eigen eigenschap (speler.score) is geen techniek. Daarom een
// vaste lijst van constructies die we herkennen; lesstof.json filtert eruit
// wat de lessen al gebruiken. Een constructie toevoegen mag gerust: staat hij
// in een les, dan komt hij via de test in lesstof.json en valt hij weg.
const JS_SYNTAX: { label: string; patroon: RegExp }[] = [
  { label: '=> (arrow-functie)', patroon: /=>/g },
  { label: 'function () (naamloze functie)', patroon: /\bfunction\s*\(/g },
  { label: 'class', patroon: /\bclass\s+[A-Za-z_$]/g },
  { label: 'new', patroon: /\bnew\s+[A-Za-z_$]/g },
  { label: 'async', patroon: /\basync\b/g },
  { label: 'await', patroon: /\bawait\b/g },
  { label: 'try / catch', patroon: /\btry\s*\{/g },
  { label: 'throw', patroon: /\bthrow\b/g },
  { label: 'switch', patroon: /\bswitch\s*\(/g },
  { label: 'for … of', patroon: /\bfor\s*\(\s*(?:const|let|var)\s+[\w$]+\s+of\b/g },
  { label: 'for … in', patroon: /\bfor\s*\(\s*(?:const|let|var)\s+[\w$]+\s+in\b/g },
  { label: 'do … while', patroon: /\bdo\s*\{/g },
  { label: 'var', patroon: /\bvar\s+[A-Za-z_$]/g },
  { label: 'return', patroon: /\breturn\b/g },
  { label: 'break', patroon: /\bbreak\b/g },
  { label: 'continue', patroon: /\bcontinue\b/g },
  { label: 'else if', patroon: /\belse\s+if\b/g },
  { label: '? : (ternary)', patroon: /\?\s*[^?.:\s][^:;\n]*\s:\s/g },
  { label: '?. (optional chaining)', patroon: /\?\.(?!\d)/g },
  { label: '??', patroon: /\?\?/g },
  { label: '... (spread)', patroon: /\.\.\.[A-Za-z_$[{]/g },
  { label: '`…` (template literal)', patroon: /`[^`]*`/g },
  { label: 'import / export', patroon: /^\s*(?:import|export)\s/gm },
  { label: '== (losse vergelijking)', patroon: /[^=!<>]==[^=]/g },
  { label: '++ / --', patroon: /\+\+|--/g },
  { label: '+= / -=', patroon: /[+-]=(?!=)/g },
  { label: '*= / /= / %=', patroon: /[*/%]=(?!=)/g },
  { label: '% (modulo)', patroon: /[\w)\]]\s*%\s*[\w(]/g },
  { label: 'const { … } = (destructuring)', patroon: /\b(?:const|let|var)\s*[{[]/g },
];

// Ingebouwde objecten waarvan we elke methode of eigenschap herkennen:
// Math.random, JSON.parse, document.createElement, window.scrollTo, …
const JS_OBJECTEN = [
  'Math',
  'JSON',
  'Date',
  'Object',
  'Array',
  'Number',
  'String',
  'Promise',
  'document',
  'window',
  'console',
  'localStorage',
  'sessionStorage',
  'navigator',
  'location',
  'history',
];

// Losse functies van de browser.
const JS_FUNCTIES = [
  'fetch',
  'setTimeout',
  'setInterval',
  'clearTimeout',
  'clearInterval',
  'requestAnimationFrame',
  'parseInt',
  'parseFloat',
  'isNaN',
  'alert',
  'confirm',
  'prompt',
  'Number',
  'String',
  'Boolean',
];

// Methoden en eigenschappen van elementen, lijsten en tekst. Een eigen
// eigenschap van de leerling heet zelden zo.
const JS_LEDEN = [
  'addEventListener',
  'removeEventListener',
  'preventDefault',
  'stopPropagation',
  'getElementById',
  'getElementsByClassName',
  'getElementsByTagName',
  'querySelector',
  'querySelectorAll',
  'createElement',
  'appendChild',
  'append',
  'prepend',
  'removeChild',
  'remove',
  'replaceChildren',
  'insertAdjacentHTML',
  'cloneNode',
  'closest',
  'matches',
  'innerHTML',
  'innerText',
  'outerHTML',
  'textContent',
  'value',
  'checked',
  'disabled',
  'src',
  'href',
  'style',
  'classList',
  'className',
  'dataset',
  'setAttribute',
  'getAttribute',
  'removeAttribute',
  'children',
  'parentElement',
  'nextElementSibling',
  'previousElementSibling',
  'focus',
  'blur',
  'click',
  'scrollIntoView',
  'getBoundingClientRect',
  'getContext',
  'target',
  'key',
  'length',
  'push',
  'pop',
  'shift',
  'unshift',
  'splice',
  'slice',
  'concat',
  'indexOf',
  'includes',
  'join',
  'split',
  'reverse',
  'sort',
  'map',
  'filter',
  'reduce',
  'forEach',
  'find',
  'findIndex',
  'some',
  'every',
  'toUpperCase',
  'toLowerCase',
  'trim',
  'replace',
  'replaceAll',
  'startsWith',
  'endsWith',
  'padStart',
  'repeat',
  'charAt',
  'toFixed',
  'toString',
  'then',
  'catch',
  'json',
];

/**
 * Poetst commentaar en tekst tussen aanhalingstekens weg: tekst kan alles
 * bevatten ("Klik => hier") en telt niet mee. Eén doorloop, van links naar
 * rechts, zodat wat het eerst begint wint: een // in een string is geen
 * commentaar, en een " in commentaar opent geen string. De code tussen ${ }
 * in een template literal blijft staan, want dat is gewone code; de backticks
 * ook, zodat de template literal zelf herkend blijft. Alles wordt spaties van
 * dezelfde lengte, met de regeleinden erin, zodat posities kloppen.
 */
export function zonderCommentaarEnTekst(js: string): string {
  let uit = '';
  let i = 0;
  // Per open ${ … } in een template: hoeveel { er binnen nog open staan.
  const templates: number[] = [];
  const blancoTot = (eind: number) => {
    uit += blanco(js.slice(i, eind));
    i = eind;
  };
  const inTemplate = () => {
    // In de tekst van een template literal, tot de sluitende ` of een ${.
    while (i < js.length) {
      const c = js[i];
      if (c === '\\') {
        blancoTot(Math.min(i + 2, js.length));
      } else if (c === '`') {
        uit += '`';
        i++;
        return;
      } else if (c === '$' && js[i + 1] === '{') {
        uit += '${';
        i += 2;
        templates.push(0);
        return;
      } else {
        blancoTot(i + 1);
      }
    }
  };
  while (i < js.length) {
    const c = js[i];
    const volgende = js[i + 1];
    if (c === '/' && volgende === '/') {
      const eind = js.indexOf('\n', i);
      blancoTot(eind === -1 ? js.length : eind);
    } else if (c === '/' && volgende === '*') {
      const eind = js.indexOf('*/', i + 2);
      blancoTot(eind === -1 ? js.length : eind + 2);
    } else if (c === '"' || c === "'") {
      // Tot de sluitende quote (of het regeleinde, als hij ontbreekt).
      let j = i + 1;
      while (j < js.length && js[j] !== c && js[j] !== '\n') j += js[j] === '\\' ? 2 : 1;
      const dicht = js[j] === c;
      uit += c + blanco(js.slice(i + 1, j)) + (dicht ? c : '');
      i = dicht ? j + 1 : j;
    } else if (c === '`') {
      uit += '`';
      i++;
      inTemplate();
    } else if (templates.length > 0 && c === '{') {
      templates[templates.length - 1]++;
      uit += c;
      i++;
    } else if (templates.length > 0 && c === '}') {
      uit += c;
      i++;
      const open = templates.length - 1;
      if (templates[open] === 0) {
        templates.pop();
        inTemplate();
      } else {
        templates[open]--;
      }
    } else {
      uit += c;
      i++;
    }
  }
  return uit;
}

// Eén keer opgebouwd; matchAll werkt op een kopie, dus hergebruik is veilig.
const JS_OBJECT_RE = new RegExp(
  `(?<![\\w$.])(${JS_OBJECTEN.join('|')})\\.([A-Za-z_$][\\w$]*)`,
  'g',
);
const JS_FUNCTIE_RE = new RegExp(`(?<![\\w$.])(${JS_FUNCTIES.join('|')})\\s*\\(`, 'g');
// Leden na een punt, maar niet na een van de objecten hierboven: die hebben
// hun eigen label (document.querySelector, niet .querySelector). En niet na
// .classList: classList.remove() is iets anders dan element.remove().
const JS_LID_RE = new RegExp(
  `(?<!\\b(?:${JS_OBJECTEN.join('|')})|\\.classList)\\.(${JS_LEDEN.join('|')})\\b(\\s*\\()?`,
  'g',
);

function jsConstructies(js: string, begin: number, t: Telling): void {
  const bron = zonderCommentaarEnTekst(js);
  for (const { label, patroon } of JS_SYNTAX) {
    for (const m of bron.matchAll(patroon)) tel(t, 'JavaScript', label, begin + (m.index ?? 0));
  }
  for (const m of bron.matchAll(JS_OBJECT_RE)) {
    tel(t, 'JavaScript', `${m[1]}.${m[2]}`, begin + (m.index ?? 0));
  }
  for (const m of bron.matchAll(JS_FUNCTIE_RE)) {
    tel(t, 'JavaScript', `${m[1]}()`, begin + (m.index ?? 0));
  }
  for (const m of bron.matchAll(JS_LID_RE)) {
    tel(t, 'JavaScript', `.${m[1]}${m[2] ? '()' : ''}`, begin + (m.index ?? 0));
  }
}

// --- Samen -----------------------------------------------------------------

/** Telt elke herkende constructie in een rij stukken code, met de posities. */
export function constructiesIn(stukken: Stuk[]): Telling {
  const t: Telling = new Map();
  const alles = stukken.flatMap((s) =>
    s.soort === 'html' ? splitsHtml(s.tekst, s.begin ?? 0) : [s],
  );
  for (const s of alles) {
    const begin = s.begin ?? 0;
    if (s.soort === 'html') htmlConstructies(s.tekst, begin, t);
    else if (s.soort === 'css') cssConstructies(s.tekst, begin, t);
    else jsConstructies(s.tekst, begin, t);
  }
  return t;
}

/** Wat de lessen behandelen, per groep (zie lesstof.ts). */
export type Lesstof = Record<string, string[]>;

const SOORT_VAN_KIND: Record<string, Soort | undefined> = { html: 'html', css: 'css', js: 'js' };

/**
 * De zoeker voor het rapport: wat een project gebruikt en de lessen niet.
 * `lesstof` komt bij het bouwen uit lesstof-plugin.ts, in tests uit
 * berekenLesstof().
 */
export function maakBuitenLesstof(lesstof: Lesstof): (files: ProjectFiles) => Vondst[] {
  const bekend = new Set(
    Object.entries(lesstof).flatMap(([groep, labels]) => labels.map((l) => sleutel(groep, l))),
  );
  return (files) => {
    const perSleutel = new Map<string, Vondst>();
    const paden = Object.values(files).sort((a, b) => a.path.localeCompare(b.path));
    for (const f of paden) {
      const soort = SOORT_VAN_KIND[f.kind];
      if (!soort || f.content === null) continue;
      let begins: number[] | null = null;
      for (const [k, { n, posities }] of constructiesIn([{ soort, tekst: f.content }])) {
        if (bekend.has(k)) continue;
        const [groep, ...rest] = k.split('|');
        const label = rest.join('|');
        const vondst = perSleutel.get(k) ?? { groep, label, count: 0, files: [], plekken: [] };
        vondst.count += n;
        vondst.files.push(f.path);
        const plekken = vondst.plekken ?? [];
        if (plekken.length < MAX_PLEKKEN) {
          // Regelstarts één keer per bestand, en pas als er een vondst is.
          begins ??= regelBegins(f.content);
          plekken.push(...plekkenIn(f.path, begins, posities, MAX_PLEKKEN - plekken.length));
        }
        vondst.plekken = plekken;
        perSleutel.set(k, vondst);
      }
    }
    const volgorde = (g: string) => GROEPEN.indexOf(g as Groep);
    return Array.from(perSleutel.values()).sort(
      (a, b) => volgorde(a.groep) - volgorde(b.groep) || a.label.localeCompare(b.label),
    );
  };
}

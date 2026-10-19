import type { ProjectFiles, Vondst } from '@coderius/checker/types';
import LESSTOF from './lesstof.json';

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

type Telling = Map<string, number>;

function tel(t: Telling, groep: Groep, label: string, n = 1): void {
  const k = sleutel(groep, label);
  t.set(k, (t.get(k) ?? 0) + n);
}

// --- HTML ------------------------------------------------------------------

const TAG = /<([a-zA-Z][a-zA-Z0-9-]*)((?:\s+[^<>]*?)?)\s*\/?>/g;
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
export function splitsHtml(html: string): Stuk[] {
  const stukken: Stuk[] = [];
  let rest = html.replace(/<!--[\s\S]*?-->/g, '');
  rest = rest.replace(
    /(<style\b[^>]*>)([\s\S]*?)(<\/style\s*>)/gi,
    (_m, open: string, css: string, dicht: string) => {
      stukken.push({ soort: 'css', tekst: css });
      return open + dicht;
    },
  );
  rest = rest.replace(
    /(<script\b[^>]*>)([\s\S]*?)(<\/script\s*>)/gi,
    (_m, open: string, js: string, dicht: string) => {
      stukken.push({ soort: 'js', tekst: js });
      return open + dicht;
    },
  );
  for (const tag of rest.matchAll(TAG)) {
    for (const a of (tag[2] ?? '').matchAll(ATTRIBUUT)) {
      const naam = a[1].toLowerCase();
      const waarde = a[2] ?? a[3];
      if (waarde === undefined) continue;
      if (naam === 'style') stukken.push({ soort: 'css', tekst: `x{${waarde}}` });
      else if (naam.startsWith('on')) stukken.push({ soort: 'js', tekst: waarde });
    }
  }
  stukken.push({ soort: 'html', tekst: rest });
  return stukken;
}

function htmlConstructies(html: string, t: Telling): void {
  for (const tag of html.matchAll(TAG)) {
    tel(t, 'HTML-elementen', `<${tag[1].toLowerCase()}>`);
    for (const a of (tag[2] ?? '').matchAll(ATTRIBUUT)) {
      // Kapotte HTML (aanhalingstekens door elkaar) levert brokken op die
      // geen attribuutnaam zijn; die tellen niet.
      if (/^[a-zA-Z][\w:-]*$/.test(a[1])) tel(t, 'HTML-attributen', attribuutLabel(a[1]));
    }
  }
}

// --- CSS -------------------------------------------------------------------

function selectorConstructies(selector: string, t: Telling): void {
  let s = selector.replace(/"[^"]*"|'[^']*'/g, '""');
  for (const _ of s.matchAll(/\[[^\]]*\]/g)) tel(t, 'CSS-selectoren', '[attribuut]');
  s = s.replace(/\[[^\]]*\]/g, '');
  for (const p of s.matchAll(/(::?)([a-zA-Z-]+)(\()?/g)) {
    tel(t, 'CSS-selectoren', `${p[1]}${p[2].toLowerCase()}${p[3] ? '()' : ''}`);
  }
  // Haakjes van :nth-child(2n + 1) zijn geen combinators.
  s = s.replace(/\([^)]*\)/g, '');
  for (const _ of s.matchAll(/>/g)) tel(t, 'CSS-selectoren', 'a > b');
  for (const _ of s.matchAll(/\+/g)) tel(t, 'CSS-selectoren', 'a + b');
  for (const _ of s.matchAll(/~/g)) tel(t, 'CSS-selectoren', 'a ~ b');
  for (const _ of s.matchAll(/\*/g)) tel(t, 'CSS-selectoren', '*');
  for (const _ of s.matchAll(/&/g)) tel(t, 'CSS-selectoren', '&');
}

function waardeConstructies(waarde: string, t: Telling): void {
  const v = waarde.replace(/"[^"]*"|'[^']*'/g, '""').replace(/#[0-9a-fA-F]{3,8}\b/g, '');
  for (const f of v.matchAll(/(?<![\w-])([a-zA-Z-]+)\(/g)) {
    tel(t, 'CSS-waarden', `${f[1].toLowerCase()}()`);
  }
  for (const e of v.matchAll(/(?<![\w.-])-?(?:\d+\.?\d*|\.\d+)([a-zA-Z]+|%)/g)) {
    tel(t, 'CSS-waarden', e[1].toLowerCase());
  }
  if (/!\s*important/i.test(v)) tel(t, 'CSS-waarden', '!important');
}

function declaratie(tekst: string, t: Telling): void {
  const d = tekst.trim();
  if (d === '') return;
  if (d.startsWith('@')) {
    // Een at-regel zonder blok, zoals @import url(…);
    tel(t, 'CSS-at-regels', `@${(/^@([\w-]+)/.exec(d)?.[1] ?? '').toLowerCase()}`);
    return;
  }
  const dubbelepunt = d.indexOf(':');
  if (dubbelepunt <= 0) return;
  const eigenschap = d.slice(0, dubbelepunt).trim().toLowerCase();
  if (!/^-{0,2}[a-z][a-z0-9-]*$/.test(eigenschap)) return;
  tel(t, 'CSS-eigenschappen', eigenschap.startsWith('--') ? '--*' : eigenschap);
  waardeConstructies(d.slice(dubbelepunt + 1), t);
}

function cssConstructies(css: string, t: Telling): void {
  const bron = css.replace(/\/\*[\s\S]*?\*\//g, '');
  let buffer = '';
  for (const teken of bron) {
    if (teken === '{') {
      const kop = buffer.trim();
      if (kop.startsWith('@')) {
        tel(t, 'CSS-at-regels', `@${(/^@([\w-]+)/.exec(kop)?.[1] ?? '').toLowerCase()}`);
      } else if (kop !== '') {
        selectorConstructies(kop, t);
      }
      buffer = '';
    } else if (teken === ';' || teken === '}') {
      declaratie(buffer, t);
      buffer = '';
    } else {
      buffer += teken;
    }
  }
  declaratie(buffer, t);
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
  { label: '+= / -=', patroon: /[+\-*/]=(?!=)/g },
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

function zonderCommentaarEnTekst(js: string): string {
  // Tekst tussen aanhalingstekens kan alles bevatten ("Klik => hier"); die
  // telt niet mee. Template literals houden hun backtick, zodat de
  // constructie zelf herkend blijft.
  return js
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:\\])\/\/.*$/gm, '$1')
    .replace(/"(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'/g, '""')
    .replace(/`(?:[^`\\$]|\\.|\$(?!\{))*`/g, '``');
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

function jsConstructies(js: string, t: Telling): void {
  const bron = zonderCommentaarEnTekst(js);
  for (const { label, patroon } of JS_SYNTAX) {
    const n = bron.match(patroon)?.length ?? 0;
    if (n > 0) tel(t, 'JavaScript', label, n);
  }
  for (const m of bron.matchAll(JS_OBJECT_RE)) tel(t, 'JavaScript', `${m[1]}.${m[2]}`);
  for (const m of bron.matchAll(JS_FUNCTIE_RE)) tel(t, 'JavaScript', `${m[1]}()`);
  for (const m of bron.matchAll(JS_LID_RE)) tel(t, 'JavaScript', `.${m[1]}${m[2] ? '()' : ''}`);
}

// --- Samen -----------------------------------------------------------------

/** Telt elke herkende constructie in een rij stukken code. */
export function constructiesIn(stukken: Stuk[]): Telling {
  const t: Telling = new Map();
  const alles = stukken.flatMap((s) => (s.soort === 'html' ? splitsHtml(s.tekst) : [s]));
  for (const s of alles) {
    if (s.soort === 'html') htmlConstructies(s.tekst, t);
    else if (s.soort === 'css') cssConstructies(s.tekst, t);
    else jsConstructies(s.tekst, t);
  }
  return t;
}

const BEKEND = new Set(
  Object.entries(LESSTOF as Record<string, string[]>).flatMap(([groep, labels]) =>
    labels.map((label) => sleutel(groep, label)),
  ),
);

const SOORT_VAN_KIND: Record<string, Soort | undefined> = { html: 'html', css: 'css', js: 'js' };

/** De vondsten voor het rapport: wat het project gebruikt en de lessen niet. */
export function buitenLesstof(files: ProjectFiles): Vondst[] {
  const perSleutel = new Map<string, Vondst>();
  const paden = Object.values(files).sort((a, b) => a.path.localeCompare(b.path));
  for (const f of paden) {
    const soort = SOORT_VAN_KIND[f.kind];
    if (!soort || f.content === null) continue;
    for (const [k, n] of constructiesIn([{ soort, tekst: f.content }])) {
      if (BEKEND.has(k)) continue;
      const [groep, ...rest] = k.split('|');
      const label = rest.join('|');
      const vondst = perSleutel.get(k) ?? { groep, label, count: 0, files: [] };
      vondst.count += n;
      vondst.files.push(f.path);
      perSleutel.set(k, vondst);
    }
  }
  const volgorde = (g: string) => GROEPEN.indexOf(g as Groep);
  return Array.from(perSleutel.values()).sort(
    (a, b) => volgorde(a.groep) - volgorde(b.groep) || a.label.localeCompare(b.label),
  );
}

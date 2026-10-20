import { lijktBibliotheek } from '@coderius/checker/bibliotheek';
import type {
  CheckerConfig,
  Concept,
  ConceptDetect,
  ExtraConcept,
  Level,
} from '@coderius/checker/types';
import { storageKey } from '@coderius/shared/opslag';
import { SITES_BY_ID } from '@coderius/shared/sites';
import { alleenCss, alleenJavaScript, alleenOpmaak, alleenTags } from './code';
import { CSS_TECHNIQUES, HTML_ELEMENTS, JS_TECHNIQUES } from './curriculum';
import niveaus from './niveaus.json';

// De nakijker voor webprojecten. Wélke concepten tellen en op welk niveau
// staat in `niveaus.json`: dat bestand is de tabel van de docent, in dezelfde
// volgorde en met dezelfde woorden. Hier staat alleen hóé je elke rij in de
// bestanden terugvindt.
//
// Eerder telde de nakijker elk concept uit curriculum.ts, zo'n tachtig, met
// een eigen niveau per concept. Dat sprak de tabel tegen: `<p>`, `color` en
// `let` stonden als basis in het rapport terwijl de docent er niet op
// beoordeelt, en "flexbox of grid" telde als negen losse concepten. Nu is elke
// rij één concept. Een rij met onderdelen ("ol & ul, li") is toegepast zodra
// één onderdeel erin staat; het rapport noemt welke. Wat de lessen verder
// behandelen staat onder "Ook gebruikt", zonder niveau en zonder mee te tellen.

const IMAGE_EXT = new Set(['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.ico', '.bmp']);

function classify(path: string): string {
  const dot = path.lastIndexOf('.');
  const ext = dot === -1 ? '' : path.slice(dot).toLowerCase();
  if (ext === '.html' || ext === '.htm') return 'html';
  if (ext === '.css') return 'css';
  if (ext === '.js' || ext === '.mjs') return 'js';
  if (IMAGE_EXT.has(ext)) return 'image';
  return 'other';
}

function todayStamp(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function regex(pattern: RegExp, ...kinds: string[]): ConceptDetect {
  return { type: 'regex', pattern, in: kinds };
}

// JavaScript zoeken we alleen waar JavaScript staat: in een .js-bestand, en in
// HTML in een `<script>`-blok of een `on…="…"`-attribuut. Commentaar en tekst
// tussen aanhalingstekens tellen niet mee. Eerst liepen de patronen over de
// hele HTML en over commentaar: "let op" in een alinea telde als `let`,
// `getElementById()` in een uitleg als de methode, en `alert("if (x)")` als
// een if. De afgeleide soorten zijn even lang als het bestand, dus een vondst
// houdt zijn regelnummer.
const JS_CODE = 'js-code';
// Hetzelfde, maar met de tekst tussen aanhalingstekens erin: de naam van een
// event staat daar (`addEventListener('click', …)`).
const JS_TEKST = 'js-tekst';
// De HTML zonder commentaar en zonder de inhoud van <script> en <style>.
const HTML_OPMAAK = 'html-opmaak';
// De tags: de opmaak zonder commentaar, plus HTML in tekst in JavaScript
// (`innerHTML = "<ul>…"`). Een tag in een HTML-commentaar telde eerst mee,
// en `i<li.length` in een script telde als <li>.
const HTML_TAGS = 'html-tags';
// De CSS uit .css-bestanden, <style>-blokken en style-attributen, zonder
// commentaar en tekst. CSS in een HTML-bestand telde eerst helemaal niet,
// en weggecommentarieerde CSS wel.
const CSS_CODE = 'css-code';

// Elk concept uit de lessen, met zijn herkenning.

const LESCONCEPTEN: ExtraConcept[] = [
  ...HTML_ELEMENTS.map((e) => ({
    id: `html-${e.tags.join('-')}`,
    subject: 'html',
    group: e.group,
    label: e.label,
    detect: regex(new RegExp(`<(${e.tags.join('|')})\\b`, 'gi'), HTML_TAGS),
  })),
  ...CSS_TECHNIQUES.map((t) => ({
    id: t.id,
    subject: 'css',
    group: t.group,
    label: t.label,
    detect: regex(t.pattern, CSS_CODE),
  })),
  ...JS_TECHNIQUES.map((t) => ({
    id: t.id,
    subject: 'js',
    group: t.group,
    label: t.label,
    // Het onclick-attribuut heeft geen patroon in curriculum.ts; het staat
    // in de HTML, niet in de broncode.
    detect:
      t.id === 'js-onclick-attribute' ? regex(/onclick\s*=/gi, 'html') : regex(t.pattern, JS_CODE),
  })),
];

const LES = new Map(LESCONCEPTEN.map((c) => [c.id, c]));

function les(id: string): ExtraConcept {
  const c = LES.get(id);
  if (!c) throw new Error(`config.ts: onbekend lesconcept '${id}'`);
  return c;
}

/** Een tag, of een rij tags waarvan er één moet voorkomen ("ol & ul, li"). */
function tags(...namen: string[]): ConceptDetect {
  return {
    type: 'regex',
    pattern: new RegExp(`<(${namen.join('|')})\\b`, 'gi'),
    in: [HTML_TAGS],
    delen: true,
  };
}

/**
 * Een rij die bestaat uit concepten uit de lessen: toegepast als er één van
 * voorkomt. Elk patroon wordt een benoemde groep, zodat het rapport kan zeggen
 * welke het waren.
 */
function eenVan(...ids: string[]): ConceptDetect {
  const delen = ids.map(les);
  const detects = delen.map((c) => c.detect);
  if (ids.length === 1) return detects[0];
  const bronnen: string[] = [];
  const soorten = new Set<string>();
  for (const d of detects) {
    if (d.type !== 'regex' || d.pattern.flags !== 'g') {
      throw new Error(`config.ts: eenVan(${ids.join(', ')}) kan alleen /g-patronen combineren`);
    }
    bronnen.push(d.pattern.source);
    for (const k of d.in ?? []) soorten.add(k);
  }
  return {
    type: 'regex',
    pattern: new RegExp(bronnen.map((b, i) => `(?<d${i}>${b})`).join('|'), 'g'),
    in: Array.from(soorten),
    delen: delen.map((c) => c.label),
  };
}

/**
 * Een rij met onderdelen die elk een eigen patroon hebben: elk patroon wordt
 * een benoemde groep, zodat het rapport zegt welk onderdeel er staat.
 */
function onderdelen(kinds: string[], flags: string, delen: [string, RegExp][]): ConceptDetect {
  return {
    type: 'regex',
    pattern: new RegExp(delen.map(([, re], i) => `(?<d${i}>${re.source})`).join('|'), flags),
    in: kinds,
    delen: delen.map(([label]) => label),
  };
}

/** Een selector in een CSS-bestand. */
function selector(pattern: RegExp): Extract<ConceptDetect, { type: 'regex' }> {
  return { type: 'regex', pattern, in: [CSS_CODE] };
}

interface Herkenning {
  detect: ConceptDetect;
  /** De concepten uit de lessen die deze rij al meet; die staan niet onder "Ook gebruikt". */
  dekt: string[];
}

const uitLessen = (...ids: string[]): Herkenning => ({ detect: eenVan(...ids), dekt: ids });

const HERKENNING: Record<string, Herkenning> = {
  // --- CSS ---
  // Een selector die met een tagnaam begint, vóór de `{`: `p {`, `h1, h2 {`,
  // `nav a {`, ook direct na een commentaar. De keyframe-stappen `from` en
  // `to` zijn geen tags, en de soorten media uit `@media screen, print {`
  // ook niet.
  //
  // Commentaar en tekst zijn er in css-code al uit: `/* style.css */` boven
  // `body {` telt niet als class, `/* kleur #ccc */` niet als id, en
  // `content: ".kaart {"` niet als selector. Het `*/` in de patronen houdt
  // dat ook vast als iemand ze op gewone CSS loslaat.
  'css-tag-selector': {
    detect: {
      type: 'regex',
      pattern:
        /(?:^|[{};,/])\s*(?!(?:from|to|screen|print|all|only|and|not)\b)([a-z][a-z0-9]*)\b(?=(?:(?!\*\/)[^{};])*\{)/g,
      in: [CSS_CODE],
      delen: true,
    },
    dekt: [],
  },
  // Class, id en pseudoclass herkennen we aan wat ze in een selector zijn:
  // iets vóór de `{`. Het patroon uit de lessen eist `{` of `,` direct na de
  // naam en mist zo `.kaart:hover {` en `.kaart h2 {`; met de tabel kost dat
  // een leerling een basisconcept. Een kleur als `#fff` of een getal als
  // `1.5em` staat in een declaratie, niet vóór een `{`.
  'css-class': {
    detect: selector(/\.[a-zA-Z_-][\w-]*(?=(?:(?!\*\/)[^{};])*\{)/g),
    dekt: ['css-class-selector'],
  },
  // Elke pseudoclass telt, ook een die de lessen niet behandelen (`:focus`),
  // maar een pseudo-element (`::before`) niet. Achter de naam mag één paar
  // haakjes (`:nth-child(2)`, `:not(.x)`), daarna geen haakje meer tot de
  // `{`: zo is `@media (orientation:landscape) {` geen pseudoclass.
  'css-pseudoclass': {
    detect: {
      ...selector(/(?<!:)(:[a-z][a-z-]*)(?=(?:\([^)]*\))?(?:(?!\*\/)[^{};()])*\{)/g),
      delen: true,
    },
    dekt: ['css-hover', 'css-first-child', 'css-last-child', 'css-nth-child'],
  },
  'css-id': {
    detect: selector(/#[a-zA-Z_-][\w-]*(?=(?:(?!\*\/)[^{};])*\{)/g),
    dekt: ['css-id-selector'],
  },
  'css-flexbox-grid': uitLessen(
    'css-display-flex',
    'css-justify-content',
    'css-align-items',
    'css-gap',
    'css-flex-direction',
    'css-display-grid',
    'css-grid-template-columns',
    'css-grid-template-rows',
    'css-grid-column',
  ),
  'css-media-query': uitLessen('css-media-query'),

  // --- HTML ---
  'html-koppen': {
    detect: tags('h1', 'h2', 'h3', 'h4', 'h5', 'h6'),
    dekt: ['html-h1-h2-h3-h4-h5-h6'],
  },
  'html-lijsten': { detect: tags('ol', 'ul', 'li'), dekt: ['html-ol', 'html-ul', 'html-li'] },
  'html-img': uitLessen('html-img'),
  'html-a': uitLessen('html-a'),
  'html-opbouw': {
    detect: tags('header', 'main', 'footer'),
    dekt: ['html-header', 'html-main', 'html-footer'],
  },
  // De knop hoort er niet bij: die staat al in de les over onclick, lang
  // vóór formulieren.
  'html-forms': {
    detect: tags('form', 'input', 'label', 'textarea', 'select', 'option'),
    dekt: ['html-form', 'html-input', 'html-label', 'html-textarea', 'html-select', 'html-option'],
  },

  // --- JavaScript ---
  'js-get-element-by-id': uitLessen('js-get-element-by-id'),
  'js-style': uitLessen('js-style'),
  'js-script-tag': { detect: { type: 'regex', pattern: /<script\b/gi, in: [HTML_TAGS] }, dekt: [] },
  // Een eigen JavaScript-bestand, gekoppeld met `<script src="…">`. Een
  // bibliotheek van een andere site (`src="https://…"`) is geen eigen bestand.
  'js-script-js': {
    detect: {
      type: 'regex',
      pattern: /<script\b[^>]*\bsrc\s*=\s*(?!["']?(?:https?:|\/\/))/gi,
      in: [HTML_TAGS],
    },
    dekt: [],
  },
  'js-prompt-alert': uitLessen('js-prompt', 'js-alert'),
  // Elke functie die de leerling zelf maakt. De lessen gebruiken alleen
  // `function naam()`, maar een arrow-functie, een naamloze functie of een
  // methode in een object is net zo goed een eigen functie. Buiten de
  // lesstof noemt de eerste twee daarnaast als iets wat de lessen niet
  // behandelen.
  'js-functies': {
    detect: onderdelen([JS_CODE], 'gm', [
      ['function naam()', /\bfunction\s+[\w$]+\s*\(/],
      ['function ()', /\bfunction\s*\(/],
      ['=>', /=>/],
      // `spring() {` aan het begin van een regel, maar niet `if (x) {`; ook
      // `static maak() {` en `async laad() {`.
      [
        'methode',
        /^[ \t]*(?:(?:static|async|get|set)[ \t]+)*(?!(?:if|for|while|switch|catch|function|return)\b)[\w$]+[ \t]*\([^()\n]*\)[ \t]*\{/,
      ],
    ]),
    dekt: ['js-function'],
  },
  'js-add-event-listener': uitLessen('js-add-event-listener'),
  // Een event koppelen: als attribuut in een tag (`<button onclick="…">`),
  // als eigenschap (`knop.onclick = …`) of met addEventListener; het rapport
  // noemt welke events. Het attribuut zoeken we alleen ín een tag: eerst
  // telde `let onderwerp = "…"` als het event "derwerp". Een waarde tussen
  // aanhalingstekens mag een > bevatten (`value="a>b"`), net als in
  // splitsHtml. HTML is hoofdletterongevoelig, dus `onClick="…"` telt ook.
  'js-events': {
    detect: {
      type: 'regex',
      pattern:
        /<[a-z](?:"[^"]*"|'[^']*'|[^>"'])*?\son([a-z]{3,})\s*=|\.on([a-z]{3,})\s*=(?!=)|\baddEventListener\s*\(\s*['"]([a-z]+)/gi,
      in: [HTML_OPMAAK, JS_TEKST],
      delen: true,
    },
    dekt: ['js-onclick-attribute'],
  },
  'js-if-else': uitLessen('js-if-else'),
  // De waarde uit een invoerveld. `Number(…)` hoort er niet bij: dat zet
  // ook het antwoord op een prompt om, en dan telde een programma zonder
  // formulier als "formulier data ophalen".
  'js-formulier-data': uitLessen('js-value'),
  // Een lijst tussen blokhaken, ook als argument (`toon([1, 2])`) of als
  // antwoord van een functie; het patroon uit de lessen eist `= [`. Niet
  // `lijst[0]`: daar staat een naam vóór de blokhaak.
  'js-arrays': {
    detect: onderdelen([JS_CODE], 'g', [
      ['array ([...])', /(?:[=(,:>[]|\b(?:return|of)\b)\s*\[/],
      ['.push()', /\.push\s*\(/],
      ['new Array()', /\bnew\s+Array\s*\(/],
    ]),
    dekt: ['js-array-literal', 'js-array-push'],
  },
  // Elke herhaling: for (ook for … of), while, en forEach op een lijst.
  'js-loops': {
    detect: onderdelen([JS_CODE], 'g', [
      ['for-loop', /\bfor\s*\(/],
      ['while-loop', /\bwhile\s*\(/],
      ['forEach()', /\.forEach\s*\(/],
    ]),
    dekt: ['js-for', 'js-while'],
  },
};

const NIVEAUS: Record<string, Level> = { basis: 'basis', gevorderd: 'gevorderd' };
const GROEP: Record<Level, string> = { basis: 'Basis', gevorderd: 'Gevorderd' };

const concepts: Concept[] = niveaus.concepten.map((c) => {
  const herkenning = HERKENNING[c.id];
  if (!herkenning) throw new Error(`niveaus.json: geen herkenning voor concept '${c.id}'`);
  const level = NIVEAUS[c.niveau];
  if (!level) throw new Error(`niveaus.json: onbekend niveau '${c.niveau}' bij ${c.id}`);
  return {
    id: c.id,
    subject: c.onderwerp,
    group: GROEP[level],
    label: c.concept,
    level,
    detect: herkenning.detect,
  };
});

const TABEL = new Set(niveaus.concepten.map((c) => c.id));
for (const id of Object.keys(HERKENNING)) {
  if (!TABEL.has(id))
    throw new Error(`config.ts: herkenning voor '${id}', dat niet in niveaus.json staat`);
}

const gedekt = new Set(Object.values(HERKENNING).flatMap((h) => h.dekt));
for (const id of gedekt) les(id);
const extra = LESCONCEPTEN.filter((c) => !gedekt.has(c.id));

export const webConfig: CheckerConfig = {
  subjects: niveaus.onderwerpen,

  fileKinds: [
    { id: 'html', label: 'HTML' },
    { id: 'css', label: 'CSS' },
    { id: 'js', label: 'JavaScript' },
    { id: 'image', label: 'Afbeeldingen' },
    { id: 'other', label: 'Overig' },
  ],

  classify,
  textKinds: ['html', 'css', 'js'],
  // jQuery, Bootstrap en andere meegeleverde bibliotheken tellen niet als
  // eigen code; het rapport noemt ze.
  bibliotheek: lijktBibliotheek,
  afgeleid: [
    { kind: JS_CODE, van: ['js', 'html'], maak: (t, soort) => alleenJavaScript(t, soort) },
    {
      kind: JS_TEKST,
      van: ['js', 'html'],
      maak: (t, soort) => alleenJavaScript(t, soort, { tekstLaten: true }),
    },
    { kind: HTML_OPMAAK, van: ['html'], maak: alleenOpmaak },
    { kind: HTML_TAGS, van: ['html', 'js'], maak: alleenTags },
    { kind: CSS_CODE, van: ['css', 'html'], maak: alleenCss },
  ],
  imageKinds: ['image'],
  accept: '.zip,.html,.htm,.css,.js,.png,.jpg,.jpeg,.gif,.svg,.webp,.ico',

  ide: { url: SITES_BY_ID.ide.url },
  teacher: {
    password: 'coderius-docent',
    storageKey: storageKey('web', 'webChecker.docentUnlocked'),
  },
  pdfFilename: (d) => `Beoordeling Web Project - ${todayStamp(d)}.pdf`,
  privacyNote:
    'Let op: je bestanden gaan nooit naar een server. Alles gebeurt in je eigen browser.',

  concepts,
  extra,
  // buitenLesstof zet de docentpagina erbij, met de lesstof die
  // lesstof-plugin.ts bij het bouwen berekent; de leerling ziet het niet.
};

import type {
  CheckerConfig,
  Concept,
  ConceptDetect,
  ExtraConcept,
  Level,
} from '@coderius/checker/types';
import { storageKey } from '@coderius/shared/opslag';
import { SITES_BY_ID } from '@coderius/shared/sites';
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

// Elk concept uit de lessen, met zijn herkenning. JavaScript zoeken we ook in
// de HTML: de les over de script-tag zet de code in een `<script>`-blok, en een
// `onclick="alert(...)"` is ook JavaScript.

const LESCONCEPTEN: ExtraConcept[] = [
  ...HTML_ELEMENTS.map((e) => ({
    id: `html-${e.tags.join('-')}`,
    subject: 'html',
    group: e.group,
    label: e.label,
    detect: regex(new RegExp(`<(${e.tags.join('|')})\\b`, 'gi'), 'html'),
  })),
  ...CSS_TECHNIQUES.map((t) => ({
    id: t.id,
    subject: 'css',
    group: t.group,
    label: t.label,
    detect: regex(t.pattern, 'css'),
  })),
  ...JS_TECHNIQUES.map((t) => ({
    id: t.id,
    subject: 'js',
    group: t.group,
    label: t.label,
    // Het onclick-attribuut heeft geen patroon in curriculum.ts; het staat
    // in de HTML, niet in de broncode.
    detect:
      t.id === 'js-onclick-attribute'
        ? regex(/onclick\s*=/gi, 'html')
        : regex(t.pattern, 'js', 'html'),
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
    in: ['html'],
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

/** Een selector in een CSS-bestand. */
function selector(pattern: RegExp): Extract<ConceptDetect, { type: 'regex' }> {
  return { type: 'regex', pattern, in: ['css'] };
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
  // `to` zijn geen tags.
  //
  // De selectorpatronen kijken vooruit naar de `{`, maar niet voorbij een
  // `*/`: anders telt `/* style.css */` boven `body {` als class, en
  // `/* kleur #ccc */` als id.
  'css-tag-selector': {
    detect: {
      type: 'regex',
      pattern: /(?:^|[{};,/])\s*(?!(?:from|to)\b)([a-z][a-z0-9]*)\b(?=(?:(?!\*\/)[^{};])*\{)/g,
      in: ['css'],
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
  // maar een pseudo-element (`::before`) niet.
  'css-pseudoclass': {
    detect: { ...selector(/(?<!:)(:[a-z][a-z-]*)(?=(?:(?!\*\/)[^{};])*\{)/g), delen: true },
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
  'js-script-tag': { detect: { type: 'regex', pattern: /<script\b/gi, in: ['html'] }, dekt: [] },
  // Een eigen JavaScript-bestand, gekoppeld met `<script src="…">`. Een
  // bibliotheek van een andere site (`src="https://…"`) is geen eigen bestand.
  'js-script-js': {
    detect: {
      type: 'regex',
      pattern: /<script\b[^>]*\bsrc\s*=\s*(?!["']?(?:https?:|\/\/))/gi,
      in: ['html'],
    },
    dekt: [],
  },
  'js-prompt-alert': uitLessen('js-prompt', 'js-alert'),
  'js-functies': uitLessen('js-function'),
  'js-add-event-listener': uitLessen('js-add-event-listener'),
  // Een event koppelen, als attribuut (`onclick="…"`) of met
  // addEventListener; het rapport noemt welke events. HTML is
  // hoofdletterongevoelig, dus `onClick="…"` telt ook.
  'js-events': {
    detect: {
      type: 'regex',
      pattern: /\bon([a-z]{3,})\s*=\s*["']|\baddEventListener\s*\(\s*['"]([a-z]+)/gi,
      in: ['html', 'js'],
      delen: true,
    },
    dekt: ['js-onclick-attribute'],
  },
  'js-if-else': uitLessen('js-if-else'),
  'js-formulier-data': uitLessen('js-value', 'js-number'),
  'js-arrays': uitLessen('js-array-literal', 'js-array-push'),
  'js-loops': uitLessen('js-for', 'js-while'),
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

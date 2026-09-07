import { CSS_TECHNIQUES, HTML_ELEMENTS, JS_TECHNIQUES } from '../checker/curriculum';
import type { Technique } from '../checker/curriculum-types';

// Welke les een concept introduceert. Een les mag alles gebruiken wat hier op
// een eerdere plek in de sidebar staat, en niets van later.
//
// Aanleiding: de eenheden-les stond op plek 4 en gebruikte in zijn startcode
// een `<div class="balk">` en in het Make-antwoord `.kaart h2` — klassen komen
// in les 9, geneste selectors in les 14. Een leerling die dat leest denkt dat
// hij iets gemist heeft. Zulke sprongen ontstaan vanzelf zodra iemand een les
// bijschrijft of verplaatst, dus staan ze hier vast en niet in iemands hoofd.
//
// De les-ids zijn die uit `sidebars.ts`; die volgorde is de waarheid, niet de
// bestandsnaam. `src/docs-tests/leerlijn.test.ts` controleert het.

export const INTRODUCEERT: Record<string, string[]> = {
  'html-css/intro-html': ['html-h1', 'html-p', 'html-b', 'html-i'],
  'html-css/koppen-lijsten': [
    'html-h2',
    'html-h3',
    'html-h4',
    'html-h5',
    'html-h6',
    'html-ul',
    'html-ol',
    'html-li',
  ],
  'html-css/tekst-opmaken-css': ['css-color', 'css-font-size', 'css-font-family'],
  'html-css/eenheden': ['css-rem', 'css-em', 'css-percent'],
  'html-css/afbeeldingen': ['html-img'],
  'html-css/paginas-koppelen': ['html-a', 'html-button'],
  'html-css/elementen-opmaken': ['css-background-color', 'css-padding', 'css-margin', 'html-div'],
  'html-css/display-en-span': ['html-span', 'css-display-block-inline'],
  'html-css/css-klassen': ['css-class-selector', 'css-id-selector'],
  'html-css/pseudo-klassen': ['css-hover', 'css-first-child', 'css-last-child', 'css-nth-child'],
  'html-css/flexbox': [
    'css-display-flex',
    'css-justify-content',
    'css-align-items',
    'css-gap',
    'css-flex-direction',
  ],
  'html-css/border-en-dimensies': [
    'css-border',
    'css-border-radius',
    'css-box-sizing',
    'css-width',
    'css-height',
  ],
  'html-css/position': ['css-position', 'css-offsets'],
  'html-css/css-selectors': ['css-nesting'],
  'html-css/media-queries': ['css-media-query'],
  'html-css/css-grid': [
    'css-display-grid',
    'css-grid-template-columns',
    'css-grid-template-rows',
    'css-grid-column',
  ],
  'html-css/semantische-html': [
    'html-header',
    'html-nav',
    'html-main',
    'html-section',
    'html-article',
    'html-footer',
  ],
  'html-css/formulieren': [
    'html-form',
    'html-input',
    'html-label',
    'html-textarea',
    'html-select',
    'html-option',
  ],
  'js-basics/intro-javascript': [],
  'js-basics/inline-onclick': ['js-onclick-attribute', 'js-get-element-by-id'],
  'js-basics/tekst-veranderen': ['js-text-content'],
  'js-basics/inline-stijl': ['js-style'],
  'js-basics/script-tag': ['js-function'],
  'js-basics/scriptjs': [],
  'js-basics/variabelen': ['js-let', 'js-const'],
  'js-basics/events': ['js-add-event-listener'],
  'js-basics/prompt-alert': ['js-prompt', 'js-alert'],
  'js-basics/operatoren-types': ['js-typeof', 'js-number', 'js-template-literal'],
  'js-basics/vergelijken': ['js-strict-equality', 'js-logical-operators'],
  'js-basics/if-else': ['js-if-else'],
  'js-basics/modern-dom': ['js-query-selector', 'js-query-selector-all', 'js-class-list'],
  'js-basics/loops': ['js-for', 'js-while'],
  'js-basics/arrays': ['js-array-literal', 'js-array-length', 'js-array-push'],
  'js-basics/formulier-data': ['js-value'],
};

/**
 * Bewuste vooruitwijzingen: een les mag een concept gebruiken dat later wordt
 * uitgelegd, maar dan moet hij de leerling vertellen waar dat gebeurt. Zonder
 * die link denkt de leerling dat hij iets gemist heeft en zoekt hij terug in
 * lessen waar het niet staat.
 *
 * De test eist daarom twee dingen per regel hieronder: een reden, en een link
 * naar de les die het concept uitlegt.
 */
export const VOORUITWIJZINGEN: { les: string; concept: string; reden: string }[] = [
  {
    les: 'html-css/tekst-opmaken-css',
    concept: 'css-rem',
    reden:
      'de eerste CSS-les moet een lettergrootte kiezen; `2rem` met een :::info die vooruitwijst',
  },
  {
    les: 'html-css/css-klassen',
    concept: 'css-rem',
    reden: 'gegeven CSS gebruikt rem als lengte; de les zelf gaat over klassen',
  },
  {
    les: 'html-css/pseudo-klassen',
    concept: 'css-rem',
    reden: 'gegeven CSS gebruikt rem als lengte; de les zelf gaat over pseudo-klassen',
  },
  {
    les: 'html-css/flexbox',
    concept: 'css-rem',
    reden: 'gegeven CSS gebruikt rem als lengte; de les zelf gaat over flex',
  },
  {
    les: 'html-css/border-en-dimensies',
    concept: 'css-percent',
    reden: '`border-radius: 50%` is de manier om een cirkel te maken, en die hoort bij border',
  },
  {
    les: 'js-basics/inline-onclick',
    concept: 'js-text-content',
    reden: 'een knop moet iets zichtbaars doen; deze les gaat over het vinden van het element',
  },
];

// Concepten die de nakijker niet meet omdat een leerling ze niet "aanzet",
// en concepten die hij op een andere manier herkent dan met een patroon.
// Een id dat hier staat vervangt dat uit `curriculum.ts`.
export const EXTRA_TECHNIEKEN: Technique[] = [
  {
    id: 'css-nesting',
    category: 'css',
    group: 'Selectors',
    label: 'geneste selector (.kaart h2)',
    // Een selectorregel met twee delen: `.kaart h2 {`. Alleen aan het begin
    // van een regel, zodat `margin: 0 auto;` niet meetelt.
    pattern: /^[.#]?[\w-]+(?:\s*[>+~]\s*|\s+)[.#]?[\w-]+[^;{}]*\{/gm,
    level: 'gevorderd',
  },
  {
    id: 'js-onclick-attribute',
    category: 'js',
    group: 'Events',
    // In curriculum.ts staat hier een patroon dat nooit matcht: de nakijker
    // leest dit attribuut uit de HTML-boom in plaats van uit de tekst.
    label: 'onclick (HTML-attribuut)',
    pattern: /\bonclick\s*=\s*["']/g,
    level: 'gevorderd',
  },
];

/** Elk concept-id dat we kunnen herkennen, met zijn patroon. */
export function alleConcepten(): Technique[] {
  const eigen = new Set(EXTRA_TECHNIEKEN.map((t) => t.id));
  return [
    ...[...CSS_TECHNIQUES, ...JS_TECHNIQUES].filter((t) => !eigen.has(t.id)),
    ...EXTRA_TECHNIEKEN,
  ];
}

/** De html-element-ids, één per tag: `html-div`, `html-span`, … */
export function htmlConcepten(): string[] {
  return HTML_ELEMENTS.flatMap((e) => e.tags.map((t) => `html-${t}`));
}

/**
 * Waaraan je ziet dat een pagina een concept noemt, ook als hij het niet in
 * code toont: `grid-template-rows` staat alleen in een overzichtstabel.
 */
export function noemtConcept(paginaTekst: string, id: string): boolean {
  if (id.startsWith('html-')) {
    return new RegExp(`<${id.slice('html-'.length)}[\\s>/\`]`).test(paginaTekst);
  }
  const techniek = alleConcepten().find((t) => t.id === id);
  if (!techniek) return false;
  const los = new RegExp(techniek.pattern.source, techniek.pattern.flags.replace('g', ''));
  if (los.test(paginaTekst)) return true;
  const woord = techniek.label.match(/[\w-]+/)?.[0];
  return woord ? new RegExp(`\\b${woord}\\b`).test(paginaTekst) : false;
}

import type { HtmlElementInfo, Technique } from './curriculum-types';

// Bron: sites/web/src/pages/cheatsheet.mdx. Dit bestand is bewust 1-op-1
// afgeleid van de cheatsheet — wijzig je een les daar, werk dan ook hier de
// bijbehorende regel bij, zodat het rapport aansluit bij wat er onderwezen
// wordt.

export const HTML_ELEMENTS: HtmlElementInfo[] = [
  {
    tags: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
    label: '<h1>–<h6> — koppen',
    level: 'basis',
    group: 'Koppen',
  },
  { tags: ['p'], label: '<p> — paragraaf', level: 'basis', group: 'Tekst' },
  { tags: ['b'], label: '<b> — vetgedrukt', level: 'basis', group: 'Tekst' },
  { tags: ['i'], label: '<i> — cursief', level: 'basis', group: 'Tekst' },
  { tags: ['ul'], label: '<ul> — ongenummerde lijst', level: 'basis', group: 'Lijsten' },
  { tags: ['ol'], label: '<ol> — genummerde lijst', level: 'basis', group: 'Lijsten' },
  { tags: ['li'], label: '<li> — lijst-item', level: 'basis', group: 'Lijsten' },
  { tags: ['img'], label: '<img> — afbeelding', level: 'basis', group: 'Afbeeldingen en links' },
  { tags: ['a'], label: '<a> — link', level: 'basis', group: 'Afbeeldingen en links' },
  { tags: ['header'], label: '<header>', level: 'basis', group: 'Semantische opbouw' },
  { tags: ['nav'], label: '<nav>', level: 'basis', group: 'Semantische opbouw' },
  { tags: ['main'], label: '<main>', level: 'basis', group: 'Semantische opbouw' },
  { tags: ['section'], label: '<section>', level: 'basis', group: 'Semantische opbouw' },
  { tags: ['article'], label: '<article>', level: 'basis', group: 'Semantische opbouw' },
  { tags: ['footer'], label: '<footer>', level: 'basis', group: 'Semantische opbouw' },
  { tags: ['form'], label: '<form>', level: 'gevorderd', group: 'Formulieren' },
  { tags: ['input'], label: '<input>', level: 'gevorderd', group: 'Formulieren' },
  { tags: ['label'], label: '<label>', level: 'gevorderd', group: 'Formulieren' },
  { tags: ['textarea'], label: '<textarea>', level: 'gevorderd', group: 'Formulieren' },
  { tags: ['select'], label: '<select>', level: 'gevorderd', group: 'Formulieren' },
  { tags: ['option'], label: '<option>', level: 'gevorderd', group: 'Formulieren' },
  { tags: ['span'], label: '<span>', level: 'basis', group: 'Groeperingen' },
  { tags: ['div'], label: '<div>', level: 'basis', group: 'Groeperingen' },
  { tags: ['button'], label: '<button>', level: 'gevorderd', group: 'Formulieren' },
];

export const CSS_TECHNIQUES: Technique[] = [
  // Tekst opmaken
  {
    id: 'css-color',
    category: 'css',
    group: 'Tekst opmaken',
    label: 'color',
    pattern: /(?<![\w-])color\s*:/g,
    level: 'basis',
  },
  {
    id: 'css-font-size',
    category: 'css',
    group: 'Tekst opmaken',
    label: 'font-size',
    pattern: /font-size\s*:/g,
    level: 'basis',
  },
  {
    id: 'css-font-family',
    category: 'css',
    group: 'Tekst opmaken',
    label: 'font-family',
    pattern: /font-family\s*:/g,
    level: 'basis',
  },

  // Eenheden
  {
    id: 'css-rem',
    category: 'css',
    group: 'Eenheden',
    label: 'rem',
    pattern: /\d+(\.\d+)?rem\b/g,
    level: 'gevorderd',
  },
  {
    id: 'css-em',
    category: 'css',
    group: 'Eenheden',
    label: 'em',
    pattern: /\d+(\.\d+)?em\b/g,
    level: 'gevorderd',
  },
  {
    id: 'css-percent',
    category: 'css',
    group: 'Eenheden',
    label: '% (procent)',
    pattern: /\d+(\.\d+)?%/g,
    level: 'gevorderd',
  },

  // Box-model
  {
    id: 'css-background-color',
    category: 'css',
    group: 'Box-model',
    label: 'background-color',
    pattern: /background-color\s*:/g,
    level: 'basis',
  },
  {
    id: 'css-padding',
    category: 'css',
    group: 'Box-model',
    label: 'padding',
    pattern: /(?<![\w-])padding\s*:/g,
    level: 'basis',
  },
  {
    id: 'css-margin',
    category: 'css',
    group: 'Box-model',
    label: 'margin',
    pattern: /(?<![\w-])margin\s*:/g,
    level: 'basis',
  },
  {
    id: 'css-border',
    category: 'css',
    group: 'Box-model',
    label: 'border',
    pattern: /(?<![\w-])border\s*:/g,
    level: 'basis',
  },
  {
    id: 'css-border-radius',
    category: 'css',
    group: 'Box-model',
    label: 'border-radius',
    pattern: /border-radius\s*:/g,
    level: 'basis',
  },
  {
    id: 'css-box-sizing',
    category: 'css',
    group: 'Box-model',
    label: 'box-sizing: border-box',
    pattern: /box-sizing\s*:\s*border-box/g,
    level: 'gevorderd',
  },

  // Breedte en hoogte
  {
    id: 'css-width',
    category: 'css',
    group: 'Breedte en hoogte',
    label: 'width',
    pattern: /(?<![\w-])width\s*:/g,
    level: 'basis',
  },
  {
    id: 'css-height',
    category: 'css',
    group: 'Breedte en hoogte',
    label: 'height',
    pattern: /(?<![\w-])height\s*:/g,
    level: 'basis',
  },

  // Selectoren
  {
    id: 'css-class-selector',
    category: 'css',
    group: 'Selectoren',
    label: 'klasse-selector (.naam)',
    pattern: /\.[a-zA-Z_-][\w-]*\s*[{,]/g,
    level: 'basis',
  },
  {
    id: 'css-id-selector',
    category: 'css',
    group: 'Selectoren',
    label: 'id-selector (#naam)',
    pattern: /#[a-zA-Z_-][\w-]*\s*[{,]/g,
    level: 'gevorderd',
  },
  {
    id: 'css-hover',
    category: 'css',
    group: 'Selectoren',
    label: ':hover',
    pattern: /:hover\b/g,
    level: 'basis',
  },
  {
    id: 'css-first-child',
    category: 'css',
    group: 'Selectoren',
    label: ':first-child',
    pattern: /:first-child\b/g,
    level: 'gevorderd',
  },
  {
    id: 'css-last-child',
    category: 'css',
    group: 'Selectoren',
    label: ':last-child',
    pattern: /:last-child\b/g,
    level: 'gevorderd',
  },
  {
    id: 'css-nth-child',
    category: 'css',
    group: 'Selectoren',
    label: ':nth-child()',
    pattern: /:nth-child\s*\(/g,
    level: 'gevorderd',
  },

  // Display-types
  {
    id: 'css-display-block-inline',
    category: 'css',
    group: 'Display-types',
    label: 'display: block/inline/inline-block',
    pattern: /display\s*:\s*(block|inline-block|inline)\b/g,
    level: 'basis',
  },

  // Flexbox
  {
    id: 'css-display-flex',
    category: 'css',
    group: 'Flexbox',
    label: 'display: flex',
    pattern: /display\s*:\s*(inline-flex|flex)\b/g,
    level: 'gevorderd',
  },
  {
    id: 'css-justify-content',
    category: 'css',
    group: 'Flexbox',
    label: 'justify-content',
    pattern: /justify-content\s*:/g,
    level: 'gevorderd',
  },
  {
    id: 'css-align-items',
    category: 'css',
    group: 'Flexbox',
    label: 'align-items',
    pattern: /align-items\s*:/g,
    level: 'gevorderd',
  },
  {
    id: 'css-gap',
    category: 'css',
    group: 'Flexbox',
    label: 'gap',
    pattern: /(?<![\w-])gap\s*:/g,
    level: 'gevorderd',
  },
  {
    id: 'css-flex-direction',
    category: 'css',
    group: 'Flexbox',
    label: 'flex-direction',
    pattern: /flex-direction\s*:/g,
    level: 'gevorderd',
  },

  // Position
  {
    id: 'css-position',
    category: 'css',
    group: 'Position',
    label: 'position: relative/absolute/fixed',
    pattern: /(?<![\w-])position\s*:\s*(relative|absolute|fixed|sticky)/g,
    level: 'gevorderd',
  },
  {
    id: 'css-offsets',
    category: 'css',
    group: 'Position',
    label: 'top/right/bottom/left',
    pattern: /(?<![\w-])(top|right|bottom|left)\s*:/g,
    level: 'gevorderd',
  },

  // Grid
  {
    id: 'css-display-grid',
    category: 'css',
    group: 'Grid',
    label: 'display: grid',
    pattern: /display\s*:\s*grid\b/g,
    level: 'gevorderd',
  },
  {
    id: 'css-grid-template-columns',
    category: 'css',
    group: 'Grid',
    label: 'grid-template-columns',
    pattern: /grid-template-columns\s*:/g,
    level: 'gevorderd',
  },
  {
    id: 'css-grid-template-rows',
    category: 'css',
    group: 'Grid',
    label: 'grid-template-rows',
    pattern: /grid-template-rows\s*:/g,
    level: 'gevorderd',
  },
  {
    id: 'css-grid-column',
    category: 'css',
    group: 'Grid',
    label: 'grid-column',
    pattern: /grid-column\s*:/g,
    level: 'gevorderd',
  },

  // Media queries
  {
    id: 'css-media-query',
    category: 'css',
    group: 'Media queries',
    label: '@media (max-width/min-width)',
    pattern: /@media[^{]*\(\s*(max|min)-width/g,
    level: 'gevorderd',
  },
];

export const JS_TECHNIQUES: Technique[] = [
  // DOM-selectie
  {
    id: 'js-get-element-by-id',
    category: 'js',
    group: 'DOM-selectie',
    label: 'getElementById()',
    pattern: /\bgetElementById\s*\(/g,
    level: 'basis',
  },
  {
    id: 'js-query-selector',
    category: 'js',
    group: 'DOM-selectie',
    label: 'querySelector()',
    pattern: /\bquerySelector\s*\(/g,
    level: 'basis',
  },
  {
    id: 'js-query-selector-all',
    category: 'js',
    group: 'DOM-selectie',
    label: 'querySelectorAll()',
    pattern: /\bquerySelectorAll\s*\(/g,
    level: 'basis',
  },

  // DOM-manipulatie
  {
    id: 'js-text-content',
    category: 'js',
    group: 'DOM-manipulatie',
    label: '.textContent',
    pattern: /\.textContent\b/g,
    level: 'basis',
  },
  {
    id: 'js-style',
    category: 'js',
    group: 'DOM-manipulatie',
    label: '.style.xxx',
    pattern: /\.style\.[a-zA-Z]/g,
    level: 'basis',
  },
  {
    id: 'js-class-list',
    category: 'js',
    group: 'DOM-manipulatie',
    label: '.classList (add/remove/toggle/contains)',
    pattern: /\.classList\.(add|remove|toggle|contains)\s*\(/g,
    level: 'basis',
  },

  // Functies en scripts
  {
    id: 'js-function',
    category: 'js',
    group: 'Functies en scripts',
    label: 'function ...() { }',
    pattern: /\bfunction\s+\w+\s*\(/g,
    level: 'gevorderd',
  },

  // Waarden en operatoren
  {
    id: 'js-typeof',
    category: 'js',
    group: 'Waarden en operatoren',
    label: 'typeof',
    pattern: /\btypeof\b/g,
    level: 'gevorderd',
  },
  {
    id: 'js-template-literal',
    category: 'js',
    group: 'Waarden en operatoren',
    label: 'template literal (`${...}`)',
    pattern: /`[^`]*\$\{/g,
    level: 'gevorderd',
  },
  {
    id: 'js-strict-equality',
    category: 'js',
    group: 'Waarden en operatoren',
    label: '=== / !==',
    pattern: /(===|!==)/g,
    level: 'gevorderd',
  },
  {
    id: 'js-logical-operators',
    category: 'js',
    group: 'Waarden en operatoren',
    label: '&& / ||',
    pattern: /(&&|\|\|)/g,
    level: 'gevorderd',
  },

  // Variabelen
  {
    id: 'js-let',
    category: 'js',
    group: 'Variabelen',
    label: 'let',
    pattern: /\blet\s+[a-zA-Z_$]/g,
    level: 'basis',
  },
  {
    id: 'js-const',
    category: 'js',
    group: 'Variabelen',
    label: 'const',
    pattern: /\bconst\s+[a-zA-Z_$]/g,
    level: 'basis',
  },

  // Beslissingen
  {
    id: 'js-if-else',
    category: 'js',
    group: 'Beslissingen',
    label: 'if / else',
    pattern: /\bif\s*\(/g,
    level: 'gevorderd',
  },

  // Events
  {
    id: 'js-add-event-listener',
    category: 'js',
    group: 'Events',
    label: 'addEventListener()',
    pattern: /\baddEventListener\s*\(/g,
    level: 'gevorderd',
  },
  // Telling komt uit analyzeHtml.ts (onclick-attributen), niet uit JS-broncode —
  // deze regex matcht bewust nooit iets; analyze.ts vult de echte count in.
  {
    id: 'js-onclick-attribute',
    category: 'js',
    group: 'Events',
    label: 'onclick="..." (HTML-attribuut)',
    pattern: /(?!)/g,
    level: 'gevorderd',
  },

  // Formulier-data ophalen
  {
    id: 'js-value',
    category: 'js',
    group: 'Formulier-data ophalen',
    label: '.value',
    pattern: /\.value\b/g,
    level: 'gevorderd',
  },
  {
    id: 'js-number',
    category: 'js',
    group: 'Formulier-data ophalen',
    label: 'Number(...)',
    pattern: /\bNumber\s*\(/g,
    level: 'gevorderd',
  },

  // prompt & alert
  {
    id: 'js-prompt',
    category: 'js',
    group: 'prompt & alert',
    label: 'prompt()',
    pattern: /\bprompt\s*\(/g,
    level: 'basis',
  },
  {
    id: 'js-alert',
    category: 'js',
    group: 'prompt & alert',
    label: 'alert()',
    pattern: /\balert\s*\(/g,
    level: 'basis',
  },

  // Loops
  {
    id: 'js-for',
    category: 'js',
    group: 'Loops',
    label: 'for-loop',
    pattern: /\bfor\s*\(/g,
    level: 'gevorderd',
  },
  {
    id: 'js-while',
    category: 'js',
    group: 'Loops',
    label: 'while-loop',
    pattern: /\bwhile\s*\(/g,
    level: 'gevorderd',
  },

  // Arrays
  {
    id: 'js-array-literal',
    category: 'js',
    group: 'Arrays',
    label: 'array ([...])',
    pattern: /=\s*\[/g,
    level: 'gevorderd',
  },
  {
    id: 'js-array-length',
    category: 'js',
    group: 'Arrays',
    label: '.length',
    pattern: /\.length\b/g,
    level: 'gevorderd',
  },
  {
    id: 'js-array-push',
    category: 'js',
    group: 'Arrays',
    label: '.push()',
    pattern: /\.push\s*\(/g,
    level: 'gevorderd',
  },
];

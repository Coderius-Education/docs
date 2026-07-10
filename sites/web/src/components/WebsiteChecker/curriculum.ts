import type { HtmlElementInfo, Technique } from './types';

// Bron: sites/web/src/pages/cheatsheet.mdx. Dit bestand is bewust 1-op-1
// afgeleid van de cheatsheet — wijzig je een les daar, werk dan ook hier de
// bijbehorende regel bij, zodat het rapport aansluit bij wat er onderwezen
// wordt.

export const HTML_ELEMENTS: HtmlElementInfo[] = [
  { tag: 'h1', label: '<h1> — hoofdkop' },
  { tag: 'h2', label: '<h2> — tussenkop' },
  { tag: 'h3', label: '<h3> — subkop' },
  { tag: 'h4', label: '<h4> — subkop' },
  { tag: 'h5', label: '<h5> — subkop' },
  { tag: 'h6', label: '<h6> — subkop' },
  { tag: 'p', label: '<p> — paragraaf' },
  { tag: 'b', label: '<b> — vetgedrukt' },
  { tag: 'i', label: '<i> — cursief' },
  { tag: 'ul', label: '<ul> — ongenummerde lijst' },
  { tag: 'ol', label: '<ol> — genummerde lijst' },
  { tag: 'li', label: '<li> — lijst-item' },
  { tag: 'img', label: '<img> — afbeelding' },
  { tag: 'a', label: '<a> — link' },
  { tag: 'header', label: '<header>' },
  { tag: 'nav', label: '<nav>' },
  { tag: 'main', label: '<main>' },
  { tag: 'section', label: '<section>' },
  { tag: 'article', label: '<article>' },
  { tag: 'footer', label: '<footer>' },
  { tag: 'form', label: '<form>' },
  { tag: 'input', label: '<input>' },
  { tag: 'label', label: '<label>' },
  { tag: 'textarea', label: '<textarea>' },
  { tag: 'select', label: '<select>' },
  { tag: 'option', label: '<option>' },
  { tag: 'span', label: '<span>' },
  { tag: 'div', label: '<div>' },
  { tag: 'button', label: '<button>' },
];

export const CSS_TECHNIQUES: Technique[] = [
  // Tekst opmaken
  {
    id: 'css-color',
    category: 'css',
    group: 'Tekst opmaken',
    label: 'color',
    pattern: /(?<![\w-])color\s*:/g,
  },
  {
    id: 'css-font-size',
    category: 'css',
    group: 'Tekst opmaken',
    label: 'font-size',
    pattern: /font-size\s*:/g,
  },
  {
    id: 'css-font-family',
    category: 'css',
    group: 'Tekst opmaken',
    label: 'font-family',
    pattern: /font-family\s*:/g,
  },

  // Eenheden
  { id: 'css-rem', category: 'css', group: 'Eenheden', label: 'rem', pattern: /\d+(\.\d+)?rem\b/g },
  { id: 'css-em', category: 'css', group: 'Eenheden', label: 'em', pattern: /\d+(\.\d+)?em\b/g },
  {
    id: 'css-percent',
    category: 'css',
    group: 'Eenheden',
    label: '% (procent)',
    pattern: /\d+(\.\d+)?%/g,
  },

  // Box-model
  {
    id: 'css-background-color',
    category: 'css',
    group: 'Box-model',
    label: 'background-color',
    pattern: /background-color\s*:/g,
  },
  {
    id: 'css-padding',
    category: 'css',
    group: 'Box-model',
    label: 'padding',
    pattern: /(?<![\w-])padding\s*:/g,
  },
  {
    id: 'css-margin',
    category: 'css',
    group: 'Box-model',
    label: 'margin',
    pattern: /(?<![\w-])margin\s*:/g,
  },
  {
    id: 'css-border',
    category: 'css',
    group: 'Box-model',
    label: 'border',
    pattern: /(?<![\w-])border\s*:/g,
  },
  {
    id: 'css-border-radius',
    category: 'css',
    group: 'Box-model',
    label: 'border-radius',
    pattern: /border-radius\s*:/g,
  },
  {
    id: 'css-box-sizing',
    category: 'css',
    group: 'Box-model',
    label: 'box-sizing: border-box',
    pattern: /box-sizing\s*:\s*border-box/g,
  },

  // Breedte en hoogte
  {
    id: 'css-width',
    category: 'css',
    group: 'Breedte en hoogte',
    label: 'width',
    pattern: /(?<![\w-])width\s*:/g,
  },
  {
    id: 'css-height',
    category: 'css',
    group: 'Breedte en hoogte',
    label: 'height',
    pattern: /(?<![\w-])height\s*:/g,
  },

  // Selectoren
  {
    id: 'css-class-selector',
    category: 'css',
    group: 'Selectoren',
    label: 'klasse-selector (.naam)',
    pattern: /\.[a-zA-Z_-][\w-]*\s*[{,]/g,
  },
  {
    id: 'css-id-selector',
    category: 'css',
    group: 'Selectoren',
    label: 'id-selector (#naam)',
    pattern: /#[a-zA-Z_-][\w-]*\s*[{,]/g,
  },
  { id: 'css-hover', category: 'css', group: 'Selectoren', label: ':hover', pattern: /:hover\b/g },
  {
    id: 'css-first-child',
    category: 'css',
    group: 'Selectoren',
    label: ':first-child',
    pattern: /:first-child\b/g,
  },
  {
    id: 'css-last-child',
    category: 'css',
    group: 'Selectoren',
    label: ':last-child',
    pattern: /:last-child\b/g,
  },
  {
    id: 'css-nth-child',
    category: 'css',
    group: 'Selectoren',
    label: ':nth-child()',
    pattern: /:nth-child\s*\(/g,
  },

  // Display-types
  {
    id: 'css-display-block-inline',
    category: 'css',
    group: 'Display-types',
    label: 'display: block/inline/inline-block',
    pattern: /display\s*:\s*(block|inline-block|inline)\b/g,
  },

  // Flexbox
  {
    id: 'css-display-flex',
    category: 'css',
    group: 'Flexbox',
    label: 'display: flex',
    pattern: /display\s*:\s*(inline-flex|flex)\b/g,
  },
  {
    id: 'css-justify-content',
    category: 'css',
    group: 'Flexbox',
    label: 'justify-content',
    pattern: /justify-content\s*:/g,
  },
  {
    id: 'css-align-items',
    category: 'css',
    group: 'Flexbox',
    label: 'align-items',
    pattern: /align-items\s*:/g,
  },
  { id: 'css-gap', category: 'css', group: 'Flexbox', label: 'gap', pattern: /(?<![\w-])gap\s*:/g },
  {
    id: 'css-flex-direction',
    category: 'css',
    group: 'Flexbox',
    label: 'flex-direction',
    pattern: /flex-direction\s*:/g,
  },

  // Position
  {
    id: 'css-position',
    category: 'css',
    group: 'Position',
    label: 'position: relative/absolute/fixed',
    pattern: /(?<![\w-])position\s*:\s*(relative|absolute|fixed|sticky)/g,
  },
  {
    id: 'css-offsets',
    category: 'css',
    group: 'Position',
    label: 'top/right/bottom/left',
    pattern: /(?<![\w-])(top|right|bottom|left)\s*:/g,
  },

  // Grid
  {
    id: 'css-display-grid',
    category: 'css',
    group: 'Grid',
    label: 'display: grid',
    pattern: /display\s*:\s*grid\b/g,
  },
  {
    id: 'css-grid-template-columns',
    category: 'css',
    group: 'Grid',
    label: 'grid-template-columns',
    pattern: /grid-template-columns\s*:/g,
  },
  {
    id: 'css-grid-template-rows',
    category: 'css',
    group: 'Grid',
    label: 'grid-template-rows',
    pattern: /grid-template-rows\s*:/g,
  },
  {
    id: 'css-grid-column',
    category: 'css',
    group: 'Grid',
    label: 'grid-column',
    pattern: /grid-column\s*:/g,
  },

  // Media queries
  {
    id: 'css-media-query',
    category: 'css',
    group: 'Media queries',
    label: '@media (max-width/min-width)',
    pattern: /@media[^{]*\(\s*(max|min)-width/g,
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
  },
  {
    id: 'js-query-selector',
    category: 'js',
    group: 'DOM-selectie',
    label: 'querySelector()',
    pattern: /\bquerySelector\s*\(/g,
  },
  {
    id: 'js-query-selector-all',
    category: 'js',
    group: 'DOM-selectie',
    label: 'querySelectorAll()',
    pattern: /\bquerySelectorAll\s*\(/g,
  },

  // DOM-manipulatie
  {
    id: 'js-text-content',
    category: 'js',
    group: 'DOM-manipulatie',
    label: '.textContent',
    pattern: /\.textContent\b/g,
  },
  {
    id: 'js-style',
    category: 'js',
    group: 'DOM-manipulatie',
    label: '.style.xxx',
    pattern: /\.style\.[a-zA-Z]/g,
  },
  {
    id: 'js-class-list',
    category: 'js',
    group: 'DOM-manipulatie',
    label: '.classList (add/remove/toggle/contains)',
    pattern: /\.classList\.(add|remove|toggle|contains)\s*\(/g,
  },

  // Functies en scripts
  {
    id: 'js-function',
    category: 'js',
    group: 'Functies en scripts',
    label: 'function ...() { }',
    pattern: /\bfunction\s+\w+\s*\(/g,
  },

  // Waarden en operatoren
  {
    id: 'js-typeof',
    category: 'js',
    group: 'Waarden en operatoren',
    label: 'typeof',
    pattern: /\btypeof\b/g,
  },
  {
    id: 'js-template-literal',
    category: 'js',
    group: 'Waarden en operatoren',
    label: 'template literal (`${...}`)',
    pattern: /`[^`]*\$\{/g,
  },
  {
    id: 'js-strict-equality',
    category: 'js',
    group: 'Waarden en operatoren',
    label: '=== / !==',
    pattern: /(===|!==)/g,
  },
  {
    id: 'js-logical-operators',
    category: 'js',
    group: 'Waarden en operatoren',
    label: '&& / ||',
    pattern: /(&&|\|\|)/g,
  },

  // Variabelen
  {
    id: 'js-let',
    category: 'js',
    group: 'Variabelen',
    label: 'let',
    pattern: /\blet\s+[a-zA-Z_$]/g,
  },
  {
    id: 'js-const',
    category: 'js',
    group: 'Variabelen',
    label: 'const',
    pattern: /\bconst\s+[a-zA-Z_$]/g,
  },

  // Beslissingen
  {
    id: 'js-if-else',
    category: 'js',
    group: 'Beslissingen',
    label: 'if / else',
    pattern: /\bif\s*\(/g,
  },

  // Events
  {
    id: 'js-add-event-listener',
    category: 'js',
    group: 'Events',
    label: 'addEventListener()',
    pattern: /\baddEventListener\s*\(/g,
  },
  // Telling komt uit analyzeHtml.ts (onclick-attributen), niet uit JS-broncode —
  // deze regex matcht bewust nooit iets; analyze.ts vult de echte count in.
  {
    id: 'js-onclick-attribute',
    category: 'js',
    group: 'Events',
    label: 'onclick="..." (HTML-attribuut)',
    pattern: /(?!)/g,
  },

  // Formulier-data ophalen
  {
    id: 'js-value',
    category: 'js',
    group: 'Formulier-data ophalen',
    label: '.value',
    pattern: /\.value\b/g,
  },
  {
    id: 'js-number',
    category: 'js',
    group: 'Formulier-data ophalen',
    label: 'Number(...)',
    pattern: /\bNumber\s*\(/g,
  },

  // prompt & alert
  {
    id: 'js-prompt',
    category: 'js',
    group: 'prompt & alert',
    label: 'prompt()',
    pattern: /\bprompt\s*\(/g,
  },
  {
    id: 'js-alert',
    category: 'js',
    group: 'prompt & alert',
    label: 'alert()',
    pattern: /\balert\s*\(/g,
  },

  // Loops
  { id: 'js-for', category: 'js', group: 'Loops', label: 'for-loop', pattern: /\bfor\s*\(/g },
  { id: 'js-while', category: 'js', group: 'Loops', label: 'while-loop', pattern: /\bwhile\s*\(/g },

  // Arrays
  {
    id: 'js-array-literal',
    category: 'js',
    group: 'Arrays',
    label: 'array ([...])',
    pattern: /=\s*\[/g,
  },
  {
    id: 'js-array-length',
    category: 'js',
    group: 'Arrays',
    label: '.length',
    pattern: /\.length\b/g,
  },
  {
    id: 'js-array-push',
    category: 'js',
    group: 'Arrays',
    label: '.push()',
    pattern: /\.push\s*\(/g,
  },
];

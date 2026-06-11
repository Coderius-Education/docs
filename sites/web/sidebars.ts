import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

/**
 * Handmatige sidebar-volgorde — onafhankelijk van het bestandsnummer.
 *
 * Reden: lessen 13 (Eenheden) en 14 (Display & <span>) zijn later toegevoegd
 * met hogere nummers, maar horen didactisch eerder in de leerlijn:
 * eenheden vóór CSS-properties die ze gebruiken, display-types vóór Flexbox.
 *
 * Doc-IDs gebruiken de slug (zonder nummerprefiks) — Docusaurus strip die automatisch.
 */
const sidebars: SidebarsConfig = {
  htmlCssSidebar: [
    'html-css/intro-html',
    'html-css/koppen-lijsten',
    'html-css/tekst-opmaken-css',
    'html-css/eenheden',
    'html-css/afbeeldingen',
    'html-css/paginas-koppelen',
    'html-css/elementen-opmaken',
    'html-css/display-en-span',
    'html-css/css-klassen',
    'html-css/pseudo-klassen',
    'html-css/flexbox',
    'html-css/border-en-dimensies',
    'html-css/position',
    'html-css/media-queries',
    'html-css/css-grid',
    'html-css/semantische-html',
    'html-css/formulieren',
  ],
  jsSidebar: [
    'js-basics/intro-javascript',
    'js-basics/inline-onclick',
    'js-basics/inline-stijl',
    'js-basics/script-tag',
    'js-basics/scriptjs',
    'js-basics/variabelen',
    'js-basics/events',
    'js-basics/operatoren-types',
    'js-basics/if-else',
    'js-basics/formulier-data',
    'js-basics/prompt-alert',
    'js-basics/loops',
    'js-basics/arrays',
    'js-basics/modern-dom',
  ],
};

export default sidebars;

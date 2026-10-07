import type { SidebarsConfig } from '@docusaurus/plugin-content-docs';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

/**
 * Handmatige sidebar-volgorde — onafhankelijk van het bestandsnummer.
 *
 * Deze volgorde is de leerlijn: `src/data/leerlijn.ts` legt per les vast welke
 * concepten hij introduceert, en `src/docs-tests/leerlijn.test.ts` weert code
 * die vooruitloopt op een latere les. Verschuif je hier iets, dan valt die
 * test om zodra de nieuwe plek een concept te vroeg maakt.
 *
 * Display & <span> hoort vóór Flexbox — je kunt geen flex-container
 * uitleggen zonder block en inline — maar ná CSS-klassen: een `<span>` is
 * alleen nuttig als je hem kunt aanwijzen, en dat doe je met een klasse.
 *
 * Eenheden stond eerder op plek 4, "vóór de properties die ze gebruiken".
 * Dat werkte averechts: op die plek kende de leerling alleen font-size, dus
 * de les demonstreerde `%` en `em` op padding, width en een `<div class>` die
 * pas veel later worden uitgelegd. Nu staat hij ná border-en-dimensies, waar
 * al die properties er zijn. Dat een eerdere les al `2rem` gebruikt is geen
 * probleem zolang hij het aankondigt — tekst-opmaken-css doet dat met een
 * `:::info` die hierheen wijst.
 *
 * Doc-IDs gebruiken de slug (zonder nummerprefiks) — Docusaurus strip die automatisch.
 */
const sidebars: SidebarsConfig = {
  htmlCssSidebar: [
    'html-css/intro-html',
    'html-css/koppen-lijsten',
    'html-css/tekst-opmaken-css',
    'html-css/afbeeldingen',
    'html-css/paginas-koppelen',
    'html-css/elementen-opmaken',
    'html-css/css-klassen',
    'html-css/display-en-span',
    'html-css/pseudo-klassen',
    'html-css/flexbox',
    'html-css/border-en-dimensies',
    'html-css/eenheden',
    'html-css/position',
    'html-css/css-selectors',
    'html-css/media-queries',
    'html-css/css-grid',
    'html-css/semantische-html',
    'html-css/formulieren',
  ],
  // De JS-leerlijn wijkt bewust af van de bestandsnamen: events staat direct
  // na variabelen (functies en de teller-variabele zijn er dan net), zodat
  // alle lessen erna de addEventListener-huisstijl gebruiken; prompt/alert
  // volgt meteen zodat de waarden-lessen met echte invoer werken; en
  // formulier-data sluit af als toepassing van alles ervoor. Tot en met
  // variabelen is inline onclick de huisstijl; vanaf events addEventListener.
  jsSidebar: [
    'js-basics/intro-javascript',
    'js-basics/inline-onclick',
    'js-basics/tekst-veranderen',
    'js-basics/inline-stijl',
    'js-basics/script-tag',
    'js-basics/scriptjs',
    'js-basics/variabelen',
    'js-basics/events',
    'js-basics/prompt-alert',
    'js-basics/operatoren-types',
    'js-basics/vergelijken',
    'js-basics/if-else',
    'js-basics/modern-dom',
    'js-basics/loops',
    'js-basics/arrays',
    'js-basics/formulier-data',
  ],
};

export default sidebars;

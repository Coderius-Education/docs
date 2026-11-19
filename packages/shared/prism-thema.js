// De kleuren van code, in licht en donker. Licht is github, donker is
// dracula. De twee thema's kleuren niet dezelfde soorten code: dracula liet
// getallen en True/False wit, terwijl ze in licht blauwgroen zijn (issue
// #158); dracula zet sleutelwoorden als `for`, `in` en `print` cursief,
// github niet (#224); en github laat `range`, `len` en de andere ingebouwde
// functies zwart, terwijl ze in donker paars zijn (#223). Een leerling zag
// zijn code dus van vorm veranderen als hij van stand wisselde.
//
// De regel is nu: een soort code die in de ene stand een kleur heeft, heeft
// die ook in de andere, en cursief is alleen commentaar, in beide standen.
// De kleuren zelf blijven die van github en dracula, behalve waar een stand
// geen kleur had: daar komt de kleur van de verwante soort (een
// attribuutwaarde als tekst, een CSS-eigenschap als getal).
//
// Gebruikt door createConfig (de codeblokken van elke cursus) en de editor
// van de python-runner (HighlightedEditor). prism-thema.test.tsx legt de
// regel en het contrast vast. De CodeMirror-editors van play en robotica
// volgen dezelfde regel met hun eigen kleuren (CODEMIRROR hieronder).

const { themes } = require('prism-react-renderer');

/** De kleur van een getal (en van True en False) in licht en donker. */
const GETAL_KLEUR = '#36acaa';

/** De kleur van een ingebouwde functie (`range`, `len`) in licht. */
const INGEBOUWD_LICHT = '#6f42c1';

const licht = {
  ...themes.github,
  styles: [
    ...themes.github.styles,
    // github kleurde deze soorten niet; dracula wel.
    { types: ['builtin'], style: { color: INGEBOUWD_LICHT } },
    { types: ['char'], style: { color: '#e3116c' } },
    { types: ['changed'], style: { color: '#9a6700' } },
  ],
};

/** Een stijl van dracula zonder cursief: dat is alleen voor commentaar. */
const recht = ({ fontStyle: _cursief, ...stijl }) => stijl;

const donker = {
  ...themes.dracula,
  styles: [
    ...themes.dracula.styles.map((regel) => ({ ...regel, style: recht(regel.style) })),
    { types: ['number', 'boolean'], style: { color: GETAL_KLEUR } },
    // dracula kleurde deze soorten niet; github wel.
    {
      types: ['comment', 'prolog', 'doctype', 'cdata'],
      style: { color: 'rgb(98, 114, 164)', fontStyle: 'italic' },
    },
    { types: ['attr-value'], style: { color: 'rgb(255, 121, 198)' } },
    { types: ['entity', 'url', 'symbol', 'property', 'regex'], style: { color: GETAL_KLEUR } },
    { types: ['atrule'], style: { color: 'rgb(241, 250, 140)' } },
    { types: ['function-variable'], style: { color: 'rgb(80, 250, 123)' } },
    { types: ['namespace'], style: { opacity: 0.7 } },
  ],
};

/**
 * De kleuren van de CodeMirror-editors (play, robotica), per soort code in
 * licht en donker. Licht zijn de kleuren van `defaultHighlightStyle`, donker
 * die van oneDark. Die twee kleurden niet dezelfde soorten: oneDark gaf elke
 * variabele en elke aanroep (`range(`, `print(`) een kleur, de lichte stijl
 * niet; en oneDark gaf `in` een andere kleur dan `for`. Hier staan beide
 * standen in één lijst, zodat een soort in beide standen een kleur heeft of
 * in geen van beide. Getallen zijn in donker groen, zoals in licht (#158).
 *
 * De lijst noemt de soorten bij naam; `codeMirrorStijlen` maakt er met de
 * `tags` en `HighlightStyle` van de site twee stijlen van. Zo hoeft dit
 * pakket CodeMirror niet zelf te laden, en heeft de site maar één kopie.
 */
const CODEMIRROR = [
  { soorten: [['keyword'], ['self']], licht: '#708', donker: '#c678dd' },
  { soorten: [['comment']], licht: '#940', donker: '#7d8799' },
  { soorten: [['string']], licht: '#a11', donker: '#98c379' },
  { soorten: [['number']], licht: '#164', donker: '#3ecf8e' },
  { soorten: [['bool'], ['null'], ['atom']], licht: '#219', donker: '#d19a66' },
  {
    soorten: [
      ['function', 'variableName'],
      ['function', 'propertyName'],
      ['function', 'definition', 'variableName'],
    ],
    licht: '#00f',
    donker: '#61afef',
  },
  { soorten: [['className']], licht: '#167', donker: '#e5c07b' },
  { soorten: [['invalid']], licht: '#f00', donker: '#ff6b6b' },
];

/**
 * De lichte en de donkere stijl van een CodeMirror-editor.
 *
 * @param {{ HighlightStyle: { define: (specs: object[]) => unknown }, tags: Record<string, any> }} cm
 *   `HighlightStyle` uit `@codemirror/language` en `tags` uit `@lezer/highlight`
 * @returns {{ licht: any, donker: any }}
 */
function codeMirrorStijlen({ HighlightStyle, tags }) {
  // ['function', 'definition', 'variableName'] wordt
  // tags.function(tags.definition(tags.variableName)).
  const tag = (pad) => pad.slice(0, -1).reduceRight((t, mod) => tags[mod](t), tags[pad.at(-1)]);
  const stijl = (stand) =>
    HighlightStyle.define(
      CODEMIRROR.map((regel) => ({ tag: regel.soorten.map(tag), color: regel[stand] })),
    );
  return { licht: stijl('licht'), donker: stijl('donker') };
}

module.exports = { GETAL_KLEUR, INGEBOUWD_LICHT, CODEMIRROR, codeMirrorStijlen, licht, donker };

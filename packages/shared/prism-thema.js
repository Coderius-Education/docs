// De kleuren van Python-code, in licht en donker. Licht is github, donker is
// dracula, maar dracula kleurt getallen en True/False niet: die werden in
// donker wit, terwijl ze in licht blauwgroen zijn. Een leerling zag zijn
// getallen dus hun kleur verliezen (issue #158). Nu
// hebben getallen en True/False in beide standen dezelfde kleur.
//
// Gebruikt door createConfig (de codeblokken van elke cursus), de editor van
// de python-runner (HighlightedEditor) en de CodeMirror-editor van play.
// prism-thema.test.ts legt de kleuren en het contrast vast.

const { themes } = require('prism-react-renderer');

/** De kleur van een getal (en van True en False) in licht en donker. */
const GETAL_KLEUR = '#36acaa';

const licht = themes.github;

const donker = {
  ...themes.dracula,
  styles: [
    ...themes.dracula.styles,
    { types: ['number', 'boolean'], style: { color: GETAL_KLEUR } },
  ],
};

module.exports = { GETAL_KLEUR, licht, donker };

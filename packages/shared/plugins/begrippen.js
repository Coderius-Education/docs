// Begrippen van een cursus (zie ../begrippen/index.js). createConfig zet deze
// plugin aan als de site `src/begrippen.json` heeft, en hangt remarkBegrippen
// in de docs-plugin:
//  - remarkBegrippen zet bij het bouwen het eerste voorkomen van elk begrip op
//    een pagina in een <Begrip id="…">, met een tooltip;
//  - de plugin zoekt bij elk begrip de titel en het adres van zijn les op, en
//    het adres van de woordenlijst, en zet dat in de globale data, voor
//    <Begrip> en <Woordenlijst>.
//
// Een fout in het bestand, of een les die niet bestaat, stopt de build.

const fs = require('node:fs');
const path = require('node:path');
const { begrippenBestand, leesBegrippen, markeer, slaOver } = require('../begrippen');
const { docsVan } = require('./leerdoelen');

const NAAM = 'coderius-begrippen';

function lees(bestand) {
  return leesBegrippen(JSON.parse(fs.readFileSync(bestand, 'utf8')), bestand);
}

/**
 * Bij elk begrip met een les: de titel en het adres van die les. Een les die
 * niet bestaat is een fout, net als bij de leerdoelen.
 *
 * @param {{begrippen: object[]}} gelezen uit leesBegrippen
 * @param {{id: string, title: string, permalink: string}[]} docs
 */
function koppelLessen(gelezen, docs) {
  const onbekend = [];
  const begrippen = gelezen.begrippen.map(({ vormen, les, anker, ...b }) => {
    if (!les) return b;
    const doc = docs.find((d) => d.id === les);
    if (!doc) {
      onbekend.push(`begrip ${b.id}: les '${les}' bestaat niet`);
      return b;
    }
    return { ...b, les: { titel: doc.title, pad: doc.permalink + (anker ? `#${anker}` : '') } };
  });
  let woordenlijst = null;
  if (gelezen.woordenlijst) {
    woordenlijst = docs.find((d) => d.id === gelezen.woordenlijst)?.permalink ?? null;
    if (!woordenlijst) onbekend.push(`woordenlijst: les '${gelezen.woordenlijst}' bestaat niet`);
  }
  if (onbekend.length) throw new Error(`begrippen.json:\n- ${onbekend.join('\n- ')}`);
  return {
    begrippen: begrippen.sort((a, b) => a.term.localeCompare(b.term, 'nl')),
    woordenlijst,
  };
}

/**
 * De remark-stap. Het doc-id komt uit het pad van het bestand ten opzichte van
 * de docs-map, zoals Docusaurus het maakt (zonder cijferprefix: de cursussen
 * met begrippen hebben er geen).
 *
 * @param {{ bestand: string, docsDir: string }} opties
 */
function remarkBegrippen({ bestand, docsDir }) {
  const { begrippen, overslaan } = lees(bestand);
  return (tree, file) => {
    if (!file.path || !file.path.endsWith('.mdx')) return;
    const docId = path
      .relative(docsDir, file.path)
      .split(path.sep)
      .join('/')
      .replace(/\.mdx$/, '');
    if (docId.startsWith('..') || slaOver(docId, overslaan)) return;
    markeer(tree, begrippen, { docId });
  };
}

module.exports = function begrippenPlugin(context) {
  const bestand = begrippenBestand(context.siteDir);
  lees(bestand);
  return {
    name: NAAM,
    async allContentLoaded({ allContent, actions }) {
      actions.setGlobalData(koppelLessen(lees(bestand), docsVan(allContent)));
    },
    getPathsToWatch: () => [bestand],
  };
};

module.exports.NAAM = NAAM;
module.exports.koppelLessen = koppelLessen;
module.exports.remarkBegrippen = remarkBegrippen;

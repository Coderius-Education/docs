// Leerdoelen van een cursus (zie ../leerdoelen/README.md). createConfig zet
// deze plugin aan als de site `src/leerdoelen.json` heeft:
//  - /leerdoelen: de concepten per niveau, en bij meer niveaus een tabel om
//    ze te vergelijken;
//  - /leerdoelen/<niveau>: één niveau, als er meer dan één is;
//  - /leerdoelen/bloom: de beoordeling volgens Bloom, voor elke cursus gelijk;
//  - na de build: leerdoelen.json in de root van de cursus, voor coderius.nl.
//
// Het bestand wordt bij het maken van de plugin al gelezen en gecontroleerd:
// een fout erin stopt de build, met alle problemen in de melding.

const fs = require('node:fs');
const path = require('node:path');
const { leesLeerdoelen } = require('../leerdoelen');

const COMPONENT = '@coderius/shared/components/Leerdoelen';

/** Het pad van het leerdoelenbestand van een site. */
function leerdoelenBestand(siteDir) {
  return path.join(siteDir, 'src', 'leerdoelen.json');
}

function lees(bestand) {
  return leesLeerdoelen(JSON.parse(fs.readFileSync(bestand, 'utf8')), bestand);
}

/** Wat de plugin na de build in de root van de cursus zet. */
function gepubliceerd(siteId, leerdoelen) {
  return { cursus: siteId ?? null, ...leerdoelen };
}

/** De routes, los van Docusaurus, zodat een test ze kan nalopen. */
function routes(baseUrl, leerdoelen) {
  const lijst = [
    {
      path: `${baseUrl}leerdoelen`,
      component: `${COMPONENT}/LeerdoelenPagina`,
      exact: true,
      props: { leerdoelen },
    },
    {
      path: `${baseUrl}leerdoelen/bloom`,
      component: `${COMPONENT}/BloomPagina`,
      exact: true,
    },
  ];
  if (leerdoelen.niveaus.length > 1) {
    for (const niveau of leerdoelen.niveaus) {
      if (niveau.id === 'bloom')
        throw new Error("leerdoelen.json: een niveau mag niet 'bloom' heten");
      lijst.push({
        path: `${baseUrl}leerdoelen/${niveau.id}`,
        component: `${COMPONENT}/NiveauPagina`,
        exact: true,
        props: { leerdoelen, niveau: niveau.id },
      });
    }
  }
  return lijst;
}

module.exports = function leerdoelenPlugin(context, { siteId } = {}) {
  const bestand = leerdoelenBestand(context.siteDir);
  lees(bestand);
  return {
    name: 'coderius-leerdoelen',
    loadContent: () => lees(bestand),
    contentLoaded({ content, actions }) {
      // Een route van een plugin krijgt de baseUrl niet vanzelf.
      for (const route of routes(context.baseUrl, content)) actions.addRoute(route);
    },
    getPathsToWatch: () => [bestand],
    async postBuild({ outDir, content }) {
      fs.writeFileSync(
        path.join(outDir, 'leerdoelen.json'),
        `${JSON.stringify(gepubliceerd(siteId, content), null, 2)}\n`,
      );
    },
  };
};

module.exports.leerdoelenBestand = leerdoelenBestand;
module.exports.routes = routes;
module.exports.gepubliceerd = gepubliceerd;

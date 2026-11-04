// Leerdoelen van een cursus (zie ../leerdoelen/README.md). createConfig zet
// deze plugin aan als de site `src/leerdoelen.json` heeft:
//  - /leerdoelen: het overzicht, met links naar de niveaus en de vergelijking,
//    en de uitleg van de beoordeling volgens
//    Bloom (voor elke cursus gelijk);
//  - /leerdoelen/vergelijken: de niveaus naast elkaar, bij meer dan één;
//  - /leerdoelen/niveau-<n>: de concepten van één niveau;
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

/**
 * Zoek bij elk concept de titel en het adres van zijn lessen op, uit de docs
 * van de cursus. Een les die niet bestaat is een fout: anders verwees de
 * pagina naar een les die verhuisd of verdwenen is.
 *
 * @param {object} leerdoelen uit leesLeerdoelen
 * @param {{id: string, title: string, permalink: string}[]} docs
 */
function koppelLessen(leerdoelen, docs) {
  const perId = new Map(docs.map((d) => [d.id, d]));
  const onbekend = [];
  const concepten = leerdoelen.concepten.map((c) => {
    if (!c.lessen) return c;
    const lessen = c.lessen.map(({ id }) => {
      const doc = perId.get(id);
      if (!doc) {
        onbekend.push(`concept '${c.id}': les '${id}' bestaat niet`);
        return { id };
      }
      return { id, titel: doc.title, pad: doc.permalink };
    });
    return { ...c, lessen };
  });
  if (onbekend.length) throw new Error(`leerdoelen.json:\n- ${onbekend.join('\n- ')}`);
  return { ...leerdoelen, concepten };
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
  ];
  if (leerdoelen.niveaus.length > 1) {
    lijst.push({
      path: `${baseUrl}leerdoelen/vergelijken`,
      component: `${COMPONENT}/VergelijkPagina`,
      exact: true,
      props: { leerdoelen },
    });
  }
  for (const niveau of leerdoelen.niveaus) {
    lijst.push({
      path: `${baseUrl}leerdoelen/niveau-${niveau.id}`,
      component: `${COMPONENT}/NiveauPagina`,
      exact: true,
      props: { leerdoelen, niveau: niveau.id },
    });
  }
  return lijst;
}

module.exports = function leerdoelenPlugin(context, { siteId } = {}) {
  const bestand = leerdoelenBestand(context.siteDir);
  lees(bestand);
  let gekoppeld = null;
  return {
    name: 'coderius-leerdoelen',
    // De lessen staan pas vast als de docs geladen zijn: daarom komen de
    // routes uit allContentLoaded, met de titels en adressen erbij.
    async allContentLoaded({ allContent, actions }) {
      const docsPlugin = allContent['docusaurus-plugin-content-docs'];
      const docs = docsPlugin?.default?.loadedVersions?.[0]?.docs ?? [];
      gekoppeld = koppelLessen(lees(bestand), docs);
      // Een route van een plugin krijgt de baseUrl niet vanzelf.
      for (const route of routes(context.baseUrl, gekoppeld)) actions.addRoute(route);
    },
    getPathsToWatch: () => [bestand],
    async postBuild({ outDir }) {
      fs.writeFileSync(
        path.join(outDir, 'leerdoelen.json'),
        `${JSON.stringify(gepubliceerd(siteId, gekoppeld), null, 2)}\n`,
      );
    },
  };
};

module.exports.leerdoelenBestand = leerdoelenBestand;
module.exports.routes = routes;
module.exports.koppelLessen = koppelLessen;
module.exports.gepubliceerd = gepubliceerd;

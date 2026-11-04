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
const { leesLeerdoelen, projectNiveaus } = require('../leerdoelen');
const { linkDoel, parseSiteUrl, routeUrl } = require('../sites');

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
 * Alle docs van de cursus: uit elke instantie van de docs-plugin, en per
 * instantie de nieuwste versie (zonder versies is dat de enige). Een cursus
 * met twee docs-plugins of met versies vindt zo ook zijn lessen.
 */
function docsVan(allContent) {
  const instanties = Object.values(allContent?.['docusaurus-plugin-content-docs'] ?? {});
  return instanties.flatMap((inst) => {
    const versies = inst?.loadedVersions ?? [];
    return (versies.find((v) => v.isLast) ?? versies[0])?.docs ?? [];
  });
}

/**
 * Zoek bij elk concept de titel en het adres van zijn lessen op, uit de docs
 * van de cursus. Een les die niet bestaat is een fout: anders verwees de
 * pagina naar een les die verhuisd of verdwenen is. Een site:-link wijst naar
 * een andere cursus; die krijgt het adres uit de registry, en de CI-job
 * cross-links controleert of hij bestaat.
 *
 * Op het tentamen-niveau krijgt een concept met manieren per manier de les
 * waar je hem oefent: de eerste naam uit `manier.lessen` die in de map van
 * zijn eerste les bestaat ("binair-zoeken/01-concept" geeft de map
 * "binair-zoeken"), zonder het cijferprefix van het bestand. Een naam op "/" is een submap, en dan telt de eerste les
 * daarin. Een manier zonder les is een fout.
 *
 * @param {object} leerdoelen uit leesLeerdoelen
 * @param {{id: string, title: string, permalink: string, sidebarPosition?: number}[]} docs
 */
function koppelLessen(leerdoelen, docs) {
  const perId = new Map(docs.map((d) => [d.id, d]));
  const onbekend = [];
  const manieren = leerdoelen.tentamen?.manieren ?? [];
  // Een doc-id houdt het cijferprefix van zijn bestand ("binair-zoeken/
  // 03-stellingen"); een lesnaam van een manier noemt alleen de naam.
  const zonderPrefix = (id) =>
    id
      .split('/')
      .map((deel) => deel.replace(/^\d+[-_.]+/, ''))
      .join('/');
  const lesIn = (map, naam) => {
    const voor = `${zonderPrefix(map)}/${naam}`;
    if (!naam.endsWith('/')) return docs.find((d) => zonderPrefix(d.id) === voor);
    return docs
      .filter((d) => {
        const id = zonderPrefix(d.id);
        return id.startsWith(voor) && !id.slice(voor.length).includes('/');
      })
      .sort((a, b) => (a.sidebarPosition ?? 0) - (b.sidebarPosition ?? 0))[0];
  };
  const concepten = leerdoelen.concepten.map((c) => {
    if (!c.lessen) return c;
    const lessen = c.lessen.map(({ id }) => {
      const extern = parseSiteUrl(id);
      if (extern) {
        const doel = linkDoel(extern.site);
        if (!doel) {
          onbekend.push(`concept '${c.id}': onbekende cursus in '${id}'`);
          return { id };
        }
        return {
          id,
          titel: `de cursus ${doel.label}`,
          pad: routeUrl(extern.site, extern.route, extern.anchor),
          extern: true,
        };
      }
      const doc = perId.get(id);
      if (!doc) {
        onbekend.push(`concept '${c.id}': les '${id}' bestaat niet`);
        return { id };
      }
      return { id, titel: doc.title, pad: doc.permalink };
    });
    const uit = { ...c, lessen };
    if (c.manieren?.length) {
      const eigen = c.lessen.find(({ id }) => !id.startsWith('site:'));
      const map = eigen ? path.posix.dirname(eigen.id) : '.';
      uit.oefenen = {};
      for (const id of c.manieren) {
        const manier = manieren.find((m) => m.id === id);
        const doc = manier?.lessen.map((naam) => lesIn(map, naam)).find(Boolean);
        if (!doc) {
          onbekend.push(
            `concept '${c.id}': geen les voor '${id}' in ${map}/ (gezocht: ${manier?.lessen.join(', ')})`,
          );
          continue;
        }
        uit.oefenen[id] = { id: doc.id, titel: doc.title, pad: doc.permalink };
      }
    }
    return uit;
  });
  if (onbekend.length) {
    const hint =
      docs.length === 0
        ? '\n(de cursus heeft geen docs: een les moet een doc van de eigen cursus zijn)'
        : '';
    throw new Error(`leerdoelen.json:\n- ${onbekend.join('\n- ')}${hint}`);
  }
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
  if (projectNiveaus(leerdoelen).length > 1) {
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
      gekoppeld = koppelLessen(lees(bestand), docsVan(allContent));
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
module.exports.docsVan = docsVan;
module.exports.gepubliceerd = gepubliceerd;

// Werk van het oude subdomein overzetten (zie ../oude-opslag.js). Voor een
// site met `oudeOpslag` in createConfig:
//  - route /overzetten: ontvangt het werk en bewaart het onder de nieuwe
//    sleutels (components/OudeOpslag/OverzettenPagina);
//  - na de build: oud/overzetten/ met de losse pagina uit oude-opslag/pagina/
//    en regels.json. Op de vak-host doet die map niets; op het oude subdomein
//    laat docs-management hem staan (legacy_paths) en leest hij de oude opslag.

const fs = require('node:fs');
const path = require('node:path');
const { controleerRegels, paginaGegevens } = require('../oude-opslag');

const PAGINA = path.join(__dirname, '..', 'oude-opslag', 'pagina');

function schrijfPagina(outDir, siteId, regels) {
  const doel = path.join(outDir, 'oud', 'overzetten');
  fs.mkdirSync(doel, { recursive: true });
  for (const bestand of fs.readdirSync(PAGINA)) {
    fs.copyFileSync(path.join(PAGINA, bestand), path.join(doel, bestand));
  }
  fs.writeFileSync(
    path.join(doel, 'regels.json'),
    `${JSON.stringify(paginaGegevens(siteId, regels), null, 2)}\n`,
  );
  return doel;
}

module.exports = function oudeOpslagPlugin(context, { siteId, regels }) {
  controleerRegels(regels);
  return {
    name: 'coderius-oude-opslag',
    contentLoaded({ actions }) {
      actions.addRoute({
        // Een route van een plugin krijgt de baseUrl niet vanzelf.
        path: `${context.baseUrl}overzetten`,
        component: '@coderius/shared/components/OudeOpslag/OverzettenPagina',
        exact: true,
      });
    },
    async postBuild({ outDir }) {
      schrijfPagina(outDir, siteId, regels);
    },
  };
};

module.exports.schrijfPagina = schrijfPagina;

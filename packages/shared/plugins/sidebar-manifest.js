const fs = require('node:fs/promises');
const path = require('node:path');
const { buildCommit } = require('./build-commit');
const { hoofdstukSleutel } = require('../klas');

// Schrijft sidebar-manifest.json naast de build: de sidebars zoals leerlingen
// ze zien, ná sidebarItemsGenerator en _category_.json. docs-management leest
// het om docenten hoofdstukken te laten kiezen voor een klas. De boom van de
// repo is daarvoor niet goed genoeg: python verplaatst bv. de projecten naar
// een eigen sidebar, en labels en volgorde komen uit _category_.json.

const MAX_DIEPTE = 6;

/** Verwerkte sidebar → de vorm die de browser als props krijgt, met sleutels. */
function zetOm(item, docs, diepte = 0) {
  if (!item || typeof item !== 'object') return null;
  if (item.type === 'doc' || item.type === 'ref') {
    const doc = docs.get(item.id);
    if (!doc) return null;
    return {
      key: hoofdstukSleutel(item),
      type: 'doc',
      docId: item.id,
      label: item.label || doc.sidebarLabel || doc.title,
      href: doc.permalink,
    };
  }
  if (item.type === 'link') {
    return { key: hoofdstukSleutel(item), type: 'link', label: item.label, href: item.href };
  }
  if (item.type === 'category') {
    const link = item.link;
    const href =
      link?.type === 'doc'
        ? docs.get(link.id)?.permalink
        : link?.type === 'generated-index'
          ? link.permalink
          : undefined;
    const items =
      diepte < MAX_DIEPTE
        ? (item.items || []).map((kind) => zetOm(kind, docs, diepte + 1)).filter(Boolean)
        : [];
    // De sleutel rekent met de doc-id's van de kinderen, net als in de browser.
    return {
      key: hoofdstukSleutel(item),
      type: 'category',
      label: item.label,
      ...(href ? { href } : {}),
      items,
    };
  }
  return null;
}

function maakManifest(version, extra = {}) {
  const docs = new Map((version.docs || []).map((doc) => [doc.id, doc]));
  const sidebars = Object.fromEntries(
    Object.entries(version.sidebars || {}).map(([naam, items]) => [
      naam,
      items.map((item) => zetOm(item, docs)).filter(Boolean),
    ]),
  );
  return { version: 1, ...extra, sidebars };
}

module.exports = function sidebarManifest(context) {
  let manifest = null;
  return {
    name: 'coderius-sidebar-manifest',
    async allContentLoaded({ allContent }) {
      const docsPlugin = allContent['docusaurus-plugin-content-docs'];
      const version = docsPlugin?.default?.loadedVersions?.[0];
      manifest = version ? maakManifest(version) : null;
    },
    async postBuild({ outDir }) {
      if (!manifest) return;
      const { commit, dirty } = buildCommit(context.siteDir);
      const site = context.siteConfig.customFields?.siteId ?? null;
      await fs.writeFile(
        path.join(outDir, 'sidebar-manifest.json'),
        `${JSON.stringify({ ...manifest, commit, dirty, site }, null, 2)}\n`,
      );
    },
  };
};

module.exports.maakManifest = maakManifest;

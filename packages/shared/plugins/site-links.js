const { parseSiteUrl, linkDoel, routeUrl } = require('../sites');

// Zet [tekst](site:<id>/<pad>#anker) om naar een echte link (stijlgids §12).
//  - naar de eigen cursus: een gewone interne route (/docs/x#anker). Docusaurus
//    plakt het basispad ervoor en controleert link én anker bij de build.
//  - naar een andere cursus: de productie-URL uit de registry, in een nieuw
//    tabblad, net als <SiteLink>. De cross-links-job controleert die.
// Draait in beforeDefaultRemarkPlugins, dus vóór Docusaurus' eigen
// linkverwerking; createConfig hangt hem in elke content-plugin.

/** Loopt de mdast-boom door zonder extra dependency. */
function bezoek(node, fn) {
  fn(node);
  for (const kind of node.children || []) bezoek(kind, fn);
}

/**
 * Remark-plugin. `siteId` is het registry-id van de site die bouwt; zonder id
 * (een site buiten de registry) is elke site:-link een link naar elders.
 *
 * @param {{ siteId?: string }} [opties]
 */
function remarkSiteLinks({ siteId } = {}) {
  return (tree, file) => {
    const nieuwTabblad = new Set();
    bezoek(tree, (node) => {
      if ((node.type !== 'link' && node.type !== 'definition') || !node.url) return;
      let link;
      try {
        link = parseSiteUrl(node.url);
      } catch (err) {
        file.fail(err.message, node);
      }
      if (!link) return;
      if (!linkDoel(link.site))
        file.fail(
          `Onbekende cursus '${link.site}' in ${node.url} (zie packages/shared/sites.js)`,
          node,
        );
      if (link.site === siteId) {
        node.url = link.route + (link.anchor ? `#${link.anchor}` : '');
        return;
      }
      node.url = routeUrl(link.site, link.route, link.anchor);
      if (node.type === 'definition') nieuwTabblad.add(node.identifier);
      else zetNieuwTabblad(node);
    });
    if (nieuwTabblad.size)
      bezoek(tree, (node) => {
        if (node.type === 'linkReference' && nieuwTabblad.has(node.identifier))
          zetNieuwTabblad(node);
      });
  };
}

function zetNieuwTabblad(node) {
  node.data = node.data || {};
  node.data.hProperties = {
    ...node.data.hProperties,
    target: '_blank',
    rel: 'noopener noreferrer',
  };
}

module.exports = remarkSiteLinks;

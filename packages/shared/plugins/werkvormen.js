// Werkvormen per les (zie ../werkvormen): voor de docentenhandleiding, die per
// les laat zien hoe hij wordt aangeleerd. createConfig zet deze plugin aan bij
// een site met les-tabbladen.
//
// De plugin leest elke les met dezelfde parser als de build en dezelfde stap
// die de tabbladen maakt (les-tabs.js): wat de docentenhandleiding toont, is
// dus wat de leerling op de tabbladen ziet. De uitkomst staat in de globale
// gegevens van de site; <LesWerkvormen les="…"> (components/Werkvorm) leest
// hem daar.

const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { groepeer } = require('./les-tabs');

const NAAM = 'coderius-werkvormen';

/** De stappen van PRIMM, zoals ze in de kop van een opdracht staan, met hun werkvorm. */
const PRIMM = {
  Predict: 'voorspellen',
  Run: 'onderzoeken',
  Investigate: 'onderzoeken',
  Modify: 'aanpassen',
  Make: 'maken',
};

/**
 * De MDX-parser van Docusaurus zelf. Hij is geen eigen dependency van dit
 * package; we vinden hem langs de weg waarlangs de build hem ook laadt
 * (core, dan de mdx-loader). Zo leest de plugin een les precies zoals de
 * build, ook na een upgrade.
 */
async function mdxParser() {
  const core = path.dirname(require.resolve('@docusaurus/core/package.json'));
  const loader = path.dirname(
    require.resolve('@docusaurus/mdx-loader/package.json', { paths: [core] }),
  );
  const mdx = require.resolve('@mdx-js/mdx', { paths: [loader] });
  const { createProcessor } = await import(pathToFileURL(mdx).href);
  // Met remark-directive en remark-gfm, zoals de build. Zonder is een
  // `:::info` of een tabel een rij alinea's, en dan verdeelt de stap van de
  // tabbladen de les anders dan de leerling hem ziet: geen blok (Vooraf,
  // korte uitleg), en een tabel vóór de eerste `###` telde als losse zin.
  const plugin = async (naam) =>
    (await import(pathToFileURL(require.resolve(naam, { paths: [loader] })).href)).default;
  const processor = createProcessor({
    format: 'mdx',
    remarkPlugins: [await plugin('remark-directive'), await plugin('remark-gfm')],
  });
  return (bron) => processor.parse(bron);
}

/**
 * De werkvormen van één les, in de volgorde van zijn tabbladen, of null als
 * de les geen tabbladen heeft.
 *
 * @param {string} bron de inhoud van het bestand
 * @param {(bron: string) => {children: object[]}} parse
 */
function werkvormenVanLes(bron, parse) {
  // Ook een lege front matter (twee regels met streepjes) telt.
  const voorwerk = /^---\r?\n(?:([\s\S]*?)\r?\n)?---\r?\n/.exec(bron);
  if (voorwerk && /^les_tabs:\s*false\s*$/m.test(voorwerk[1] ?? '')) return null;
  // De front matter is geen MDX: zonder hem weg te halen las de parser de
  // laatste regel ervan als een kop.
  const tree = parse(voorwerk ? bron.slice(voorwerk[0].length) : bron);
  // De build geeft elke kop een id; hier doet alleen de tekst ertoe.
  let n = 0;
  const geefId = (node) => {
    if (node.type === 'heading') node.data = { ...node.data, id: `kop-${n++}` };
    for (const kind of node.children ?? []) geefId(kind);
  };
  geefId(tree);
  const tabs = (groepeer(tree.children) ?? []).find((node) => node.name === 'LesTabs');
  if (!tabs) return null;
  // Het leerdoel van de les heeft geen eigen tabblad: het staat bovenaan het
  // tabblad erna. Voor de docent is het wel een werkvorm van de les.
  const heeft = (node, naam) =>
    node.name === naam || (node.children ?? []).some((kind) => heeft(kind, naam));
  // Een voorspelvraag in de uitleg (<Voorspel>, in de python-cursus direct
  // onder de code waar hij over gaat) is voorspellen, ook zonder tabblad
  // Predict.
  // Een controlevraag (<Voorspel soort="Controlevraag">) is controleren, geen
  // voorspellen: in fullstack heeft elke les met code er een na de uitleg, en
  // de handleiding noemde ze Voorspellen.
  const vragen = (node, uit = []) => {
    if (node.name === 'Voorspel')
      uit.push(
        node.attributes?.some((a) => a.name === 'soort' && a.value === 'Controlevraag')
          ? 'controle'
          : 'voorspellen',
      );
    for (const kind of node.children ?? []) vragen(kind, uit);
    return uit;
  };
  // Een opdracht die zijn werkvorm in de kop heeft ("Opdracht 3: Investigate -
  // …", de stappen van het tabblad Opdrachten in fullstack) telt als die
  // werkvorm: het tabblad zelf is één icoon, de les heeft ze alle vijf.
  const stappen = (node, uit = []) => {
    if (node.name === 'LesStap') {
      const titel = node.attributes?.find((a) => a.name === 'titel')?.value ?? '';
      const soort = /^Opdracht \d+: (Predict|Run|Investigate|Modify|Make)\b/.exec(titel)?.[1];
      if (soort) uit.push(PRIMM[soort]);
    }
    for (const kind of node.children ?? []) stappen(kind, uit);
    return uit;
  };
  return tabs.children.flatMap((tab) => {
    const vorm = tab.attributes.find((a) => a.name === 'werkvorm')?.value ?? null;
    const erbij = [...new Set([...vragen(tab), ...stappen(tab)])].filter((v) => v !== vorm);
    return [...(heeft(tab, 'LesLeerdoel') ? ['leerdoel'] : []), vorm, ...erbij];
  });
}

/** De docs van de cursus: van elke docs-plugin de nieuwste versie. */
function docsVan(allContent) {
  const instanties = Object.values(allContent?.['docusaurus-plugin-content-docs'] ?? {});
  return instanties.flatMap((inst) => {
    const versies = inst?.loadedVersions ?? [];
    return (versies.find((v) => v.isLast) ?? versies[0])?.docs ?? [];
  });
}

module.exports = function werkvormenPlugin(context) {
  return {
    name: NAAM,
    async allContentLoaded({ allContent, actions }) {
      const parse = await mdxParser();
      const lessen = {};
      for (const doc of docsVan(allContent)) {
        const bestand = path.join(context.siteDir, doc.source.replace(/^@site\//, ''));
        const werkvormen = werkvormenVanLes(fs.readFileSync(bestand, 'utf8'), parse);
        if (werkvormen) lessen[doc.id] = { titel: doc.title, pad: doc.permalink, werkvormen };
      }
      actions.setGlobalData({ lessen });
    },
  };
};

module.exports.NAAM = NAAM;
module.exports.werkvormenVanLes = werkvormenVanLes;
module.exports.mdxParser = mdxParser;

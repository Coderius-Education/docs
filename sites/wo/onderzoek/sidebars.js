// @ts-check
// Zie https://docusaurus.io/docs/sidebar voor alle opties.

/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {
  materiaalSidebar: [
    'intro',
    'theoriegericht-vs-ontwerpgericht',
    'spelregels',
    'interne-externe-validiteit',
    'kwalitatief-vs-kwantitatief',
    {
      type: 'category',
      label: 'Onderzoek opzetten',
      items: [
        'functies-van-onderzoek',
        'soorten-onderzoek',
        'gegevensverzameling',
        'keuzedriehoek',
      ],
    },
    'termen',
  ],
};

export default sidebars;

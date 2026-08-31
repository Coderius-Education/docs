// @ts-check
// Zie https://docusaurus.io/docs/sidebar voor alle opties.
// Elke categorie linkt naar zijn verbandpagina: klikken op het mapje
// opent de pagina die de samenhang tussen de concepten uitlegt.

/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {
  materiaalSidebar: [
    'intro',
    {
      type: 'category',
      label: 'Typen onderzoek',
      link: {type: 'doc', id: 'typen/theorie-vs-ontwerp'},
      items: ['typen/theoriegericht', 'typen/ontwerpgericht'],
    },
    {
      type: 'category',
      label: 'De spelregels',
      link: {type: 'doc', id: 'spelregels/de-vier-spelregels'},
      items: [
        'spelregels/betrouwbaar',
        'spelregels/valide',
        'spelregels/transparant',
        'spelregels/aanvaardbaar',
        'spelregels/interne-validiteit',
        'spelregels/externe-validiteit',
        'spelregels/intern-vs-extern',
      ],
    },
    {
      type: 'category',
      label: 'Onderzoek opzetten',
      link: {type: 'doc', id: 'opzet/keuzedriehoek'},
      items: [
        {
          type: 'category',
          label: 'Functies',
          link: {type: 'doc', id: 'opzet/functies/functies-overzicht'},
          items: [
            'opzet/functies/puur-beschrijvend',
            'opzet/functies/beschrijvend-vergelijkend',
            'opzet/functies/beschrijvend-definierend',
            'opzet/functies/beschrijvend-evaluerend',
            'opzet/functies/verklarend-explorerend',
            'opzet/functies/verklarend-toetsend',
          ],
        },
        {
          type: 'category',
          label: 'Soorten onderzoek',
          link: {type: 'doc', id: 'opzet/soorten/soorten-combineren'},
          items: [
            'opzet/soorten/experimenteel',
            'opzet/soorten/veldonderzoek',
            'opzet/soorten/literatuuronderzoek',
          ],
        },
        {
          type: 'category',
          label: 'Methoden',
          link: {type: 'doc', id: 'opzet/methoden/methode-kiezen'},
          items: [
            'opzet/methoden/observatie',
            'opzet/methoden/interview',
            'opzet/methoden/enquete',
            'opzet/methoden/analyse-materiaal',
          ],
        },
      ],
    },
    {
      type: 'category',
      label: 'Soorten gegevens',
      link: {type: 'doc', id: 'gegevens/kwal-vs-kwant'},
      items: ['gegevens/kwantitatief', 'gegevens/kwalitatief'],
    },
    'termen',
  ],
};

export default sidebars;

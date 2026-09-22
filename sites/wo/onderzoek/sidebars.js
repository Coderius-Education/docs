// @ts-check
// Zie https://docusaurus.io/docs/sidebar voor alle opties.
// Een hoofdstuk begint met zijn overzichtspagina als eerste zichtbare
// item; kleinere mapjes linken via `link` naar hun verbandpagina.

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
      items: [
        'spelregels/de-vier-spelregels',
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
      label: 'Kennisleer',
      items: [
        'kennisleer/hoe-weet-je-iets',
        {
          type: 'category',
          label: 'Kennis vooraf en achteraf',
          items: [
            'kennisleer/a-priori',
            'kennisleer/a-posteriori',
            'kennisleer/vork-van-hume',
          ],
        },
        {
          type: 'category',
          label: 'Soorten kennis',
          items: [
            'kennisleer/objectief',
            'kennisleer/subjectief',
            'kennisleer/intersubjectief',
            'kennisleer/soorten-kennis',
          ],
        },
        {
          type: 'category',
          label: 'Drie posities',
          items: [
            'kennisleer/scepticisme',
            'kennisleer/rationalisme',
            'kennisleer/empirisme',
          ],
        },
        'kennisleer/inductieprobleem',
        {
          type: 'category',
          label: 'Denkers',
          items: [
            'kennisleer/denkers',
            'kennisleer/plato',
            'kennisleer/aristoteles',
            'kennisleer/descartes',
            'kennisleer/spinoza',
            'kennisleer/locke',
            'kennisleer/berkeley',
            'kennisleer/hume',
            'kennisleer/chomsky',
          ],
        },
      ],
    },
    {
      type: 'category',
      label: 'Onderzoek opzetten',
      items: [
        'opzet/keuzedriehoek',
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
        {
          type: 'category',
          label: 'Soorten gegevens',
          link: {type: 'doc', id: 'gegevens/kwal-vs-kwant'},
          items: ['gegevens/kwantitatief', 'gegevens/kwalitatief'],
        },
      ],
    },
    {
      type: 'category',
      label: 'Literatuurstudie',
      items: [
        'literatuurstudie/van-zoeken-tot-lezen',
        {
          type: 'category',
          label: 'Zoeken',
          items: [
            'literatuurstudie/zoektermen',
            'literatuurstudie/google-scholar',
            'literatuurstudie/semantic-scholar',
            'literatuurstudie/sneeuwbalmethode',
          ],
        },
        {
          type: 'category',
          label: 'Beoordelen',
          items: [
            'literatuurstudie/peer-review',
            'literatuurstudie/auteurvolgorde',
            'literatuurstudie/citaties',
            'literatuurstudie/h-index',
            'literatuurstudie/onderzoeker-onderzoeken',
          ],
        },
        {
          type: 'category',
          label: 'Lezen',
          items: [
            'literatuurstudie/abstract-scannen',
            'literatuurstudie/skimmen',
            'literatuurstudie/deep-reading',
            'literatuurstudie/literatuurmatrix',
          ],
        },
        'literatuurstudie/welke-strategie',
      ],
    },
    {
      type: 'category',
      label: 'Werkvormen',
      items: [
        'werkvormen/overzicht',
        'werkvormen/methoden-kennisleer',
        'werkvormen/van-vijftig-naar-drie',
      ],
    },
    'termen',
  ],
};

export default sidebars;

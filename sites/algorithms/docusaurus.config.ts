import {createConfig, prismThemes} from '@coderius/shared/config';

export default createConfig({
  title: 'Coderius Algoritmes',
  tagline: 'Leer algoritmes door ze zelf uit te voeren',
  url: 'https://algoritmes.coderius.nl',
  organizationName: 'coderius',
  projectName: 'coderius-algorithms',
  deploymentBranch: 'gh-pages',
  trailingSlash: false,

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          numberPrefixParser: false,
        },
        blog: false,
        theme: {customCss: './src/css/custom.css'},
      },
    ],
  ],

  themeConfig: {
    navbar: {
      title: 'Coderius Algoritmes',
      logo: {alt: 'Coderius Algoritmes logo', src: 'img/logo.svg'},
      items: [
        {type: 'docSidebar', sidebarId: 'tutorialSidebar', position: 'left', label: 'Algoritmes'},
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Leren',
          items: [
            {label: 'Lineair zoeken', to: '/docs/lineair-zoeken/01-concept'},
            {label: 'Binair zoeken', to: '/docs/binair-zoeken/01-concept'},
            {label: 'Vind maximum', to: '/docs/vind-maximum/01-concept'},
            {label: 'Max en min', to: '/docs/max-en-min/01-concept'},
            {label: 'Selection sort', to: '/docs/selection-sort/01-concept'},
            {label: 'Bubble sort', to: '/docs/bubble-sort/01-concept'},
            {label: 'Big O notatie', to: '/docs/big-o/01-concept'},
            {label: 'Dijkstra', to: '/docs/dijkstra/01-concept'},
            {label: 'Minimax', to: '/docs/minimax/01-concept'},
            {label: 'Knapsack 0/1', to: '/docs/knapsack/01-concept'},
          ],
        },
      ],
      copyright: `Licensed under CC BY-NC 4.0 — Minimax-track is afgeleid van CS50 AI en valt onder CC BY-NC-SA 4.0.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['python'],
    },
  },
});

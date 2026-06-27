import {createConfig, prismThemes} from '@coderius/shared/config';

export default createConfig({
  title: 'Didactiek — Coderius',
  tagline: 'Waarom we het zo doen, en waarop dat berust',
  url: 'https://didactiek.coderius.nl',
  organizationName: 'coderius',
  projectName: 'coderius-didactiek',
  deploymentBranch: 'gh-pages',
  trailingSlash: false,

  description:
    'De onderbouwing achter het Coderius-lesmateriaal: didactische tips en de onderzoeken waarop ze rusten.',
  keywords:
    'didactiek, onderwijs, cognitive load, PRIMM, scaffolding, retrieval practice, onderzoek',

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          routeBasePath: 'bronnen',
          numberPrefixParser: false,
        },
        blog: false,
        theme: {customCss: './src/css/custom.css'},
      },
    ],
  ],

  themeConfig: {
    navbar: {
      title: 'Coderius Didactiek',
      logo: {alt: 'Coderius Didactiek logo', src: 'img/logo.svg'},
      items: [
        {to: '/', label: 'Tips', position: 'left'},
        {type: 'docSidebar', sidebarId: 'bronnenSidebar', position: 'left', label: 'Bronnen'},
      ],
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['python'],
    },
  },
});

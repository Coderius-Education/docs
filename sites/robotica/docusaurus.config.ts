import {createConfig} from '@coderius/shared/config';

const organizationName = 'Coderius-Education';
const projectName = 'robotica-docs';

export default createConfig({
  title: 'Robotica Lessenpakket',
  url: 'https://robotica.coderius.nl',
  projectName,

  // Robotica is (nog) Engelstalig.
  i18n: {defaultLocale: 'en', locales: ['en']},
  markdown: {hooks: {onBrokenMarkdownLinks: 'warn'}},

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          editUrl: `https://github.com/${organizationName}/${projectName}/tree/main/`,
        },
        blog: {
          showReadingTime: true,
          editUrl: `https://github.com/${organizationName}/${projectName}/tree/main/`,
        },
        theme: {customCss: './src/css/custom.css'},
      },
    ],
  ],

  plugins: [
    [
      '@docusaurus/plugin-content-docs',
      {
        id: 'lego_auto',
        path: 'lego_auto',
        routeBasePath: 'lego_auto',
        sidebarPath: './sidebarsLegoAuto.ts',
      },
    ],
  ],

  themeConfig: {
    image: 'img/docusaurus-social-card.jpg',
    navbar: {
      title: 'Home',
      items: [
        {type: 'docSidebar', sidebarId: 'tutorialSidebar', position: 'right', label: 'Bibliotheek'},
        {type: 'doc', docId: 'intro', position: 'left', label: 'Lego-auto', docsPluginId: 'lego_auto'},
        {to: '/cheatsheet', label: 'Cheatsheet', position: 'left'},
        {to: '/editor', label: 'Editor', position: 'left'},
        {
          to: '/docs/Microcontrollers/Arduino Nano RP2040 Connect/Tutorial-debuggen/debuggen',
          label: 'Er gaat iets mis',
          position: 'left',
        },
        {href: 'https://github.com/Coderius-Education/robotica-docs', label: 'GitHub', position: 'right'},
      ],
    },
    footer: {
      style: 'dark',
      links: [],
      copyright: `Licensed under <a href="https://creativecommons.org/licenses/by-nc/4.0/" target="_blank" rel="noopener noreferrer">Creative Commons Attribution-NonCommercial 4.0 International (CC BY-NC 4.0)</a>.`,
    },
  },
});

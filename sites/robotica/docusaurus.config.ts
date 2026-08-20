import { createConfig } from '@coderius/shared/config';
import { REPO_URL, repoEditUrl } from '@coderius/shared/sites';

const projectName = 'robotica-docs';

export default createConfig({
  title: 'Robotica — Coderius',
  url: 'https://robotica.coderius.nl',
  projectName,
  matomoSiteId: 7,

  // Robotica is (nog) Engelstalig.
  i18n: { defaultLocale: 'en', locales: ['en'] },
  markdown: { hooks: { onBrokenMarkdownLinks: 'warn' } },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          editUrl: repoEditUrl('robotica'),
        },
        blog: {
          showReadingTime: true,
          editUrl: repoEditUrl('robotica'),
        },
        theme: { customCss: './src/css/custom.css' },
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
    [
      '@docusaurus/plugin-content-docs',
      {
        id: 'click_golfer',
        path: 'click_golfer',
        routeBasePath: 'click_golfer',
        sidebarPath: './sidebarsClickGolfer.ts',
      },
    ],
  ],

  themeConfig: {
    image: 'img/docusaurus-social-card.jpg',
    navbar: {
      title: 'Home',
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'tutorialSidebar',
          position: 'right',
          label: 'Bibliotheek',
        },
        {
          type: 'doc',
          docId: 'intro',
          position: 'left',
          label: 'Lego-auto',
          docsPluginId: 'lego_auto',
        },
        { to: '/cheatsheet', label: 'Cheatsheet', position: 'left' },
        { to: '/editor', label: 'Editor', position: 'left' },
        {
          to: '/docs/Microcontrollers/Arduino Nano RP2040 Connect/Tutorial-debuggen/debuggen',
          label: 'Er gaat iets mis',
          position: 'left',
        },
        {
          type: 'doc',
          docId: 'intro',
          position: 'left',
          label: 'Click Golfer',
          docsPluginId: 'click_golfer',
        },
        {
          href: REPO_URL,
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [],
      copyright: `Licensed under <a href="https://creativecommons.org/licenses/by-nc/4.0/" target="_blank" rel="noopener noreferrer">Creative Commons Attribution-NonCommercial 4.0 International (CC BY-NC 4.0)</a>.`,
    },
  },
});

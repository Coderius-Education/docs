// @ts-check
// Zie https://docusaurus.io/docs/api/docusaurus-config voor alle opties.

import {themes as prismThemes} from 'prism-react-renderer';

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'Onderzoek',
  tagline: 'Materiaal voor het doen van onderzoek',
  favicon: 'img/favicon.ico',

  future: {
    v4: true,
  },

  url: 'https://coderius-education.github.io',
  baseUrl: '/onderzoek/',
  trailingSlash: false,

  // GitHub Pages deployment
  organizationName: 'Coderius-Education',
  projectName: 'onderzoek',

  onBrokenLinks: 'throw',

  i18n: {
    defaultLocale: 'nl',
    locales: ['nl'],
  },

  markdown: {
    mermaid: true,
  },
  themes: ['@docusaurus/theme-mermaid'],

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          routeBasePath: '/',
          sidebarPath: './sidebars.js',
          editUrl:
            'https://github.com/Coderius-Education/onderzoek/tree/main/',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      colorMode: {
        respectPrefersColorScheme: true,
      },
      navbar: {
        title: 'Onderzoek',
        logo: {
          alt: 'Logo',
          src: 'img/logo.svg',
        },
        items: [
          {
            type: 'docSidebar',
            sidebarId: 'materiaalSidebar',
            position: 'left',
            label: 'Materiaal',
          },
          {
            href: 'https://github.com/Coderius-Education/onderzoek',
            label: 'GitHub',
            position: 'right',
          },
        ],
      },
      footer: {
        style: 'dark',
        links: [],
        copyright: `Copyright © ${new Date().getFullYear()} Coderius Education. Gebouwd met Docusaurus.`,
      },
      prism: {
        theme: prismThemes.github,
        darkTheme: prismThemes.dracula,
      },
    }),
};

export default config;

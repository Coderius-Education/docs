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

  plugins: [
    [
      '@docusaurus/plugin-client-redirects',
      {
        // Oude URL's van vóór de herstructurering (aug 2026)
        redirects: [
          {from: '/theoriegericht-vs-ontwerpgericht', to: '/typen/theorie-vs-ontwerp'},
          {from: '/spelregels', to: '/spelregels/de-vier-spelregels'},
          {from: '/interne-externe-validiteit', to: '/spelregels/intern-vs-extern'},
          {from: '/soorten-onderzoek', to: '/opzet/soorten/soorten-combineren'},
          {from: '/gegevensverzameling', to: '/opzet/methoden/methode-kiezen'},
          {from: '/functies-van-onderzoek', to: '/opzet/functies/functies-overzicht'},
          {from: '/kwalitatief-vs-kwantitatief', to: '/gegevens/kwal-vs-kwant'},
          {from: '/keuzedriehoek', to: '/opzet/keuzedriehoek'},
        ],
      },
    ],
  ],

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
            to: '/termen',
            label: 'Termen',
            position: 'left',
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

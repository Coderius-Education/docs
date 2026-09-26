import { createConfig } from '@coderius/shared/config';
import { REPO_URL } from '@coderius/shared/sites';
import type { PluginOptions } from '@docusaurus/plugin-content-docs';
import { zonderProjecten } from './src/sidebar/zonderProjecten';

// De Tutorial-sidebar wordt uit heel docs/ gegenereerd; de projecten staan in
// hun eigen sidebar (zie sidebars.ts) en gaan hier uit de Tutorial.
const sidebarItemsGenerator: PluginOptions['sidebarItemsGenerator'] = async ({
  defaultSidebarItemsGenerator,
  ...args
}) => {
  const items = await defaultSidebarItemsGenerator(args);
  return args.item.dirName === '.' ? zonderProjecten(items) : items;
};

export default createConfig({
  title: 'Python Leren — Coderius',
  tagline: 'Leer stap voor stap programmeren in Python',
  url: 'https://python.coderius.nl',
  projectName: 'python-docs',
  matomoSiteId: 4,

  description:
    'Leer stap voor stap programmeren in Python. Gratis cursus met interactieve oefeningen direct in je browser.',
  keywords:
    'python leren, python programmeren beginners, python cursus gratis, python oefeningen online',

  // Gedeelde Pyodide-componenten transpileren + lokaal serveren.
  sharedPackages: ['@coderius/shared', '@coderius/python-runner'],
  clientModules: ['./src/pyodide-setup.ts'],

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          sidebarItemsGenerator,
        },
        blog: false,
        theme: { customCss: './src/css/custom.css' },
      },
    ],
  ],

  themeConfig: {
    image: 'img/docusaurus-social-card.jpg',
    metadata: [
      { name: 'og:type', content: 'website' },
      { name: 'og:locale', content: 'nl_NL' },
    ],
    navbar: {
      items: [
        { type: 'docSidebar', sidebarId: 'tutorialSidebar', position: 'left', label: 'Tutorial' },
        { type: 'docSidebar', sidebarId: 'projectenSidebar', position: 'left', label: 'Projecten' },
        { to: '/playground', label: 'Playground', position: 'left' },
        { to: '/cheatsheet', label: 'Cheatsheet', position: 'left' },
        { to: '/begrippenlijst', label: 'Begrippenlijst', position: 'left' },
        { to: '/hulp', label: 'Hulp', position: 'left' },
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
    },
  },
});

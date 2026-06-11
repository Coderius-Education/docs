import {createConfig} from '@coderius/shared/config';

export default createConfig({
  title: 'Python Leren Programmeren — Coderius',
  tagline: 'Leer stap voor stap programmeren in Python',
  url: 'https://python.coderius.nl',
  projectName: 'python-docs',

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
        docs: {sidebarPath: './sidebars.ts'},
        blog: false,
        theme: {customCss: './src/css/custom.css'},
      },
    ],
  ],

  themeConfig: {
    image: 'img/docusaurus-social-card.jpg',
    metadata: [
      {name: 'og:type', content: 'website'},
      {name: 'og:locale', content: 'nl_NL'},
    ],
    navbar: {
      title: 'coderius-python',
      logo: {alt: 'coderius-python', src: 'img/logo.svg'},
      items: [
        {type: 'docSidebar', sidebarId: 'tutorialSidebar', position: 'left', label: 'Tutorial'},
        {to: '/playground', label: 'Playground', position: 'left'},
        {to: '/cheatsheet', label: 'Cheatsheet', position: 'left'},
        {to: '/begrippenlijst', label: 'Begrippenlijst', position: 'left'},
        {to: '/hulp', label: 'Hulp', position: 'left'},
        {href: 'https://github.com/Coderius-Education/python-docs', label: 'GitHub', position: 'right'},
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Meer van Coderius',
          items: [
            {label: 'Maak games met Python', href: 'https://play.coderius.nl'},
            {label: 'Python als back-end met FastAPI', href: 'https://fullstack.coderius.nl'},
          ],
        },
      ],
    },
  },
});

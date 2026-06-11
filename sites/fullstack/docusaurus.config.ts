import {createConfig} from '@coderius/shared/config';

export default createConfig({
  title: 'Fullstack Ontwikkeling — FastAPI — Coderius',
  tagline: 'Leer hier een Python back-end toe te voegen aan je website',
  url: 'https://fullstack.coderius.nl',
  projectName: 'fullstack-docs',

  description:
    'Leer een back-end bouwen met FastAPI (Python). Van frontend naar database, direct in je browser.',
  keywords:
    'fastapi leren, fullstack python, backend leren beginners, sqlite database python',

  // Pyodide-componenten gedeeld; fullstack gebruikt de CDN (geen lokale setup).
  sharedPackages: ['@coderius/shared', '@coderius/python-runner'],

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          editUrl: 'https://github.com/Coderius-Education/fullstack/tree/main/',
        },
        blog: false,
      },
    ],
  ],

  themeConfig: {
    image: 'img/docusaurus-social-card.jpg',
    navbar: {
      title: 'coderius-fullstack',
      logo: {alt: 'My Site Logo', src: 'img/logo.svg'},
      items: [
        {type: 'docSidebar', sidebarId: 'apiSidebar', position: 'left', label: 'FastAPI'},
        {type: 'doc', docId: 'cheatsheet', position: 'left', label: 'Cheatsheet'},
        {type: 'doc', docId: 'troubleshooting', position: 'left', label: 'Er gaat iets mis'},
        {href: 'https://github.com/Coderius-Education/fullstack', label: 'GitHub', position: 'right'},
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Meer van Coderius',
          items: [
            {label: 'Leer eerst Python', href: 'https://python.coderius.nl'},
            {label: 'Leer HTML & CSS', href: 'https://web.coderius.nl'},
            {label: 'Web security met DVWA', href: 'https://dvwa.coderius.nl'},
          ],
        },
      ],
    },
  },
});

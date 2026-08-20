import { createConfig } from '@coderius/shared/config';
import { REPO_URL, repoEditUrl } from '@coderius/shared/sites';

export default createConfig({
  title: 'Fullstack met FastAPI — Coderius',
  tagline: 'Leer hier een Python back-end toe te voegen aan je website',
  url: 'https://fullstack.coderius.nl',
  projectName: 'fullstack-docs',
  matomoSiteId: 11,

  description:
    'Leer een back-end bouwen met FastAPI (Python). Van frontend naar database, direct in je browser.',
  keywords: 'fastapi leren, fullstack python, backend leren beginners, sqlite database python',

  // @coderius/checker levert de gedeelde 'nakijken'-validator (TSX-bron).
  sharedPackages: ['@coderius/shared', '@coderius/checker'],

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          editUrl: repoEditUrl('fullstack'),
        },
        blog: false,
      },
    ],
  ],

  themeConfig: {
    image: 'img/docusaurus-social-card.jpg',
    navbar: {
      title: 'coderius-fullstack',
      logo: { alt: 'My Site Logo', src: 'img/logo.svg' },
      items: [
        { type: 'docSidebar', sidebarId: 'apiSidebar', position: 'left', label: 'FastAPI' },
        { type: 'doc', docId: 'cheatsheet', position: 'left', label: 'Cheatsheet' },
        { type: 'doc', docId: 'troubleshooting', position: 'left', label: 'Er gaat iets mis' },
        { to: '/project-checken', label: 'Project checken', position: 'left' },
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

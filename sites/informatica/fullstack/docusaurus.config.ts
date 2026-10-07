import { createRequire } from 'node:module';
import { createConfig } from '@coderius/shared/config';
import { REPO_URL, repoEditUrl } from '@coderius/shared/sites';

// <Routekaart> leest de sidebar met useDocsSidebar() uit
// '@docusaurus/plugin-content-docs/client'. pnpm heeft meerdere kopieën van dat
// package; vanuit src/ kwam een andere kopie dan die van theme-classic, en dan
// zit de hook buiten de <DocsSidebarProvider> van het thema en faalt de build.
// Deze alias stuurt elke import naar de kopie die theme-classic gebruikt.
const require = createRequire(import.meta.url);
const themeClassic = require.resolve('@docusaurus/theme-classic', {
  paths: [require.resolve('@docusaurus/preset-classic')],
});
const docsClient = require.resolve('@docusaurus/plugin-content-docs/client', {
  paths: [themeClassic],
});
const eenDocsClient = () => ({
  name: 'een-docs-client',
  configureWebpack: () => ({
    resolve: { alias: { '@docusaurus/plugin-content-docs/client$': docsClient } },
  }),
});

export default createConfig({
  title: 'Fullstack met FastAPI — Coderius',
  tagline: 'Leer hier een Python back-end toe te voegen aan je website',
  siteId: 'fullstack',
  projectName: 'fullstack-docs',
  matomoSiteId: 11,

  description:
    'Leer een back-end bouwen met FastAPI (Python). Van frontend naar database, direct in je browser.',
  keywords: 'fastapi leren, fullstack python, backend leren beginners, sqlite database python',

  // @coderius/checker levert de gedeelde 'nakijken'-validator (TSX-bron).
  omleidingen: [
    // De eindopdracht Jouw eigen project is uit de cursus gehaald; het oude
    // adres komt uit bij het eind van de basis.
    { van: '/docs/FastAPI/jouw-project', naar: '/docs/FastAPI/verzoek-get' },
    // Het diagram van één formulier staat sinds de herindeling op dezelfde
    // pagina als dat van één klik.
    { van: '/docs/FastAPI/verzoek-post', naar: '/docs/FastAPI/verzoek-get#een-formulier' },
  ],

  sharedPackages: ['@coderius/shared', '@coderius/checker'],

  plugins: [eenDocsClient],

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
      items: [
        { type: 'docSidebar', sidebarId: 'apiSidebar', position: 'left', label: 'FastAPI' },
        {
          type: 'docSidebar',
          sidebarId: 'veiligheidSidebar',
          position: 'left',
          label: 'Veiligheid',
        },
        { type: 'doc', docId: 'starten', position: 'left', label: 'Hoe start ik?' },
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

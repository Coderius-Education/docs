import { createConfig } from '@coderius/shared/config';
import type { Options as DocsOptions } from '@docusaurus/plugin-content-docs';
import { omleidingen } from './src/data/omleidingen';
import { sidebarZonderMl } from './src/lib/mlSidebar';

// De route machine learning staat in zijn eigen sidebar (mlSidebar), niet ook
// nog in "Algoritmes". Zie src/lib/mlSidebar.ts.
const sidebarItemsGenerator = sidebarZonderMl as unknown as DocsOptions['sidebarItemsGenerator'];

export default createConfig({
  title: 'Algoritmes — Coderius',
  tagline: 'Leer algoritmes door ze zelf uit te voeren',
  siteId: 'algorithms',
  organizationName: 'coderius',
  projectName: 'coderius-algorithms',
  matomoSiteId: 12,
  deploymentBranch: 'gh-pages',
  trailingSlash: false,
  // Verhuisde lessen houden hun oude adres; de lijst staat in
  // src/data/omleidingen.ts.
  omleidingen,
  // Elke ##-sectie van een les is een tabblad (zie Les-tabbladen in de
  // root-CLAUDE.md).
  lesTabs: true,

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          numberPrefixParser: false,
          sidebarItemsGenerator,
        },
        blog: false,
        theme: { customCss: './src/css/custom.css' },
      },
    ],
  ],

  themeConfig: {
    navbar: {
      items: [
        { type: 'docSidebar', sidebarId: 'tutorialSidebar', position: 'left', label: 'Algoritmes' },
        { to: '/docs/unplugged', label: 'Unplugged', position: 'left' },
        { type: 'docSidebar', sidebarId: 'mlSidebar', position: 'left', label: 'Machine learning' },
      ],
    },
    prism: {
      additionalLanguages: ['python'],
    },
  },
});

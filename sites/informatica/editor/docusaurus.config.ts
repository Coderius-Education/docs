import { createConfig } from '@coderius/shared/config';

export default createConfig({
  title: 'VS Code & Git — Coderius',
  tagline: 'Een cursus voor leerlingen die voor het eerst met een code editor aan de slag gaan',
  siteId: 'editor',
  projectName: 'editor-docs',
  matomoSiteId: 6,
  // Elke ##-sectie van een pagina is een tabblad (zie de root-CLAUDE.md).
  // Een stap is hier vaak tien regels: een pagina die in haar geheel op één
  // scherm past, krijgt geen tabbladen.
  lesTabs: { eenScherm: true },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          routeBasePath: '/',
          editUrl: undefined,
        },
        blog: false,
      },
    ],
  ],

  themeConfig: {
    image: 'img/docusaurus-social-card.jpg',
    navbar: {
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'installatieSidebar',
          position: 'left',
          label: 'Installatie VS Code',
        },
        {
          type: 'docSidebar',
          sidebarId: 'webSidebar',
          position: 'left',
          label: 'Website in VS Code',
        },
        {
          type: 'docSidebar',
          sidebarId: 'pythonSidebar',
          position: 'left',
          label: 'Python in VS Code',
        },
        { type: 'docSidebar', sidebarId: 'gitSidebar', position: 'left', label: 'Git & GitHub' },
      ],
    },
    footer: { style: 'dark', links: [] },
  },
});

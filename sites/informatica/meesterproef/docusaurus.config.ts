import { createConfig } from '@coderius/shared/config';
import { repoEditUrl } from '@coderius/shared/sites';

export default createConfig({
  title: 'Meesterproef',
  tagline: 'Meesterproef',
  siteId: 'meesterproef',
  projectName: 'meesterproef-docs',

  description: 'Meesterproef',

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          editUrl: repoEditUrl('meesterproef'),
        },
        blog: false,
      },
    ],
  ],

  themeConfig: {
    navbar: {
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'tutorialSidebar',
          label: 'Docs',
          position: 'left',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [],
    },
  },
});

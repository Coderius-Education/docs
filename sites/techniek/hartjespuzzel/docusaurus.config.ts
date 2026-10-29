import { createConfig } from '@coderius/shared/config';
import { repoEditUrl } from '@coderius/shared/sites';

export default createConfig({
  title: 'Opdracht hartjespuzzel',
  tagline: '',
  siteId: 'hartjespuzzel',
  projectName: 'hartjespuzzel-docs',

  description: 'Leermateriaal: Opdracht hartjespuzzel',

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          editUrl: repoEditUrl('hartjespuzzel'),
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

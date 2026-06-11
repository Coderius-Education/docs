import {createConfig} from '@coderius/shared/config';

export default createConfig({
  title: 'VS Code & Git voor websites en Python',
  tagline:
    'Een cursus voor leerlingen die voor het eerst met een code editor aan de slag gaan',
  url: 'https://editor.coderius.nl',
  projectName: 'editor-docs',

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
      title: 'coderius-editor',
      logo: {alt: 'coderius-editor', src: 'img/logo.svg'},
      items: [
        {type: 'docSidebar', sidebarId: 'installatieSidebar', position: 'left', label: 'Installatie VS Code'},
        {type: 'docSidebar', sidebarId: 'webSidebar', position: 'left', label: 'Website in VS Code'},
        {type: 'docSidebar', sidebarId: 'pythonSidebar', position: 'left', label: 'Python in VS Code'},
        {type: 'docSidebar', sidebarId: 'gitSidebar', position: 'left', label: 'Git & GitHub'},
      ],
    },
    footer: {style: 'dark', links: []},
  },
});

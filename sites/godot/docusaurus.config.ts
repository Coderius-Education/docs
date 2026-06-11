import {createConfig} from '@coderius/shared/config';

export default createConfig({
  title: 'Coderius Godot — Nederlandse cursus 2D gamedev',
  tagline: 'De eerste stappen in Godot',
  url: 'https://godot.coderius.nl',
  projectName: 'GoDot',

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          editUrl: 'https://github.com/Coderius-Education/Godot/tree/main',
        },
        blog: false,
      },
    ],
  ],

  themeConfig: {
    image: 'img/docusaurus-social-card.jpg',
    metadata: [
      {
        name: 'description',
        content:
          'Gratis Nederlandse cursus om je eerste 2D game in Godot 4 te bouwen. Stap-voor-stap: installatie, sprites, GDScript, animaties, collisions en score.',
      },
      {
        name: 'keywords',
        content:
          'Godot, Godot 4, gamedev, 2D game, GDScript, Nederlandse cursus, tutorial, leren programmeren, onderwijs',
      },
      {property: 'og:locale', content: 'nl_NL'},
      {property: 'og:type', content: 'website'},
    ],
    navbar: {
      title: 'Coderius Godot',
      logo: {alt: 'Coderius Godot logo', src: 'img/logo.svg'},
      items: [
        {type: 'docSidebar', sidebarId: 'tutorialSidebar', position: 'left', label: '1e 2D game'},
        {to: '/cheatsheet', label: 'Nodes cheatsheet', position: 'left'},
        {href: 'https://github.com/Coderius-Education/Godot', label: 'GitHub', position: 'right'},
      ],
    },
    footer: {style: 'dark', links: []},
  },
});

import { createConfig } from '@coderius/shared/config';
import { REPO_URL, repoEditUrl } from '@coderius/shared/sites';

export default createConfig({
  title: 'Games met Godot — Coderius',
  tagline: 'De eerste stappen in Godot',
  url: 'https://godot.coderius.nl',
  projectName: 'GoDot',
  matomoSiteId: 9,

  // @coderius/shared is de standaard; @coderius/checker levert de nakijk-validator.
  sharedPackages: ['@coderius/shared', '@coderius/checker'],

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          editUrl: repoEditUrl('godot'),
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
      { property: 'og:locale', content: 'nl_NL' },
      { property: 'og:type', content: 'website' },
    ],
    navbar: {
      title: 'Coderius Godot',
      logo: { alt: 'Coderius Godot logo', src: 'img/logo.svg' },
      items: [
        { type: 'docSidebar', sidebarId: 'tutorialSidebar', position: 'left', label: '1e 2D game' },
        { to: '/cheatsheet', label: 'Nodes cheatsheet', position: 'left' },
        { to: '/game-checken', label: 'Game checken', position: 'left' },
        { href: REPO_URL, label: 'GitHub', position: 'right' },
      ],
    },
    footer: { style: 'dark', links: [] },
  },
});

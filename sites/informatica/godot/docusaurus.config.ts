import { createConfig } from '@coderius/shared/config';
import { REPO_URL } from '@coderius/shared/sites';
import { GODOT_VERSION } from './src/data/godot';

export default createConfig({
  title: 'Games met Godot — Coderius',
  tagline: 'De eerste stappen in Godot',
  siteId: 'godot',
  projectName: 'GoDot',
  matomoSiteId: 9,

  // Elke ##-sectie van een les is een tabblad (zie de root-CLAUDE.md,
  // Les-tabbladen); de inhoudsopgave rechts vervalt.
  lesTabs: { stapNaam: true, volScherm: true },

  // De conceptenkaart is in november 2026 weggehaald. Het oude adres stond in
  // de navbar; wie het bewaard heeft, komt uit bij de leerdoelen: daar staat
  // ook per concept de les waarin je het leert.
  omleidingen: [{ van: '/conceptenkaart', naar: '/leerdoelen' }],

  // @coderius/shared is de standaard; @coderius/checker levert de nakijk-validator.
  sharedPackages: ['@coderius/shared', '@coderius/checker'],

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
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
      items: [
        { type: 'docSidebar', sidebarId: 'tutorialSidebar', position: 'left', label: '1e 2D game' },
        { to: '/cheatsheet', label: 'Nodes cheatsheet', position: 'left' },
        { to: '/gdscript-tips', label: 'GDScript-tips', position: 'left' },
        { to: '/game-checken', label: 'Game checken', position: 'left' },
        // Voor welke Godot de cursus geschreven is. Stond als blok bovenaan
        // elke les en maakte van het eerste scherm een bijna leeg tabblad
        // (een alinea en dit blok); hier staat het op elke pagina.
        { to: '/docs/godot-versies', label: `Godot ${GODOT_VERSION}`, position: 'right' },
        { href: REPO_URL, label: 'GitHub', position: 'right' },
      ],
    },
    footer: { style: 'dark', links: [] },
  },
});

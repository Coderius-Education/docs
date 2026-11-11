import { createConfig } from '@coderius/shared/config';
import { REPO_URL, repoEditUrl } from '@coderius/shared/sites';
import lesstofPlugin from './src/checker/lesstof-plugin';

export default createConfig({
  title: 'Webontwikkeling — Coderius',
  tagline: 'leer hier je eerste website te maken',
  siteId: 'web',
  projectName: 'web-docs',
  matomoSiteId: 3,
  // De oude pagina /html_css is weg; een oude link (werkblad,
  // bladwijzer) komt op de eerste HTML-les uit.
  omleidingen: [{ van: '/html_css', naar: '/docs/html-css/intro-html' }],
  // Proef: elke ##-sectie van een les is een tabblad, zonder inhoudsopgave
  // rechts (plugins/les-tabs.js in shared).
  lesTabs: true,
  // Werk van web.coderius.nl (vóór de verhuizing): zie oude-opslag.js.
  oudeOpslag: {
    indexedDB: [
      {
        van: 'coderius-oefenvelden',
        store: 'velden',
        naar: 'oefenvelden',
        // Sleutel = location.pathname|zaad|n; het pad kreeg /web/ ervoor.
        sleutelBegintMetPad: true,
        label: 'Je oefenvelden',
      },
    ],
  },

  description:
    'Leer hier je eerste website te maken met HTML en CSS. Gratis cursus direct in je browser.',
  keywords: 'html leren, css leren, website maken beginners, webontwikkeling cursus gratis',

  // @coderius/shared is de standaard; @coderius/checker levert de nakijker.
  sharedPackages: ['@coderius/shared', '@coderius/checker'],

  // Wat de lessen behandelen, voor "buiten de lesstof" in de nakijker.
  plugins: [lesstofPlugin],

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          editUrl: repoEditUrl('web'),
        },
        blog: false,
      },
    ],
  ],

  themeConfig: {
    image: 'img/docusaurus-social-card.jpg',
    navbar: {
      items: [
        { type: 'docSidebar', sidebarId: 'htmlCssSidebar', label: 'HTML & CSS', position: 'left' },
        { type: 'docSidebar', sidebarId: 'jsSidebar', label: 'JavaScript', position: 'left' },
        { to: '/cheatsheet', label: 'Cheatsheet', position: 'left' },
        { to: '/jouw-website', label: 'Jouw website', position: 'left' },
        { to: '/website-checken', label: 'Website checken', position: 'left' },
        { href: REPO_URL, label: 'GitHub', position: 'right' },
      ],
    },
    footer: {
      style: 'dark',
      links: [],
    },
  },
});

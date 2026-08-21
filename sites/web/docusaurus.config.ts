import { createConfig } from '@coderius/shared/config';
import { REPO_URL, repoEditUrl } from '@coderius/shared/sites';

export default createConfig({
  title: 'Webontwikkeling — Coderius',
  tagline: 'leer hier je eerste website te maken',
  url: 'https://web.coderius.nl',
  projectName: 'web-docs',
  matomoSiteId: 3,

  description:
    'Leer hier je eerste website te maken met HTML en CSS. Gratis cursus direct in je browser.',
  keywords: 'html leren, css leren, website maken beginners, webontwikkeling cursus gratis',

  // @coderius/shared is de standaard; @coderius/checker levert de nakijker.
  sharedPackages: ['@coderius/shared', '@coderius/checker'],

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
      title: 'coderius-web',
      logo: { alt: 'My Site Logo', src: 'img/logo.svg' },
      items: [
        { to: '/html_css', label: 'Met Code.org', position: 'left' },
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

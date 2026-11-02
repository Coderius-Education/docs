import { createConfig, prismThemes } from '@coderius/shared/config';
import { REPO_URL, repoEditUrl } from '@coderius/shared/sites';

export default createConfig({
  title: 'Linux — Coderius',
  tagline: 'Leer werken in de terminal van Linux, in je browser en op je eigen computer',
  siteId: 'linux',
  projectName: 'Linux',
  // Hetzelfde nummer als de DVWA-site die hier eerst stond: dezelfde cursus-
  // plek in Matomo.
  matomoSiteId: 10,

  description:
    'Leer Linux in de terminal, direct in je browser, en zet Linux op je eigen computer met WSL: apt, nano, diensten en ssh.',
  keywords:
    'linux leren, linux terminal oefenen, wsl installeren, ubuntu wsl, ssh leren, linux voor beginners',

  clientModules: [require.resolve('@xterm/xterm/css/xterm.css')],

  presets: [
    [
      'classic',
      {
        docs: {
          id: 'default',
          path: 'docs',
          routeBasePath: 'docs',
          sidebarPath: './sidebars.js',
          editUrl: repoEditUrl('linux'),
        },
        blog: false,
      },
    ],
  ],

  themeConfig: {
    image: 'img/docusaurus-social-card.jpg',
    navbar: {
      items: [
        { type: 'docSidebar', sidebarId: 'linuxSidebar', position: 'left', label: 'Linux' },
        { to: '/docs/wsl/installeren', label: 'WSL', position: 'left' },
        { to: '/docs/cheatsheet', label: 'Cheatsheet', position: 'left' },
        { href: REPO_URL, label: 'GitHub', position: 'right' },
      ],
    },
    footer: {
      style: 'dark',
      links: [],
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  },
});

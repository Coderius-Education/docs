import { createConfig } from '@coderius/shared/config';
import { repoEditUrl } from '@coderius/shared/sites';

const projectName = 'play-docs';

export default createConfig({
  title: 'Python Games — Coderius',
  tagline: 'Leer nog beter Python door het maken van games',
  url: 'https://play.coderius.nl',
  projectName,
  matomoSiteId: 5,
  // @coderius/shared is de standaard; @coderius/checker levert de nakijker.
  sharedPackages: ['@coderius/shared', '@coderius/checker'],
  trailingSlash: false,

  description:
    'Leer nog beter Python door het maken van games met pygame. Gratis cursus met speloefeningen direct in je browser.',
  keywords:
    'python games, pygame leren, python spel maken, coderius play, game development python beginners',

  markdown: { hooks: { onBrokenMarkdownLinks: 'throw' } },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.js',
          editUrl: repoEditUrl('play'),
        },
        blog: false,
        theme: { customCss: './src/css/custom.css' },
      },
    ],
  ],

  plugins: [
    [
      '@docusaurus/plugin-pwa',
      {
        debug: false,
        offlineModeActivationStrategies: ['appInstalled', 'standalone', 'queryString'],
        swCustom: require.resolve('./src/sw.js'),
        pwaHead: [
          { tagName: 'link', rel: 'icon', href: '/img/logo.png' },
          { tagName: 'meta', name: 'theme-color', content: '#1a1a2e' },
        ],
      },
    ],
  ],

  themeConfig: {
    navbar: {
      title: ' ',
      logo: { alt: 'Coderius Play Logo', src: 'img/logo.png' },
      items: [
        { type: 'doc', docId: 'eerste-keer-python/IA', position: 'left', label: 'Begin hier!' },
        { href: '/docs/cheatsheet', label: 'Cheatsheet', position: 'left' },
        { href: '/er_gaat_iets_mis', label: 'Foutmeldingen', position: 'left' },
        { href: '/docs/pygame-ce/je_eerste_programma', label: 'pygame-ce', position: 'left' },
        { to: '/speeltuin', label: 'Speeltuin', position: 'left' },
        { href: '/docs/cheatsheet#play-package', label: 'Nieuw: v3.3.3', position: 'right' },
        { href: '/docs/voor-de-docent/bug', label: 'Foutje gevonden?', position: 'right' },
        {
          // Bewust de play-library en niet de docs-monorepo: op deze site is de
          // software zelf wat een lezer op GitHub zoekt. Zie ook
          // /docs/voor-de-docent/bug, dat de twee repo's uit elkaar houdt.
          href: 'https://github.com/Coderius-Education/play',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [],
    },
  },
});

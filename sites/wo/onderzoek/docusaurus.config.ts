import { createConfig } from '@coderius/shared/config';
import { REPO_URL, repoEditUrl } from '@coderius/shared/sites';
import { omleidingen } from './src/data/omleidingen';

export default createConfig({
  title: 'Onderzoek — Coderius',
  tagline: 'Materiaal voor het doen van onderzoek',
  siteId: 'onderzoek',
  projectName: 'onderzoek',
  trailingSlash: false,
  omleidingen,

  description:
    'Lesmateriaal over onderzoek doen voor havo en vwo: onderzoeksvragen, opzet, gegevens, literatuurstudie en kennisleer.',
  keywords:
    'onderzoek doen, wetenschapsoriëntatie, onderzoeksvaardigheden, hoofdvraag, deelvragen, profielwerkstuk',

  markdown: {
    mermaid: true,
  },
  themes: [
    '@docusaurus/theme-mermaid',
    [
      '@easyops-cn/docusaurus-search-local',
      {
        hashed: true,
        language: ['nl'],
        docsRouteBasePath: '/',
        indexBlog: false,
        indexPages: false,
        searchBarShortcutHint: false,
      },
    ],
  ],

  presets: [
    [
      'classic',
      {
        docs: {
          routeBasePath: '/',
          sidebarPath: './sidebars.js',
          editUrl: repoEditUrl('onderzoek'),
        },
        blog: false,
        theme: { customCss: './src/css/custom.css' },
      },
    ],
  ],

  themeConfig: {
    image: 'img/social-card.png',
    // Mermaid meet de tekstbreedte met zijn eigen lettertype (Trebuchet);
    // wijkt dat af van wat de browser toont, dan worden labels afgekapt.
    // Zelfde letter als de site plus extra ruimte in de vakjes voorkomt dat.
    mermaid: {
      options: {
        fontFamily:
          '"Atkinson Hyperlegible Next Variable", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
        flowchart: { padding: 24, nodeSpacing: 40, rankSpacing: 40, wrappingWidth: 300 },
      },
    },
    navbar: {
      items: [
        { type: 'docSidebar', sidebarId: 'materiaalSidebar', position: 'left', label: 'Materiaal' },
        { to: '/termen', label: 'Termen', position: 'left' },
        { href: REPO_URL, label: 'GitHub', position: 'right' },
      ],
    },
    footer: {
      style: 'dark',
      links: [],
    },
  },
});

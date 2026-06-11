import {createConfig} from '@coderius/shared/config';

export default createConfig({
  title: 'Webontwikkeling Leren — HTML, CSS & JavaScript — Coderius',
  tagline: 'leer hier je eerste website te maken',
  url: 'https://web.coderius.nl',
  projectName: 'web-docs',

  description:
    'Leer hier je eerste website te maken met HTML en CSS. Gratis cursus direct in je browser.',
  keywords: 'html leren, css leren, website maken beginners, webontwikkeling cursus gratis',

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          editUrl: 'https://github.com/Coderius-Education/web-docs/tree/main/',
        },
        blog: false,
      },
    ],
  ],

  themeConfig: {
    image: 'img/docusaurus-social-card.jpg',
    navbar: {
      title: 'coderius-web',
      logo: {alt: 'My Site Logo', src: 'img/logo.svg'},
      items: [
        {type: 'docSidebar', sidebarId: 'htmlCssSidebar', label: 'HTML & CSS', position: 'left'},
        {type: 'docSidebar', sidebarId: 'jsSidebar', label: 'JavaScript', position: 'left'},
        {to: '/cheatsheet', label: 'Cheatsheet', position: 'left'},
        {to: '/jouw-website', label: 'Jouw website', position: 'left'},
        {to: '/docenten', label: 'Docenten', position: 'left'},
        {href: 'https://github.com/Coderius-Education/web', label: 'GitHub', position: 'right'},
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Meer van Coderius',
          items: [
            {label: 'JavaScript & FastAPI', href: 'https://fullstack.coderius.nl'},
            {label: 'Leer Python', href: 'https://python.coderius.nl'},
          ],
        },
      ],
    },
  },
});

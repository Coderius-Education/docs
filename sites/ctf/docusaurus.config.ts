import {createConfig} from '@coderius/shared/config';

// Site-specifieke config; gedeelde standaarden (assets, merk-CSS, CC BY-NC 4.0,
// i18n, prism, transpilatie van @coderius/* componenten) komen uit createConfig.
export default createConfig({
  title: 'Capture The Flag — Cybersecurity Leren — Coderius',
  tagline: 'Leer cybersecurity door Capture the Flag challenges',
  url: 'https://ctf.coderius.nl',
  projectName: 'ctf-docs',

  description:
    'Los CTF-challenges op en leer cybersecurity. Codes kraken, websites hacken, forensisch onderzoek — direct in je browser.',
  keywords:
    'ctf leren, capture the flag uitleg, cybersecurity cursus beginners, ethical hacking leren, ctf challenges nederlands',

  // Editor-componenten transpileren; hun static-assets (Monaco) worden
  // automatisch mee-geserveerd. Pyodide wordt lokaal geserveerd (geen CDN).
  sharedPackages: ['@coderius/shared', '@coderius/editor', '@coderius/python-runner'],
  clientModules: ['./src/client/runtime-paths.ts'],

  presets: [
    [
      'classic',
      {
        docs: {sidebarPath: './sidebars.ts'},
        blog: false,
      },
    ],
  ],

  themeConfig: {
    navbar: {
      title: 'coderius-ctf',
      items: [
        {type: 'docSidebar', sidebarId: 'tutorialSidebar', position: 'left', label: 'Challenges'},
        {to: '/presentatie', label: 'Presentatie', position: 'left'},
        {to: '/toolbox', label: 'Toolbox', position: 'left'},
        {to: '/woordenlijst', label: 'Woordenlijst', position: 'left'},
        {href: 'https://ctf.hackchallenges.nl/register', label: 'Registreer', position: 'right'},
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {title: 'Challenges', items: [{label: 'Aan de slag', to: '/docs/intro'}]},
        {
          title: 'Links',
          items: [{label: 'CTF Platform', href: 'https://ctf.hackchallenges.nl/register'}],
        },
        {
          title: 'Meer van Coderius',
          items: [
            {label: 'Leer Python voor scripts', href: 'https://python.coderius.nl'},
            {label: 'Leer HTML/JS voor hacking', href: 'https://web.coderius.nl'},
            {label: 'DVWA Security Training', href: 'https://dvwa.coderius.nl'},
          ],
        },
      ],
    },
  },
});

import { createConfig, prismThemes } from '@coderius/shared/config';
import { REPO_URL, repoEditUrl } from '@coderius/shared/sites';

export default createConfig({
  title: 'Linux en DVWA — Coderius',
  tagline: 'Leer werken in de terminal van Linux, en oefen daarna websecurity met DVWA',
  siteId: 'dvwa',
  projectName: 'DVWA',
  matomoSiteId: 10,

  description:
    'Leer Linux in de terminal, direct in je browser, en zet Linux op je eigen computer met WSL. Daarna oefen je websecurity met DVWA.',
  keywords:
    'linux leren, linux terminal oefenen, wsl installeren, ubuntu wsl, ssh leren, dvwa tutorial, websecurity oefenen',

  // De Linux-pagina's kregen in november 2026 een eigen cursus onder docs/linux/.
  omleidingen: [
    { van: '/docs/linux_leren', naar: '/docs/linux' },
    { van: '/docs/installatie', naar: '/docs/linux/wsl/installeren' },
  ],

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
          editUrl: repoEditUrl('dvwa'),
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
        { to: '/docs/linux/wsl/installeren', label: 'WSL', position: 'left' },
        {
          to: '/docs/dvwa_tutorial/brute-force/low',
          label: 'DVWA Challenges',
          position: 'left',
          items: [
            { to: '/docs/dvwa_tutorial/brute-force/low', label: 'Brute Force' },
            { to: '/docs/dvwa_tutorial/command-injection/low', label: 'Command Injection' },
            { to: '/docs/dvwa_tutorial/authorization-bypass/low', label: 'Authorization Bypass' },
            { to: '/docs/dvwa_tutorial/sql-injection/low', label: 'SQL Injection' },
            { to: '/docs/dvwa_tutorial/sql-injection-blind/low', label: 'SQL Injection (Blind)' },
            { to: '/docs/dvwa_tutorial/xss-reflected/low', label: 'XSS (Reflected)' },
            { to: '/docs/dvwa_tutorial/xss-stored/low', label: 'XSS (Stored)' },
            { to: '/docs/dvwa_tutorial/xss-dom/low', label: 'XSS (DOM)' },
            { to: '/docs/dvwa_tutorial/csrf/low', label: 'CSRF' },
            { to: '/docs/dvwa_tutorial/file-inclusion/low', label: 'File Inclusion' },
            { to: '/docs/dvwa_tutorial/file-upload/low', label: 'File Upload' },
            { to: '/docs/dvwa_tutorial/weak-session-ids/low', label: 'Weak Session IDs' },
            { to: '/docs/dvwa_tutorial/csp-bypass/low', label: 'CSP Bypass' },
            { to: '/docs/dvwa_tutorial/javascript-attacks/low', label: 'JavaScript Attacks' },
          ],
        },
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
      additionalLanguages: ['php'],
    },
  },
});

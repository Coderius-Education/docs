import {createConfig, prismThemes} from '@coderius/shared/config';

export default createConfig({
  title: 'DVWA Security Training — Leer Websecurity — Coderius',
  tagline: 'Oefen websecurity met DVWA direct in je browser',
  url: 'https://dvwa.coderius.nl',
  projectName: 'DVWA',

  description:
    'Oefen websecurity met DVWA direct in je browser. Geen installatie nodig. Leer SQL-injectie, XSS, command injection en meer.',
  keywords:
    'dvwa tutorial, dvwa zonder installatie, websecurity oefenen, sql injectie leren, command injection tutorial, ethical hacking browser',

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
          editUrl: 'https://github.com/Coderius-Education/DVWA/tree/main/',
        },
        blog: false,
      },
    ],
  ],

  plugins: [
    [
      '@docusaurus/plugin-content-docs',
      {id: 'dvwa_tutorial', path: 'dvwa_tutorial', routeBasePath: 'dvwa_tutorial'},
    ],
  ],

  themeConfig: {
    image: 'img/docusaurus-social-card.jpg',
    navbar: {
      title: 'Coderius-DVWA',
      items: [
        {to: '/docs/linux_leren', label: 'Linux leren', position: 'left'},
        {to: '/docs/installatie', label: 'WSL installeren', position: 'left'},
        {to: '/docs/dvwa_installatie', label: 'DVWA installeren', position: 'left'},
        {
          to: 'dvwa_tutorial/brute-force/low',
          label: 'DVWA Challenges',
          position: 'left',
          items: [
            {to: 'dvwa_tutorial/brute-force/low', label: 'Brute Force'},
            {to: 'dvwa_tutorial/command-injection/low', label: 'Command Injection'},
            {to: 'dvwa_tutorial/authorization-bypass/low', label: 'Authorization Bypass'},
            {to: 'dvwa_tutorial/sql-injection/low', label: 'SQL Injection'},
            {to: 'dvwa_tutorial/sql-injection-blind/low', label: 'SQL Injection (Blind)'},
            {to: 'dvwa_tutorial/xss-reflected/low', label: 'XSS (Reflected)'},
            {to: 'dvwa_tutorial/xss-stored/low', label: 'XSS (Stored)'},
            {to: 'dvwa_tutorial/xss-dom/low', label: 'XSS (DOM)'},
            {to: 'dvwa_tutorial/csrf/low', label: 'CSRF'},
            {to: 'dvwa_tutorial/file-inclusion/low', label: 'File Inclusion'},
            {to: 'dvwa_tutorial/file-upload/low', label: 'File Upload'},
            {to: 'dvwa_tutorial/weak-session-ids/low', label: 'Weak Session IDs'},
            {to: 'dvwa_tutorial/csp-bypass/low', label: 'CSP Bypass'},
            {to: 'dvwa_tutorial/javascript-attacks/low', label: 'JavaScript Attacks'},
          ],
        },
        {to: '/docs/cheatsheet', label: 'Cheatsheet', position: 'left'},
        {href: 'https://github.com/Coderius-Education/DVWA', label: 'GitHub', position: 'right'},
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Meer van Coderius',
          items: [
            {label: 'Leer Python', href: 'https://python.coderius.nl'},
            {label: 'CTF Challenges', href: 'https://ctf.coderius.nl'},
            {label: 'Fullstack Development', href: 'https://fullstack.coderius.nl'},
          ],
        },
      ],
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['php'],
    },
  },
});

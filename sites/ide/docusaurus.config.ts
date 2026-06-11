import { createConfig } from '@coderius/shared/config';

export default createConfig({
  title: 'Coderius IDE',
  tagline: 'Schrijf en draai code direct in je browser',
  url: 'https://ide.coderius.nl',
  projectName: 'ide',

  description:
    'Een gratis browser-IDE voor leerlingen: Python, websites (HTML, CSS en JavaScript) en MicroPython, zonder installatie.',
  keywords: 'python online editor, html css javascript editor, micropython, browser ide, coderius',

  // Editor-componenten transpileren; hun static-assets (Monaco) worden
  // automatisch mee-geserveerd.
  sharedPackages: ['@coderius/shared', '@coderius/editor', '@coderius/python-runner'],
  clientModules: ['./src/client/runtime-paths.ts'],

  presets: [
    [
      'classic',
      {
        docs: false,
        blog: false,
        theme: { customCss: './src/css/custom.css' },
      },
    ],
  ],

  themeConfig: {
    navbar: {
      title: 'Coderius IDE',
      logo: { alt: 'Coderius IDE', src: 'img/logo.svg' },
      items: [{ to: '/', label: 'Editor', position: 'left' }],
    },
  },
});

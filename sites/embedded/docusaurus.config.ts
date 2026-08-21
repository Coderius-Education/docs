import { createConfig, prismThemes } from '@coderius/shared/config';
import { REPO_URL, repoEditUrl } from '@coderius/shared/sites';

export default createConfig({
  title: 'Embedded Programmeren — Coderius',
  tagline: 'Van knipperende LED tot STM32: leer microcontrollers programmeren',
  url: 'https://embedded.coderius.nl',
  projectName: 'embedded-docs',
  matomoSiteId: 13,

  description:
    'Leer embedded programmeren: van je eerste blink-LED in de Arduino IDE tot het configureren van IO en interfaces op een STM32. Simuleer alles in je browser.',
  keywords:
    'arduino leren, platformio tutorial, stm32 blue pill, embedded programmeren, microcontroller beginners, arduino uno blink, stm32 gpio, wokwi simulator',

  markdown: { hooks: { onBrokenMarkdownLinks: 'throw' } },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          editUrl: repoEditUrl('embedded'),
        },
        blog: false,
        theme: { customCss: './src/css/custom.css' },
      },
    ],
  ],

  themeConfig: {
    image: 'img/logo.svg',
    navbar: {
      title: 'Embedded',
      logo: { alt: 'Coderius Embedded', src: 'img/logo.svg' },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'tutorialSidebar',
          position: 'left',
          label: 'Begin hier!',
        },
        { to: '/cheatsheet', label: 'Cheatsheet', position: 'left' },
        {
          to: '/docs/er-gaat-iets-mis/upload-mislukt',
          label: 'Er gaat iets mis',
          position: 'left',
        },
        {
          href: REPO_URL,
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [],
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['arduino', 'cpp', 'ini', 'bash'],
    },
  },
});

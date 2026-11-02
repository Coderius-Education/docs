// @ts-check

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

/**
 * Handmatige sidebar. Eerst de terminal in de browser, dan Linux op je eigen
 * computer. De volgorde is de leerroute; elke les linkt naar de volgende
 * (src/docs-tests/linux.test.ts). De cheatsheet staat in de navbar.
 *
 * @type {import('@docusaurus/plugin-content-docs').SidebarsConfig}
 */
const sidebars = {
  linuxSidebar: [
    'index',
    {
      type: 'category',
      label: '1. De terminal',
      collapsed: false,
      items: [
        'terminal/eerste-commando',
        'terminal/mappen',
        'terminal/bestanden-lezen',
        'terminal/maken',
        'terminal/kopieren',
        'terminal/zoeken',
        'terminal/rechten',
      ],
    },
    {
      type: 'category',
      label: '2. Linux op je eigen computer (WSL)',
      collapsed: false,
      items: [
        'wsl/installeren',
        'wsl/windows-en-linux',
        'wsl/apt',
        'wsl/nano',
        'wsl/diensten',
        'wsl/ssh',
      ],
    },
  ],
};

export default sidebars;

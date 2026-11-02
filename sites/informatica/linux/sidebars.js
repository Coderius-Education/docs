// @ts-check

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

/**
 * Handmatige sidebar, op thema. De volgorde is de leerroute; elke les linkt
 * naar de volgende (src/docs-tests/linux.test.ts), en het nummer van een les
 * is thema.les. De cheatsheet staat in de navbar.
 *
 * De map van een les zegt waar je hem doet: terminal/ in de oefenterminal op
 * de pagina, wsl/ op je eigen Ubuntu. De thema's 1 tot en met 4 zijn helemaal
 * terminal/, zodat je zonder installatie tot en met de rechten komt. De sidebar
 * zet er een label "browser" of "WSL" bij (src/css/custom.css), op het pad.
 */

/**
 * @param {string} label
 * @param {string[]} items
 * @returns {{ type: 'category', label: string, collapsed: boolean, items: string[] }}
 */
const thema = (label, items) => ({ type: 'category', label, collapsed: true, items });

/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {
  linuxSidebar: [
    'index',
    thema('1. Rondkijken', ['terminal/eerste-commando', 'terminal/mappen', 'terminal/sneller']),
    thema('2. Bestanden', [
      'terminal/bestanden-lezen',
      'terminal/maken',
      'terminal/kopieren',
      'terminal/jokertekens',
    ]),
    thema('3. Zoeken', ['terminal/zoeken', 'terminal/vinden']),
    thema('4. Gebruikers en rechten', ['terminal/rechten']),
    thema('5. Linux op je eigen computer', ['wsl/installeren', 'wsl/windows-en-linux', 'wsl/hulp']),
    thema("6. Programma's en diensten", ['wsl/apt', 'wsl/nano', 'wsl/processen', 'wsl/diensten']),
    thema('7. Netwerk', ['wsl/netwerk', 'wsl/ssh']),
  ],
};

export default sidebars;

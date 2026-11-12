import { createRequire } from 'node:module';
import { createConfig } from '@coderius/shared/config';
import { REPO_URL, repoEditUrl } from '@coderius/shared/sites';
import type { Plugin } from '@docusaurus/types';

const projectName = 'robotica-docs';

// Blockly tekent de blokken van de Golfbot, en dat gebeurt alleen in de
// browser (`src/components/Blokken`). In de serverbuild zou webpack de
// node-versie van Blockly meenemen, met jsdom erbij, voor code die daar nooit
// draait; die laat je hier weg.
function blocklyAlleenInDeBrowser(): Plugin {
  return {
    name: 'blockly-alleen-in-de-browser',
    configureWebpack(_config, isServer) {
      if (!isServer) return {};
      return { resolve: { alias: { blockly: false, '@leaphy-robotics/leaphy-blocks': false } } };
    },
  };
}

// <OnderdelenOverzicht> leest de sidebar met useDocsSidebar() uit
// '@docusaurus/plugin-content-docs/client'. pnpm heeft meerdere kopieën van dat
// package; vanuit src/ kwam een andere kopie dan die van theme-classic, en dan
// zit de hook buiten de provider van het thema en faalt de build. Deze alias
// stuurt elke import naar de kopie van theme-classic, net als in fullstack.
const require = createRequire(import.meta.url);
const themeClassic = require.resolve('@docusaurus/theme-classic', {
  paths: [require.resolve('@docusaurus/preset-classic')],
});
const docsClient = require.resolve('@docusaurus/plugin-content-docs/client', {
  paths: [themeClassic],
});
function eenDocsClient(): Plugin {
  return {
    name: 'een-docs-client',
    configureWebpack: () => ({
      resolve: { alias: { '@docusaurus/plugin-content-docs/client$': docsClient } },
    }),
  };
}

export default createConfig({
  title: 'Robotica — Coderius',
  siteId: 'robotica',
  projectName,
  // Elke ##-sectie van een les is een tabblad (root-CLAUDE.md, Les-tabbladen),
  // ook in de Lego-auto en de Golfbot, die een eigen docs-plugin hebben.
  lesTabs: true,
  matomoSiteId: 7,
  // Werk van robotica.coderius.nl (vóór de verhuizing): zie oude-opslag.js.
  oudeOpslag: {
    localStorage: [
      { van: 'webMicroEditor.code', label: 'Je code in de editor' },
      { van: 'webMicroEditor.currentFile', label: 'Je code in de editor' },
      { van: 'webMicroEditor.leaphyRepo', label: 'Instellingen van de editor' },
      { van: 'webMicroEditor.leaphyBranch', label: 'Instellingen van de editor' },
      { van: 'webMicroEditor.fontSize', label: 'Instellingen van de editor' },
    ],
  },

  // De Golfbot heette eerst Click Golfer en stond onder /click_golfer/.
  // Werkbladen en bladwijzers met dat adres landen op dezelfde les onder
  // /golfbot/. Een les die er niet meer is, stuurt door naar de les die zijn
  // plek in de route nam: Hole in one staat nu bij de arm, en de uitbreiding
  // verving Een naam voor je blokken en de Extra's. Aansluiten,
  // bal-detecteren en hole-in-one gingen al eerder op in andere lessen.
  omleidingen: [
    { van: '/click_golfer/intro', naar: '/golfbot/intro' },
    { van: '/click_golfer/microcontroller', naar: '/golfbot/microcontroller' },
    { van: '/click_golfer/easybloqs', naar: '/golfbot/easybloqs' },
    { van: '/click_golfer/ir-sensor', naar: '/golfbot/ir-sensor' },
    { van: '/click_golfer/servo', naar: '/golfbot/servo' },
    { van: '/click_golfer/bal-slaan', naar: '/golfbot/bal-slaan' },
    { van: '/click_golfer/bouwen', naar: '/golfbot/bouwen' },
    { van: '/click_golfer/hout', naar: '/golfbot/hout' },
    { van: '/click_golfer/oefenen', naar: '/golfbot/bal-slaan' },
    { van: '/click_golfer/mikken', naar: '/golfbot/arm#hole-in-one' },
    { van: '/click_golfer/subprogrammas', naar: '/golfbot/uitbreiding' },
    { van: '/click_golfer/extras', naar: '/golfbot/uitbreiding' },
    { van: '/click_golfer/aansluiten', naar: '/golfbot/ir-sensor' },
    { van: '/click_golfer/bal-detecteren', naar: '/golfbot/ir-sensor' },
    { van: '/click_golfer/hole-in-one', naar: '/golfbot/arm#hole-in-one' },
    // RoboCup Junior stond tot november 2026 diep in de Bibliotheek, onder
    // Competities/RoboCup-Junior/Redden-Basis; nu heeft het een eigen ingang.
    { van: '/docs/Competities/RoboCup-Junior/Redden-Basis/start', naar: '/docs/robocup/start' },
    {
      van: '/docs/Competities/RoboCup-Junior/Redden-Basis/the_material',
      naar: '/docs/robocup/the_material',
    },
    {
      van: '/docs/Competities/RoboCup-Junior/Redden-Basis/redden_basis',
      naar: '/docs/robocup/start',
    },
    {
      van: '/docs/Competities/RoboCup-Junior/Redden-Basis/lijnvolgen',
      naar: '/docs/robocup/lijnvolgen',
    },
    {
      van: '/docs/Competities/RoboCup-Junior/Redden-Basis/obstakels',
      naar: '/docs/robocup/obstakels',
    },
    {
      van: '/docs/Competities/RoboCup-Junior/Redden-Basis/evacuatiezone_detectie',
      naar: '/docs/robocup/evacuatiezone_detectie',
    },
    {
      van: '/docs/Competities/RoboCup-Junior/Redden-Basis/rijden_evacuatiezone',
      naar: '/docs/robocup/rijden_evacuatiezone',
    },
    {
      van: '/docs/Competities/RoboCup-Junior/Redden-Basis/vinden_van_ballen',
      naar: '/docs/robocup/vinden_van_ballen',
    },
    {
      van: '/docs/Competities/RoboCup-Junior/Redden-Basis/grijpen_van_een_bal',
      naar: '/docs/robocup/grijpen_van_een_bal',
    },
    {
      van: '/docs/Competities/RoboCup-Junior/Redden-Basis/detectie_eindpunt',
      naar: '/docs/robocup/detectie_eindpunt',
    },
    {
      van: '/docs/Competities/RoboCup-Junior/Redden-Basis/pinnen_nano_connect',
      naar: '/docs/robocup/pinnen_nano_connect',
    },
    { van: '/docs/category/redden-basis', naar: '/docs/robocup/start' },
    // De Bibliotheek (Microcontrollers/Arduino Nano RP2040 Connect/Tutorial-…,
    // 44 pagina's in 16 categorieën) werd in november 2026 één pagina per
    // onderdeel onder docs/onderdelen; elke oude subpagina stuurt naar de
    // sectie die hem overnam, elke oude categoriepagina naar het onderdeel.
    {
      van: '/docs/Microcontrollers/Arduino Nano RP2040 Connect/Tutorial-buzzer/materiaal',
      naar: '/docs/onderdelen/buzzer#materiaal',
    },
    {
      van: '/docs/Microcontrollers/Arduino Nano RP2040 Connect/Tutorial-buzzer/wiring',
      naar: '/docs/onderdelen/buzzer#aansluiten',
    },
    {
      van: '/docs/Microcontrollers/Arduino Nano RP2040 Connect/Tutorial-buzzer/code',
      naar: '/docs/onderdelen/buzzer#code',
    },
    { van: '/docs/category/tutorial---buzzer', naar: '/docs/onderdelen/buzzer' },
    {
      van: '/docs/Microcontrollers/Arduino Nano RP2040 Connect/Tutorial-servo/materiaal',
      naar: '/docs/onderdelen/servo#materiaal',
    },
    {
      van: '/docs/Microcontrollers/Arduino Nano RP2040 Connect/Tutorial-servo/wiring',
      naar: '/docs/onderdelen/servo#aansluiten',
    },
    { van: '/docs/category/tutorial---servo-motor', naar: '/docs/onderdelen/servo' },
    {
      van: '/docs/Microcontrollers/Arduino Nano RP2040 Connect/Tutorial-Dcmotor/materiaal',
      naar: '/docs/onderdelen/dc-motor#materiaal',
    },
    {
      van: '/docs/Microcontrollers/Arduino Nano RP2040 Connect/Tutorial-Dcmotor/wiring',
      naar: '/docs/onderdelen/dc-motor#aansluiten',
    },
    {
      van: '/docs/Microcontrollers/Arduino Nano RP2040 Connect/Tutorial-Dcmotor/b_let_op',
      naar: '/docs/onderdelen/dc-motor#er-gaat-iets-mis',
    },
    {
      van: '/docs/Microcontrollers/Arduino Nano RP2040 Connect/Tutorial-Dcmotor/code',
      naar: '/docs/onderdelen/dc-motor#code',
    },
    { van: '/docs/category/tutorial---dcmotor', naar: '/docs/onderdelen/dc-motor' },
    {
      van: '/docs/Microcontrollers/Arduino Nano RP2040 Connect/Tutorial-oled-scherm/materiaal',
      naar: '/docs/onderdelen/oled-scherm#materiaal',
    },
    {
      van: '/docs/Microcontrollers/Arduino Nano RP2040 Connect/Tutorial-oled-scherm/code_met_mux',
      naar: '/docs/onderdelen/oled-scherm#aansluiten',
    },
    { van: '/docs/category/tutorial---oled-scherm', naar: '/docs/onderdelen/oled-scherm' },
    {
      van: '/docs/Microcontrollers/Arduino Nano RP2040 Connect/Tutorial-digitale-IR-sensor/materiaal',
      naar: '/docs/onderdelen/ir-digitaal#materiaal',
    },
    {
      van: '/docs/Microcontrollers/Arduino Nano RP2040 Connect/Tutorial-digitale-IR-sensor/wiring',
      naar: '/docs/onderdelen/ir-digitaal#aansluiten',
    },
    { van: '/docs/category/tutorial---digitale-ir-sensor', naar: '/docs/onderdelen/ir-digitaal' },
    {
      van: '/docs/Microcontrollers/Arduino Nano RP2040 Connect/Tutorial-analoge IR-sensor/material',
      naar: '/docs/onderdelen/ir-analoog#materiaal',
    },
    {
      van: '/docs/Microcontrollers/Arduino Nano RP2040 Connect/Tutorial-analoge IR-sensor/analog_ir',
      naar: '/docs/onderdelen/ir-analoog#een-sensor',
    },
    {
      van: '/docs/Microcontrollers/Arduino Nano RP2040 Connect/Tutorial-analoge IR-sensor/analog_irs',
      naar: '/docs/onderdelen/ir-analoog#twee-sensoren',
    },
    {
      van: '/docs/Microcontrollers/Arduino Nano RP2040 Connect/Tutorial-analoge IR-sensor/opties',
      naar: '/docs/onderdelen/ir-analoog#hoeveel-sensoren',
    },
    { van: '/docs/category/tutorial---analoge-ir-sensor', naar: '/docs/onderdelen/ir-analoog' },
    {
      van: '/docs/Microcontrollers/Arduino Nano RP2040 Connect/Tutorial-afstandssensor/materiaal',
      naar: '/docs/onderdelen/afstandssensor#materiaal',
    },
    {
      van: '/docs/Microcontrollers/Arduino Nano RP2040 Connect/Tutorial-afstandssensor/wiring',
      naar: '/docs/onderdelen/afstandssensor#aansluiten',
    },
    { van: '/docs/category/tutorial---afstandssensor', naar: '/docs/onderdelen/afstandssensor' },
    {
      van: '/docs/Microcontrollers/Arduino Nano RP2040 Connect/Tutorial-TOF/materiaal',
      naar: '/docs/onderdelen/tof#materiaal',
    },
    {
      van: '/docs/Microcontrollers/Arduino Nano RP2040 Connect/Tutorial-TOF/wiring_code_zonder_mux',
      naar: '/docs/onderdelen/tof#zonder-mux',
    },
    {
      van: '/docs/Microcontrollers/Arduino Nano RP2040 Connect/Tutorial-TOF/wiring_code_met_mux',
      naar: '/docs/onderdelen/tof#met-mux',
    },
    {
      van: '/docs/Microcontrollers/Arduino Nano RP2040 Connect/Tutorial-TOF/wiring_code_2_met_mux',
      naar: '/docs/onderdelen/tof#twee-met-mux',
    },
    { van: '/docs/category/tutorial---time-of-flight', naar: '/docs/onderdelen/tof' },
    {
      van: '/docs/Microcontrollers/Arduino Nano RP2040 Connect/Tutorial-lampje/pak_led',
      naar: '/docs/onderdelen/led#materiaal',
    },
    {
      van: '/docs/Microcontrollers/Arduino Nano RP2040 Connect/Tutorial-lampje/code',
      naar: '/docs/onderdelen/led#aansluiten',
    },
    { van: '/docs/category/tutorial---led', naar: '/docs/onderdelen/led' },
    {
      van: '/docs/Microcontrollers/Arduino Nano RP2040 Connect/Tutorial-RGBled/materiaal',
      naar: '/docs/onderdelen/rgb-led#materiaal',
    },
    {
      van: '/docs/Microcontrollers/Arduino Nano RP2040 Connect/Tutorial-RGBled/wiring',
      naar: '/docs/onderdelen/rgb-led#aansluiten',
    },
    {
      van: '/docs/Microcontrollers/Arduino Nano RP2040 Connect/Tutorial-RGBled/code',
      naar: '/docs/onderdelen/rgb-led#code',
    },
    { van: '/docs/category/tutorial---rgbled', naar: '/docs/onderdelen/rgb-led' },
    {
      van: '/docs/Microcontrollers/Arduino Nano RP2040 Connect/Tutorial-installatie/board',
      naar: '/docs/onderdelen/installatie#bord',
    },
    {
      van: '/docs/Microcontrollers/Arduino Nano RP2040 Connect/Tutorial-installatie/editor',
      naar: '/docs/onderdelen/installatie#editor',
    },
    {
      van: '/docs/Microcontrollers/Arduino Nano RP2040 Connect/Tutorial-installatie/verbinden',
      naar: '/docs/onderdelen/installatie#verbinden',
    },
    {
      van: '/docs/Microcontrollers/Arduino Nano RP2040 Connect/Tutorial-installatie/REPL',
      naar: '/docs/onderdelen/installatie#micropython',
    },
    {
      van: '/docs/Microcontrollers/Arduino Nano RP2040 Connect/Tutorial-installatie/package',
      naar: '/docs/onderdelen/installatie#leaphymicropython',
    },
    { van: '/docs/category/tutorial---installatie', naar: '/docs/onderdelen/installatie' },
    {
      van: '/docs/Microcontrollers/Arduino Nano RP2040 Connect/Tutorial-ingebouwd-lampje/ingebouwd_lampje',
      naar: '/docs/onderdelen/ingebouwd-lampje#aanzetten',
    },
    {
      van: '/docs/Microcontrollers/Arduino Nano RP2040 Connect/Tutorial-ingebouwd-lampje/knipperen',
      naar: '/docs/onderdelen/ingebouwd-lampje#knipperen',
    },
    {
      van: '/docs/Microcontrollers/Arduino Nano RP2040 Connect/Tutorial-ingebouwd-lampje/ingebouwd_lampje_kleur',
      naar: '/docs/onderdelen/ingebouwd-lampje#kleur',
    },
    {
      van: '/docs/category/tutorial---ingebouwd-lampje',
      naar: '/docs/onderdelen/ingebouwd-lampje',
    },
    {
      van: '/docs/Microcontrollers/Arduino Nano RP2040 Connect/Tutorial-meten is weten/pin_nameten',
      naar: '/docs/onderdelen/meten',
    },
    {
      van: '/docs/Microcontrollers/Arduino Nano RP2040 Connect/Tutorial-meten is weten/board',
      naar: '/docs/onderdelen/meten#video',
    },
    { van: '/docs/category/tutorial---meten-is-weten', naar: '/docs/onderdelen/meten' },
    {
      van: '/docs/Microcontrollers/Arduino Nano RP2040 Connect/Tutorial-debuggen/debuggen',
      naar: '/docs/onderdelen/er-gaat-iets-mis',
    },
    { van: '/docs/category/tutorial---debuggen', naar: '/docs/onderdelen/er-gaat-iets-mis' },
    {
      van: '/docs/Microcontrollers/Arduino Nano RP2040 Connect/Tutorial-batterijen/materiaal',
      naar: '/docs/onderdelen/batterijen#materiaal',
    },
    {
      van: '/docs/Microcontrollers/Arduino Nano RP2040 Connect/Tutorial-batterijen/wiring',
      naar: '/docs/onderdelen/batterijen#aansluiten',
    },
    {
      van: '/docs/Microcontrollers/Arduino Nano RP2040 Connect/Tutorial-batterijen/code',
      naar: '/docs/onderdelen/batterijen#code',
    },
    { van: '/docs/category/tutorial---batterijen', naar: '/docs/onderdelen/batterijen' },
    {
      van: '/docs/Microcontrollers/Arduino Nano RP2040 Connect/Tutorial-lijnvolgen/lijnvolgen',
      naar: '/docs/onderdelen/lijnvolgen#hoe-werkt-lijnvolgen',
    },
    {
      van: '/docs/Microcontrollers/Arduino Nano RP2040 Connect/Tutorial-lijnvolgen/code',
      naar: '/docs/onderdelen/lijnvolgen#code',
    },
    { van: '/docs/category/tutorial---lijnvolgen', naar: '/docs/onderdelen/lijnvolgen' },
  ],

  // @coderius/shared is de standaard; @coderius/checker levert de nakijker.
  sharedPackages: ['@coderius/shared', '@coderius/checker'],

  // Robotica is (nog) Engelstalig.
  i18n: { defaultLocale: 'en', locales: ['en'] },
  markdown: { hooks: { onBrokenMarkdownLinks: 'warn' } },
  // De "Open in de editor"-links zetten de code in #code=…, en dat is geen
  // anker; ze slaan de controle over (theme/CodeBlock). Daarna bleef er niets
  // over, dus een echt kapot anker breekt de build in plaats van te
  // verdwijnen tussen negentig meldingen.
  onBrokenAnchors: 'throw',

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          editUrl: repoEditUrl('robotica'),
        },
        blog: {
          showReadingTime: true,
          editUrl: repoEditUrl('robotica'),
        },
        theme: { customCss: './src/css/custom.css' },
      },
    ],
  ],

  plugins: [
    blocklyAlleenInDeBrowser,
    eenDocsClient,
    [
      '@docusaurus/plugin-content-docs',
      {
        id: 'lego_auto',
        path: 'lego_auto',
        routeBasePath: 'lego_auto',
        sidebarPath: './sidebarsLegoAuto.ts',
      },
    ],
    [
      '@docusaurus/plugin-content-docs',
      {
        id: 'golfbot',
        path: 'golfbot',
        routeBasePath: 'golfbot',
        sidebarPath: './sidebarsGolfbot.ts',
      },
    ],
  ],

  themeConfig: {
    image: 'img/docusaurus-social-card.jpg',
    navbar: {
      items: [
        {
          type: 'doc',
          docId: 'intro',
          position: 'left',
          label: 'Lego-auto',
          docsPluginId: 'lego_auto',
        },
        {
          type: 'doc',
          docId: 'intro',
          position: 'left',
          label: 'Golfbot',
          docsPluginId: 'golfbot',
        },
        {
          type: 'docSidebar',
          sidebarId: 'onderdelenSidebar',
          position: 'left',
          label: 'Onderdelen',
        },
        {
          type: 'docSidebar',
          sidebarId: 'robocupSidebar',
          position: 'left',
          label: 'RoboCup Junior',
        },
        { to: '/editor', label: 'Editor', position: 'left' },
        {
          type: 'dropdown',
          label: 'Hulp',
          position: 'left',
          items: [
            { to: '/cheatsheet', label: 'Cheatsheet' },
            { to: '/docs/onderdelen/er-gaat-iets-mis', label: 'Er gaat iets mis' },
            { to: '/robot-checken', label: 'Robot checken' },
          ],
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
      copyright: `Licensed under <a href="https://creativecommons.org/licenses/by-nc/4.0/" target="_blank" rel="noopener noreferrer">Creative Commons Attribution-NonCommercial 4.0 International (CC BY-NC 4.0)</a>.`,
    },
  },
});

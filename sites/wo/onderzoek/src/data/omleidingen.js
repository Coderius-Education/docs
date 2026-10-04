// Oude adressen van vóór de herstructurering (aug 2026), met hun nieuwe plek.
// createConfig zet op elk oud adres een pagina die doorstuurt
// (packages/shared/plugins/omleidingen.js). Verhuis je een pagina, zet hem
// dan hier bij.

/** @type {{ van: string; naar: string }[]} */
export const omleidingen = [
  { van: '/theoriegericht-vs-ontwerpgericht', naar: '/typen/theorie-vs-ontwerp' },
  { van: '/spelregels', naar: '/spelregels/de-vier-spelregels' },
  { van: '/interne-externe-validiteit', naar: '/spelregels/intern-vs-extern' },
  { van: '/soorten-onderzoek', naar: '/opzet/soorten/soorten-combineren' },
  { van: '/gegevensverzameling', naar: '/opzet/methoden/methode-kiezen' },
  { van: '/functies-van-onderzoek', naar: '/opzet/functies/functies-overzicht' },
  { van: '/kwalitatief-vs-kwantitatief', naar: '/gegevens/kwal-vs-kwant' },
  { van: '/keuzedriehoek', naar: '/opzet/keuzedriehoek' },
];

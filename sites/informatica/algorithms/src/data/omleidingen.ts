// Lessen die verhuisd zijn, met hun oude adres. createConfig zet op elk oud
// adres een pagina die doorstuurt (packages/shared/plugins/omleidingen.js).
// src/docs-tests/omleidingen.test.ts eist dat elk doel een stap van de route
// is en dat op geen oud adres nog een pagina staat.

export type Omleiding = { van: string; naar: string };

// De projecten van de route machine learning waren elk één pagina. Nu is elk
// project een map met bouwstappen, en het oude adres wijst naar de eerste.
const ml: [string, string][] = [
  ['ml-regels/01-chatbot', '01-een-trefwoord'],
  ['ml-regels/02-spamfilter', '01-een-score'],
  ['ml-regels/03-spamfilter-leert', '01-woorden-tellen'],
  ['ml-afstand/01-dichtstbijzijnde-buur', '01-een-afstand'],
  ['ml-afstand/02-k-buren', '01-de-buren-sorteren'],
  ['ml-afstand/03-eerlijk-testen', '01-oefenen-en-toetsen'],
  ['ml-kans/01-dobbelsteen', '01-een-worp'],
  ['ml-kans/02-surfer', '01-het-web'],
  ['ml-spellen/01-nim-strategie', '01-een-zet'],
  ['ml-spellen/02-nim-leert', '01-een-score-per-zet'],
  ['ml-zoeken/01-buren', '01-een-raster'],
  ['ml-zoeken/02-kortste-weg', '01-een-wachtrij'],
  ['ml-neuronen/01-neuron', '01-gewichten'],
  ['ml-neuronen/02-neuron-leert', '01-de-fout'],
];

export const omleidingen: Omleiding[] = [
  ...ml.map(([project, stap]) => ({ van: `/docs/${project}`, naar: `/docs/${project}/${stap}` })),
  // Klaar voor Shopping kreeg ook een andere mapnaam.
  {
    van: '/docs/ml-afstand/04-shopping',
    naar: '/docs/ml-afstand/04-klaar-voor-shopping/01-een-csv-lezen',
  },
];

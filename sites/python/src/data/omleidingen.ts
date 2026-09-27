// Lessen die verhuisd zijn, met hun oude adres. createConfig zet op elk oud
// adres een pagina die doorstuurt (packages/shared/plugins/omleidingen.js).
// omleidingen.test.ts eist dat elk doel een les is en elk oud adres niet meer.

export type Omleiding = { van: string; naar: string };

// PR #110: Modules en Bestanden werden eigen hoofdstukken; Klassen schoof op
// van 14 naar 15 en Fouten afvangen van 15 naar 16.
const klassen = [
  'a-je-eerste-klasse',
  'b-meer-attributen',
  'c-attributen-veranderen',
  'd-je-eerste-methode',
  'e-methoden-die-veranderen',
  'f-methoden-met-return',
  'g-objecten-in-een-lijst',
  'h-een-klasse-vol-objecten',
  'i-str',
  'j-klassen-en-json',
  'k-objecten-inlezen',
];
const fouten = [
  'a-try-en-except',
  'b-welke-fout',
  'c-de-melding-bewaren',
  'd-proberen-tot-het-lukt',
  'e-een-bestand-dat-er-niet-is',
  'f-zelf-een-fout-opwerpen',
];

export const omleidingen: Omleiding[] = [
  { van: '/docs/functies/09d-modules', naar: '/docs/modules/09d-modules' },
  { van: '/docs/functies/09e-eigen-module', naar: '/docs/modules/09e-eigen-module' },
  { van: '/docs/data/11d-json', naar: '/docs/bestanden/14e-json' },
  { van: '/docs/data/11e-json-bestand', naar: '/docs/bestanden/14f-json-bestand' },
  ...klassen.map((s) => ({ van: `/docs/klassen/14${s}`, naar: `/docs/klassen/15${s}` })),
  ...fouten.map((s) => ({ van: `/docs/fouten/15${s}`, naar: `/docs/fouten/16${s}` })),
];

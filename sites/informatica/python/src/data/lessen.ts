// Alle lessen van de python-cursus, in de volgorde van de cursus. De
// projectkiezer (src/components/ProjectKiezer) haalt hieruit de volgorde van
// de concept-chips, de naam van elk concept, en "vanaf les …" op een kaart:
// de laatste les die een activiteit nodig heeft. projectkiezer.test.ts
// bewaakt dat deze lijst precies de lessen in docs/ is, met hun kop en pad.

export type Les = {
  /** Het nummerprefix van het bestand, bv. '06a'. */
  id: string;
  /** De kop van de les, bv. '6a For-loop'. */
  label: string;
  /** Het hoofdstuk, zoals in de sidebar (label uit _category_.json). */
  hoofdstuk: string;
  /** Het pad van de les, bv. '/docs/herhalen/06a-for-loop'. */
  pad: string;
};

export const lessen: Les[] = [
  { id: '00', label: '0 Welkom bij Python', hoofdstuk: 'Basis', pad: '/docs/basis/introductie' },
  {
    id: '01',
    label: '1 Jouw naam op het scherm',
    hoofdstuk: 'Basis',
    pad: '/docs/basis/jouw-naam-op-het-scherm',
  },
  {
    id: '02',
    label: '2 Jij als variabele',
    hoofdstuk: 'Basis',
    pad: '/docs/basis/jij-als-variabele',
  },
  { id: '03', label: '3 De rekenmachine', hoofdstuk: 'Basis', pad: '/docs/basis/rekenmachine' },
  {
    id: '03b',
    label: '3b Tekst naar getal',
    hoofdstuk: 'Basis',
    pad: '/docs/basis/03b-tekst-naar-getal',
  },
  {
    id: '04a',
    label: '4a Slimme berichten met f-strings',
    hoofdstuk: 'Tekst',
    pad: '/docs/tekst/04a-f-strings',
  },
  {
    id: '04b',
    label: '4b String-methoden',
    hoofdstuk: 'Tekst',
    pad: '/docs/tekst/04b-string-methoden',
  },
  {
    id: '05a',
    label: '5a Booleans en vergelijken',
    hoofdstuk: 'Beslissen',
    pad: '/docs/beslissen/05a-booleans-en-vergelijken',
  },
  { id: '05b', label: '5b If en else', hoofdstuk: 'Beslissen', pad: '/docs/beslissen/05b-if-else' },
  {
    id: '05c',
    label: '5c And, or en elif',
    hoofdstuk: 'Beslissen',
    pad: '/docs/beslissen/05c-and-or-elif',
  },
  { id: '06a', label: '6a For-loop', hoofdstuk: 'Herhalen', pad: '/docs/herhalen/06a-for-loop' },
  {
    id: '06b',
    label: '6b Range met start en stappen',
    hoofdstuk: 'Herhalen',
    pad: '/docs/herhalen/06b-range-stappen',
  },
  {
    id: '06c',
    label: '6c Een ronde overslaan met continue',
    hoofdstuk: 'Herhalen',
    pad: '/docs/herhalen/06c-continue',
  },
  {
    id: '06d',
    label: '6d Stoppen met break',
    hoofdstuk: 'Herhalen',
    pad: '/docs/herhalen/06d-break',
  },
  { id: '07', label: '7 While-loop', hoofdstuk: 'Herhalen', pad: '/docs/herhalen/while-loop' },
  { id: '08', label: '8 Functies', hoofdstuk: 'Functies', pad: '/docs/functies/functies' },
  {
    id: '09a',
    label: '9a Parameters',
    hoofdstuk: 'Functies',
    pad: '/docs/functies/09a-parameters',
  },
  { id: '09b', label: '9b Return', hoofdstuk: 'Functies', pad: '/docs/functies/09b-return' },
  { id: '09c', label: '9c Scope', hoofdstuk: 'Functies', pad: '/docs/functies/09c-scope' },
  {
    id: '09d',
    label: '9d Modules importeren',
    hoofdstuk: 'Modules',
    pad: '/docs/modules/09d-modules',
  },
  {
    id: '09e',
    label: '9e Je eigen module',
    hoofdstuk: 'Modules',
    pad: '/docs/modules/09e-eigen-module',
  },
  {
    id: '09f',
    label: '9f Testcode in je module',
    hoofdstuk: 'Modules',
    pad: '/docs/modules/09f-testcode-in-je-module',
  },
  { id: '10a', label: '10a Lijsten', hoofdstuk: 'Data', pad: '/docs/data/10a-lijsten-basis' },
  {
    id: '10b',
    label: '10b Lijst-methoden',
    hoofdstuk: 'Data',
    pad: '/docs/data/10b-lijst-methoden',
  },
  {
    id: '11a',
    label: '11a Dictionaries',
    hoofdstuk: 'Data',
    pad: '/docs/data/11a-dictionaries-basis',
  },
  {
    id: '11b',
    label: '11b Door een dictionary lopen',
    hoofdstuk: 'Data',
    pad: '/docs/data/11b-itereren-dictionaries',
  },
  {
    id: '11c',
    label: '11c Geneste dictionaries',
    hoofdstuk: 'Data',
    pad: '/docs/data/11c-geneste-dictionaries',
  },
  { id: '12', label: '12 Tuples', hoofdstuk: 'Data', pad: '/docs/data/tuples' },
  { id: '13', label: '13 Sets', hoofdstuk: 'Data', pad: '/docs/data/sets' },
  {
    id: '14a',
    label: '14a Een tekstbestand schrijven',
    hoofdstuk: 'Bestanden',
    pad: '/docs/bestanden/14a-tekstbestand-schrijven',
  },
  {
    id: '14b',
    label: '14b Een tekstbestand lezen',
    hoofdstuk: 'Bestanden',
    pad: '/docs/bestanden/14b-tekstbestand-lezen',
  },
  {
    id: '14c',
    label: '14c Regels toevoegen',
    hoofdstuk: 'Bestanden',
    pad: '/docs/bestanden/14c-regels-toevoegen',
  },
  {
    id: '14d',
    label: '14d Regels opsplitsen',
    hoofdstuk: 'Bestanden',
    pad: '/docs/bestanden/14d-regels-opsplitsen',
  },
  {
    id: '14e',
    label: '14e JSON',
    hoofdstuk: 'Bestanden',
    pad: '/docs/bestanden/14e-json',
  },
  {
    id: '14f',
    label: '14f JSON in een bestand',
    hoofdstuk: 'Bestanden',
    pad: '/docs/bestanden/14f-json-bestand',
  },
  {
    id: '15a',
    label: '15a Je eerste klasse',
    hoofdstuk: 'Klassen',
    pad: '/docs/klassen/15a-je-eerste-klasse',
  },
  {
    id: '15b',
    label: '15b Meer attributen',
    hoofdstuk: 'Klassen',
    pad: '/docs/klassen/15b-meer-attributen',
  },
  {
    id: '15c',
    label: '15c Attributen veranderen',
    hoofdstuk: 'Klassen',
    pad: '/docs/klassen/15c-attributen-veranderen',
  },
  {
    id: '15d',
    label: '15d Je eerste methode',
    hoofdstuk: 'Klassen',
    pad: '/docs/klassen/15d-je-eerste-methode',
  },
  {
    id: '15e',
    label: '15e Methoden die het object veranderen',
    hoofdstuk: 'Klassen',
    pad: '/docs/klassen/15e-methoden-die-veranderen',
  },
  {
    id: '15f',
    label: '15f Methoden met return',
    hoofdstuk: 'Klassen',
    pad: '/docs/klassen/15f-methoden-met-return',
  },
  {
    id: '15g',
    label: '15g Objecten in een lijst',
    hoofdstuk: 'Klassen',
    pad: '/docs/klassen/15g-objecten-in-een-lijst',
  },
  {
    id: '15h',
    label: '15h Een klasse vol objecten',
    hoofdstuk: 'Klassen',
    pad: '/docs/klassen/15h-een-klasse-vol-objecten',
  },
  {
    id: '15i',
    label: '15i Je object printen met __str__',
    hoofdstuk: 'Klassen',
    pad: '/docs/klassen/15i-str',
  },
  {
    id: '15j',
    label: '15j Objecten opslaan als JSON',
    hoofdstuk: 'Klassen',
    pad: '/docs/klassen/15j-klassen-en-json',
  },
  {
    id: '15k',
    label: '15k Objecten inlezen uit JSON',
    hoofdstuk: 'Klassen',
    pad: '/docs/klassen/15k-objecten-inlezen',
  },
  {
    id: '16a',
    label: '16a Try en except',
    hoofdstuk: 'Fouten afvangen',
    pad: '/docs/fouten/16a-try-en-except',
  },
  {
    id: '16b',
    label: '16b Welke fout?',
    hoofdstuk: 'Fouten afvangen',
    pad: '/docs/fouten/16b-welke-fout',
  },
  {
    id: '16c',
    label: '16c De melding bewaren',
    hoofdstuk: 'Fouten afvangen',
    pad: '/docs/fouten/16c-de-melding-bewaren',
  },
  {
    id: '16d',
    label: '16d Proberen tot het lukt',
    hoofdstuk: 'Fouten afvangen',
    pad: '/docs/fouten/16d-proberen-tot-het-lukt',
  },
  {
    id: '16e',
    label: '16e Een bestand dat er niet is',
    hoofdstuk: 'Fouten afvangen',
    pad: '/docs/fouten/16e-een-bestand-dat-er-niet-is',
  },
  {
    id: '16f',
    label: '16f Zelf een fout opwerpen',
    hoofdstuk: 'Fouten afvangen',
    pad: '/docs/fouten/16f-zelf-een-fout-opwerpen',
  },
];

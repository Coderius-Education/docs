// Alle lessen van de python-cursus, in de volgorde van de cursus. De
// projectkiezer (src/components/ProjectKiezer) gebruikt dit voor "Ik ben bij
// les …": een activiteit past als elke les die hij nodig heeft, hier op of
// vóór de gekozen les staat. projectkiezer.test.ts bewaakt dat deze lijst
// precies de lessen in docs/ is, met hun kop en pad.

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
    hoofdstuk: 'Functies',
    pad: '/docs/functies/09d-modules',
  },
  {
    id: '09e',
    label: '9e Je eigen module',
    hoofdstuk: 'Functies',
    pad: '/docs/functies/09e-eigen-module',
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
    label: '11b Door een dictionary loopen',
    hoofdstuk: 'Data',
    pad: '/docs/data/11b-itereren-dictionaries',
  },
  {
    id: '11c',
    label: '11c Geneste dictionaries',
    hoofdstuk: 'Data',
    pad: '/docs/data/11c-geneste-dictionaries',
  },
  {
    id: '11d',
    label: '11d JSON: opslaan en inlezen',
    hoofdstuk: 'Data',
    pad: '/docs/data/11d-json',
  },
  { id: '12', label: '12 Tuples', hoofdstuk: 'Data', pad: '/docs/data/tuples' },
  { id: '13', label: '13 Sets', hoofdstuk: 'Data', pad: '/docs/data/sets' },
  {
    id: '14a',
    label: '14a Je eerste klasse',
    hoofdstuk: 'Klassen',
    pad: '/docs/klassen/14a-je-eerste-klasse',
  },
  {
    id: '14b',
    label: '14b Meer attributen',
    hoofdstuk: 'Klassen',
    pad: '/docs/klassen/14b-meer-attributen',
  },
  {
    id: '14c',
    label: '14c Attributen veranderen',
    hoofdstuk: 'Klassen',
    pad: '/docs/klassen/14c-attributen-veranderen',
  },
  {
    id: '14d',
    label: '14d Je eerste methode',
    hoofdstuk: 'Klassen',
    pad: '/docs/klassen/14d-je-eerste-methode',
  },
  {
    id: '14e',
    label: '14e Methoden die het object veranderen',
    hoofdstuk: 'Klassen',
    pad: '/docs/klassen/14e-methoden-die-veranderen',
  },
  {
    id: '14f',
    label: '14f Methoden met return',
    hoofdstuk: 'Klassen',
    pad: '/docs/klassen/14f-methoden-met-return',
  },
  {
    id: '14g',
    label: '14g Objecten in een lijst',
    hoofdstuk: 'Klassen',
    pad: '/docs/klassen/14g-objecten-in-een-lijst',
  },
  {
    id: '14h',
    label: '14h Een klasse vol objecten',
    hoofdstuk: 'Klassen',
    pad: '/docs/klassen/14h-een-klasse-vol-objecten',
  },
  {
    id: '14i',
    label: '14i Je object printen met __str__',
    hoofdstuk: 'Klassen',
    pad: '/docs/klassen/14i-str',
  },
  {
    id: '14j',
    label: '14j Objecten opslaan als JSON',
    hoofdstuk: 'Klassen',
    pad: '/docs/klassen/14j-klassen-en-json',
  },
  {
    id: '14k',
    label: '14k Objecten inlezen uit JSON',
    hoofdstuk: 'Klassen',
    pad: '/docs/klassen/14k-objecten-inlezen',
  },
];

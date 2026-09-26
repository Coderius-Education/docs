import { type Les, lessen } from './lessen';

// Alles wat een leerling naast de lessen kan doen: de projecten van deze
// cursus, de turtle-projecten, Pydle, Coderius Play en de algoritmes. De
// projectkiezer toont het als kaarten; je kiest een concept dat je wilt
// oefenen, en ziet waar het in voorkomt.
//
// `concepten` is wat je met een activiteit oefent, `lessen` alles wat hij
// nodig heeft (weglaten = gelijk aan concepten); beide zijn id's uit
// lessen.ts. projectkiezer.test.ts bewaakt dat elk project in docs/projecten
// hier staat met het juiste aantal stappen, en dat de algoritmes gelijk zijn
// aan algorithms.ts en de conceptenkaart van de algoritmes-cursus: concepten
// is de kern van de kaart, lessen de volledige voorkennis.

export type Soort = 'project' | 'turtle' | 'puzzel' | 'spel' | 'algoritme';

export const SOORTEN: { id: Soort; label: string }[] = [
  { id: 'project', label: 'Project' },
  { id: 'turtle', label: 'Turtle' },
  { id: 'puzzel', label: 'Puzzel' },
  { id: 'spel', label: 'Spel' },
  { id: 'algoritme', label: 'Algoritme' },
];

export type Link = { to: string } | { site: string; to: string } | { href: string };

export type Activiteit = {
  id: string;
  titel: string;
  soort: Soort;
  /** Eén zin: wat je doet of maakt. */
  wat: string;
  /** Aantal stappen, bij een project in deze cursus. */
  stappen?: number;
  /** Wat je ermee oefent: de chips op de kaart, en waarop je filtert. */
  concepten: string[];
  /** Alles wat hij nodig heeft; weglaten betekent: alleen de concepten. */
  lessen?: string[];
  link: Link;
};

/** Korte namen voor de concepten, zoals ze op de chips staan. */
export const CONCEPTNAMEN: Record<string, string> = {
  '01': 'Commando’s na elkaar',
  '02': 'Variabelen',
  '03': 'Rekenen',
  '04a': 'F-strings',
  '05b': 'If en else',
  '05c': 'Elif, and en or',
  '06a': 'For-loop',
  '06b': 'Range met stappen',
  '07': 'While-loop',
  '08': 'Functies',
  '09a': 'Parameters',
  '09b': 'Return',
  '10a': 'Lijsten',
  '11a': 'Dictionaries',
  '11b': 'Door een dictionary loopen',
  '12': 'Tuples',
  '13': 'Sets',
};

export const activiteiten: Activiteit[] = [
  {
    id: 'tien-groene-flessen',
    titel: 'Tien groene flessen',
    soort: 'project',
    wat: 'Van vijftig losse print-regels naar één aanroep lied(10).',
    stappen: 8,
    concepten: ['01', '02', '04a', '05b', '05c', '06a', '06b', '08', '09a', '09b'],
    link: { to: '/docs/projecten/tien-groene-flessen/stap-1-print' },
  },
  {
    id: 'turtle-een-huis',
    titel: 'Een huis',
    soort: 'turtle',
    wat: 'Een vierkant en een huis in kleur, met alleen losse commando’s.',
    stappen: 2,
    concepten: ['01'],
    link: { to: '/docs/projecten/turtle/een-huis/stap-1-vierkant' },
  },
  {
    id: 'turtle-robotkop',
    titel: 'Een robotkop',
    soort: 'turtle',
    wat: 'Een hoofd met ogen die meegroeien als je één variabele verandert.',
    stappen: 2,
    concepten: ['02', '03'],
    link: { to: '/docs/projecten/turtle/robotkop/stap-1-maat' },
  },
  {
    id: 'turtle-verkeerslicht',
    titel: 'Een verkeerslicht',
    soort: 'turtle',
    wat: 'Drie lampen, waarvan er precies één brandt.',
    stappen: 2,
    concepten: ['05b', '05c'],
    lessen: ['02', '05b', '05c'],
    link: { to: '/docs/projecten/turtle/verkeerslicht/stap-1-if-else' },
  },
  {
    id: 'turtle-veelhoeken',
    titel: 'Veelhoeken en sterren',
    soort: 'turtle',
    wat: 'Een driehoek, een achthoek en een ster, elk met één loop.',
    stappen: 3,
    concepten: ['06a'],
    lessen: ['02', '06a'],
    link: { to: '/docs/projecten/turtle/veelhoeken/stap-1-vierkant' },
  },
  {
    id: 'turtle-spiraal',
    titel: 'Een spiraal',
    soort: 'turtle',
    wat: 'Een spiraal en een trap die doorgaan tot ze groot genoeg zijn.',
    stappen: 2,
    concepten: ['07'],
    lessen: ['02', '07'],
    link: { to: '/docs/projecten/turtle/spiraal/stap-1-spiraal' },
  },
  {
    id: 'turtle-straat-vol-huizen',
    titel: 'Een straat vol huizen',
    soort: 'turtle',
    wat: 'Huizen in elke maat, met een functie, en een hele straat op een rij.',
    stappen: 3,
    concepten: ['06a', '06b', '08', '09a'],
    link: { to: '/docs/projecten/turtle/straat-vol-huizen/stap-1-functies' },
  },
  {
    id: 'turtle-regenboog',
    titel: 'Een regenboog',
    soort: 'turtle',
    wat: 'Een rij stippen en een regenboog, met de kleuren uit een lijst.',
    stappen: 2,
    concepten: ['10a'],
    lessen: ['06a', '10a'],
    link: { to: '/docs/projecten/turtle/regenboog/stap-1-stippen' },
  },
  {
    id: 'pydle',
    titel: 'Pydle',
    soort: 'puzzel',
    wat: 'Elke dag een puzzel: maak een raster met gekleurde vakjes na.',
    concepten: ['05b', '05c', '06a'],
    link: { href: 'https://pydle.net' },
  },
  {
    id: 'play',
    titel: 'Coderius Play',
    soort: 'spel',
    wat: 'Je eigen spelletjes bouwen, met vormen die bewegen en reageren.',
    concepten: ['02', '05b', '08', '10a'],
    link: { site: 'play', to: '/docs/eerste-keer-python/wanneer_beginnen' },
  },
  {
    id: 'algoritme-lineair-zoeken',
    titel: 'Lineair zoeken',
    soort: 'algoritme',
    wat: 'Loop één voor één door de lijst tot je het doel vindt.',
    concepten: ['05b', '06a', '09b', '10a'],
    lessen: ['05b', '06a', '08', '09b', '10a'],
    link: { site: 'algorithms', to: '/docs/lineair-zoeken/01-concept' },
  },
  {
    id: 'algoritme-vind-maximum',
    titel: 'Vind het maximum',
    soort: 'algoritme',
    wat: 'Onthoud de grootste tot nu toe en update onderweg.',
    concepten: ['05b', '06a', '10a'],
    lessen: ['04a', '05b', '06a', '08', '09b', '10a'],
    link: { site: 'algorithms', to: '/docs/vind-maximum/01-concept' },
  },
  {
    id: 'algoritme-max-en-min',
    titel: 'Max én min in één pass',
    soort: 'algoritme',
    wat: 'Twee accumulators tegelijk — minder werk dan twee losse passes.',
    concepten: ['05b', '05c', '06a', '10a'],
    lessen: ['04a', '05b', '05c', '06a', '09b', '10a', '12'],
    link: { site: 'algorithms', to: '/docs/max-en-min/01-concept' },
  },
  {
    id: 'algoritme-binair-zoeken',
    titel: 'Binair zoeken',
    soort: 'algoritme',
    wat: 'Halveer steeds een gesorteerde lijst — sneller dan lineair.',
    concepten: ['05b', '05c', '07', '10a'],
    lessen: ['05b', '05c', '06d', '07', '08', '09b', '10a', '12'],
    link: { site: 'algorithms', to: '/docs/binair-zoeken/01-concept' },
  },
  {
    id: 'algoritme-selection-sort',
    titel: 'Selection sort',
    soort: 'algoritme',
    wat: 'Vind steeds het kleinste van de rest en zet het vooraan.',
    concepten: ['05b', '06a', '10a', '12'],
    lessen: ['05b', '06a', '08', '09b', '10a', '12'],
    link: { site: 'algorithms', to: '/docs/selection-sort/01-concept' },
  },
  {
    id: 'algoritme-bubble-sort',
    titel: 'Bubble sort',
    soort: 'algoritme',
    wat: 'Vergelijk buren en swap — tot de lijst klopt.',
    concepten: ['05b', '06a', '10a', '12'],
    lessen: ['04a', '05b', '06a', '08', '09b', '10a', '12'],
    link: { site: 'algorithms', to: '/docs/bubble-sort/01-concept' },
  },
  {
    id: 'algoritme-big-o',
    titel: 'Big O notatie',
    soort: 'algoritme',
    wat: 'Hoe schaalt een algoritme als de invoer groeit?',
    concepten: ['06a', '07'],
    lessen: ['05b', '05c', '06a', '07', '08', '10b', '12'],
    link: { site: 'algorithms', to: '/docs/big-o/01-concept' },
  },
  {
    id: 'algoritme-dijkstra',
    titel: 'Dijkstra',
    soort: 'algoritme',
    wat: 'Vind de kortste route in een gewogen graph.',
    concepten: ['06a', '07', '11a', '11b', '13'],
    lessen: ['04a', '05b', '06a', '06c', '06d', '07', '08', '10a', '11a', '11b', '12', '13'],
    link: { site: 'algorithms', to: '/docs/dijkstra/01-concept' },
  },
  {
    id: 'algoritme-minimax',
    titel: 'Minimax',
    soort: 'algoritme',
    wat: 'Bouw een tic-tac-toe-AI die nooit verliest.',
    concepten: ['06a', '08', '09b', '10a'],
    lessen: ['04a', '05b', '06a', '07', '08', '09a', '09b', '10a', '12', '13'],
    link: { site: 'algorithms', to: '/docs/minimax/01-concept' },
  },
  {
    id: 'algoritme-knapsack',
    titel: 'Knapsack 0/1',
    soort: 'algoritme',
    wat: 'Pak de meest waardevolle rugzak binnen je gewichtslimiet.',
    concepten: ['05b', '06a', '10a'],
    lessen: ['04a', '05b', '06a', '08', '10a', '12'],
    link: { site: 'algorithms', to: '/docs/knapsack/01-concept' },
  },
  {
    id: 'algoritme-cfg',
    titel: 'Context-vrije grammatica',
    soort: 'algoritme',
    wat: 'Ontwerp regels die Engelse zinnen ontleden — zin voor zin.',
    concepten: ['10a'],
    lessen: ['10a'],
    link: { site: 'algorithms', to: '/docs/cfg/01-concept' },
  },
  {
    id: 'algoritme-hanoi',
    titel: 'Torens van Hanoi',
    soort: 'algoritme',
    wat: 'Speel het spel, ontdek het patroon (2ⁿ−1) en los het op met recursie.',
    concepten: ['05b', '08', '09b', '10a'],
    lessen: ['04a', '05b', '08', '09b', '10a', '10b', '11a', '12'],
    link: { site: 'algorithms', to: '/docs/hanoi/01-spel' },
  },
  {
    id: 'algoritme-pagerank',
    titel: 'PageRank',
    soort: 'algoritme',
    wat: 'Hoe rangschikt Google pagina’s? Links als stemmen, iteratief uitgerekend.',
    concepten: ['06a', '07', '11a', '11b'],
    lessen: ['05b', '06a', '07', '08', '11a', '11b', '13'],
    link: { site: 'algorithms', to: '/docs/pagerank/01-concept' },
  },
];

const volgorde = new Map(lessen.map((les, i) => [les.id, i]));

function plek(id: string, waar: string): number {
  const p = volgorde.get(id);
  if (p === undefined) throw new Error(`${waar}: onbekende les ${id}`);
  return p;
}

/** De laatste les die een activiteit nodig heeft: vanaf daar kun je hem doen. */
export function vanafLes(activiteit: Activiteit): Les {
  const nodig = activiteit.lessen ?? activiteit.concepten;
  return lessen[Math.max(...nodig.map((id) => plek(id, activiteit.id)))];
}

/** De concepten die in de lijst voorkomen, in de volgorde van de cursus. */
export function conceptenIn(lijst: Activiteit[]): string[] {
  const gebruikt = new Set(lijst.flatMap((a) => a.concepten));
  return lessen.map((l) => l.id).filter((id) => gebruikt.has(id));
}

/**
 * De activiteiten met dit concept (of alle, bij null) en deze soort (of alle),
 * in de volgorde waarin je ze in de cursus kunt doen.
 */
export function filter(
  lijst: Activiteit[],
  concept: string | null,
  soort: Soort | null,
): Activiteit[] {
  return lijst
    .map((a, i) => ({ a, i, vanaf: plek(vanafLes(a).id, a.id) }))
    .filter(({ a }) => concept === null || a.concepten.includes(concept))
    .filter(({ a }) => soort === null || a.soort === soort)
    .sort((x, y) => x.vanaf - y.vanaf || x.i - y.i)
    .map(({ a }) => a);
}

/**
 * De concepten waar een chip voor komt: alleen die met iets om te laten zien.
 * Een soortfilter kan een concept op nul zetten; dan valt de chip weg, behalve
 * als hij gekozen is, want anders kun je hem niet meer uitzetten.
 */
export function zichtbareConcepten(
  concepten: string[],
  aantal: (id: string) => number,
  gekozen: string | null,
): string[] {
  return concepten.filter((id) => id === gekozen || aantal(id) > 0);
}

/** De regel boven de kaarten: hoeveel er staan, en met welk concept. */
export function telling(aantal: number, concept: string | null): string {
  if (concept !== null) return `${aantal} met ${CONCEPTNAMEN[concept]}`;
  return aantal === 1 ? '1 activiteit' : `${aantal} activiteiten`;
}

import { type Les, lessen } from './lessen';

// Alles wat een leerling naast de lessen kan doen: de projecten van deze
// cursus, de turtle-projecten, Pydle, Coderius Play en de algoritmes. De
// projectkiezer toont het als kaarten, en deelt ze in naar "past nu" en
// "straks" op basis van de les waar de leerling is.
//
// `lessen` zijn de lessen die een activiteit nodig heeft (id's uit
// lessen.ts). projectkiezer.test.ts bewaakt dat elk project in docs/projecten
// hier staat met het juiste aantal stappen, en dat de algoritmes gelijk zijn
// aan algorithms.ts en de conceptenkaart van de algoritmes-cursus.

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
  lessen: string[];
  link: Link;
};

export const activiteiten: Activiteit[] = [
  {
    id: 'tien-groene-flessen',
    titel: 'Tien groene flessen',
    soort: 'project',
    wat: 'Van vijftig losse print-regels naar één aanroep lied(10).',
    stappen: 8,
    lessen: ['01', '02', '04a', '05b', '05c', '06b', '08', '09a', '09b'],
    link: { to: '/docs/projecten/tien-groene-flessen/stap-1-print' },
  },
  {
    id: 'turtle-een-huis',
    titel: 'Een huis',
    soort: 'turtle',
    wat: 'Een vierkant en een huis in kleur, met alleen losse commando’s.',
    stappen: 2,
    lessen: ['01'],
    link: { to: '/docs/projecten/turtle/een-huis/stap-1-vierkant' },
  },
  {
    id: 'turtle-robotkop',
    titel: 'Een robotkop',
    soort: 'turtle',
    wat: 'Een hoofd met ogen die meegroeien als je één variabele verandert.',
    stappen: 2,
    lessen: ['02', '03'],
    link: { to: '/docs/projecten/turtle/robotkop/stap-1-maat' },
  },
  {
    id: 'turtle-verkeerslicht',
    titel: 'Een verkeerslicht',
    soort: 'turtle',
    wat: 'Drie lampen, waarvan er precies één brandt.',
    stappen: 2,
    lessen: ['02', '05b', '05c'],
    link: { to: '/docs/projecten/turtle/verkeerslicht/stap-1-if-else' },
  },
  {
    id: 'turtle-veelhoeken',
    titel: 'Veelhoeken en sterren',
    soort: 'turtle',
    wat: 'Een driehoek, een achthoek en een ster, elk met één loop.',
    stappen: 3,
    lessen: ['02', '06a'],
    link: { to: '/docs/projecten/turtle/veelhoeken/stap-1-vierkant' },
  },
  {
    id: 'turtle-spiraal',
    titel: 'Een spiraal',
    soort: 'turtle',
    wat: 'Een spiraal en een trap die doorgaan tot ze groot genoeg zijn.',
    stappen: 2,
    lessen: ['02', '07'],
    link: { to: '/docs/projecten/turtle/spiraal/stap-1-spiraal' },
  },
  {
    id: 'turtle-straat-vol-huizen',
    titel: 'Een straat vol huizen',
    soort: 'turtle',
    wat: 'Huizen in elke maat, met een functie, en een hele straat op een rij.',
    stappen: 3,
    lessen: ['06a', '06b', '08', '09a'],
    link: { to: '/docs/projecten/turtle/straat-vol-huizen/stap-1-functies' },
  },
  {
    id: 'turtle-regenboog',
    titel: 'Een regenboog',
    soort: 'turtle',
    wat: 'Een rij stippen en een regenboog, met de kleuren uit een lijst.',
    stappen: 2,
    lessen: ['06a', '10a'],
    link: { to: '/docs/projecten/turtle/regenboog/stap-1-stippen' },
  },
  {
    id: 'pydle',
    titel: 'Pydle',
    soort: 'puzzel',
    wat: 'Elke dag een puzzel: maak een raster met gekleurde vakjes na.',
    lessen: ['05b', '05c', '06a'],
    link: { href: 'https://pydle.net' },
  },
  {
    id: 'play',
    titel: 'Coderius Play',
    soort: 'spel',
    wat: 'Je eigen spelletjes bouwen, met vormen die bewegen en reageren.',
    lessen: ['02', '05b', '08', '10a'],
    link: { site: 'play', to: '/docs/eerste-keer-python/wanneer_beginnen' },
  },
  {
    id: 'algoritme-lineair-zoeken',
    titel: 'Lineair zoeken',
    soort: 'algoritme',
    wat: 'Loop één voor één door de lijst tot je het doel vindt.',
    lessen: ['05b', '06a', '08', '09b', '10a'],
    link: { site: 'algorithms', to: '/docs/lineair-zoeken/01-concept' },
  },
  {
    id: 'algoritme-vind-maximum',
    titel: 'Vind het maximum',
    soort: 'algoritme',
    wat: 'Onthoud de grootste tot nu toe en update onderweg.',
    lessen: ['04a', '05b', '06a', '08', '09b', '10a'],
    link: { site: 'algorithms', to: '/docs/vind-maximum/01-concept' },
  },
  {
    id: 'algoritme-max-en-min',
    titel: 'Max én min in één pass',
    soort: 'algoritme',
    wat: 'Twee accumulators tegelijk — minder werk dan twee losse passes.',
    lessen: ['04a', '05b', '05c', '06a', '09b', '10a', '12'],
    link: { site: 'algorithms', to: '/docs/max-en-min/01-concept' },
  },
  {
    id: 'algoritme-binair-zoeken',
    titel: 'Binair zoeken',
    soort: 'algoritme',
    wat: 'Halveer steeds een gesorteerde lijst — sneller dan lineair.',
    lessen: ['05b', '05c', '06d', '07', '08', '09b', '10a', '12'],
    link: { site: 'algorithms', to: '/docs/binair-zoeken/01-concept' },
  },
  {
    id: 'algoritme-selection-sort',
    titel: 'Selection sort',
    soort: 'algoritme',
    wat: 'Vind steeds het kleinste van de rest en zet het vooraan.',
    lessen: ['05b', '06a', '08', '09b', '10a', '12'],
    link: { site: 'algorithms', to: '/docs/selection-sort/01-concept' },
  },
  {
    id: 'algoritme-bubble-sort',
    titel: 'Bubble sort',
    soort: 'algoritme',
    wat: 'Vergelijk buren en swap — tot de lijst klopt.',
    lessen: ['04a', '05b', '06a', '08', '09b', '10a', '12'],
    link: { site: 'algorithms', to: '/docs/bubble-sort/01-concept' },
  },
  {
    id: 'algoritme-big-o',
    titel: 'Big O notatie',
    soort: 'algoritme',
    wat: 'Hoe schaalt een algoritme als de invoer groeit?',
    lessen: ['05b', '05c', '06a', '07', '08', '10b', '12'],
    link: { site: 'algorithms', to: '/docs/big-o/01-concept' },
  },
  {
    id: 'algoritme-dijkstra',
    titel: 'Dijkstra',
    soort: 'algoritme',
    wat: 'Vind de kortste route in een gewogen graph.',
    lessen: ['04a', '05b', '06a', '06c', '06d', '07', '08', '10a', '11a', '11b', '12', '13'],
    link: { site: 'algorithms', to: '/docs/dijkstra/01-concept' },
  },
  {
    id: 'algoritme-minimax',
    titel: 'Minimax',
    soort: 'algoritme',
    wat: 'Bouw een tic-tac-toe-AI die nooit verliest.',
    lessen: ['04a', '05b', '06a', '07', '08', '09a', '09b', '10a', '12', '13'],
    link: { site: 'algorithms', to: '/docs/minimax/01-concept' },
  },
  {
    id: 'algoritme-knapsack',
    titel: 'Knapsack 0/1',
    soort: 'algoritme',
    wat: 'Pak de meest waardevolle rugzak binnen je gewichtslimiet.',
    lessen: ['04a', '05b', '06a', '08', '10a', '12'],
    link: { site: 'algorithms', to: '/docs/knapsack/01-concept' },
  },
  {
    id: 'algoritme-cfg',
    titel: 'Context-vrije grammatica',
    soort: 'algoritme',
    wat: 'Ontwerp regels die Engelse zinnen ontleden — zin voor zin.',
    lessen: ['10a'],
    link: { site: 'algorithms', to: '/docs/cfg/01-concept' },
  },
  {
    id: 'algoritme-hanoi',
    titel: 'Torens van Hanoi',
    soort: 'algoritme',
    wat: 'Speel het spel, ontdek het patroon (2ⁿ−1) en los het op met recursie.',
    lessen: ['04a', '05b', '08', '09b', '10a', '10b', '11a', '12'],
    link: { site: 'algorithms', to: '/docs/hanoi/01-spel' },
  },
  {
    id: 'algoritme-pagerank',
    titel: 'PageRank',
    soort: 'algoritme',
    wat: 'Hoe rangschikt Google pagina’s? Links als stemmen, iteratief uitgerekend.',
    lessen: ['05b', '06a', '07', '08', '11a', '11b', '13'],
    link: { site: 'algorithms', to: '/docs/pagerank/01-concept' },
  },
];

const volgorde = new Map(lessen.map((les, i) => [les.id, i]));

/** De laatste les die een activiteit nodig heeft: daarna past hij. */
export function pastNa(activiteit: Activiteit): Les {
  let hoogste = 0;
  for (const id of activiteit.lessen) {
    const plek = volgorde.get(id);
    if (plek === undefined) throw new Error(`${activiteit.id}: onbekende les ${id}`);
    hoogste = Math.max(hoogste, plek);
  }
  return lessen[hoogste];
}

/** De lessen die een activiteit nodig heeft, in de volgorde van de cursus. */
export function lessenVan(activiteit: Activiteit): Les[] {
  return lessen.filter((les) => activiteit.lessen.includes(les.id));
}

/**
 * Deelt de activiteiten in. Zonder gekozen les past alles; met een les past
 * een activiteit als hij op of vóór die les past. Beide lijsten staan in de
 * volgorde van de cursus, en bij gelijke les in de volgorde van de data.
 */
export function indelen(
  lijst: Activiteit[],
  lesId: string | null,
  soort: Soort | null,
): { nu: Activiteit[]; straks: Activiteit[] } {
  const grens = lesId === null ? lessen.length : (volgorde.get(lesId) ?? lessen.length);
  const gefilterd = lijst
    .filter((a) => soort === null || a.soort === soort)
    .map((a, i) => ({ a, i, na: volgorde.get(pastNa(a).id) ?? 0 }))
    .sort((x, y) => x.na - y.na || x.i - y.i);
  return {
    nu: gefilterd.filter((x) => x.na <= grens).map((x) => x.a),
    straks: gefilterd.filter((x) => x.na > grens).map((x) => x.a),
  };
}

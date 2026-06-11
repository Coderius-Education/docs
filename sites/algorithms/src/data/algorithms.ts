export type Algoritme = {
  slug: string;
  titel: string;
  niveau: string;
  samenvatting: string;
  startPad: string;
  emoji: string;
};

export const algoritmes: Algoritme[] = [
  {
    slug: 'lineair-zoeken',
    titel: 'Lineair zoeken',
    niveau: 'Beginner',
    samenvatting: 'Loop één voor één door de lijst tot je het doel vindt.',
    startPad: '/docs/lineair-zoeken/01-concept',
    emoji: '🔎',
  },
  {
    slug: 'vind-maximum',
    titel: 'Vind het maximum',
    niveau: 'Beginner',
    samenvatting: 'Onthoud de grootste tot nu toe en update onderweg.',
    startPad: '/docs/vind-maximum/01-concept',
    emoji: '🏔️',
  },
  {
    slug: 'max-en-min',
    titel: 'Max én min in één pass',
    niveau: 'Beginner+',
    samenvatting: 'Twee accumulators tegelijk — minder werk dan twee losse passes.',
    startPad: '/docs/max-en-min/01-concept',
    emoji: '📊',
  },
  {
    slug: 'binair-zoeken',
    titel: 'Binair zoeken',
    niveau: 'Beginner+',
    samenvatting: 'Halveer steeds een gesorteerde lijst — sneller dan lineair.',
    startPad: '/docs/binair-zoeken/01-concept',
    emoji: '✂️',
  },
  {
    slug: 'selection-sort',
    titel: 'Selection sort',
    niveau: 'Gemiddeld',
    samenvatting: 'Vind steeds het kleinste van de rest en zet het vooraan.',
    startPad: '/docs/selection-sort/01-concept',
    emoji: '📥',
  },
  {
    slug: 'bubble-sort',
    titel: 'Bubble sort',
    niveau: 'Gemiddeld',
    samenvatting: 'Vergelijk buren en swap — tot de lijst klopt.',
    startPad: '/docs/bubble-sort/01-concept',
    emoji: '🫧',
  },
  {
    slug: 'big-o',
    titel: 'Big O notatie',
    niveau: 'Verdieping',
    samenvatting: 'Hoe schaalt een algoritme als de invoer groeit?',
    startPad: '/docs/big-o/01-concept',
    emoji: '📈',
  },
  {
    slug: 'dijkstra',
    titel: 'Dijkstra',
    niveau: 'Gevorderd',
    samenvatting: 'Vind de kortste route in een gewogen graph.',
    startPad: '/docs/dijkstra/01-concept',
    emoji: '🗺️',
  },
  {
    slug: 'minimax',
    titel: 'Minimax',
    niveau: 'Gevorderd',
    samenvatting: 'Bouw een tic-tac-toe-AI die nooit verliest.',
    startPad: '/docs/minimax/01-concept',
    emoji: '🎮',
  },
  {
    slug: 'knapsack',
    titel: 'Knapsack 0/1',
    niveau: 'Gevorderd',
    samenvatting: 'Pak de meest waardevolle rugzak binnen je gewichtslimiet.',
    startPad: '/docs/knapsack/01-concept',
    emoji: '🎒',
  },
  {
    slug: 'cfg',
    titel: 'Context-vrije grammatica',
    niveau: 'Gevorderd',
    samenvatting: 'Ontwerp regels die Engelse zinnen ontleden — zin voor zin.',
    startPad: '/docs/cfg/01-concept',
    emoji: '🌳',
  },
  {
    slug: 'hanoi',
    titel: 'Torens van Hanoi',
    niveau: 'Gevorderd',
    samenvatting: 'Speel het spel, ontdek het patroon (2ⁿ−1) en los het op met recursie.',
    startPad: '/docs/hanoi/01-spel',
    emoji: '🗼',
  },
  {
    slug: 'pagerank',
    titel: 'PageRank',
    niveau: 'Gevorderd',
    samenvatting: 'Hoe rangschikt Google pagina’s? Links als stemmen, iteratief uitgerekend.',
    startPad: '/docs/pagerank/01-concept',
    emoji: '🔗',
  },
];

// De game tree van een tic-tac-toe-positie, als data. De component tekent
// hem; hier staat alleen het rekenwerk, zodat het los te testen is en de
// waardes in de boom nooit anders kunnen zijn dan wat minimax uitrekent.

export type Cel = 'X' | 'O' | null;
export type Bord = Cel[][];

export interface Knoop {
  bord: Bord;
  /** De zet waarmee dit bord uit zijn ouder ontstond; null bij de wortel. */
  zet: [number, number] | null;
  /** Wie hier aan zet is; null als het bord klaar is. */
  speler: 'X' | 'O' | null;
  /** Utility bij een klaar bord, anders de minimax-waarde. */
  waarde: number;
  kinderen: Knoop[];
}

const LIJNEN: [number, number][][] = [
  [
    [0, 0],
    [0, 1],
    [0, 2],
  ],
  [
    [1, 0],
    [1, 1],
    [1, 2],
  ],
  [
    [2, 0],
    [2, 1],
    [2, 2],
  ],
  [
    [0, 0],
    [1, 0],
    [2, 0],
  ],
  [
    [0, 1],
    [1, 1],
    [2, 1],
  ],
  [
    [0, 2],
    [1, 2],
    [2, 2],
  ],
  [
    [0, 0],
    [1, 1],
    [2, 2],
  ],
  [
    [0, 2],
    [1, 1],
    [2, 0],
  ],
];

/** `"XXO/OOX/..."`: drie rijen, `.` is leeg. Handig als prop in MDX. */
export function parseBord(tekst: string): Bord {
  const rijen = tekst.trim().split('/');
  if (rijen.length !== 3 || rijen.some((r) => !/^[XO.]{3}$/.test(r))) {
    throw new Error(`GameTree: geen bord: '${tekst}' (verwacht bv. "XXO/OOX/...")`);
  }
  // Bewust split en geen spread: de browser-build van Docusaurus vertaalde
  // `[...r]` op een string naar één element, en dan is elke rij één cel en
  // elk bord "klaar". De server-render had het wel goed, dus alleen in de
  // browser stond er een boom van één knoop.
  return rijen.map((r) => r.split('').map((c) => (c === '.' ? null : (c as Cel))));
}

/** De omgekeerde van parseBord: `"XXO/OOX/..."`. */
export function naarTekst(bord: Bord): string {
  return bord.map((rij) => rij.map((c) => c ?? '.').join('')).join('/');
}

export function winnaar(bord: Bord): Cel {
  for (const lijn of LIJNEN) {
    const [a, b, c] = lijn.map(([i, j]) => bord[i][j]);
    if (a !== null && a === b && b === c) return a;
  }
  return null;
}

export function speler(bord: Bord): 'X' | 'O' {
  const x = bord.flat().filter((c) => c === 'X').length;
  const o = bord.flat().filter((c) => c === 'O').length;
  return x === o ? 'X' : 'O';
}

export function zetten(bord: Bord): [number, number][] {
  const uit: [number, number][] = [];
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      if (bord[i][j] === null) uit.push([i, j]);
    }
  }
  return uit;
}

function na(bord: Bord, [i, j]: [number, number]): Bord {
  const kopie = bord.map((rij) => [...rij]);
  kopie[i][j] = speler(bord);
  return kopie;
}

export function utility(bord: Bord): number {
  const w = winnaar(bord);
  if (w === 'X') return 1;
  if (w === 'O') return -1;
  return 0;
}

export function isKlaar(bord: Bord): boolean {
  return winnaar(bord) !== null || zetten(bord).length === 0;
}

/** De hele boom onder een positie, kinderen in leesvolgorde van de zet. */
export function bouwBoom(bord: Bord, zet: [number, number] | null = null): Knoop {
  if (isKlaar(bord)) {
    return { bord, zet, speler: null, waarde: utility(bord), kinderen: [] };
  }
  const wie = speler(bord);
  const kinderen = zetten(bord).map((z) => bouwBoom(na(bord, z), z));
  const waardes = kinderen.map((k) => k.waarde);
  const waarde = wie === 'X' ? Math.max(...waardes) : Math.min(...waardes);
  return { bord, zet, speler: wie, waarde, kinderen };
}

export function telKnopen(knoop: Knoop): number {
  return 1 + knoop.kinderen.reduce((som, k) => som + telKnopen(k), 0);
}

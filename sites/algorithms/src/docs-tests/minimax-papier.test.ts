import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// De pen-en-papier-pagina van minimax werkt een eindspel met de hand uit en
// zet de waarde van elke X-zet in een tabel. Bij de doorloop klopte die
// uitwerking niet: de les noemde een bord "vol zonder winnaar" terwijl er
// een diagonaal X X X op stond, en alle drie de zetten waren in werkelijkheid
// +1 waard. Dat is precies de pagina waar een leerling de methode leert, en
// hij kan het niet controleren. Daarom rekent deze test de positie uit de
// pagina zelf na en legt de tabel ernaast.

const PAGINA = fileURLToPath(new URL('../../docs/minimax/02-pen-en-papier.mdx', import.meta.url));

type Cel = 'X' | 'O' | null;
type Bord = Cel[][];

const LIJNEN: [number, number][][] = [
  ...[0, 1, 2].map((i): [number, number][] => [
    [i, 0],
    [i, 1],
    [i, 2],
  ]),
  ...[0, 1, 2].map((j): [number, number][] => [
    [0, j],
    [1, j],
    [2, j],
  ]),
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

function winnaar(bord: Bord): Cel {
  for (const lijn of LIJNEN) {
    const [a, b, c] = lijn.map(([i, j]) => bord[i][j]);
    if (a !== null && a === b && b === c) return a;
  }
  return null;
}

function zetten(bord: Bord): [number, number][] {
  const uit: [number, number][] = [];
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) if (bord[i][j] === null) uit.push([i, j]);
  return uit;
}

function speler(bord: Bord): Cel {
  const x = bord.flat().filter((c) => c === 'X').length;
  const o = bord.flat().filter((c) => c === 'O').length;
  return x === o ? 'X' : 'O';
}

function na(bord: Bord, [i, j]: [number, number]): Bord {
  const kopie = bord.map((rij) => [...rij]);
  kopie[i][j] = speler(bord);
  return kopie;
}

function waarde(bord: Bord): number {
  const w = winnaar(bord);
  if (w === 'X') return 1;
  if (w === 'O') return -1;
  const vrij = zetten(bord);
  if (vrij.length === 0) return 0;
  const kinderen = vrij.map((z) => waarde(na(bord, z)));
  return speler(bord) === 'X' ? Math.max(...kinderen) : Math.min(...kinderen);
}

/** Het eerste bord onder "## Deel 2", in de ` X | X | O `-notatie van de les. */
function bordUit(tekst: string): Bord {
  const deel2 = tekst.slice(tekst.indexOf('## Deel 2'));
  const rijen = [...deel2.matchAll(/^ ([XO.]) \| ([XO.]) \| ([XO.])/gm)].slice(0, 3);
  expect(rijen, 'de pagina toont het bord van Deel 2 als drie rijen X | O | .').toHaveLength(3);
  return rijen.map((m) => m.slice(1, 4).map((c) => (c === '.' ? null : (c as Cel))));
}

/** De tabel `| \`(2,0)\` | … | **0** |` met per X-zet de waarde van de tak. */
function tabelUit(tekst: string): Map<string, number> {
  const uit = new Map<string, number>();
  for (const m of tekst.matchAll(/^\| `\((\d),(\d)\)` \|[^|]*\| \*\*(-?\d)\*\* \|$/gm)) {
    uit.set(`${m[1]},${m[2]}`, Number(m[3]));
  }
  return uit;
}

describe('minimax op papier', () => {
  const tekst = readFileSync(PAGINA, 'utf8');
  const bord = bordUit(tekst);

  it('de positie is een geldig eindspel met X aan zet en drie lege vakjes', () => {
    expect(speler(bord)).toBe('X');
    expect(zetten(bord)).toHaveLength(3);
    expect(winnaar(bord)).toBeNull();
  });

  it('de tabel geeft per X-zet de waarde die minimax uitrekent', () => {
    const tabel = tabelUit(tekst);
    expect([...tabel.keys()].sort()).toEqual(
      zetten(bord)
        .map(([i, j]) => `${i},${j}`)
        .sort(),
    );
    for (const z of zetten(bord)) {
      expect(tabel.get(`${z[0]},${z[1]}`), `waarde van X→(${z[0]},${z[1]})`).toBe(
        waarde(na(bord, z)),
      );
    }
  });

  it('de zetten verschillen in waarde, anders valt er niets te kiezen', () => {
    // Bij de doorloop waren alle drie de zetten +1 waard: elke zet won
    // meteen, en de boom liet niet zien waarom minimax de ene zet boven de
    // andere verkiest.
    const waardes = new Set(zetten(bord).map((z) => waarde(na(bord, z))));
    expect(waardes.size).toBeGreaterThan(1);
  });

  it('elke getekende boom op de pagina begint bij dezelfde positie', () => {
    // De <GameTree> rekent zijn waardes zelf uit; wat hij niet kan weten is
    // of hij dezelfde positie tekent als de tekst uitwerkt.
    const bomen = [...tekst.matchAll(/<GameTree bord="([^"]+)"/g)].map((m) => m[1]);
    expect(bomen.length).toBeGreaterThan(0);
    const notatie = bord.map((rij) => rij.map((c) => c ?? '.').join('')).join('/');
    for (const b of bomen) expect(b).toBe(notatie);
  });

  it('de uitkomst bij de wortel staat als max van de tabel op de pagina', () => {
    const beste = Math.max(...zetten(bord).map((z) => waarde(na(bord, z))));
    expect(tekst).toMatch(new RegExp(`de uitkomst bij perfect spel is \\*\\*${beste}\\*\\*`));
  });
});

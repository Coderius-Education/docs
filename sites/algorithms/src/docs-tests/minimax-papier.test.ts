import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  type Bord,
  bouwBoom,
  naarTekst,
  parseBord,
  speler,
  winnaar,
  zetten,
} from '../components/GameTree/boom';

// De pen-en-papier-pagina van minimax werkt een eindspel met de hand uit en
// zet de waarde van elke X-zet in een tabel. Bij de doorloop klopte die
// uitwerking niet: de les noemde een bord "vol zonder winnaar" terwijl er
// een diagonaal X X X op stond, en alle drie de zetten waren in werkelijkheid
// +1 waard. Dat is precies de pagina waar een leerling de methode leert, en
// hij kan het niet controleren. Daarom rekent deze test de positie uit de
// pagina zelf na en legt de tabel ernaast. Het rekenwerk is dat van de
// GameTree-component (boom.ts), zodat tabel en tekening dezelfde som delen.

const PAGINA = fileURLToPath(new URL('../../docs/minimax/02-pen-en-papier.mdx', import.meta.url));

/** Het eerste bord onder "## Deel 2", in de ` X | X | O `-notatie van de les. */
function bordUit(tekst: string): Bord {
  const deel2 = tekst.slice(tekst.indexOf('## Deel 2'));
  const rijen = [...deel2.matchAll(/^ ([XO.]) \| ([XO.]) \| ([XO.])/gm)].slice(0, 3);
  expect(rijen, 'de pagina toont het bord van Deel 2 als drie rijen X | O | .').toHaveLength(3);
  return parseBord(rijen.map((m) => m.slice(1, 4).join('')).join('/'));
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
  const waarde = (b: Bord) => bouwBoom(b).waarde;
  const na = (b: Bord, z: [number, number]) =>
    bouwBoom(b).kinderen.find((k) => k.zet?.[0] === z[0] && k.zet?.[1] === z[1]);

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
        na(bord, z)?.waarde,
      );
    }
  });

  it('de zetten verschillen in waarde, anders valt er niets te kiezen', () => {
    // Bij de doorloop waren alle drie de zetten +1 waard: elke zet won
    // meteen, en de boom liet niet zien waarom minimax de ene zet boven de
    // andere verkiest.
    const waardes = new Set(bouwBoom(bord).kinderen.map((k) => k.waarde));
    expect(waardes.size).toBeGreaterThan(1);
  });

  it('elke getekende boom op de pagina begint bij dezelfde positie', () => {
    // De <GameTree> rekent zijn waardes zelf uit; wat hij niet kan weten is
    // of hij dezelfde positie tekent als de tekst uitwerkt.
    const bomen = [...tekst.matchAll(/<GameTree bord="([^"]+)"/g)].map((m) => m[1]);
    expect(bomen.length).toBeGreaterThan(0);
    for (const b of bomen) expect(b).toBe(naarTekst(bord));
  });

  it('de uitkomst bij de wortel staat als max van de tabel op de pagina', () => {
    const beste = waarde(bord);
    expect(tekst).toMatch(new RegExp(`de uitkomst bij perfect spel is \\*\\*${beste}\\*\\*`));
  });
});

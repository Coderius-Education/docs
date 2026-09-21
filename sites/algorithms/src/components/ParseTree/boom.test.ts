import { describe, expect, it } from 'vitest';
import {
  type Boom,
  LAAG,
  MIN_KOLOM,
  bladeren,
  isBoom,
  kolomBreedte,
  leesBomen,
  tekenBoom,
} from './boom';

const HOLMES: Boom = [
  'S',
  ['NP', ['N', 'holmes']],
  ['VP', ['V', 'lit'], ['NP', ['Det', 'a'], ['N', 'pipe']]],
];

describe('tekenBoom', () => {
  it('zet elk blad in een eigen kolom, op volgorde van de zin', () => {
    const t = tekenBoom(HOLMES);
    const bladen = t.knopen.filter((k) => k.woord !== null);
    expect(bladen.map((k) => k.woord)).toEqual(['holmes', 'lit', 'a', 'pipe']);
    for (let i = 1; i < bladen.length; i += 1) expect(bladen[i].x).toBeGreaterThan(bladen[i - 1].x);
    expect(t.breedte).toBe(bladen.reduce((som, k) => som + kolomBreedte(k.woord ?? ''), 0));
  });

  it('hangt een knoop midden boven zijn eerste en laatste kind', () => {
    const t = tekenBoom(HOLMES);
    const wortel = t.knopen[0];
    const kinderen = t.knopen.filter((k) => k.ouder === wortel.id);
    expect(kinderen.map((k) => k.label)).toEqual(['NP', 'VP']);
    expect(wortel.x).toBe((kinderen[0].x + kinderen[1].x) / 2);
    expect(wortel.y).toBe(0);
    expect(kinderen[0].y).toBe(LAAG);
  });

  it('een knoop met één kind staat er recht boven', () => {
    const t = tekenBoom(HOLMES);
    const np = t.knopen.find((k) => k.label === 'NP' && k.y === LAAG);
    const n = t.knopen.find((k) => k.ouder === np?.id);
    expect(n?.x).toBe(np?.x);
  });

  it('de hoogte volgt de diepste tak, plus ruimte voor de woorden', () => {
    expect(tekenBoom(['N', 'holmes']).hoogte).toBeGreaterThan(LAAG);
    expect(tekenBoom(HOLMES).hoogte).toBe(4 * LAAG + (tekenBoom(['N', 'x']).hoogte - LAAG));
  });

  it('een lang woord krijgt een bredere kolom, een kort woord de minimumbreedte', () => {
    expect(kolomBreedte('a')).toBe(MIN_KOLOM);
    expect(kolomBreedte('enigmatical')).toBeGreaterThan(MIN_KOLOM);
    const t = tekenBoom(['S', ['Adj', 'enigmatical'], ['N', 'smile']]);
    const [adj, n] = t.knopen.filter((k) => k.woord !== null);
    expect(n.x - adj.x).toBe(kolomBreedte('enigmatical') / 2 + kolomBreedte('smile') / 2);
  });
});

describe('leesBomen', () => {
  it('leest wat json.dumps van de parser-bomen maakt', () => {
    const uit = leesBomen(JSON.parse(JSON.stringify([HOLMES, ['N', 'x']])));
    expect(uit).toHaveLength(2);
    expect(bladeren(uit[0])).toEqual(['holmes', 'lit', 'a', 'pipe']);
  });

  it('laat alles vallen wat geen boom is, en valt daar niet op om', () => {
    expect(leesBomen(null)).toEqual([]);
    expect(leesBomen('S')).toEqual([]);
    expect(leesBomen([['S'], ['S', 3], ['S', ['N', 'x'], 'los'], 7])).toEqual([]);
    expect(isBoom(['S', ['N', 'x']])).toBe(true);
  });
});

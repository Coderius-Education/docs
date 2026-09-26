import { describe, expect, it } from 'vitest';
import {
  type Gebeurtenis,
  afspeelduur,
  kader,
  naarSvg,
  schildpadPunten,
  speelAf,
} from './tekening';

const NIEUW: Gebeurtenis = { t: 'nieuw', id: 0, vorm: 'classic', zichtbaar: true };
const ga = (x: number, y: number, pen = true, id = 0): Gebeurtenis => ({
  t: 'ga',
  id,
  x,
  y,
  pen,
  kleur: 'black',
  dikte: 1,
});

describe('speelAf', () => {
  it('maakt van elke beweging met de pen omlaag een lijn vanaf de vorige plek', () => {
    const stand = speelAf([NIEUW, ga(100, 0), ga(100, 50, false), ga(0, 50)]);
    expect(stand.vormen).toEqual([
      { soort: 'lijn', id: 0, x1: 0, y1: 0, x2: 100, y2: 0, kleur: 'black', dikte: 1 },
      { soort: 'lijn', id: 0, x1: 100, y1: 50, x2: 0, y2: 50, kleur: 'black', dikte: 1 },
    ]);
    expect(stand.schildpadden[0]).toMatchObject({ x: 0, y: 50 });
  });

  it('toont na `tot` gebeurtenissen alleen wat er dan al was', () => {
    const gebeurtenissen = [
      NIEUW,
      ga(100, 0),
      { t: 'draai', id: 0, hoek: 90 } as Gebeurtenis,
      ga(100, 100),
    ];
    expect(speelAf(gebeurtenissen, 2).vormen).toHaveLength(1);
    expect(speelAf(gebeurtenissen, 3).schildpadden[0].hoek).toBe(90);
    expect(speelAf(gebeurtenissen, 0).schildpadden).toEqual([]);
  });

  it('laat een vulling pas zien na end_fill, op de plek van begin_fill', () => {
    const vul: Gebeurtenis = {
      t: 'vul',
      id: 0,
      punten: [
        [0, 0],
        [10, 0],
        [0, 10],
      ],
      kleur: 'yellow',
      zichtbaarVanaf: 4,
    };
    const gebeurtenissen = [NIEUW, vul, ga(10, 0), ga(0, 10)];
    expect(speelAf(gebeurtenissen, 3).vormen.map((v) => v.soort)).toEqual(['lijn']);
    expect(speelAf(gebeurtenissen, 4).vormen.map((v) => v.soort)).toEqual(['vul', 'lijn', 'lijn']);
  });

  it('een vulling zonder end_fill verschijnt nooit', () => {
    const vul: Gebeurtenis = { t: 'vul', id: 0, punten: [[0, 0]] };
    expect(speelAf([NIEUW, vul, ga(10, 0)]).vormen.map((v) => v.soort)).toEqual(['lijn']);
  });

  it('clear() wist alleen de lijnen van die schildpad, Screen().clear() alles', () => {
    const twee: Gebeurtenis = { t: 'nieuw', id: 1, vorm: 'classic', zichtbaar: true };
    const basis = [NIEUW, twee, ga(10, 0, true, 0), ga(0, 10, true, 1)];
    expect(speelAf([...basis, { t: 'wis', id: 0 }]).vormen.map((v) => v.id)).toEqual([1]);
    expect(speelAf([...basis, { t: 'wis' }]).vormen).toEqual([]);
  });

  it('onthoudt achtergrond, zichtbaarheid en vorm', () => {
    const stand = speelAf([
      NIEUW,
      { t: 'achtergrond', kleur: 'lightblue' },
      { t: 'zichtbaar', id: 0, aan: false },
      { t: 'vorm', id: 0, vorm: 'turtle' },
    ]);
    expect(stand.achtergrond).toBe('lightblue');
    expect(stand.schildpadden[0]).toMatchObject({ zichtbaar: false, vorm: 'turtle' });
  });
});

describe('kader', () => {
  it('is minstens 500 bij 400, met de oorsprong in het midden', () => {
    expect(kader([NIEUW, ga(10, 10)])).toEqual({ x: -250, y: -200, breedte: 500, hoogte: 400 });
  });

  it('groeit mee met een tekening die buiten dat vlak komt, plus een marge', () => {
    const k = kader([NIEUW, ga(400, -300)]);
    expect(k.x + k.breedte).toBe(420);
    expect(k.y + k.hoogte).toBe(320); // y = -300 staat in SVG onderaan: 300 + 20
  });
});

describe('afspeelduur', () => {
  it('is nul met speed(0) of tracer(0)', () => {
    expect(afspeelduur({ gebeurtenissen: [NIEUW, ga(1, 1)], direct: true })).toBe(0);
  });

  it('groeit met het aantal bewegingen, tot hoogstens vier seconden', () => {
    const veel = Array.from({ length: 1000 }, (_, i) => ga(i, 0));
    expect(afspeelduur({ gebeurtenissen: [NIEUW, ga(1, 1)], direct: false })).toBe(25);
    expect(afspeelduur({ gebeurtenissen: [NIEUW, ...veel], direct: false })).toBe(4000);
  });
});

describe('schildpadPunten', () => {
  it('richt de punt van de pijl in de kijkrichting, met y omhoog', () => {
    const s = { id: 0, x: 0, y: 0, zichtbaar: true, vorm: 'classic', kleur: 'black' };
    // Richting 0: de staart ligt links van de punt.
    expect(schildpadPunten({ ...s, hoek: 0 }).split(' ')[1]).toBe('-9,-5');
    // Richting 90 (omhoog): de staart ligt eronder, en in SVG is onder een positieve y.
    expect(schildpadPunten({ ...s, hoek: 90 }).split(' ')[1]).toBe('-5,9');
  });
});

describe('naarSvg', () => {
  it('tekent lijnen met y omhoog, en de schildpad erbovenop', () => {
    const svg = naarSvg({ gebeurtenissen: [NIEUW, ga(100, 50)], direct: false });
    expect(svg).toContain('<line x1="0" y1="0" x2="100" y2="-50" stroke="black"');
    expect(svg.indexOf('<line')).toBeLessThan(svg.lastIndexOf('<polygon'));
    expect(svg).toContain('viewBox="-250 -200 500 400"');
  });

  it('ontsnapt kleuren en tekst uit de code van de leerling', () => {
    const svg = naarSvg({
      gebeurtenissen: [
        NIEUW,
        { t: 'achtergrond', kleur: 'red" onload="alert(1)' },
        {
          t: 'tekst',
          id: 0,
          x: 0,
          y: 0,
          tekst: '<script>x</script>',
          uitlijning: 'left',
          grootte: 8,
          kleur: 'black',
        },
      ],
      direct: false,
    });
    expect(svg).not.toContain('onload="');
    expect(svg).not.toContain('<script>');
    expect(svg).toContain('&lt;script&gt;x&lt;/script&gt;');
  });
});

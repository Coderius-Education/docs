import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { TEKST } from '../../../../packages/shared/components/Voorspel/logica';
import {
  BIJNA,
  MELDING_REGELS,
  MIDDEN,
  OPDRACHTEN,
  type Opdracht,
  begrens,
  beoordeel,
  draaiing,
  leesInvoer,
  moetBevestigen,
  punt,
} from '../components/ServoSchijf/logica';

// De servo-draaischijf in click_golfer/servo.md: een tekening van de servo
// waarin het asje meedraait met de stand die de leerling kiest, plus kleine
// opdrachten. Wat hier vastligt, is wat de les in de tabel onder "Graden"
// zegt: 0° en 180° aan de twee kanten, 90° recht in het midden.

const SERVO = fileURLToPath(new URL('../../click_golfer/servo.md', import.meta.url));

describe('de tekening', () => {
  it('90° wijst recht omhoog, 0° ligt links en 180° rechts, net als op de schuif', () => {
    const r = 100;
    expect(punt(90, r)).toEqual({ x: MIDDEN.x, y: MIDDEN.y - r });
    expect(punt(0, r)).toEqual({ x: MIDDEN.x - r, y: MIDDEN.y });
    expect(punt(180, r)).toEqual({ x: MIDDEN.x + r, y: MIDDEN.y });
    // 45° en 135° liggen elk halverwege, gespiegeld om het midden.
    const a = punt(45, r);
    const b = punt(135, r);
    expect(a.y).toBe(b.y);
    expect(MIDDEN.x - a.x).toBeCloseTo(b.x - MIDDEN.x, 1);
  });

  it('de arm is naar 180° getekend en gaat van 0° naar 180° over het midden, niet onder het asje door', () => {
    expect(draaiing(0)).toBe(-180);
    expect(draaiing(90)).toBe(-90);
    expect(draaiing(180)).toBe(0);
    // Hoe hoger de stand, hoe verder met de klok mee: schuif naar rechts, arm naar rechts.
    expect(draaiing(100)).toBeGreaterThan(draaiing(80));
    // Buiten 0–180 blijft de arm aan de rand van de halve cirkel.
    expect(draaiing(250)).toBe(0);
    expect(draaiing(-30)).toBe(-180);
  });
});

describe('begrenzen', () => {
  it('houdt een stand tussen 0 en 180, in hele graden', () => {
    expect(begrens(-5)).toBe(0);
    expect(begrens(200)).toBe(180);
    expect(begrens(44.6)).toBe(45);
    expect(begrens(Number.NaN)).toBe(0);
  });

  it('legt uit waarom een getal buiten 0–180 is aangepast, zonder uitroepteken', () => {
    const hoog = leesInvoer('200');
    expect(hoog.stand).toBe(180);
    expect(hoog.melding).toMatch(/180°/);
    const laag = leesInvoer('-10');
    expect(laag.stand).toBe(0);
    expect(laag.melding).toMatch(/0°/);
    const komma = leesInvoer('45,5');
    expect(komma.stand).toBe(46);
    expect(komma.melding).toMatch(/hele graden/);
    for (const m of [hoog.melding, laag.melding, komma.melding]) expect(m).not.toMatch(/!/);
  });

  it('een gewoon getal gaat zonder melding door, en geen getal verandert niets', () => {
    expect(leesInvoer(' 135 ')).toEqual({ stand: 135, melding: null });
    expect(leesInvoer('0')).toEqual({ stand: 0, melding: null });
    expect(leesInvoer('').stand).toBeNull();
    expect(leesInvoer('abc').stand).toBeNull();
  });
});

describe('het veld verlaten', () => {
  it('na Enter bij 200 blijft de melding staan als je op Volgende opdracht klikt', () => {
    // Enter bij 200 zet de stand op 180 en het veld op "180", met een
    // melding. De klik op de knop haalt de focus uit het veld; bevestigde dat
    // opnieuw, dan verdween de melding, schoof de knop omhoog en telde de
    // klik niet. Nagespeeld met Playwright op 1280 en 375 breed.
    const { stand, melding } = leesInvoer('200');
    expect(melding).not.toBeNull();
    expect(moetBevestigen(String(stand), stand as number)).toBe(false);
  });

  it('de melding heeft altijd haar ruimte, en past daarin op een telefoon', () => {
    // Wie 200 typt en zonder Enter op de knop klikt, laat het veld los
    // terwijl de muisknop omlaag is. De melding verschijnt dan; stond haar
    // ruimte er nog niet, dan schoof de knop weg en telde de klik niet.
    const css = readFileSync(
      fileURLToPath(new URL('../components/ServoSchijf/styles.module.css', import.meta.url)),
      'utf8',
    );
    expect(css).toMatch(new RegExp(`min-height: calc\\(${MELDING_REGELS} \\* 1\\.4em\\)`));
    // Het oordeel ook: dat verschijnt bij 200 zonder Enter tegelijk met de
    // melding, en is op 375 breed twee regels (gemeten: 45 px, elke tekst).
    expect(css).toMatch(/\.oordeel \{\s*min-height: calc\(2 \* 1\.4em\)/);
    // Op 375 breed passen er zo'n 40 tekens op een regel van 0.9rem
    // (gemeten met Playwright); 200 en -180 zijn de langste.
    for (const invoer of ['200', '-180', '44.5', 'abc']) {
      expect((leesInvoer(invoer).melding ?? '').length).toBeLessThanOrEqual(MELDING_REGELS * 36);
    }
  });

  it('bevestigt wel wat nog niet de stand is: een half getal, een leeg veld, of 200 zonder Enter', () => {
    expect(moetBevestigen('44.6', 90)).toBe(true);
    expect(moetBevestigen('', 90)).toBe(true);
    expect(moetBevestigen('200', 90)).toBe(true);
    expect(moetBevestigen('90', 90)).toBe(false);
  });
});

describe('de opdrachten', () => {
  const vind = (doel: number): Opdracht => {
    const o = OPDRACHTEN.find((x) => x.doelen.length === 1 && x.doelen[0] === doel);
    if (!o) throw new Error(`geen opdracht voor ${doel}°`);
    return o;
  };

  it('vragen naar standen uit de les: één kant, het midden, 45° en 135°', () => {
    expect(OPDRACHTEN.map((o) => o.doelen)).toEqual([[0, 180], [90], [45], [135]]);
    expect(vind(90).vraag).toMatch(/recht in het midden/);
    expect(OPDRACHTEN[0].vraag).toMatch(/één kant/);
  });

  it('de eerste opdracht is niet al goed bij de beginstand van 90°', () => {
    expect(beoordeel(90, OPDRACHTEN[0]).goed).toBe(false);
  });

  it('beoordeelt goed, bijna en nog niet', () => {
    expect(beoordeel(90, vind(90))).toMatchObject({
      goed: true,
      tekst: expect.stringMatching(/^Goed\. /),
    });
    expect(beoordeel(60, vind(45)).tekst).toBe('Bijna: je staat op 60°, je moet naar 45°.');
    expect(beoordeel(45 - BIJNA, vind(45)).tekst).toMatch(/^Bijna/);
    expect(beoordeel(10, vind(90)).tekst).toBe(
      'Nog niet: je staat op 10°. Draai verder, naar 180° toe.',
    );
    expect(beoordeel(170, vind(90)).tekst).toMatch(/Draai terug, naar 0° toe/);
  });

  it('"helemaal naar één kant" is goed op 0° én op 180°, en wijst naar de dichtstbijzijnde kant', () => {
    const kant = OPDRACHTEN[0];
    expect(beoordeel(0, kant).goed).toBe(true);
    expect(beoordeel(180, kant).goed).toBe(true);
    expect(beoordeel(170, kant).tekst).toMatch(/naar 180°/);
    expect(beoordeel(10, kant).tekst).toMatch(/naar 0°/);
  });

  it('zegt goed met hetzelfde woord als de voorspelvragen op de pagina', () => {
    // De draaischijf zei "Goed zo.", de <Voorspel> eronder "Goed.".
    for (const o of OPDRACHTEN) expect(o.goed.startsWith(`${TEKST.goed} `)).toBe(true);
  });

  it('geen terugkoppeling met een uitroepteken', () => {
    for (const o of OPDRACHTEN) {
      for (const stand of [0, 30, 45, 90, 120, 135, 180]) {
        expect(beoordeel(stand, o).tekst).not.toMatch(/!/);
      }
      expect(o.vraag).not.toMatch(/!/);
    }
  });
});

describe('servo.md', () => {
  const inhoud = readFileSync(SERVO, 'utf8');

  it('importeert de draaischijf en zet hem in de sectie Graden', () => {
    expect(inhoud).toMatch(/^import ServoSchijf from '@site\/src\/components\/ServoSchijf';$/m);
    const graden = inhoud.indexOf('## Graden');
    const plek = inhoud.indexOf('<ServoSchijf');
    const volgende = inhoud.indexOf('\n## ', graden + 1);
    expect(graden).toBeGreaterThan(-1);
    expect(plek).toBeGreaterThan(graden);
    expect(plek).toBeLessThan(volgende);
  });

  it('de tabel van de les klopt met de tekening: 90° is recht in het midden', () => {
    expect(inhoud).toMatch(/\| 0° \| helemaal naar één kant \|/);
    expect(inhoud).toMatch(/\| 90° \| recht in het midden \|/);
    expect(inhoud).toMatch(/\| 180° \| helemaal naar de andere kant \|/);
  });
});

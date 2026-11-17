import { describe, expect, it } from 'vitest';
import {
  CODE_MAX,
  CODE_MIN,
  KLEINSTE_LETTER,
  KLEINSTE_SPEL,
  codeKolom,
  knip,
  spelHoogte,
  spelInBlok,
  veldGrenzen,
  veldInScherm,
} from './maat';

// De maten van het spel in een les-tabblad, en welk deel van het zwevende
// spelvenster te zien is.

describe('de hoogte van het spel', () => {
  it('is wat de les vraagt, als de kolom daar breed genoeg voor is', () => {
    expect(spelHoogte(418, 300)).toBe(300);
  });

  it('is niet hoger dan het venster van play in die kolom wordt', () => {
    // 800 bij 600 in een kolom van 360 breed is 270 hoog. Met de 450 van de
    // les stond er 180 pixels donkere rand onder het spel.
    expect(spelHoogte(360, 450)).toBe(270);
  });

  it('het veld past zich aan tussen een speelbaar spel en de hele kolom', () => {
    expect(veldGrenzen(418, 85)).toEqual({ min: 85 + KLEINSTE_SPEL, max: 85 + 314 });
  });
});

describe('de kolom van de code', () => {
  // Het veld is op 1280 pixels 930 breed.
  it('een kort programma laat het spel de ruimte', () => {
    expect(codeKolom(30, 930)).toEqual({ deel: CODE_MIN, schaal: 1 });
  });

  it('een regel van 62 tekens krijgt een bredere kolom, zonder af te breken', () => {
    // In een vaste kolom van 55 procent brak in een op de drie voorbeelden
    // een regel af.
    const { deel, schaal } = codeKolom(62, 930);
    expect(schaal).toBe(1);
    expect(deel).toBeGreaterThan(CODE_MIN);
    expect(deel).toBeLessThanOrEqual(CODE_MAX);
    expect(deel * 930).toBeGreaterThanOrEqual(62 * 8.43 + 62);
  });

  it('een regel van 80 tekens krijgt kleinere letters', () => {
    const { deel, schaal } = codeKolom(80, 930);
    expect(deel).toBe(CODE_MAX);
    expect(schaal).toBeLessThan(1);
    expect(schaal).toBeGreaterThanOrEqual(KLEINSTE_LETTER);
    expect(62 + 80 * 8.43 * schaal).toBeLessThanOrEqual(930 * CODE_MAX);
  });

  it('de letters worden niet kleiner dan 80 procent: dan breekt de regel af', () => {
    expect(codeKolom(111, 930)).toEqual({ deel: CODE_MAX, schaal: KLEINSTE_LETTER });
  });

  it('zonder maten (een tabblad dat dicht is) de gewone kolom', () => {
    expect(codeKolom(80, 0)).toEqual({ deel: CODE_MIN, schaal: 1 });
  });
});

describe('een veld dat het enige op zijn scherm is', () => {
  const grenzen = { min: 228, max: 362 };

  it('neemt de ruimte die er over is, tot zijn grootste maat', () => {
    expect(veldInScherm({ scherm: 720, zonderVeld: 400, ...grenzen })).toBe(308);
    expect(veldInScherm({ scherm: 1080, zonderVeld: 400, ...grenzen })).toBe(362);
  });

  it('staat ruimte af als er op zijn scherm iets openklapt', () => {
    // Opdracht 1.2.a: met de oplossing open hield het veld zijn 362 pixels,
    // en was het scherm 240 pixels te lang.
    expect(veldInScherm({ scherm: 720, zonderVeld: 460, ...grenzen })).toBe(248);
    expect(veldInScherm({ scherm: 720, zonderVeld: 600, ...grenzen })).toBe(228);
  });

  it('een veld in de open oplossing krijgt eerst zijn kleinste maat', () => {
    expect(veldInScherm({ scherm: 720, zonderVeld: 200, nodigVoorAnderen: 228, ...grenzen })).toBe(
      280,
    );
  });
});

describe('het spel in een open oplossing', () => {
  // Opdracht 3.3.a op 1280 bij 720: de oplossing schoof in een vak van 284
  // pixels, en van het veld van 381 was de onderste helft te zien.
  const rond = 81;

  it('neemt de ruimte die er op het scherm over is', () => {
    expect(spelInBlok({ scherm: 720, zonderVeld: 400, rond, eigen: 300 })).toBe(227);
  });

  it('wordt niet hoger dan wat de les vraagt', () => {
    expect(spelInBlok({ scherm: 1080, zonderVeld: 400, rond, eigen: 300 })).toBe(300);
  });

  it('blijft speelbaar als er geen ruimte is: dan schuift de oplossing', () => {
    expect(spelInBlok({ scherm: 720, zonderVeld: 560, rond, eigen: 300 })).toBe(KLEINSTE_SPEL);
  });
});

describe('welk deel van het spelvenster te zien is', () => {
  const vak = { top: 300, bottom: 600, left: 800, right: 1200 };
  const scherm = { top: 60, bottom: 720, left: 0, right: 1280 };

  it('alles, als het vak binnen het scherm staat', () => {
    expect(knip(vak, [scherm])).toEqual({ weg: false, boven: 0, rechts: 0, onder: 0, links: 0 });
  });

  it('onder de navbar gaat de bovenkant eraf', () => {
    // Het venster staat position: fixed boven alles: zonder knippen schoof
    // het spel bij het scrollen over de navbar heen.
    expect(knip({ ...vak, top: 20, bottom: 320 }, [scherm])).toMatchObject({
      weg: false,
      boven: 40,
      onder: 0,
    });
  });

  it('in een vak dat schuift (een open oplossing) blijft het binnen dat vak', () => {
    // De oplossing schuift in een vak van 410 tot 560; het spel loopt van 300
    // tot 600. Wat boven en onder het vak uitsteekt, is niet te zien.
    const oplossing = { top: 410, bottom: 560, left: 320, right: 1250 };
    expect(knip(vak, [oplossing, scherm])).toEqual({
      weg: false,
      boven: 110,
      rechts: 0,
      onder: 40,
      links: 0,
    });
  });

  it('helemaal uit beeld geschoven is het weg', () => {
    expect(knip({ ...vak, top: -400, bottom: -100 }, [scherm]).weg).toBe(true);
    const oplossing = { top: 620, bottom: 700, left: 320, right: 1250 };
    expect(knip(vak, [oplossing, scherm]).weg).toBe(true);
  });
});

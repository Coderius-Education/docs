import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { KLEINSTE_SCHAAL } from './breedte';
import { MIN_REGELS, REGEL_PX, UITVOER_ONDER, editorHoogte, rondOm, veldOpmaak } from './opmaak';

// De opmaak van een PyRunner in een les-tabblad. Een review als leerling vond
// editors van anderhalve regel, een grafiek in een vak van 100 pixels en een
// veld dat onder het typen van naast naar onder sprong; hier ligt vast wat het
// veld daarvoor doet. Of het scherm past, meet scripts/meet-les-tabs.mjs.

const kort = 'x = 1\nprint(x)';
const regel = (n: number) => `print("${'a'.repeat(n - 9)}")`;
const VELD = 930;

describe('de editor laat altijd een paar regels zien', () => {
  it('zelfs als er bijna geen ruimte is', () => {
    const m = veldOpmaak({ code: kort, breedte: VELD, ruimte: 60 });
    expect(m.editorMax).toBe(editorHoogte(MIN_REGELS));
    expect((m.editorMax ?? 0) - 28).toBeGreaterThanOrEqual(MIN_REGELS * REGEL_PX);
  });

  it('ook met de uitvoer onder de code', () => {
    const m = veldOpmaak({ code: regel(110), breedte: VELD, ruimte: 150 });
    expect(m.onder).toBe(true);
    expect(m.editorMax).toBeGreaterThanOrEqual(m.editorMin);
    expect(m.uitvoerOnder).toBe(UITVOER_ONDER);
  });

  it('zes regels: één meer dan het meetscript met --streng eist, en het meldt elke editor eronder', () => {
    // Met acht regels pasten 117 schermen van de route machine learning niet.
    const script = readFileSync(
      new URL('../../../../../../scripts/meet-les-tabs.mjs', import.meta.url),
      'utf8',
    );
    const getal = (naam: string) =>
      Number(script.match(new RegExp(`const ${naam} = (\\d+);`))?.[1]);
    expect(MIN_REGELS).toBe(6);
    expect(getal('MIN_EDITOR')).toBe(MIN_REGELS);
    expect(getal('KLEINSTE_EDITOR')).toBe(MIN_REGELS - 1);
  });

  it('met ruimte genoeg neemt de editor de ruimte', () => {
    expect(veldOpmaak({ code: kort, breedte: VELD, ruimte: 400 }).editorMax).toBe(400);
  });
});

describe('naast of onder', () => {
  it('een regel die met kleinere letters past, staat naast de uitvoer', () => {
    // 70 tekens past niet in driekwart van 930 pixels met gewone letters
    // (70 × 9,1 + 89 = 726 > 697), wel met letters op 80 procent.
    const m = veldOpmaak({ code: regel(70), breedte: VELD, ruimte: 400 });
    expect(m.onder).toBe(false);
    expect(m.schaal).toBeLessThan(1);
    expect(m.schaal).toBeGreaterThanOrEqual(KLEINSTE_SCHAAL);
  });

  it('een regel die ook zo niet past, zet de uitvoer onder de code', () => {
    expect(veldOpmaak({ code: regel(110), breedte: VELD, ruimte: 400 }).onder).toBe(true);
  });

  it('zonder gemeten breedte (een smal scherm) is er geen opmaak', () => {
    expect(veldOpmaak({ code: regel(110), breedte: null, ruimte: null })).toMatchObject({
      naast: null,
      onder: false,
      schaal: 1,
    });
  });
});

describe('een grafiek krijgt ruimte', () => {
  it('naast de code krijgt de uitvoer minstens 45 procent', () => {
    const m = veldOpmaak({ code: kort, breedte: VELD, ruimte: 400, plaatjes: true });
    expect(m.naast).not.toBeNull();
    expect(m.naast ?? VELD).toBeLessThanOrEqual(VELD * 0.55);
  });

  it('onder de code krijgt de uitvoer de helft, en de editor zijn minimum', () => {
    const m = veldOpmaak({ code: regel(110), breedte: VELD, ruimte: 500, plaatjes: true });
    expect(m.onder).toBe(true);
    expect(m.uitvoerOnder).toBeGreaterThan(UITVOER_ONDER);
    expect(m.uitvoerOnder).toBe(249);
    expect(m.editorMax).toBe(250);
  });

  it('is er weinig ruimte, dan gaat de editor voor', () => {
    const m = veldOpmaak({ code: regel(110), breedte: VELD, ruimte: 250, plaatjes: true });
    expect(m.editorMax).toBe(m.editorMin);
    expect(m.uitvoerOnder).toBe(250 - 1 - m.editorMin);
    // Met nog minder ruimte nooit onder het vaste vak.
    const krap = veldOpmaak({ code: regel(110), breedte: VELD, ruimte: 150, plaatjes: true });
    expect(krap.uitvoerOnder).toBe(UITVOER_ONDER);
    expect(krap.editorMax).toBe(krap.editorMin);
  });
});

describe('de tip of het antwoord staat open in het veld', () => {
  // Issue 212: tip en antwoord staan op de plek van de uitvoer. Het antwoord
  // is zelf code: in een kwart van het veld brak elke regel ervan af, en
  // onder de code in een vak van 100 pixels waren er vier regels te zien.
  const lang = regel(58);

  it('naast de code krijgt het antwoord minstens 45 procent', () => {
    const dicht = veldOpmaak({ code: lang, breedte: VELD, ruimte: 400 });
    expect(dicht.naast ?? 0).toBeGreaterThan(VELD * 0.55);
    const open = veldOpmaak({ code: lang, breedte: VELD, ruimte: 400, hulp: true });
    expect(open.naast).toBe(VELD - Math.round(VELD * 0.45));
    // De code houdt zijn regels heel zolang dat met kleinere letters kan.
    expect(open.schaal).toBeLessThan(dicht.schaal);
    expect(open.schaal).toBeGreaterThanOrEqual(KLEINSTE_SCHAAL);
  });

  it('korte code naast de uitvoer verandert niet', () => {
    const dicht = veldOpmaak({ code: kort, breedte: VELD, ruimte: 400 });
    expect(veldOpmaak({ code: kort, breedte: VELD, ruimte: 400, hulp: true })).toEqual(dicht);
  });

  it('naast of onder verandert niet: het veld verspringt niet bij een klik', () => {
    for (const code of [kort, lang, regel(110)]) {
      const dicht = veldOpmaak({ code, breedte: VELD, ruimte: 500 });
      for (const hulpTekens of [undefined, 30, 64, 120]) {
        const open = veldOpmaak({ code, breedte: VELD, ruimte: 500, hulp: true, hulpTekens });
        expect(open.onder, `${code} ${hulpTekens}`).toBe(dicht.onder);
      }
    }
  });

  it('een antwoord met een lange regel krijgt een bredere kolom', () => {
    // In een kolom van 418 pixels was van een regel van 64 tekens het eind
    // afgesneden.
    const open = veldOpmaak({ code: kort, breedte: VELD, ruimte: 500, hulp: true, hulpTekens: 64 });
    expect(VELD - (open.naast ?? VELD)).toBe(64 * 7 + 56 + 36);
    // De code houdt minstens dertig procent van het veld.
    const breed = veldOpmaak({
      code: lang,
      breedte: VELD,
      ruimte: 500,
      hulp: true,
      hulpTekens: 150,
    });
    expect(breed.naast).toBe(VELD - Math.round(VELD * 0.7));
  });

  it('onder de code krijgt het antwoord de helft, en de editor zijn minimum', () => {
    const open = veldOpmaak({ code: regel(110), breedte: VELD, ruimte: 500, hulp: true });
    expect(open.onder).toBe(true);
    expect(open.uitvoerOnder).toBe(249);
    expect(open.editorMax).toBe(250);
    // Samen even hoog als met de uitvoer: het veld wordt er niet hoger van.
    const dicht = veldOpmaak({ code: regel(110), breedte: VELD, ruimte: 500 });
    expect((open.editorMax ?? 0) + open.uitvoerOnder).toBe(
      (dicht.editorMax ?? 0) + dicht.uitvoerOnder,
    );
  });
});

describe('wat er rond de editor staat', () => {
  it('telt het uitklapblok met de code die al klaarstaat', () => {
    expect(rondOm({ vakBoven: 0, editorBoven: 0, editorOnder: 150, inhoudOnder: 186 })).toBe(36);
  });

  it('telt niet hoe ver het raster het codevak oprekt', () => {
    // In "de truc" rekte een verwachte uitvoer van negen regels het codevak op
    // tot 268 pixels; met de onderkant van het vak bleef het veld zo hoog.
    expect(rondOm({ vakBoven: 0, editorBoven: 0, editorOnder: 150, inhoudOnder: 150 })).toBe(0);
  });

  it('telt een opengeklapt blok niet', () => {
    expect(
      rondOm({ vakBoven: 0, editorBoven: 0, editorOnder: 150, inhoudOnder: 386, open: 200 }),
    ).toBe(36);
  });
});

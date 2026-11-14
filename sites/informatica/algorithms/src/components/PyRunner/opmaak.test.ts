import { describe, expect, it } from 'vitest';
import { KLEINSTE_SCHAAL } from './breedte';
import { MIN_REGELS, REGEL_PX, UITVOER_ONDER, editorHoogte, veldOpmaak } from './opmaak';

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
    const m = veldOpmaak({ code: regel(110), breedte: VELD, ruimte: 300, plaatjes: true });
    expect(m.editorMax).toBe(m.editorMin);
    expect(m.uitvoerOnder).toBe(300 - 1 - m.editorMin);
    // Met nog minder ruimte nooit onder het vaste vak.
    const krap = veldOpmaak({ code: regel(110), breedte: VELD, ruimte: 200, plaatjes: true });
    expect(krap.uitvoerOnder).toBe(UITVOER_ONDER);
    expect(krap.editorMax).toBe(krap.editorMin);
  });
});

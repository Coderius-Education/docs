// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { MARGE, MIN_HOOGTE, meetRuimte, pasHoogte } from './pasHoogte';

// Een oefenveld in een les-tabblad past zijn hoogte aan het scherm aan.
// Of het paneel dan echt past, meet alleen een browser
// (scripts/meet-les-tabs.mjs); de rekenregel en de twee gevallen waarin er
// niet gemeten wordt, staan hier.
describe('pasHoogte', () => {
  const basis = { scherm: 720, boven: 300, onder: 100, max: 420 };

  it('geeft het veld wat er op het scherm overblijft', () => {
    expect(pasHoogte(basis)).toBe(720 - 300 - 100 - MARGE);
  });

  it('wordt niet hoger dan de height-prop, ook op een groot scherm', () => {
    expect(pasHoogte({ ...basis, scherm: 1080 })).toBe(420);
  });

  it('wordt niet lager dan een bruikbare editor', () => {
    expect(pasHoogte({ ...basis, boven: 500 })).toBe(MIN_HOOGTE);
  });

  it('houdt een veld dat van zichzelf lager is dan het minimum zo laag', () => {
    expect(pasHoogte({ ...basis, boven: 600, max: 200 })).toBe(200);
  });
});

describe('meetRuimte', () => {
  // jsdom doet geen layout: de maten komen uit deze nagemaakte rechthoeken.
  const metMaat = (el: HTMLElement, top: number, hoogte: number, breedte = 900) => {
    el.getBoundingClientRect = () =>
      ({
        top,
        bottom: top + hoogte,
        height: hoogte,
        width: breedte,
        left: 0,
        right: breedte,
      }) as DOMRect;
    return el;
  };
  const paneelMet = (inhoud: string) => {
    const paneel = document.createElement('section');
    paneel.innerHTML = `<p>Opdracht</p><div id="veld"></div>${inhoud}`;
    document.body.replaceChildren(paneel);
    const veld = paneel.querySelector<HTMLElement>('#veld');
    if (!veld) throw new Error('geen veld');
    return { paneel, veld };
  };

  it('meet van de bovenkant van de pagina tot het veld, en van het veld tot het eind van het paneel', () => {
    const { paneel, veld } = paneelMet('<details><summary>Tip</summary>hint</details>');
    metMaat(paneel, 180, 500);
    metMaat(veld, 260, 300);
    expect(meetRuimte(veld, paneel, 420)).toEqual({
      scherm: window.innerHeight,
      boven: 260,
      onder: 120,
      max: 420,
    });
  });

  it('meet niet in een tabblad dat niet open staat', () => {
    const { paneel, veld } = paneelMet('');
    metMaat(paneel, 0, 0, 0);
    metMaat(veld, 0, 0, 0);
    expect(meetRuimte(veld, paneel, 420)).toBeNull();
  });

  // De bug: met de tip open is het paneel langer, de meting gaf het veld
  // minder ruimte, en de editor kromp van 322 naar 252 pixels onder het
  // typen van de leerling.
  it('meet niet zolang er een tip of antwoord open staat', () => {
    const { paneel, veld } = paneelMet('<details open><summary>Tip</summary>hint</details>');
    metMaat(paneel, 180, 700);
    metMaat(veld, 260, 300);
    expect(meetRuimte(veld, paneel, 420)).toBeNull();
  });
});

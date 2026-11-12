// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { plaatjeHoogte, speling, verdeelSpeling } from './speling';

// Wat er op het scherm over is, gaat naar het plaatje of het codevak. Bij de
// joystick van robotica stond het aansluitschema op 128 bij 240 pixels met
// 150 pixels leeg eronder, en van een script van 46 regels waren er twaalf te
// zien. Maten meet jsdom niet: de tests zetten ze vast. Of het in de browser
// past, meet scripts/meet-les-tabs.mjs.

describe('speling', () => {
  it('is wat er onder het paneel over is, min een marge', () => {
    expect(speling({ scherm: 720, onderkant: 560 })).toBe(148);
    // Te weinig om iets mee te doen, of niets.
    expect(speling({ scherm: 720, onderkant: 704 })).toBe(0);
    expect(speling({ scherm: 720, onderkant: 900 })).toBe(0);
  });
});

describe('plaatjeHoogte', () => {
  const vak = { breedte: 513, hoogte: 240 };

  it('geeft het vak de vrije ruimte erbij', () => {
    // Een staand schema van 1600 bij 2994: op 513 breed zou het 960 hoog zijn.
    expect(plaatjeHoogte(vak, { breedte: 1600, hoogte: 2994 }, 148)).toBe(388);
  });

  it('maakt het vak niet hoger dan het plaatje op die breedte wordt', () => {
    // Een liggende foto van 1600 bij 800 is op 513 breed 257 hoog.
    expect(plaatjeHoogte(vak, { breedte: 1600, hoogte: 800 }, 148)).toBe(257);
  });

  it('blaast een klein plaatje niet op, en laat een plaatje zonder maten met rust', () => {
    expect(plaatjeHoogte(vak, { breedte: 200, hoogte: 260 }, 148)).toBe(260);
    expect(plaatjeHoogte(vak, { breedte: 0, hoogte: 0 }, 148)).toBe(240);
  });
});

describe('verdeelSpeling', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  const maat = (el: Element, eigenschappen: Record<string, number>) => {
    for (const [naam, waarde] of Object.entries(eigenschappen))
      Object.defineProperty(el, naam, { value: waarde, configurable: true });
  };
  const onderkant = (el: Element, bottom: number) => {
    el.getBoundingClientRect = () => ({ bottom }) as DOMRect;
  };
  const les = (inhoud: string) => {
    document.body.innerHTML = `<div id="wortel"><section data-les-tab="a">${inhoud}</section><section data-les-tab="b" hidden><pre id="dicht"></pre></section></div>`;
    const wortel = document.getElementById('wortel') as HTMLElement;
    onderkant(wortel.querySelector('[data-les-tab="a"]') as Element, 560);
    Object.defineProperty(window, 'innerHeight', { value: 720, configurable: true });
    Object.defineProperty(window, 'innerWidth', { value: 1280, configurable: true });
    return wortel;
  };

  it('maakt een codevak dat schuift hoger, tot het programma past', () => {
    const wortel = les('<pre id="vak"></pre>');
    const vak = document.getElementById('vak') as HTMLElement;
    // 148 pixels vrij; er zijn er 100 verborgen.
    maat(vak, { scrollHeight: 480, clientHeight: 380, offsetHeight: 382 });
    verdeelSpeling(wortel);
    expect(vak.style.maxHeight).toBe('482px');
    // Zijn er meer verborgen dan er vrij is, dan krijgt het vak wat er is.
    maat(vak, { scrollHeight: 1000, clientHeight: 380, offsetHeight: 382 });
    verdeelSpeling(wortel);
    expect(vak.style.maxHeight).toBe('530px');
  });

  it('geeft de ruimte anders aan het plaatje naast zijn tekst', () => {
    const wortel = les(
      '<div data-les-beeld=""><p id="beeld"><img id="schema" alt="schema"></p><div>tekst</div></div>',
    );
    const beeld = document.getElementById('beeld') as HTMLElement;
    maat(beeld, { clientWidth: 513, clientHeight: 240 });
    maat(document.getElementById('schema') as Element, { naturalWidth: 1600, naturalHeight: 2994 });
    verdeelSpeling(wortel);
    expect(beeld.style.minHeight).toBe('388px');
  });

  it('doet niets op een telefoon, met een oefenveld, of met een antwoord open', () => {
    const wortel = les('<pre id="vak"></pre>');
    const vak = document.getElementById('vak') as HTMLElement;
    const paneel = wortel.querySelector('[data-les-tab="a"]') as HTMLElement;
    maat(vak, { scrollHeight: 480, clientHeight: 380, offsetHeight: 382 });
    Object.defineProperty(window, 'innerWidth', { value: 390, configurable: true });
    verdeelSpeling(wortel);
    expect(vak.style.maxHeight).toBe('');
    Object.defineProperty(window, 'innerWidth', { value: 1280, configurable: true });
    // Een oefenveld neemt de ruimte zelf (pasHoogte.ts zet de markering).
    paneel.setAttribute('data-heeft-veld', '');
    verdeelSpeling(wortel);
    expect(vak.style.maxHeight).toBe('');
    paneel.removeAttribute('data-heeft-veld');
    paneel.insertAdjacentHTML('beforeend', '<details open><summary>Tip</summary></details>');
    verdeelSpeling(wortel);
    expect(vak.style.maxHeight).toBe('');
  });

  it('zet een eerdere aanpassing terug als het paneel niets meer over heeft', () => {
    const wortel = les('<pre id="vak"></pre>');
    const vak = document.getElementById('vak') as HTMLElement;
    maat(vak, { scrollHeight: 480, clientHeight: 380, offsetHeight: 382 });
    verdeelSpeling(wortel);
    expect(vak.style.maxHeight).not.toBe('');
    onderkant(wortel.querySelector('[data-les-tab="a"]') as Element, 800);
    verdeelSpeling(wortel);
    expect(vak.style.maxHeight).toBe('');
  });
});

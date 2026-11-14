// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { MARGE } from './pasHoogte';
import {
  KLEINSTE_NA,
  KLEINSTE_VAK,
  NOODGREEP,
  blokHoogte,
  openBlokInVak,
  plaatjeHoogte,
  speling,
  vakHoogte,
  verdeelSpeling,
} from './speling';

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

  it('telt de hoogte van de tekst naast het plaatje mee', () => {
    // De joystick van robotica: naast het schema staat 370 pixels tekst. Het
    // vak van 240 werd 388, en dat maakte het paneel niet langer: 140 pixels
    // bleven ongebruikt. Het plaatje groeit eerst tot de hoogte van de rij,
    // en krijgt daarna de vrije ruimte erbij.
    const wortel = les(
      '<div data-les-beeld="" id="rij"><p id="beeld"><img id="schema" alt="schema"></p><div>tekst</div></div>',
    );
    const beeld = document.getElementById('beeld') as HTMLElement;
    maat(document.getElementById('rij') as Element, { clientHeight: 370 });
    maat(beeld, { clientWidth: 513, clientHeight: 240 });
    maat(document.getElementById('schema') as Element, { naturalWidth: 1600, naturalHeight: 2994 });
    verdeelSpeling(wortel);
    expect(beeld.style.minHeight).toBe('518px');
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
    // Het paneel past precies, en het vak schuift niet meer: niets te doen.
    onderkant(wortel.querySelector('[data-les-tab="a"]') as Element, 705);
    maat(vak, { scrollHeight: 380, clientHeight: 380, offsetHeight: 382 });
    verdeelSpeling(wortel);
    expect(vak.style.maxHeight).toBe('');
  });

  it('een codevak dat al schuift, geeft toe als het paneel te lang is', () => {
    // Fullstack: een endpoint van dertig regels met zijn uitleg ernaast en een
    // alinea eronder was veertig pixels te lang. Het vak schoof al; nu is het
    // veertig pixels lager en past het scherm.
    const wortel = les('<pre id="vak"></pre>');
    const vak = document.getElementById('vak') as HTMLElement;
    onderkant(wortel.querySelector('[data-les-tab="a"]') as Element, 748);
    maat(vak, { scrollHeight: 700, clientHeight: 322, offsetHeight: 324 });
    verdeelSpeling(wortel);
    // 748 + 12 marge - 720 = 40 te veel.
    expect(vak.style.maxHeight).toBe('284px');
  });

  it('een oefenveld in een stap die dicht is, houdt de open stap niet tegen', () => {
    // Python, Testcode in je module: de voorspelvraag staat in stap 2, een
    // oefenveld in stap 3. Het tabblad had de markering van dat veld, en het
    // vak met de uitleg van de vraag kromp daardoor niet: tachtig pixels te
    // lang na het antwoord.
    const wortel = les(
      '<div data-les-stap="een"><div data-voorspel-na id="na"></div></div>' +
        '<div data-les-stap="twee" hidden><div data-les-veld id="veld"></div></div>',
    );
    const paneel = wortel.querySelector('[data-les-tab="a"]') as HTMLElement;
    const na = document.getElementById('na') as HTMLElement;
    paneel.setAttribute('data-heeft-veld', '');
    maat(na, { offsetHeight: 260 });
    onderkant(paneel, 798);
    verdeelSpeling(wortel);
    expect(na.style.maxHeight).toBe('170px');
    // Staat het veld in de stap die open is, dan blijft alles zoals het is.
    (document.querySelector('[data-les-stap="twee"]') as HTMLElement).hidden = false;
    verdeelSpeling(wortel);
    expect(na.style.maxHeight).toBe('');
  });

  it('niet verder dan acht regels, en een vak dat niet schuift blijft heel', () => {
    expect(vakHoogte(324, 40)).toBe(284);
    expect(vakHoogte(324, 400)).toBe(KLEINSTE_VAK);
    expect(vakHoogte(150, 40)).toBe(150);
    expect(vakHoogte(324, 0)).toBe(324);
    const wortel = les('<pre id="vak"></pre>');
    const vak = document.getElementById('vak') as HTMLElement;
    onderkant(wortel.querySelector('[data-les-tab="a"]') as Element, 748);
    // Het hele programma is te zien, en het scherm is veel te lang: dan
    // knippen we er niets af. Dat is werk voor de auteur.
    onderkant(wortel.querySelector('[data-les-tab="a"]') as Element, 900);
    maat(vak, { scrollHeight: 322, clientHeight: 322, offsetHeight: 324 });
    verdeelSpeling(wortel);
    expect(vak.style.maxHeight).toBe('');
  });

  it('een codeblok dat heel te zien is, levert alleen een paar regels in', () => {
    // Fullstack, Er gaat iets mis: een foutmelding, de oorzaak, de oplossing
    // en elf regels code waren veertig pixels te lang. Het blok schuift nu
    // in zijn eigen vak, zodat de pagina niet schuift.
    const wortel = les('<pre id="kort"></pre><pre id="vak"></pre>');
    const vak = document.getElementById('vak') as HTMLElement;
    const kort = document.getElementById('kort') as HTMLElement;
    const paneel = wortel.querySelector('[data-les-tab="a"]') as Element;
    maat(vak, { scrollHeight: 280, clientHeight: 280, offsetHeight: 282 });
    maat(kort, { scrollHeight: 70, clientHeight: 70, offsetHeight: 72 });
    onderkant(paneel, 748);
    verdeelSpeling(wortel);
    expect(vak.style.maxHeight).toBe('242px');
    expect(kort.style.maxHeight).toBe('');
    // Meer dan een regel of vier te lang: dan niet.
    onderkant(paneel, 720 - 12 + NOODGREEP + 1);
    verdeelSpeling(wortel);
    expect(vak.style.maxHeight).toBe('');
    // En een blok dat daarmee onder acht regels komt, blijft heel.
    maat(vak, { scrollHeight: 200, clientHeight: 200, offsetHeight: 202 });
    onderkant(paneel, 748);
    verdeelSpeling(wortel);
    expect(vak.style.maxHeight).toBe('');
  });

  it('na een antwoord schuiven de terugkoppeling en de uitleg van de vraag in hun vak', () => {
    // Fullstack: een controlevraag paste tot je antwoordde. De uitleg erbij
    // maakte het scherm 90 pixels te lang, en de knop Volgende viel weg.
    const wortel = les('<pre id="code"></pre><div data-voorspel-na id="na"></div>');
    const na = document.getElementById('na') as HTMLElement;
    const code = document.getElementById('code') as HTMLElement;
    const paneel = wortel.querySelector('[data-les-tab="a"]') as Element;
    maat(na, { offsetHeight: 260 });
    maat(code, { scrollHeight: 300, clientHeight: 300, offsetHeight: 302 });
    onderkant(paneel, 798);
    verdeelSpeling(wortel);
    // 798 + 12 marge - 720 = 90 te lang: het vak levert die in, de code niets.
    expect(na.style.maxHeight).toBe('170px');
    expect(code.style.maxHeight).toBe('');
    // Niet lager dan een paar regels: de rest is aan de auteur.
    onderkant(paneel, 1100);
    verdeelSpeling(wortel);
    expect(na.style.maxHeight).toBe(`${KLEINSTE_NA}px`);
    // Een kort vak blijft zoals het is.
    maat(na, { offsetHeight: 80 });
    onderkant(paneel, 798);
    verdeelSpeling(wortel);
    expect(na.style.maxHeight).toBe('');
  });

  it('code met de uitleg ernaast krimpt als één rij, tot het deel dat niet schuift', () => {
    const wortel = les(
      '<div data-code-uitleg><div><pre id="vak"></pre></div><ol id="uitleg"></ol></div>',
    );
    const vak = document.getElementById('vak') as HTMLElement;
    const uitleg = document.getElementById('uitleg') as HTMLElement;
    const paneel = wortel.querySelector('[data-les-tab="a"]') as Element;
    // Een lang programma en een korte uitleg: beide naar 284.
    onderkant(paneel, 748);
    maat(vak, { scrollHeight: 700, clientHeight: 322, offsetHeight: 324 });
    maat(uitleg, { scrollHeight: 320, clientHeight: 320, offsetHeight: 320 });
    verdeelSpeling(wortel);
    expect(vak.style.maxHeight).toBe('284px');
    expect(uitleg.style.maxHeight).toBe('284px');
    // Fullstack, Het account opslaan: twaalf regels code (288 pixels, alles
    // te zien) met vijf punten uitleg ernaast die schuiven (324). De uitleg
    // krimpt tot de code, niet verder: de code blijft heel.
    maat(vak, { scrollHeight: 288, clientHeight: 288, offsetHeight: 288 });
    maat(uitleg, { scrollHeight: 500, clientHeight: 322, offsetHeight: 324 });
    onderkant(paneel, 720);
    verdeelSpeling(wortel);
    expect(uitleg.style.maxHeight).toBe('312px');
    expect(vak.style.maxHeight).toBe('');
    onderkant(paneel, 900);
    verdeelSpeling(wortel);
    expect(uitleg.style.maxHeight).toBe('288px');
    expect(vak.style.maxHeight).toBe('');
  });
});

// Een open tip of antwoord viel onder de rand: in de route machine learning
// op elk scherm met een veld 85 tot 128 pixels, bij binair zoeken tot 667.
describe('openBlokInVak', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  const les = (inhoud: string, bottom: number) => {
    document.body.innerHTML = `<div id="wortel"><section data-les-tab="a">${inhoud}</section></div>`;
    const wortel = document.getElementById('wortel') as HTMLElement;
    const paneel = wortel.querySelector('[data-les-tab]') as HTMLElement;
    paneel.getBoundingClientRect = () => ({ bottom }) as DOMRect;
    Object.defineProperty(window, 'innerHeight', { value: 720, configurable: true });
    Object.defineProperty(window, 'innerWidth', { value: 1280, configurable: true });
    return wortel;
  };
  const blok = (id: string, open = true) =>
    `<details${open ? ' open' : ''}><summary>Tip</summary><div><div id="${id}">tekst</div></div></details>`;
  const hoog = (id: string, offsetHeight: number) =>
    Object.defineProperty(document.getElementById(id), 'offsetHeight', {
      value: offsetHeight,
      configurable: true,
    });

  it('geeft de inhoud een vak dat schuift, zo hoog als past', () => {
    const wortel = les(blok('inhoud'), 820);
    hoog('inhoud', 300);
    openBlokInVak(wortel);
    const inhoud = document.getElementById('inhoud') as HTMLElement;
    // 820 + marge − 720: zoveel te lang; de inhoud levert dat in.
    expect(inhoud.style.maxHeight).toBe(`${300 - (820 + MARGE - 720)}px`);
    expect(inhoud.style.overflowY).toBe('auto');
  });

  it('niet lager dan een paar regels, en niets als het past of op een telefoon', () => {
    let wortel = les(blok('inhoud'), 1400);
    hoog('inhoud', 300);
    openBlokInVak(wortel);
    expect((document.getElementById('inhoud') as HTMLElement).style.maxHeight).toBe(
      `${KLEINSTE_NA}px`,
    );
    wortel = les(blok('inhoud'), 600);
    hoog('inhoud', 300);
    openBlokInVak(wortel);
    expect((document.getElementById('inhoud') as HTMLElement).style.maxHeight).toBe('');
    wortel = les(blok('inhoud'), 900);
    hoog('inhoud', 300);
    Object.defineProperty(window, 'innerWidth', { value: 390, configurable: true });
    openBlokInVak(wortel);
    expect((document.getElementById('inhoud') as HTMLElement).style.maxHeight).toBe('');
  });

  it('zet het vak terug als het blok weer dicht is', () => {
    const wortel = les(blok('inhoud'), 820);
    hoog('inhoud', 300);
    openBlokInVak(wortel);
    const inhoud = document.getElementById('inhoud') as HTMLElement;
    expect(inhoud.style.maxHeight).not.toBe('');
    inhoud.closest('details')?.removeAttribute('open');
    openBlokInVak(wortel);
    expect(inhoud.style.maxHeight).toBe('');
    expect(inhoud.style.overflowY).toBe('');
  });

  it('blokHoogte', () => {
    expect(blokHoogte(300, 0)).toBe(300);
    expect(blokHoogte(300, 100)).toBe(200);
    expect(blokHoogte(300, 1000)).toBe(KLEINSTE_NA);
  });
});

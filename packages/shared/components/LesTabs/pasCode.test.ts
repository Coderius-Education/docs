// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { KLEINSTE_SCHAAL, codeSchaal, pasCode } from './pasCode';

// Een regel code staat heel op één regel: past hij niet, dan worden de
// letters van het blok kleiner. In fullstack was het eind van vijftig
// functiekoppen afgesneden, en daarna brak het af naar een volgende regel.
// Maten meet jsdom niet: de tests zetten ze vast. Of het in de browser past,
// meet scripts/meet-les-tabs.mjs (afgesneden en afgebroken code).

describe('codeSchaal', () => {
  it('is 1 als de langste regel past', () => {
    expect(codeSchaal(652, 600)).toBe(1);
    expect(codeSchaal(652, 652)).toBe(1);
  });

  it('is de verhouding van de ruimte voor de letters, naar beneden afgerond', () => {
    // 652 breed, de langste regel wil 760: (652 - 32) / (760 - 32) = 0,851.
    expect(codeSchaal(652, 760)).toBe(0.85);
  });

  it('gaat niet onder de ondergrens', () => {
    expect(codeSchaal(652, 1400)).toBe(KLEINSTE_SCHAAL);
  });
});

describe('pasCode', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  const blok = (inhoud = '') => {
    document.body.innerHTML = `<div id="les"><div class="theme-code-block">${inhoud}<pre><code>x</code></pre></div></div>`;
    return document.querySelector('pre') as HTMLPreElement;
  };
  /** Een blok van `heeft` breed waarvan de regels bij 14,72 pixels `nodig` breed zijn. */
  const maten = (pre: HTMLElement, heeft: number, nodig: number) => {
    Object.defineProperty(pre, 'clientWidth', { value: heeft, configurable: true });
    Object.defineProperty(pre, 'scrollWidth', {
      configurable: true,
      get: () => {
        const letters = Number.parseFloat(pre.style.fontSize || '14.72') / 14.72;
        return Math.max(heeft, Math.round(32 + (nodig - 32) * letters));
      },
    });
    window.getComputedStyle = (() => ({
      fontSize: '14.72px',
    })) as unknown as typeof window.getComputedStyle;
  };

  it('laat een blok dat past met rust', () => {
    const pre = blok();
    maten(pre, 652, 600);
    pasCode(document);
    expect(pre.style.fontSize).toBe('');
    expect(pre.hasAttribute('data-code-breekt')).toBe(false);
  });

  it('maakt de letters kleiner tot de langste regel past', () => {
    const pre = blok();
    maten(pre, 652, 760);
    pasCode(document);
    expect(pre.style.fontSize).toBe('12.51px');
    expect(pre.hasAttribute('data-code-breekt')).toBe(false);
    // Het meten zelf laat niets achter.
    expect((pre.querySelector('code') as HTMLElement).style.whiteSpace).toBe('');
  });

  it('zegt het als een regel ook met de kleinste letters niet past', () => {
    const pre = blok();
    maten(pre, 652, 1400);
    pasCode(document);
    expect(pre.style.fontSize).toBe('11.78px');
    expect(pre.hasAttribute('data-code-breekt')).toBe(true);
  });

  it('geeft code met de uitleg ernaast pas een bredere kolom als kleinere letters niet genoeg zijn', () => {
    // Fullstack: met een altijd bredere kolom voor de code was de uitleg
    // ernaast zo smal dat het scherm 36 pixels langer werd dan met de code
    // iets kleiner.
    document.body.innerHTML =
      '<div data-code-uitleg=""><div class="theme-code-block"><pre><code>x</code></pre></div><ol></ol></div>';
    const pre = document.querySelector('pre') as HTMLPreElement;
    const rij = document.querySelector('[data-code-uitleg]') as HTMLElement;
    // Een beetje te breed: kleinere letters volstaan.
    maten(pre, 652, 760);
    pasCode(document);
    expect(rij.hasAttribute('data-code-breed')).toBe(false);
    // Veel te breed voor 652, maar met de bredere kolom (690) past het net.
    Object.defineProperty(pre, 'clientWidth', {
      configurable: true,
      get: () => (rij.hasAttribute('data-code-breed') ? 690 : 652),
    });
    Object.defineProperty(pre, 'scrollWidth', {
      configurable: true,
      get: () => Math.round(32 + 820 * (Number.parseFloat(pre.style.fontSize || '14.72') / 14.72)),
    });
    pasCode(document);
    expect(rij.hasAttribute('data-code-breed')).toBe(true);
    expect(pre.hasAttribute('data-code-breekt')).toBe(false);
    expect(pre.style.fontSize).toBe('11.78px');
  });

  it('begint elke keer opnieuw: een breder venster geeft de gewone letters terug', () => {
    const pre = blok();
    maten(pre, 652, 760);
    pasCode(document);
    maten(pre, 900, 760);
    pasCode(document);
    expect(pre.style.fontSize).toBe('');
  });

  it('slaat een blok over dat niet te zien is, en de uitvoer van een oefenveld', () => {
    document.body.innerHTML =
      '<div hidden><div class="theme-code-block"><pre id="dicht"><code>x</code></pre></div></div><pre id="uitvoer"><code>x</code></pre>';
    for (const id of ['dicht', 'uitvoer'])
      maten(document.getElementById(id) as HTMLElement, 652, 760);
    pasCode(document);
    expect((document.getElementById('dicht') as HTMLElement).style.fontSize).toBe('');
    expect((document.getElementById('uitvoer') as HTMLElement).style.fontSize).toBe('');
  });
});

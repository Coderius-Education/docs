// @vitest-environment jsdom
import { defaultHighlightStyle } from '@codemirror/language';
import { tags } from '@lezer/highlight';
import { describe, expect, it } from 'vitest';
import { GETAL_DONKER, kleuren } from './codemirror';

// oneDark kleurde getallen oranje, terwijl de editor ze in licht groen kleurt
// (issue #158). De kleuren van play komen nu uit één lijst voor licht en
// donker (CODEMIRROR in packages/shared/prism-thema.js); dat licht en donker
// dezelfde stukken code kleuren, staat in packages/shared/codemirror-kleuren.test.ts.

/** Kleurtoon (0-360) van een hex-kleur. */
function toon(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => Number.parseInt(hex.slice(i, i + 2), 16) / 255);
  const max = Math.max(r, g, b);
  const d = max - Math.min(r, g, b);
  const t = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return (t * 60 + 360) % 360;
}

/** De kleur die een stijl een soort code geeft. */
const kleurVan = (stijl: typeof defaultHighlightStyle, tag: (typeof tags)[keyof typeof tags]) => {
  const klas = stijl.style([tag as never]);
  return stijl.module
    ?.getRules()
    .match(new RegExp(`\\.${klas}\\s*\\{\\s*color:\\s*(#[0-9a-f]+)`, 'i'))?.[1];
};

describe('getallen in de editor van play', () => {
  it('een getal is in licht het groen van de standaardstijl', () => {
    expect(kleurVan(kleuren.licht, tags.number)).toBe(kleurVan(defaultHighlightStyle, tags.number));
  });

  it('in donker is het hetzelfde groen, lichter, en niet het oranje van oneDark', () => {
    expect(kleurVan(kleuren.donker, tags.number)).toBe(GETAL_DONKER);
    const voluit = `#${[...('#164' as string).slice(1)].map((c) => c + c).join('')}`;
    expect(Math.abs(toon(GETAL_DONKER) - toon(voluit))).toBeLessThan(10);
  });

  it('True en een tekst hebben een eigen kleur', () => {
    expect(kleurVan(kleuren.donker, tags.bool)).not.toBe(GETAL_DONKER);
    expect(kleurVan(kleuren.donker, tags.string)).not.toBe(GETAL_DONKER);
  });
});

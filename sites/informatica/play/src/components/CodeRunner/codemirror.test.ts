// @vitest-environment jsdom
import { defaultHighlightStyle } from '@codemirror/language';
import { tags } from '@lezer/highlight';
import { describe, expect, it } from 'vitest';
import { GETAL_DONKER, getallenStijl } from './codemirror';

// oneDark kleurde getallen oranje, terwijl de editor ze in licht groen kleurt
// (issue #158). In donker legt getallenDonker hetzelfde groen eroverheen,
// lichter. Dat hij oneDark echt wint, is in Chromium nagemeten.

/** Kleurtoon (0-360) van een hex-kleur. */
function toon(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => Number.parseInt(hex.slice(i, i + 2), 16) / 255);
  const max = Math.max(r, g, b);
  const d = max - Math.min(r, g, b);
  const t = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return (t * 60 + 360) % 360;
}

describe('getallen in de editor van play, in donker', () => {
  it('een getal krijgt een eigen kleur boven oneDark', () => {
    const klas = getallenStijl.style([tags.number]);
    expect(klas).toBeTruthy();
    expect(getallenStijl.module?.getRules()).toContain(`.${klas}`);
    expect(getallenStijl.module?.getRules().toLowerCase()).toContain(GETAL_DONKER);
  });

  it('dat is het groen van licht, en niet het oranje van oneDark', () => {
    const licht = defaultHighlightStyle.module?.getRules() ?? '';
    const klasLicht = defaultHighlightStyle.style([tags.number]);
    const groen = licht.match(
      new RegExp(`\\.${klasLicht}\\s*\\{\\s*color:\\s*(#[0-9a-f]+)`, 'i'),
    )?.[1];
    expect(groen).toBe('#164');
    const voluit = `#${[...(groen as string).slice(1)].map((c) => c + c).join('')}`;
    expect(Math.abs(toon(GETAL_DONKER) - toon(voluit))).toBeLessThan(10);
  });

  it('True, False en een tekst houden hun eigen kleur', () => {
    expect(getallenStijl.style([tags.bool])).toBeNull();
    expect(getallenStijl.style([tags.string])).toBeNull();
  });
});

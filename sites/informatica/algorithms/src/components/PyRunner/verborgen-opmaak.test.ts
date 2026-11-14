import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// Het blok met de code die al klaarstaat stond in een les-tabblad in de
// opmaak van een tip (.paneel details in LesTabs: binnenruimte, een rand
// links, 16 en 8 pixels marge) en kostte dicht 77 pixels in plaats van 30.
// Daardoor paste geen scherm "Aan de slag" met klaargezette code in de route
// machine learning. Of het in de browser klopt, meet scripts/meet-les-tabs.mjs.

const css = readFileSync(new URL('./styles.module.css', import.meta.url), 'utf8');

describe('het blok met de code die al klaarstaat', () => {
  const regel = css.match(/\.runner \.codeVak details\.verborgen \{([^}]*)\}/)?.[1] ?? '';

  it('weegt zwaarder dan .paneel details', () => {
    expect(regel).not.toBe('');
  });

  it('heeft geen binnenruimte, rand of grote marge', () => {
    expect(regel).toMatch(/padding: 0;/);
    expect(regel).toMatch(/border: 0;/);
    expect(regel).toMatch(/margin: 0\.25rem 0 0;/);
  });
});
